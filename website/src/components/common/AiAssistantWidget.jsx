import React, { useMemo, useState } from 'react'

const PERPLEXITY_ENDPOINT = import.meta.env?.VITE_PERPLEXITY_ENDPOINT || 'https://api.perplexity.ai/chat/completions'
const PERPLEXITY_MODEL = import.meta.env?.VITE_PERPLEXITY_MODEL || 'sonar'
const PERPLEXITY_API_KEY = import.meta.env?.VITE_PERPLEXITY_API_KEY || ''

const PROJECT_KNOWLEDGE = [
  'Projekt: Smart Village (React Frontend, NestJS Backend, Prisma, MQTT, PostgreSQL).',
  'Realtime: Browser nutzt MQTT via WebSocket-Pfad /mqtt (Nginx -> Mosquitto).',
  'Sensor-Semantik: isActive (technisch), receiveData (Datenerfassung), exposeToApp (Sichtbarkeit App/Public).',
  'Sensoren ohne neue Werte werden nach ca. 60 Sekunden als dataStale markiert.',
  'Public UI ist feature-flag-basiert: deaktivierte Module werden nicht gezeigt.',
  'Gemeinde-Status ist als statusText persistiert und in API/App-API verfuegbar.',
].join(' ')

const LOCALE_MAP = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
}

const LANGUAGE_LABEL = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Francais',
}

const UI_TEXT = {
  de: {
    welcome: 'Hi! Ich helfe bei Fragen zum Projekt, zu Sensoren und zur Konfiguration.',
    title: 'KI-Assistent',
    connected: 'Perplexity verbunden',
    pending: 'API folgt in Kuerze',
    closeAria: 'Assistent schliessen',
    thinking: 'Denke nach...',
    inputPlaceholder: 'Frage stellen oder Daten analysieren lassen...',
    inputAria: 'Frage an den KI-Assistenten',
    send: 'Senden',
    launcherAria: 'KI-Assistent oeffnen',
    launcherTitle: 'KI-Assistent',
    launcherText: 'KI Hilfe',
    fallbackNotConnected: 'Der externe KI-Dienst wird bald angeschlossen.',
    fallbackLocalKnowledge: 'Bis dahin arbeite ich mit lokalem Projektwissen.',
    fallbackPrompt: 'Frag mich z. B. nach Sensorstatus, Modulen oder naechsten Schritten.',
    apiUnavailable: (message) => `Der KI-Dienst ist aktuell nicht erreichbar (${message}). Bitte spaeter erneut versuchen.`,
    analyticsTitle: (villageName) => `Kurzanalyse fuer ${villageName || 'die aktuelle Gemeinde'}:`,
    analyticsSensors: (count) => `- Sensoren gesamt: ${count}`,
    analyticsMissing: (count) => `- Sensoren ohne aktuelle Werte: ${count}`,
    analyticsStale: (count) => `- Sensoren als inaktiv/veraltet (dataStale): ${count}`,
    analyticsDisabled: (modules) => `- Deaktivierte Module: ${modules}`,
    analyticsAllEnabled: '- Alle bekannten Module sind aktiv.',
    systemPrompt: (audience) => `Du bist ein Smart-Village-Assistent fuer ${audience}. Antworte auf Deutsch, kurz, fachlich und mit klaren Schritten. Nutze dieses Projektwissen: ${PROJECT_KNOWLEDGE}`,
  },
  en: {
    welcome: 'Hi! I can help with questions about the project, sensors, and configuration.',
    title: 'AI Assistant',
    connected: 'Perplexity connected',
    pending: 'API coming soon',
    closeAria: 'Close assistant',
    thinking: 'Thinking...',
    inputPlaceholder: 'Ask a question or request a data analysis...',
    inputAria: 'Question for the AI assistant',
    send: 'Send',
    launcherAria: 'Open AI assistant',
    launcherTitle: 'AI assistant',
    launcherText: 'AI Help',
    fallbackNotConnected: 'The external AI service will be connected soon.',
    fallbackLocalKnowledge: 'Until then, I use local project knowledge.',
    fallbackPrompt: 'Ask about sensor status, modules, or suggested next steps.',
    apiUnavailable: (message) => `The AI service is currently unavailable (${message}). Please try again later.`,
    analyticsTitle: (villageName) => `Quick analysis for ${villageName || 'the current village'}:`,
    analyticsSensors: (count) => `- Total sensors: ${count}`,
    analyticsMissing: (count) => `- Sensors without current readings: ${count}`,
    analyticsStale: (count) => `- Stale/inactive sensors (dataStale): ${count}`,
    analyticsDisabled: (modules) => `- Disabled modules: ${modules}`,
    analyticsAllEnabled: '- All known modules are enabled.',
    systemPrompt: (audience) => `You are a Smart Village assistant for ${audience}. Respond in concise English with clear technical steps. Use this project knowledge: ${PROJECT_KNOWLEDGE}`,
  },
  fr: {
    welcome: 'Bonjour! Je peux aider avec des questions sur le projet, les capteurs et la configuration.',
    title: 'Assistant IA',
    connected: 'Perplexity connecte',
    pending: 'API bientot disponible',
    closeAria: "Fermer l'assistant",
    thinking: 'Analyse en cours...',
    inputPlaceholder: 'Posez une question ou demandez une analyse de donnees...',
    inputAria: "Question pour l'assistant IA",
    send: 'Envoyer',
    launcherAria: "Ouvrir l'assistant IA",
    launcherTitle: 'Assistant IA',
    launcherText: 'Aide IA',
    fallbackNotConnected: "Le service IA externe sera connecte bientot.",
    fallbackLocalKnowledge: "En attendant, j'utilise les connaissances locales du projet.",
    fallbackPrompt: 'Demandez par exemple le statut des capteurs, les modules ou les prochaines etapes.',
    apiUnavailable: (message) => `Le service IA est actuellement indisponible (${message}). Veuillez reessayer plus tard.`,
    analyticsTitle: (villageName) => `Analyse rapide pour ${villageName || 'la commune active'} :`,
    analyticsSensors: (count) => `- Capteurs au total : ${count}`,
    analyticsMissing: (count) => `- Capteurs sans valeur recente : ${count}`,
    analyticsStale: (count) => `- Capteurs inactifs/obsoletes (dataStale) : ${count}`,
    analyticsDisabled: (modules) => `- Modules desactives : ${modules}`,
    analyticsAllEnabled: '- Tous les modules connus sont actifs.',
    systemPrompt: (audience) => `Tu es un assistant Smart Village pour ${audience}. Reponds en francais, de facon concise et avec des etapes claires. Utilise ces connaissances du projet : ${PROJECT_KNOWLEDGE}`,
  },
}

