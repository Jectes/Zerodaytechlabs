(function () {
  const existing = window.ZDTL_CHAT_CONFIG || {};

  window.ZDTL_CHAT_CONFIG = Object.assign(
    {
      endpoint: 'https://project-fx5fh.vercel.app/api/chat',
      assistantName: 'ZeroDay Tech Labs Assistant',
      maxHistoryTurns: 12,
      requestTimeoutMs: 30000,
      welcome: {
        en: 'Hi, I’m the ZeroDay Tech Labs Assistant. I can help you find the right toolkit, spot phishing or scam texts, secure your home Wi-Fi, or learn where to report suspicious activity. What can I help you with?',
        es: 'Hola, soy el asistente de ZeroDay Tech Labs. Puedo ayudarte a encontrar el toolkit correcto, identificar phishing o textos de estafa, asegurar el Wi-Fi de tu hogar o saber dónde reportar actividad sospechosa. ¿En qué puedo ayudarte?'
      },
      prompts: {
        default: {
          en: [
            'Which toolkit section should I start with?',
            'How do I spot phishing or scam texts?',
            'How can I secure my home Wi-Fi?',
            'What is malware?'
          ],
          es: [
            '¿Con qué sección del toolkit debo empezar?',
            '¿Cómo identifico phishing o mensajes de estafa?',
            '¿Cómo puedo asegurar el Wi-Fi de mi casa?',
            '¿Qué es malware?'
          ]
        },
        toolkit: {
          en: [
            'Which section helps with scam texts?',
            'What should I download first for home Wi-Fi?',
            'Which toolkit is best for parents and kids?'
          ],
          es: [
            '¿Qué sección ayuda con mensajes de estafa?',
            '¿Qué debo descargar primero para el Wi-Fi del hogar?',
            '¿Qué toolkit sirve mejor para padres y menores?'
          ]
        },
        resources: {
          en: [
            'Where can I report fraud?',
            'Which official resources cover phishing?',
            'Where do I find identity theft recovery help?'
          ],
          es: [
            '¿Dónde puedo reportar fraude?',
            '¿Qué recursos oficiales cubren el phishing?',
            '¿Dónde encuentro ayuda para recuperación por robo de identidad?'
          ]
        },
        labs: {
          en: [
            'What does Case Study 1 teach about phishing?',
            'How can I avoid risky app installs?',
            'What does the location disclosure case teach?'
          ],
          es: [
            '¿Qué enseña el Caso de Estudio 1 sobre phishing?',
            '¿Cómo puedo evitar instalaciones riesgosas de apps?',
            '¿Qué enseña el caso de divulgación de ubicación?'
          ]
        }
      }
    },
    existing
  );
})();
