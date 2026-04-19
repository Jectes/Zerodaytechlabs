(function(){
  const existing = window.ZDTL_CHAT_CONFIG || {};
  window.ZDTL_CHAT_CONFIG = Object.assign({
    endpoint: "/api/chat",
    assistantName: "ZeroDay Tech Labs Assistant",
    maxHistoryTurns: 12,
    requestTimeoutMs: 30000,
    welcome: {
      en: "Ask what to download first, which section fits your situation, or where to report a scam.",
      es: "Pregunta qué descargar primero, qué sección encaja con tu situación o dónde reportar una estafa."
    },
    prompts: {
      default: {
        en: [
          "Which toolkit section should I start with?",
          "How do I spot phishing or scam texts?",
          "How can I secure my home Wi-Fi?"
        ],
        es: [
          "¿Con qué sección del toolkit debo empezar?",
          "¿Cómo identifico phishing o textos de estafa?",
          "¿Cómo puedo asegurar el Wi-Fi de mi casa?"
        ]
      },
      toolkit: {
        en: [
          "Which section helps with scam texts?",
          "What should I download first for home Wi-Fi?",
          "Which toolkit is best for parents and kids?"
        ],
        es: [
          "¿Qué sección ayuda con textos de estafa?",
          "¿Qué debo descargar primero para el Wi-Fi del hogar?",
          "¿Qué toolkit sirve mejor para padres y menores?"
        ]
      },
      resources: {
        en: [
          "Where can I report fraud?",
          "Which official resources cover phishing?",
          "Where do I find identity theft recovery help?"
        ],
        es: [
          "¿Dónde puedo reportar fraude?",
          "¿Qué recursos oficiales cubren phishing?",
          "¿Dónde encuentro ayuda para recuperación por robo de identidad?"
        ]
      },
      labs: {
        en: [
          "What does Case Study 1 teach about phishing?",
          "How can I avoid risky app installs?",
          "What does the location disclosure case teach?"
        ],
        es: [
          "¿Qué enseña el Caso 1 sobre phishing?",
          "¿Cómo puedo evitar instalaciones riesgosas de apps?",
          "¿Qué enseña el caso de divulgación de ubicación?"
        ]
      }
    }
  }, existing);
})();
