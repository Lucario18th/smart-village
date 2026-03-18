import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { apiClient } from '../../api/client'

const LOCALE_MAP = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
}

const LANGUAGE_LABEL = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
}

const UI_TEXT = {
  de: {
    welcome: 'Hi! Ich helfe bei Fragen zum Projekt, zu Sensoren und zur Konfiguration.',
    title: 'KI-Assistent',
    connected: 'Lokal verbunden (API-Kontext)',
    pending: 'Lokaler KI-Dienst nicht erreichbar',
    closeAria: 'Assistent schließen',
    thinking: 'Denke nach...',
    inputPlaceholder: 'Frage stellen oder Daten analysieren lassen...',
    inputAria: 'Frage an den KI-Assistenten',
    send: 'Senden',
    launcherAria: 'KI-Assistent öffnen',
    launcherTitle: 'KI-Assistent',
    launcherText: 'KI Hilfe',
    fallbackNotConnected: 'Der lokale KI-Dienst ist aktuell offline.',
    fallbackLocalKnowledge: 'Ich antworte voruebergehend nur mit lokaler Kontextanalyse.',
    fallbackPrompt: 'Frag mich z. B. nach Sensorstatus, Modulen oder nächsten Schritten.',
    apiUnavailable: (message) => `Der KI-Dienst ist aktuell nicht erreichbar (${message}). Bitte später erneut versuchen.`,
    analyticsTitle: (villageName) => `Kurzanalyse für ${villageName || 'die aktuelle Gemeinde'}:`,
    analyticsSensors: (count) => `- Sensoren gesamt: ${count}`,
    analyticsMissing: (count) => `- Sensoren ohne aktuelle Werte: ${count}`,
    analyticsStale: (count) => `- Sensoren als inaktiv/veraltet (dataStale): ${count}`,
    analyticsDisabled: (modules) => `- Deaktivierte Module: ${modules}`,
    analyticsAllEnabled: '- Alle bekannten Module sind aktiv.',
    contextBadge: ({ language, sensors, village }) => `Kontext: ${language} · ${sensors} Sensoren · ${village}`,
  },
  en: {
    welcome: 'Hi! I can help with questions about the project, sensors, and configuration.',
    title: 'AI Assistant',
    connected: 'Local service connected (API context)',
    pending: 'Local AI service unavailable',
    closeAria: 'Close assistant',
    thinking: 'Thinking...',
    inputPlaceholder: 'Ask a question or request a data analysis...',
    inputAria: 'Question for the AI assistant',
    send: 'Send',
    launcherAria: 'Open AI assistant',
    launcherTitle: 'AI assistant',
    launcherText: 'AI Help',
    fallbackNotConnected: 'The local AI service is currently offline.',
    fallbackLocalKnowledge: 'I will temporarily answer using only local context analytics.',
    fallbackPrompt: 'Ask about sensor status, modules, or suggested next steps.',
    apiUnavailable: (message) => `The AI service is currently unavailable (${message}). Please try again later.`,
    analyticsTitle: (villageName) => `Quick analysis for ${villageName || 'the current village'}:`,
    analyticsSensors: (count) => `- Total sensors: ${count}`,
    analyticsMissing: (count) => `- Sensors without current readings: ${count}`,
    analyticsStale: (count) => `- Stale/inactive sensors (dataStale): ${count}`,
    analyticsDisabled: (modules) => `- Disabled modules: ${modules}`,
    analyticsAllEnabled: '- All known modules are enabled.',
    contextBadge: ({ language, sensors, village }) => `Context: ${language} · ${sensors} sensors · ${village}`,
  },
  fr: {
    welcome: 'Bonjour! Je peux aider avec des questions sur le projet, les capteurs et la configuration.',
    title: 'Assistant IA',
    connected: 'Service local connecté (contexte API)',
    pending: 'Service IA local indisponible',
    closeAria: "Fermer l'assistant",
    thinking: 'Analyse en cours...',
    inputPlaceholder: 'Posez une question ou demandez une analyse de données...',
    inputAria: "Question pour l'assistant IA",
    send: 'Envoyer',
    launcherAria: "Ouvrir l'assistant IA",
    launcherTitle: 'Assistant IA',
    launcherText: 'Aide IA',
    fallbackNotConnected: "Le service IA local est actuellement hors ligne.",
    fallbackLocalKnowledge: "Je reponds temporairement uniquement avec l'analyse de contexte locale.",
    fallbackPrompt: 'Demandez par exemple le statut des capteurs, les modules ou les prochaines étapes.',
    apiUnavailable: (message) => `Le service IA est actuellement indisponible (${message}). Veuillez réessayer plus tard.`,
    analyticsTitle: (villageName) => `Analyse rapide pour ${villageName || 'la commune active'} :`,
    analyticsSensors: (count) => `- Capteurs au total : ${count}`,
    analyticsMissing: (count) => `- Capteurs sans valeur récente : ${count}`,
    analyticsStale: (count) => `- Capteurs inactifs/obsolètes (dataStale) : ${count}`,
    analyticsDisabled: (modules) => `- Modules désactivés : ${modules}`,
    analyticsAllEnabled: '- Tous les modules connus sont actifs.',
    contextBadge: ({ language, sensors, village }) => `Contexte : ${language} · ${sensors} capteurs · ${village}`,
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

async function askLocalAssistant({ question, contextData, audience }) {
  if (audience === 'admin') {
    const result = await apiClient.assistant.askAdmin(question, contextData)
    return result?.answer || 'Keine Antwort vom lokalen KI-Dienst.'
  }

  const result = await apiClient.assistant.askPublic(question, contextData)
  return result?.answer || 'Keine Antwort vom lokalen KI-Dienst.'
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
  const normalizedContextLocale = LOCALE_MAP[contextData?.locale] ? contextData.locale : normalizedLocale
  const contextLanguage = LANGUAGE_LABEL[normalizedContextLocale] || LANGUAGE_LABEL[normalizedLocale]

  const requestContextData = useMemo(
    () => ({
      ...(contextData || {}),
      locale: normalizedContextLocale,
      language: contextLanguage,
    }),
    [contextData, normalizedContextLocale, contextLanguage]
  )

  const contextBadgeText = useMemo(() => {
    const sensorCount = Array.isArray(requestContextData?.sensors) ? requestContextData.sensors.length : 0
    const village = requestContextData?.villageName || '-'
    return text.contextBadge({ language: contextLanguage, sensors: sensorCount, village })
  }, [requestContextData, text, contextLanguage])

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [serviceOnline, setServiceOnline] = useState(true)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: text.welcome,
    },
  ])

  const apiConnected = useMemo(() => serviceOnline, [serviceOnline])
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

    const isAnalysisRequest = /analyse|analysis|auswertung|donnees|données|data|daten|stale|obsolet|capteur|sensor/i.test(question)

    setIsLoading(true)
    try {
      const answer = await askLocalAssistant({ question, contextData: requestContextData, audience })
      setServiceOnline(true)
      const enrichedAnswer = isAnalysisRequest
        ? `${createLocalAnalytics(requestContextData, text)}\n\n${answer}`
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
      setServiceOnline(false)
      const fallbackText = [
        text.fallbackNotConnected,
        text.fallbackLocalKnowledge,
        isAnalysisRequest ? createLocalAnalytics(requestContextData, text) : text.fallbackPrompt,
        text.apiUnavailable(error.message),
      ].join('\n\n')

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
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
              <p className="ai-assistant-context-badge">{contextBadgeText}</p>
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
              </article>
            ))}
            {isLoading ? (
              <article className="ai-bubble ai-bubble--assistant">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text.thinking}</ReactMarkdown>
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
