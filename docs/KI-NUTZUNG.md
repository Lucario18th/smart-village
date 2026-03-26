# KI-Nutzung im Smart-Village-Projekt

*Studienarbeit · DHBW Lörrach · TIF 23 · Semester 5 & 6*

KI-Tools waren im Smart-Village-Projekt kein optionales Hilfsmittel, sondern ein zentrales Entwicklungswerkzeug, das den gesamten Entwicklungsprozess begleitet und maßgeblich beschleunigt hat. Dieses Dokument beschreibt, welche Tools eingesetzt wurden, wie die Methodik aussah, welche Erkenntnisse gewonnen wurden und wo Grenzen oder Probleme aufgetreten sind.

---

## Eingesetzte KI-Tools

| Tool | Einsatzbereich |
|------|----------------|
| **GitHub Copilot (Editor / VS Code)** | Code-Vervollständigung, Refactoring, Boilerplate-Generierung, Inline-Vorschläge während der Entwicklung |
| **GitHub Copilot CLI** | Generierung von Terminal-Kommandos, Shell-Skripten und Docker-Befehlen direkt im CLI |
| **GitHub Copilot Agent Mode** | Autonome Bearbeitung komplexer Aufgaben über mehrere Dateien hinweg — das leistungsstärkste eingesetzte KI-Tool im Projekt |
| **Perplexity AI / weitere LLM-Dienste** | Erstellung präziser, vollständiger Prompts und klar abgegrenzter Aufgaben-Scopes für GitHub Copilot |

---

## Methodik: Prompt-Engineering mit externen KI-Diensten

Ein zentraler Erkenntnisgewinn des Projekts war die Kombination externer KI-Dienste (Perplexity AI u. a.) mit GitHub Copilot.

**Workflow:**
1. Externe KI (z. B. Perplexity AI) wurde genutzt, um **vollständige, präzise Prompts** mit klar abgegrenzten Scopes für Copilot zu formulieren — bevor Copilot überhaupt gestartet wurde.
2. Diese vorbereiteten Prompts wurden als definierte Arbeitsaufträge an GitHub Copilot übergeben.
3. Ergebnis: **Nichts wurde vergessen**, der Token-Verbrauch wurde minimiert, Copilot arbeitete zielgerichtet ohne abzudriften.

**Warum das wichtig ist:**
Ohne klare Scope-Definition neigen KI-Modelle dazu, Aufgaben unvollständig, zu weit gefasst oder inkonsistent zu bearbeiten. Durch vorbereitete Prompts wurde sichergestellt, dass jede Aufgabe vollständig, konsistent und ohne unnötige Token-Verschwendung gelöst wurde. Diese Methode hat sich besonders bei komplexen Feature-Implementierungen bewährt, bei denen mehrere Dateien, DTOs, Services und Tests zusammenspielen mussten.

---

## GitHub Copilot Agent Mode — Erkenntnisse

Der **Agent Mode** hat im Projekt die stärksten Eindrücke hinterlassen und die Erwartungen des Teams deutlich übertroffen.

**Was der Agent Mode konkret geleistet hat:**
- Autonomes Arbeiten **über mehrere Dateien hinweg** in einem einzigen Durchgang — z. B. Backend-Endpoint erstellen, zugehörige DTOs anlegen, Service-Methode schreiben und Tests ergänzen, alles ohne manuellen Eingriff zwischen den Schritten.
- Im **CLI-basierten Agent Mode** wurden Terminal-Kommandos selbstständig zusammengestellt und direkt ausgeführt — kein Copy-Paste, kein manuelles Korrigieren. Dies zeigte eindrücklich, wie weit KI in der Softwareentwicklung bereits angekommen ist.
- Copilot ist als **aktiver Contributor** im Repository vertreten und erscheint in der offiziellen Contributor-Liste des Projekts.

**Fazit der Projektgruppe:**
Der Agent Mode ist kein erweitertes Autocomplete. Er ist ein echter Entwicklungspartner, der eigenständig plant, umsetzt und über Dateigrenzen hinweg denkt. Der Einsatz hat gezeigt, dass KI-gestützte Entwicklung nicht mehr nur Zeitersparnis bei Boilerplate bedeutet, sondern echte architektonische Aufgaben übernehmen kann.

---

## Konkrete Einsatzbereiche

