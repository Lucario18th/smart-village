import {
  Injectable,
} from "@nestjs/common";

type Audience = "user" | "admin";

type AskInput = {
  audience: Audience;
  question: string;
  contextData?: Record<string, unknown>;
  actorId?: number;
};

type SanitizedContext = {
  view: string;
  locale: "de" | "en" | "fr";
  language: string;
  villageName: string | null;
  statusText: string | null;
  infoText: string | null;
  activeSectionId: string | null;
  modules: Record<string, boolean>;
  sensors: Array<Record<string, unknown>>;
  summary: {
    sensorCount: number;
    activeSensorCount: number;
    staleSensorCount: number;
    noReadingCount: number;
  };
};

@Injectable()
export class AssistantService {
  private readonly llmEnabled = process.env.LOCAL_LLM_ENABLED !== "false";
  private readonly llmBaseUrl = process.env.LOCAL_LLM_BASE_URL || "http://host.docker.internal:11434";
  private readonly llmModel = process.env.LOCAL_LLM_MODEL || "llama3.2:1b";
  private readonly llmTimeoutMs = this.parseTimeout(process.env.LOCAL_LLM_TIMEOUT_MS, 12000);

  async ask(input: AskInput): Promise<string> {
    const sanitizedContext = this.sanitizeContext(input.contextData, input.audience);

    if (!this.llmEnabled) {
      return this.buildRuleBasedFallback(input.question, sanitizedContext);
    }

    const prompt = this.buildPrompt({
      audience: input.audience,
      question: input.question,
      context: sanitizedContext,
      actorId: input.actorId,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.llmTimeoutMs);

    try {
      const response = await fetch(`${this.llmBaseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.llmModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.15,
            top_p: 0.9,
            num_predict: 280,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return this.buildRuleBasedFallback(input.question, sanitizedContext);
      }

      const payload = (await response.json()) as { response?: string };
      const text = payload?.response?.trim();
      if (!text) {
        return this.buildRuleBasedFallback(input.question, sanitizedContext);
      }

      return text;
    } catch {
      return this.buildRuleBasedFallback(input.question, sanitizedContext);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPrompt({
    audience,
    question,
    context,
    actorId,
  }: {
    audience: Audience;
    question: string;
    context: SanitizedContext;
    actorId?: number;
  }): string {
    const roleLine = audience === "admin"
      ? `Target role: admin (accountId ${actorId ?? "unknown"}).`
      : "Target role: public user.";

    const languageInstruction = this.buildLanguageInstruction(context.locale);

    return [
      "You are the Smart Village local assistant.",
      roleLine,
      languageInstruction,
      "Hard rule 1: Use only facts that appear in the provided CONTEXT_JSON.",
      "Hard rule 2: If a fact is missing, say that it is not available in current API data.",
      "Hard rule 3: Never invent IDs, values, statuses, coordinates, or configuration.",
      "Hard rule 4: Keep answer practical, concise, and specific.",
      "Hard rule 5: For lists, only output entries present in CONTEXT_JSON.",
      "",
      "CONTEXT_JSON:",
      JSON.stringify(context, null, 2),
      "",
      `QUESTION: ${question}`,
      "",
      "Answer:",
    ].join("\n");
  }

  private sanitizeContext(contextData: Record<string, unknown> | undefined, audience: Audience): SanitizedContext {
    const source = contextData && typeof contextData === "object" ? contextData : {};

    const sensors = Array.isArray(source.sensors) ? source.sensors : [];
    const mappedSensors = sensors
      .filter((sensor): sensor is Record<string, unknown> => sensor !== null && typeof sensor === "object")
      .map((sensor) => {
        const mapped: Record<string, unknown> = {
          id: this.numberOrNull(sensor.id),
          name: this.stringOrNull(sensor.name),
          type: this.stringOrNull(sensor.type),
          unit: this.stringOrNull(sensor.unit),
          isActive: this.booleanOrNull(sensor.isActive),
          receiveData: this.booleanOrNull(sensor.receiveData),
          exposeToApp: this.booleanOrNull(sensor.exposeToApp),
          dataStale: this.booleanOrNull(sensor.dataStale),
          lastReading: this.mapLastReading(sensor.lastReading),
        };

        if (audience === "admin") {
          mapped.latitude = this.numberOrNull(sensor.latitude);
          mapped.longitude = this.numberOrNull(sensor.longitude);
          mapped.infoText = this.stringOrNull(sensor.infoText);
          mapped.deviceId = this.numberOrNull(sensor.deviceId);
        }

        return mapped;
      });

    const modulesRaw = source.modules && typeof source.modules === "object"
      ? (source.modules as Record<string, unknown>)
      : {};
    const modules = Object.fromEntries(
      Object.entries(modulesRaw)
        .filter(([key]) => key.length <= 80)
        .map(([key, value]) => [key, Boolean(value)]),
    );

    const activeSensorCount = mappedSensors.filter((sensor) => sensor.isActive === true).length;
    const staleSensorCount = mappedSensors.filter((sensor) => sensor.dataStale === true).length;
    const noReadingCount = mappedSensors.filter((sensor) => !sensor.lastReading).length;

    const locale = this.mapLocale(source.locale);
    const language = this.stringOrNull(source.language) || this.localeToLabel(locale);

    return {
      view: this.stringOrDefault(source.view, audience === "admin" ? "admin" : "public"),
      locale,
      language,
      villageName: this.stringOrNull(source.villageName),
      statusText: this.stringOrNull(source.statusText),
      infoText: this.stringOrNull(source.infoText),
      activeSectionId: this.stringOrNull(source.activeSectionId),
      modules,
      sensors: mappedSensors,
      summary: {
        sensorCount: mappedSensors.length,
        activeSensorCount,
        staleSensorCount,
        noReadingCount,
      },
    };
  }

  private mapLastReading(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object") return null;
    const reading = value as Record<string, unknown>;
    return {
      value: this.numberOrNull(reading.value),
      timestamp: this.stringOrNull(reading.timestamp),
    };
  }

  private stringOrNull(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed.slice(0, 500) : null;
  }

  private stringOrDefault(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length ? trimmed.slice(0, 120) : fallback;
  }

  private numberOrNull(value: unknown): number | null {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private booleanOrNull(value: unknown): boolean | null {
    if (typeof value !== "boolean") return null;
    return value;
  }

  private parseTimeout(raw: string | undefined, fallback: number): number {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 120000) {
      return fallback;
    }

    return parsed;
  }

  private mapLocale(value: unknown): "de" | "en" | "fr" {
    if (value === "en" || value === "fr") return value;
    return "de";
  }

  private localeToLabel(locale: "de" | "en" | "fr"): string {
    if (locale === "en") return "English";
    if (locale === "fr") return "Francais";
    return "Deutsch";
  }

  private buildLanguageInstruction(locale: "de" | "en" | "fr"): string {
    if (locale === "en") return "Respond in English.";
    if (locale === "fr") return "Respond in French.";
    return "Respond in German.";
  }

  private buildRuleBasedFallback(question: string, context: SanitizedContext): string {
    const q = question.toLowerCase();
    const village = context.villageName || this.t(context.locale, "noVillage");
    const sensors = context.sensors;
    const enabledModules = Object.entries(context.modules)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    const disabledModules = Object.entries(context.modules)
      .filter(([, enabled]) => !enabled)
      .map(([name]) => name);

    const sensorList = sensors
      .slice(0, 12)
      .map((sensor) => {
        const name = this.stringOrNull(sensor.name) || "-";
        const type = this.stringOrNull(sensor.type) || "unknown";
        const stale = sensor.dataStale === true ? this.t(context.locale, "stale") : this.t(context.locale, "fresh");
        return `- ${name} (${type}, ${stale})`;
      });

    if (/(sensor|capteur|sensors|alle|all|tous)/i.test(q)) {
      if (sensorList.length === 0) {
        return this.t(context.locale, "noSensors");
      }

      return [
        this.t(context.locale, "sensorIntro", village),
        ...sensorList,
      ].join("\n");
    }

    if (/(module|modul|fonction|feature)/i.test(q)) {
      const enabled = enabledModules.length ? enabledModules.join(", ") : this.t(context.locale, "none");
      const disabled = disabledModules.length ? disabledModules.join(", ") : this.t(context.locale, "none");
      return this.t(context.locale, "moduleSummary", village, enabled, disabled);
    }

    if (/(status|info|etat|state)/i.test(q)) {
      const status = context.statusText || this.t(context.locale, "noStatus");
      const info = context.infoText || this.t(context.locale, "noInfo");
      return this.t(context.locale, "statusSummary", village, status, info);
    }

    const enabled = enabledModules.length ? enabledModules.join(", ") : this.t(context.locale, "none");
    return this.t(
      context.locale,
      "genericSummary",
      village,
      String(context.summary.sensorCount),
      String(context.summary.staleSensorCount),
      enabled,
    );
  }

  private t(locale: "de" | "en" | "fr", key: string, ...args: string[]): string {
    const de = {
      noVillage: "unbekannte Gemeinde",
      stale: "stale",
      fresh: "aktuell",
      noSensors: "Es sind aktuell keine Sensoren im freigegebenen API-Kontext vorhanden.",
      sensorIntro: `Sensoruebersicht fuer ${args[0]}:`,
      none: "keine",
      noStatus: "kein Status hinterlegt",
      noInfo: "keine Zusatzinfo hinterlegt",
      moduleSummary: `Module fuer ${args[0]}:\n- Aktiv: ${args[1]}\n- Deaktiviert: ${args[2]}`,
      statusSummary: `Status fuer ${args[0]}:\n- Status: ${args[1]}\n- Info: ${args[2]}`,
      genericSummary: `Kurze Zusammenfassung fuer ${args[0]}:\n- Sensoren gesamt: ${args[1]}\n- Sensoren stale: ${args[2]}\n- Aktive Module: ${args[3]}`,
    };

    const en = {
      noVillage: "unknown village",
      stale: "stale",
      fresh: "fresh",
      noSensors: "There are currently no sensors in the allowed API context.",
      sensorIntro: `Sensor overview for ${args[0]}:`,
      none: "none",
      noStatus: "no status available",
      noInfo: "no additional info available",
      moduleSummary: `Modules for ${args[0]}:\n- Enabled: ${args[1]}\n- Disabled: ${args[2]}`,
      statusSummary: `Status for ${args[0]}:\n- Status: ${args[1]}\n- Info: ${args[2]}`,
      genericSummary: `Quick summary for ${args[0]}:\n- Total sensors: ${args[1]}\n- Stale sensors: ${args[2]}\n- Enabled modules: ${args[3]}`,
    };

    const fr = {
      noVillage: "commune inconnue",
      stale: "obsolete",
      fresh: "actif",
      noSensors: "Aucun capteur n'est actuellement disponible dans le contexte API autorise.",
      sensorIntro: `Apercu des capteurs pour ${args[0]} :`,
      none: "aucun",
      noStatus: "aucun statut disponible",
      noInfo: "aucune information supplementaire",
      moduleSummary: `Modules pour ${args[0]} :\n- Actifs : ${args[1]}\n- Desactives : ${args[2]}`,
      statusSummary: `Statut pour ${args[0]} :\n- Statut : ${args[1]}\n- Info : ${args[2]}`,
      genericSummary: `Resume rapide pour ${args[0]} :\n- Capteurs total : ${args[1]}\n- Capteurs obsoletes : ${args[2]}\n- Modules actifs : ${args[3]}`,
    };

    const map = locale === "en" ? en : locale === "fr" ? fr : de;
    return map[key as keyof typeof map] || "";
  }
}
