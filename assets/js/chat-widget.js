(function () {
  const STORAGE_KEY = 'zdtl_chat_messages_v2';
  const OPEN_KEY = 'zdtl_chat_open';

  function getConfig() {
    return window.ZDTL_CHAT_CONFIG || {};
  }

  function getLang() {
    try {
      if (window.ZDTL_i18n && typeof window.ZDTL_i18n.getLang === 'function') {
        return window.ZDTL_i18n.getLang() === 'es' ? 'es' : 'en';
      }
    } catch (error) {}

    const htmlLang = document.documentElement.getAttribute('lang');
    return htmlLang === 'es' ? 'es' : 'en';
  }

  function pageKind() {
    const path = window.location.pathname || '';

    if (path.includes('/toolkit/')) return 'toolkit';
    if (path.includes('/resources/')) return 'resources';
    if (path.includes('/labs/')) return 'labs';

    return 'default';
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getUiStrings(lang) {
    return lang === 'es'
      ? {
          title: 'Asistente de ciberseguridad',
          subtitle: 'Guía práctica para seguridad digital, fraudes y recursos del sitio.',
          launcher: 'Abrir asistente',
          placeholder: 'Haz una pregunta',
          send: 'Enviar',
          thinking: 'Analizando tu solicitud y preparando una respuesta clara y segura...',
          error: 'No pude completar la respuesta en este momento. Revisa la conexión o intenta nuevamente.'
        }
      : {
          title: 'Cybersecurity Assistant',
          subtitle: 'Practical guidance for digital safety, scams, and site resources.',
          launcher: 'Ask assistant',
          placeholder: 'Ask a question',
          send: 'Send',
          thinking: 'Analyzing your request and preparing a clear, security-focused response...',
          error: 'I could not complete the response right now. Please check the connection or try again.'
        };
  }

  function createMessage(role, content) {
    return {
      role,
      content: cleanText(content),
      timestamp: Date.now()
    };
  }

  function loadMessages() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(-16) : [];
    } catch (error) {
      return [];
    }
  }

  function saveMessages(messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-16)));
    } catch (error) {}
  }

  function getOpenState() {
    try {
      return sessionStorage.getItem(OPEN_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function saveOpenState(isOpen) {
    try {
      sessionStorage.setItem(OPEN_KEY, isOpen ? '1' : '0');
    } catch (error) {}
  }

  function collectContext() {
    const main = document.querySelector('main') || document.body;

    const headings = Array.from(main.querySelectorAll('h1, h2, h3'))
      .map(node => cleanText(node.textContent))
      .filter(Boolean)
      .slice(0, 12);

    const summary = Array.from(main.querySelectorAll('p, li'))
      .map(node => cleanText(node.textContent))
      .filter(Boolean)
      .join('\n')
      .slice(0, 2200);

    return {
      title: document.title || '',
      path: window.location.pathname || '/',
      pageKind: pageKind(),
      headings,
      summary,
      sections: []
    };
  }

  function addStyles() {
    if (document.getElementById('zdtl-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'zdtl-chat-styles';
    style.textContent = `
      .zdtl-chat-launcher {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 999999;
        border: 0;
        border-radius: 999px;
        padding: 14px 18px;
        background: #ff7a18;
        color: #111827;
        font: 800 14px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        box-shadow: 0 18px 40px rgba(0,0,0,.28);
        cursor: pointer;
      }

      .zdtl-chat-launcher:hover {
        transform: translateY(-1px);
      }

      .zdtl-chat-panel {
        position: fixed;
        right: 20px;
        bottom: 82px;
        z-index: 999999;
        width: min(390px, calc(100vw - 32px));
        max-height: min(690px, calc(100vh - 110px));
        display: none;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 22px;
        background: #0b1220;
        color: #f8fafc;
        box-shadow: 0 24px 70px rgba(0,0,0,.38);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .zdtl-chat-panel.is-open {
        display: flex;
        flex-direction: column;
      }

      .zdtl-chat-header {
        position: relative;
        padding: 16px 46px 16px 18px;
        background: linear-gradient(135deg, #111827, #1f2937);
        border-bottom: 1px solid rgba(255,255,255,.1);
      }

      .zdtl-chat-title {
        margin: 0;
        font-size: 15px;
        font-weight: 850;
      }

      .zdtl-chat-subtitle {
        margin: 4px 0 0;
        color: #cbd5e1;
        font-size: 12px;
        line-height: 1.35;
      }

      .zdtl-chat-close {
        position: absolute;
        top: 10px;
        right: 12px;
        border: 0;
        background: transparent;
        color: #f8fafc;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }

      .zdtl-chat-messages {
        min-height: 250px;
        padding: 16px;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .zdtl-chat-message {
        max-width: 88%;
        border-radius: 16px;
        padding: 10px 12px;
        font-size: 14px;
        line-height: 1.45;
        white-space: pre-wrap;
      }

      .zdtl-chat-message.assistant {
        align-self: flex-start;
        background: #111827;
        border: 1px solid rgba(255,255,255,.08);
        color: #e5e7eb;
      }

      .zdtl-chat-message.user {
        align-self: flex-end;
        background: #ff7a18;
        color: #111827;
        font-weight: 650;
      }

      .zdtl-chat-message.status {
        opacity: .86;
        font-style: italic;
      }

      .zdtl-chat-prompts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px 14px;
      }

      .zdtl-chat-prompt {
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 999px;
        background: transparent;
        color: #e5e7eb;
        padding: 8px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .zdtl-chat-prompt:hover {
        border-color: #ff7a18;
        color: #fff;
      }

      .zdtl-chat-form {
        display: flex;
        gap: 8px;
        padding: 14px;
        border-top: 1px solid rgba(255,255,255,.1);
        background: #060b14;
      }

      .zdtl-chat-input {
        flex: 1;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 14px;
        background: #111827;
        color: #f8fafc;
        padding: 11px 12px;
        font-size: 14px;
        outline: none;
      }

      .zdtl-chat-input:focus {
        border-color: #ff7a18;
      }

      .zdtl-chat-send {
        border: 0;
        border-radius: 14px;
        background: #ff7a18;
        color: #111827;
        font-weight: 850;
        padding: 0 14px;
        cursor: pointer;
      }

      .zdtl-chat-send:disabled,
      .zdtl-chat-input:disabled {
        opacity: .68;
        cursor: not-allowed;
      }

      @media (max-width: 520px) {
        .zdtl-chat-launcher {
          right: 14px;
          bottom: 14px;
        }

        .zdtl-chat-panel {
          right: 10px;
          bottom: 72px;
          width: calc(100vw - 20px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderMessage(container, message, extraClass) {
    const bubble = document.createElement('div');
    bubble.className = `zdtl-chat-message ${message.role}${extraClass ? ` ${extraClass}` : ''}`;
    bubble.textContent = message.content;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    return bubble;
  }

  function getPromptList(config, lang) {
    const group = config.prompts && (config.prompts[pageKind()] || config.prompts.default);

    return group && Array.isArray(group[lang]) ? group[lang] : [];
  }

  function submitForm(form) {
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      return;
    }

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function start() {
    if (document.querySelector('.zdtl-chat-launcher')) return;

    addStyles();

    const config = getConfig();
    let currentLang = getLang();
    let messages = loadMessages();

    if (!messages.length) {
      const welcome =
        config.welcome && config.welcome[currentLang]
          ? config.welcome[currentLang]
          : currentLang === 'es'
            ? 'Hola, soy el asistente de ZeroDay Tech Labs. ¿En qué puedo ayudarte?'
            : 'Hi, I’m the ZeroDay Tech Labs Assistant. What can I help you with?';

      messages = [createMessage('assistant', welcome)];
      saveMessages(messages);
    }

    const launcher = document.createElement('button');
    launcher.className = 'zdtl-chat-launcher';
    launcher.type = 'button';

    const panel = document.createElement('section');
    panel.className = 'zdtl-chat-panel';
    panel.setAttribute('aria-label', config.assistantName || 'Chat assistant');

    const header = document.createElement('div');
    header.className = 'zdtl-chat-header';

    const closeButton = document.createElement('button');
    closeButton.className = 'zdtl-chat-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.textContent = '×';

    const titleNode = document.createElement('p');
    titleNode.className = 'zdtl-chat-title';

    const subtitleNode = document.createElement('p');
    subtitleNode.className = 'zdtl-chat-subtitle';

    header.appendChild(closeButton);
    header.appendChild(titleNode);
    header.appendChild(subtitleNode);

    const messagesBox = document.createElement('div');
    messagesBox.className = 'zdtl-chat-messages';
    messagesBox.setAttribute('aria-live', 'polite');

    const promptsBox = document.createElement('div');
    promptsBox.className = 'zdtl-chat-prompts';

    const form = document.createElement('form');
    form.className = 'zdtl-chat-form';

    const input = document.createElement('input');
    input.className = 'zdtl-chat-input';
    input.type = 'text';
    input.autocomplete = 'off';

    const sendButton = document.createElement('button');
    sendButton.className = 'zdtl-chat-send';
    sendButton.type = 'submit';

    form.appendChild(input);
    form.appendChild(sendButton);

    panel.appendChild(header);
    panel.appendChild(messagesBox);
    panel.appendChild(promptsBox);
    panel.appendChild(form);

    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    messages.forEach(message => renderMessage(messagesBox, message));

    function renderPrompts() {
      promptsBox.innerHTML = '';

      getPromptList(config, currentLang)
        .slice(0, 4)
        .forEach(prompt => {
          const button = document.createElement('button');
          button.className = 'zdtl-chat-prompt';
          button.type = 'button';
          button.textContent = prompt;

          button.addEventListener('click', () => {
            input.value = prompt;
            submitForm(form);
          });

          promptsBox.appendChild(button);
        });
    }

    function replaceInitialGreetingForLanguage() {
      const hasUserMessage = messages.some(message => message.role === 'user');

      if (hasUserMessage || !messages.length) return;

      const welcome =
        config.welcome && config.welcome[currentLang]
          ? config.welcome[currentLang]
          : currentLang === 'es'
            ? 'Hola, soy el asistente de ZeroDay Tech Labs. ¿En qué puedo ayudarte?'
            : 'Hi, I’m the ZeroDay Tech Labs Assistant. What can I help you with?';

      messages[0] = createMessage('assistant', welcome);
      saveMessages(messages);

      messagesBox.innerHTML = '';
      messages.forEach(message => renderMessage(messagesBox, message));
    }

    function applyLanguageUi() {
      currentLang = getLang();

      const ui = getUiStrings(currentLang);

      launcher.textContent = ui.launcher;
      titleNode.textContent = ui.title;
      subtitleNode.textContent = ui.subtitle;
      input.placeholder = ui.placeholder;
      sendButton.textContent = ui.send;

      renderPrompts();
      replaceInitialGreetingForLanguage();
    }

    function handleLanguageMaybeChanged() {
      const nextLang = getLang();

      if (nextLang !== currentLang) {
        currentLang = nextLang;
        applyLanguageUi();
      }
    }

    function setOpen(isOpen) {
      panel.classList.toggle('is-open', isOpen);
      saveOpenState(isOpen);

      if (isOpen) {
        setTimeout(() => input.focus(), 50);
      }
    }

    launcher.addEventListener('click', () => {
      setOpen(!panel.classList.contains('is-open'));
    });

    closeButton.addEventListener('click', () => {
      setOpen(false);
    });

    document.addEventListener('click', event => {
      if (event.target && event.target.closest && event.target.closest('[data-lang-btn]')) {
        setTimeout(handleLanguageMaybeChanged, 50);
      }
    });

    if (
      window.ZDTL_i18n &&
      typeof window.ZDTL_i18n.setLang === 'function' &&
      !window.ZDTL_i18n.__zdtlChatPatched
    ) {
      const originalSetLang = window.ZDTL_i18n.setLang;

      window.ZDTL_i18n.setLang = function patchedSetLang(lang) {
        const result = originalSetLang.apply(this, arguments);
        setTimeout(handleLanguageMaybeChanged, 0);
        return result;
      };

      window.ZDTL_i18n.__zdtlChatPatched = true;
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();

      const value = cleanText(input.value);

      if (!value) return;

      const ui = getUiStrings(getLang());

      input.value = '';
      input.disabled = true;
      sendButton.disabled = true;

      const userMessage = createMessage('user', value);
      messages.push(userMessage);

      renderMessage(messagesBox, userMessage);
      saveMessages(messages);

      const statusNode = renderMessage(
        messagesBox,
        createMessage('assistant', ui.thinking),
        'status'
      );

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        Number(config.requestTimeoutMs || 30000)
      );

      try {
        const response = await fetch(config.endpoint || '/api/chat', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            locale: getLang(),
            messages: messages
              .filter(item => item.role === 'user' || item.role === 'assistant')
              .map(item => ({
                role: item.role,
                content: item.content
              }))
              .slice(-Number(config.maxHistoryTurns || 12)),
            context: collectContext()
          }),
          signal: controller.signal
        });

        const payload = await response.json().catch(() => ({}));
        const reply = cleanText(payload.reply || payload.text || payload.error || ui.error);

        statusNode.classList.remove('status');
        statusNode.textContent = reply;

        messages.push(createMessage('assistant', reply));
        saveMessages(messages);
      } catch (error) {
        statusNode.classList.remove('status');
        statusNode.textContent = ui.error;

        messages.push(createMessage('assistant', ui.error));
        saveMessages(messages);
      } finally {
        clearTimeout(timeout);

        input.disabled = false;
        sendButton.disabled = false;
        messagesBox.scrollTop = messagesBox.scrollHeight;
        input.focus();
      }
    });

    applyLanguageUi();
    setOpen(getOpenState());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