### Backend (NestJS / Prisma)
- Generierung von NestJS-Modulen, Controllern, Services und Guards
- Prisma-Schema-Definitionen und Migrationsvorschläge
- Unit- und Integrationstests (Jest)
- Fehleranalyse bei MQTT-Integrationsproblemen

### Frontend (React / Vite)
- React-Komponenten und Hooks
- Leaflet/OpenStreetMap-Integration und Marker-Farblogik (`mapViewUtils`)
- Frontend-Tests (Vitest)
- CSS für Admin-Dashboard und öffentliche Website

### Mobile App (Android / Kotlin)
- Kotlin-spezifische Muster (Coroutines, ViewModel)
- API-Aufrufe und Fehlerbehandlung

### IoT / Raspberry Pi (Python)
- MQTT-Publisher-Skripte für BMP280 (Luftdruck/Temperatur) und YL-69 (Bodenfeuchte)
- Fehlerbehandlung und Reconnect-Logik

### Tests & Smoke-Tests
- Docker-basierte Smoke-Tests (Ergebnisse unter `docker-test-report/`)
- Frontend-Tests (Ergebnisse unter `frontend-tests/`)
- Weitere Integrationsskripte unter `test-scripts/`

### Dokumentation
- Strukturierung und Verfassen technischer Markdown-Dokumentation
- Einsatz von Agent Mode für umfangreiche Neustrukturierungen (z. B. diese Dokumentation selbst)

---

## Probleme & Limitierungen

### Rate Limits und Token-Verbrauch

Das größte praktische Problem bei der KI-Nutzung waren **Rate Limits und Token-Grenzen** der eingesetzten Modelle:

- Bei größeren Aufgaben wurden Token-Limits schnell erreicht, was zu Abbrüchen mitten in der Bearbeitung führte.
- Bei intensiven Entwicklungssessions mussten Wartezeiten für Rate-Limit-Resets eingeplant werden.
- **Lösung:** Aufgaben wurden konsequent in kleinere, klar abgegrenzte Scopes aufgeteilt (→ Prompt-Engineering-Workflow, siehe oben). Dies war die effektivste Gegenstrategie.

> Rate Limits und Token-Grenzen sind aktuell die größte praktische Einschränkung beim produktiven Einsatz von KI-Modellen in der Softwareentwicklung.

### Ollama — Gescheiterter Versuch eines lokalen KI-Modells

Ein geplantes Feature war die Integration eines **lokalen KI-Modells über Ollama** direkt in die Smart-Village-Plattform:

- **Ziel:** Lokales KI-Modell für natürlichsprachliche Abfragen oder automatische Datenanalyse direkt im System — ohne externe API-Abhängigkeit.
- **Problem:** Der Server (bereitgestellt durch Herr Dittrich, Studiengangsleiter Informatik DHBW Lörrach) hatte **zu wenig Arbeitsspeicher** für den stabilen Betrieb eines Ollama-Modells.
- **Ergebnis:** Das Feature wurde nicht umgesetzt. Es ist als mögliche Erweiterung dokumentiert, sobald geeignete Hardware verfügbar ist.

### Weitere Einschränkungen
- Bei sehr projektspezifischen Themen (z. B. DHBW-interne Infrastruktur, spezifische MQTT-Topic-Struktur) waren KI-Vorschläge häufig zu allgemein und mussten manuell angepasst werden.
- KI-generierter Code wurde stets kritisch geprüft — insbesondere bei sicherheitsrelevanten Bereichen (Authentifizierung, JWT, Nginx-Konfiguration). Kein KI-generierter Code wurde ungeprüft übernommen.
- KI-generierte Prisma-Migrationsskripte führten vereinzelt zu Konflikten. Die Datenbankmigration war im Projektverlauf insgesamt eine der häufigsten Fehlerquellen.

---

## Fazit

GitHub Copilot — insbesondere der Agent Mode — hat sich als zentrales Entwicklungswerkzeug erwiesen, das weit über klassische Code-Vervollständigung hinausgeht. Die Kombination aus Prompt-Engineering mit externen KI-Diensten und der autonomen Ausführung durch den Agent Mode hat die Entwicklungsgeschwindigkeit erheblich gesteigert und komplexe, dateiübergreifende Aufgaben ermöglicht, die sonst deutlich mehr Zeit benötigt hätten. Alle KI-generierten Beiträge wurden vom Team geprüft, angepasst und verantwortet. Der Einsatz von KI im Projekt entspricht den Richtlinien der DHBW Lörrach für die Nutzung von KI-Assistenten in Studienarbeiten.