function createLocalAnalytics(contextData, text) {
  const sensors = Array.isArray(contextData?.sensors) ? contextData.sensors : []
  const staleCount = sensors.filter((sensor) => sensor?.dataStale === true).length
  const missingCount = sensors.filter((sensor) => !sensor?.lastReading).length
  const modules = contextData?.modules || {}
  const disabledModules = Object.entries(modules)
    .filter(([, enabled]) => enabled === false)
    .map(([module]) => module)

  return [
    text.analyticsTitle(contextData?.villageName),
    text.analyticsSensors(sensors.length),
    text.analyticsMissing(missingCount),
    text.analyticsStale(staleCount),
    disabledModules.length > 0
      ? text.analyticsDisabled(disabledModules.join(', '))
      : text.analyticsAllEnabled,
  ].join('\n')
}

function buildContextSummary(contextData) {
  if (!contextData) return 'Kein Laufzeitkontext uebergeben.'
  return JSON.stringify(
    {
      view: contextData.view || 'unknown',
      villageName: contextData.villageName || null,
      sensorCount: Array.isArray(contextData.sensors) ? contextData.sensors.length : 0,
      modules: contextData.modules || null,
      statusText: contextData.statusText || null,
      infoText: contextData.infoText || null,
    },
    null,
    2
  )
}

async function askPerplexity({ question, contextData, audience, text }) {
  const response = await fetch(PERPLEXITY_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        {
          role: 'system',
          content: text.systemPrompt(audience),
        },
        {
          role: 'system',
          content: `Aktueller Laufzeitkontext:\n${buildContextSummary(contextData)}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(`API-Fehler ${response.status}`)
  }

  const payload = await response.json()
  return payload?.choices?.[0]?.message?.content?.trim() || 'Keine Antwort vom KI-Dienst.'
}

export default function AiAssistantWidget({
  audience = 'user',
  contextData = null,
  placement = 'floating',
  launcherVariant = 'default',
  locale = 'de',
}) {
  const normalizedLocale = LOCALE_MAP[locale] ? locale : 'de'
  const text = UI_TEXT[normalizedLocale]
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: text.welcome,
    },
  ])

  const apiConnected = useMemo(() => Boolean(PERPLEXITY_API_KEY), [])
  const isCompactLauncher = launcherVariant === 'compact'

  React.useEffect(() => {
    setMessages((prev) => {
      if (!prev.length) return prev
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: text.welcome }]
      }
      return prev
    })
  }, [text.welcome])

  const handleSend = async (event) => {
    event.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    const isAnalysisRequest = /analyse|analysis|auswertung|donnees|data|daten|stale|obsolet|capteur|sensor/i.test(question)

    if (!apiConnected) {
      const fallbackText = [
        text.fallbackNotConnected,
        text.fallbackLocalKnowledge,
        isAnalysisRequest ? createLocalAnalytics(contextData, text) : text.fallbackPrompt,
      ].join('\n\n')

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
        },
      ])
      return
    }

    setIsLoading(true)
    try {
      const answer = await askPerplexity({ question, contextData, audience, text })
      const enrichedAnswer = isAnalysisRequest
        ? `${createLocalAnalytics(contextData, text)}\n\n${answer}`
        : answer

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: enrichedAnswer,
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: text.apiUnavailable(error.message),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={`ai-assistant ai-assistant--${placement} ${isOpen ? 'is-open' : ''}`} aria-label={text.title}>
      {isOpen ? (
        <div className="ai-assistant-panel">
          <header className="ai-assistant-header">
            <div>
              <h3>{text.title}</h3>
              <p>{apiConnected ? text.connected : text.pending}</p>
            </div>
            <button
              type="button"
              className="ai-assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label={text.closeAria}
            >
              ×
            </button>
          </header>

          <div className="ai-assistant-messages" role="log" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} className={`ai-bubble ai-bubble--${message.role}`}>
                <p>{message.text}</p>
              </article>
            ))}
            {isLoading ? (
              <article className="ai-bubble ai-bubble--assistant">
                <p>{text.thinking}</p>
              </article>
            ) : null}
          </div>

          <form className="ai-assistant-form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={text.inputPlaceholder}
              aria-label={text.inputAria}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {text.send}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className={`ai-assistant-launcher${isCompactLauncher ? ' ai-assistant-launcher--compact' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={text.launcherAria}
        title={text.launcherTitle}
      >
        {isCompactLauncher ? (
          <span className="ai-assistant-launcher-icon" aria-hidden="true">
            AI
          </span>
        ) : (
          text.launcherText
        )}
      </button>
    </section>
  )
}
