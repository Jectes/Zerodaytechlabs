(function () {
  const existing = window.ZDTL_CHAT_CONFIG || {};

  window.ZDTL_CHAT_CONFIG = Object.assign(
    {
      endpoint: 'https://project-fx5fh.vercel.app/api/chat',
      assistantName: 'ZeroDay Tech Labs Assistant',
      maxHistoryTurns: 12,
      requestTimeoutMs: 30000,
      welcome: {
        en: 'Hi, I’m the ZeroDay Tech Labs Assistant. I can help you find the right toolkit, spot phishing or scam texts, secure your home Wi-Fi, understand malware basics, or learn where to report suspicious activity. What can I help you with?',
        es: 'Hola, soy el asistente de ZeroDay Tech Labs. Puedo ayudarte a encontrar el toolkit correcto, identificar phishing o mensajes de estafa, asegurar el Wi-Fi de tu hogar, entender conceptos básicos de malware o saber dónde reportar actividad sospechosa. ¿En qué puedo ayudarte?'
      },
      prompts: {
        default: {
          en: [
            'What is malware?',
            'How do I spot phishing or scam texts?',
            'How can I secure my home Wi-Fi?',
            'Where can I report online fraud?'
          ],
          es: [
            '¿Qué es malware?',
            '¿Cómo identifico phishing o mensajes de estafa?',
            '¿Cómo puedo asegurar el Wi-Fi de mi casa?',
            '¿Dónde puedo reportar fraude en línea?'
          ]
        },
        toolkit: {
          en: [
            'Which toolkit section should I start with?',
            'Which section helps with scam texts?',
            'What should I download first for home Wi-Fi?',
            'Which toolkit is best for parents and kids?'
          ],
          es: [
            '¿Con qué sección del toolkit debo empezar?',
            '¿Qué sección ayuda con mensajes de estafa?',
            '¿Qué debo descargar primero para el Wi-Fi del hogar?',
            '¿Qué toolkit sirve mejor para padres y menores?'
          ]
        },
        resources: {
          en: [
            'Where can I report fraud?',
            'Which official resources cover phishing?',
            'Where do I find identity theft recovery help?',
            'What should I do after clicking a suspicious link?'
          ],
          es: [
            '¿Dónde puedo reportar fraude?',
            '¿Qué recursos oficiales cubren el phishing?',
            '¿Dónde encuentro ayuda para recuperación por robo de identidad?',
            '¿Qué debo hacer después de tocar un enlace sospechoso?'
          ]
        },
        labs: {
          en: [
            'What does Case Study 1 teach about phishing?',
            'How can I avoid risky app installs?',
            'What does the location disclosure case teach?',
            'Which case study should I read first?'
          ],
          es: [
            '¿Qué enseña el Caso de Estudio 1 sobre phishing?',
            '¿Cómo puedo evitar instalaciones riesgosas de apps?',
            '¿Qué enseña el caso de divulgación de ubicación?',
            '¿Qué caso de estudio debo leer primero?'
          ]
        }
      }
    },
    existing
  );
})();
