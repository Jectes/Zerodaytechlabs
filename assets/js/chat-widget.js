(function () {
  const STORAGE_KEY = 'zdtl_chat_messages';
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

    return document.documentElement.getAttribute('lang') === 'es' ? 'es' : 'en';
  }

  function pageKind() {
    const path = window.location.pathname;
    if (path.includes('/toolkit/')) return 'toolkit';
    if (path.includes('/resources/')) return 'resources';
    if (path.includes('/labs/')) return 'labs';
    return 'default';
  }

  function text(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
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

  function saveOpenState(isOpen) {
    try {
      sessionStorage.setItem(OPEN_KEY, isOpen ? '1' : '0');
    } catch (error) {}
  }

  function getOpenState() {
    try {
      return sessionStorage.getItem(OPEN_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function createMessage(role, content) {
    return {
      role,
      content: text(content),
      timestamp: Date.now()
    };
  }

  function collectContext() {
    const main = document.querySelector('main') || document.body;
    const headings = Array.from(main.querySelectorAll('h1, h2, h3'))
      .map(node => text(node.textContent))
      .filter(Boolean)
      .slice(0, 12);

    const summary = Array.from(main.querySelectorAll('p, li'))
      .map(node => text(node.textContent))
      .filter(Boolean)
      .join('\n')
      .slice(0, 2200);

    return {
      title: document.title || '',
      path: window.location.pathname,
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
      .zdtl-chat-panel {
        position: fixed;
        right: 20px;
        bottom: 82px;
        z-index: 999999;
        width: min(380px, calc(100vw - 32px));
        max-height: min(680px, calc(100vh - 110px));
        display: none;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 22px;
        background: #0b1220;
        color: #f8fafc;
        box-shadow: 0 24px 70px rgba(0,0,0,.38);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .zdtl-chat-panel.is-open { display: flex; flex-direction: column; }
      .zdtl-chat-header { padding: 16px 18px; background: linear-gradient(135deg, #111827, #1f2937); border-bottom: 1px solid rgba(255,255,255,.1); }
      .zdtl-chat-title { margin: 0; font-size: 15px; font-weight: 850; }
      .zdtl-chat-subtitle { margin: 4px 0 0; color: #cbd5e1; font-size: 12px; line-height: 1.35; }
      .zdtl-chat-messages { padding: 16px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
      .zdtl-chat-message { max-width: 88%; border-radius: 16px; padding: 10px 12px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; }
      .zdtl-chat-message.assistant { align-self: flex-start; background: #111827; border: 1px solid rgba(255,255,255,.08); color: #e5e7eb; }
      .zdtl-chat-message.user { align-self: flex-end; background: #ff7a18; color: #111827; font-weight: 650; }
      .zdtl-chat-prompts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 14px; }
      .zdtl-chat-prompt { border: 1px solid rgba(255,255,255,.14); border-radius: 999px; background: transparent; color: #e5e7eb; padding: 8px 10px; font-size: 12px; cursor: pointer; }
      .zdtl-chat-form { display: flex; gap: 8px; padding: 14px; border-top: 1px solid rgba(255,255,255,.1); background: #060b14; }
      .zdtl-chat-input { flex: 1; min-width: 0; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: #111827; color: #f8fafc; padding: 11px 12px; font-size: 14px; outline: none; }
      .zdtl-chat-send { border: 0; border-radius: 14px; background: #ff7a18; color: #111827; font-weight: 850; padding: 0 14px; cursor: pointer; }
      .zdtl-chat-close { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; color: #f8fafc; font-size: 22px; cursor: pointer; }
      @media (max-width: 520px) {
        .zdtl-chat-launcher { right: 14px; bottom: 14px; }
        .zdtl-chat-panel { right: 10px; bottom: 72px; width: calc(100vw - 20px); }
      }
    `;
    document.head.appendChild(style);
  }

  function renderMessage(container, message) {
    const bubble = document.createElement('div');
    bubble.className = `zdtl-chat-message ${message.role}`;
    bubble.textContent = message.content;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  function start() {
    if (document.querySelector('.zdtl-chat-launcher')) return;

    addStyles();

    const config = getConfig();
    const lang = getLang();
    const ui = {
      title: lang === 'es' ? 'Asistente de ciberseguridad' : 'Cybersecurity assistant',
      subtitle: lang === 'es' ? 'Ayuda del sitio y orientación práctica.' : 'Website help and practical safety guidance.',
      launcher: lang === 'es' ? 'Abrir asistente' : 'Ask assistant',
      placeholder: lang === 'es' ? 'Haz una pregunta' : 'Ask a question',
      send: lang === 'es' ? 'Enviar' : 'Send',
      working: lang === 'es' ? 'Trabajando en eso...' : 'Working on that...',
      error: lang === 'es' ? 'El asistente no está disponible ahora mismo.' : 'The assistant is unavailable right now.'
    };

    let messages = loadMessages();

    if (!messages.length) {
      messages = [createMessage('assistant', config.welcome && config.welcome[lang] ? config.welcome[lang] : 'Hi, what can I help you with?')];
      saveMessages(messages);
    }

    const launcher = document.createElement('button');
    launcher.className = 'zdtl-chat-launcher';
    launcher.type = 'button';
    launcher.textContent = ui.launcher;

    const panel = document.createElement('section');
    panel.className = 'zdtl-chat-panel';
    panel.setAttribute('aria-label', config.assistantName || 'Chat assistant');
    panel.innerHTML = `
      <button class="zdtl-chat-close" type="button" aria-label="Close">×</button>
      <div class="zdtl-chat-header">
        <p class="zdtl-chat-title">${ui.title}</p>
        <p class="zdtl-chat-subtitle">${ui.subtitle}</p>
      </div>
      <div class="zdtl-chat-messages" aria-live="polite"></div>
      <div class="zdtl-chat-prompts"></div>
      <form class="zdtl-chat-form">
        <input class="zdtl-chat-input" type="text" autocomplete="off" placeholder="${ui.placeholder}">
        <button class="zdtl-chat-send" type="submit">${ui.send}</button>
      </form>
    `;

    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    const closeButton = panel.querySelector('.zdtl-chat-close');
    const messagesBox = panel.querySelector('.zdtl-chat-messages');
    const promptsBox = panel.querySelector('.zdtl-chat-prompts');
    const form = panel.querySelector('.zdtl-chat-form');
    const input = panel.querySelector('.zdtl-chat-input');

    messages.forEach(message => renderMessage(messagesBox, message));

    const promptGroup = (config.prompts && (config.prompts[pageKind()] || config.prompts.default)) || null;
    const promptList = promptGroup && promptGroup[lang] ? promptGroup[lang] : [];

    promptList.slice(0, 4).forEach(prompt => {
      const button = document.createElement('button');
      button.className = 'zdtl-chat-prompt';
      button.type = 'button';
      button.textContent = prompt;
      button.addEventListener('click', () => {
        input.value = prompt;
        form.requestSubmit();
      });
      promptsBox.appendChild(button);
    });

    function setOpen(isOpen) {
      panel.classList.toggle('is-open', isOpen);
      saveOpenState(isOpen);
      if (isOpen) setTimeout(() => input.focus(), 50);
    }

    launcher.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    closeButton.addEventListener('click', () => setOpen(false));

    form.addEventListener('submit', async event => {
      event.preventDefault();

      const value = text(input.value);
      if (!value) return;

      input.value = '';

      const userMessage = createMessage('user', value);
      messages.push(userMessage);
      renderMessage(messagesBox, userMessage);
      saveMessages(messages);

      const working = createMessage('assistant', ui.working);
      renderMessage(messagesBox, working);
      const workingNode = messagesBox.lastElementChild;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(config.requestTimeoutMs || 30000));

      try {
        const response = await fetch(config.endpoint || '/api/chat', {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale: getLang(),
            messages: messages
              .filter(item => item.role === 'user' || item.role === 'assistant')
              .map(item => ({ role: item.role, content: item.content }))
              .slice(-Number(config.maxHistoryTurns || 12)),
            context: collectContext()
          }),
          signal: controller.signal
        });

        const payload = await response.json().catch(() => ({}));
        const reply = payload.reply || payload.text || payload.error || ui.error;

        workingNode.textContent = reply;
        messages.push(createMessage('assistant', reply));
        saveMessages(messages);
      } catch (error) {
        workingNode.textContent = ui.error;
        messages.push(createMessage('assistant', ui.error));
        saveMessages(messages);
      } finally {
        clearTimeout(timeout);
        messagesBox.scrollTop = messagesBox.scrollHeight;
      }
    });

    setOpen(getOpenState());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
