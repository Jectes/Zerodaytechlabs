(function(){
  const STORAGE_KEY = 'zdtl_chat_messages';
  const OPEN_KEY = 'zdtl_chat_open';

  function getConfig(){
    return window.ZDTL_CHAT_CONFIG || {};
  }

  function getLang(){
    try {
      if (window.ZDTL_i18n && typeof window.ZDTL_i18n.getLang === 'function') return window.ZDTL_i18n.getLang();
    } catch (error) {}
    return document.documentElement.getAttribute('lang') === 'es' ? 'es' : 'en';
  }

  const UI = {
    en: {
      launcher: 'Ask assistant',
      title: 'Cybersecurity assistant',
      subtitle: 'Website help and practical cyber safety guidance.',
      placeholder: 'Ask a question',
      send: 'Send',
      close: 'Close',
      typing: 'Working on that...',
      emptyError: 'Please enter a question.',
      requestError: 'The assistant is unavailable right now. Please try again shortly.'
    },
    es: {
      launcher: 'Abrir asistente',
      title: 'Asistente de ciberseguridad',
      subtitle: 'Ayuda del sitio y orientación práctica de ciberseguridad.',
      placeholder: 'Haz una pregunta',
      send: 'Enviar',
      close: 'Cerrar',
      typing: 'Trabajando en eso...',
      emptyError: 'Escribe una pregunta.',
      requestError: 'El asistente no está disponible ahora mismo. Inténtalo de nuevo en breve.'
    }
  };

  function safeParseMessages(){
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string').slice(-16);
    } catch (error) {
      return [];
    }
  }

  function saveMessages(messages){
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-16)));
    } catch (error) {}
  }

  function saveOpenState(isOpen){
    try {
      sessionStorage.setItem(OPEN_KEY, isOpen ? '1' : '0');
    } catch (error) {}
  }

  function getOpenState(){
    try {
      return sessionStorage.getItem(OPEN_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function normalizeText(value){
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function isVisibleForLang(element, lang){
    if (!element) return false;
    const langHolder = element.closest('[data-lang]');
    if (!langHolder) return true;
    return langHolder.getAttribute('data-lang') === lang;
  }

  function firstText(root, selectors, lang){
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of list) {
      const nodes = Array.from(root.querySelectorAll(selector));
      for (const node of nodes) {
        if (!isVisibleForLang(node, lang)) continue;
        const text = normalizeText(node.textContent);
        if (text) return text;
      }
    }
    return '';
  }

  function toInternalPath(rawHref){
    if (!rawHref) return '';
    try {
      const url = new URL(rawHref, window.location.href);
      if (url.origin !== window.location.origin) return '';
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
      return '';
    }
  }

  function currentPageKind(){
    const path = window.location.pathname;
    if (/\/toolkit\//.test(path)) return 'toolkit';
    if (/\/resources\//.test(path)) return 'resources';
    if (/\/labs\//.test(path)) return 'labs';
    if (/\/blog\//.test(path)) return 'blog';
    return 'general';
  }

  function collectToolkitSections(main, lang){
    const selector = '.toolkit-card, .toolkit-quick-card, .toolkit-mini-card';
    const seen = new Set();
    return Array.from(main.querySelectorAll(selector)).map(node => {
      const title = firstText(node, ['h3', 'h4', 'h2'], lang);
      if (!title) return null;
      const description = firstText(node, ['p'], lang);
      const category = firstText(node, ['.pill', '.badge'], lang);
      const pages = firstText(node, ['.toolkit-meta'], lang);
      const buttonLink = node.matches('a[href]') ? node : node.querySelector('a[href]');
      const downloadLink = Array.from(node.querySelectorAll('a[href]')).find(link => /\.pdf($|#|\?)/i.test(link.getAttribute('href') || '')) || (node.matches('a[href]') && /\.pdf($|#|\?)/i.test(node.getAttribute('href') || '') ? node : null);
      const sectionPath = node.id ? `${window.location.pathname}#${node.id}` : (buttonLink ? toInternalPath(buttonLink.getAttribute('href')) : '');
      const downloadPath = downloadLink ? toInternalPath(downloadLink.getAttribute('href')) : '';
      const key = `${title}|${sectionPath}|${downloadPath}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        title,
        description,
        category,
        pages,
        sectionPath,
        downloadPath
      };
    }).filter(Boolean).slice(0, 20);
  }

  function collectPageContext(lang){
    const main = document.querySelector('main') || document.body;
    const title = document.title || '';
    const headings = Array.from(main.querySelectorAll('h1, h2, h3'))
      .filter(el => isVisibleForLang(el, lang))
      .map(el => normalizeText(el.textContent))
      .filter(Boolean)
      .slice(0, 12);
    const paragraphs = Array.from(main.querySelectorAll('p, li'))
      .filter(el => isVisibleForLang(el, lang))
      .map(el => normalizeText(el.textContent))
      .filter(Boolean);

    return {
      title,
      path: window.location.pathname,
      pageKind: currentPageKind(),
      headings,
      summary: paragraphs.join('\n').slice(0, 2600),
      sections: collectToolkitSections(main, lang)
    };
  }

  function normalizeResponseText(payload){
    if (!payload) return '';
    if (typeof payload.reply === 'string') return payload.reply;
    if (typeof payload.text === 'string') return payload.text;
    return '';
  }

  function createMessage(role, content){
    return { role, content, timestamp: Date.now() };
  }

  function resolveSafeHref(rawHref){
    if (!rawHref) return null;
    try {
      const trimmed = String(rawHref).trim();
      if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return null;
      const url = new URL(trimmed, window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (url.origin !== window.location.origin) return null;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
      return null;
    }
  }

  function appendInlineMarkdown(container, text){
    const source = String(text || '');
    const markdownLink = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let matched = false;
    let match;

    while ((match = markdownLink.exec(source)) !== null) {
      matched = true;
      const [fullMatch, label, href] = match;
      const start = match.index;
      if (start > lastIndex) {
        container.appendChild(document.createTextNode(source.slice(lastIndex, start)));
      }
      const safeHref = resolveSafeHref(href);
      if (safeHref) {
        const anchor = document.createElement('a');
        anchor.href = safeHref;
        anchor.textContent = label.trim();
        anchor.className = 'zdtl-chat-inline-link';
        container.appendChild(anchor);
      } else {
        container.appendChild(document.createTextNode(fullMatch));
      }
      lastIndex = start + fullMatch.length;
    }

    if (!matched) {
      container.textContent = source;
      return;
    }

    if (lastIndex < source.length) {
      container.appendChild(document.createTextNode(source.slice(lastIndex)));
    }
  }

  function renderParagraphs(text){
    const fragment = document.createDocumentFragment();
    const chunks = String(text || '').split(/\n{2,}|\r\n\r\n/).map(item => item.trim()).filter(Boolean);
    if (!chunks.length) {
      const p = document.createElement('p');
      p.textContent = text || '';
      fragment.appendChild(p);
      return fragment;
    }
    chunks.forEach(chunk => {
      const p = document.createElement('p');
      appendInlineMarkdown(p, chunk);
      fragment.appendChild(p);
    });
    return fragment;
  }

  function buildWidget(){
    const root = document.createElement('div');
    root.className = 'zdtl-chat-shell';
    root.innerHTML = `
      <button class="zdtl-chat-launcher" type="button" aria-expanded="false" aria-controls="zdtl-chat-panel"></button>
      <section class="zdtl-chat-panel" id="zdtl-chat-panel" aria-hidden="true" aria-label="Chat assistant">
        <div class="zdtl-chat-header">
          <div>
            <strong class="zdtl-chat-title"></strong>
            <p class="zdtl-chat-subtitle"></p>
          </div>
          <button class="zdtl-chat-close" type="button"></button>
        </div>
        <div class="zdtl-chat-body" aria-live="polite"></div>
        <div class="zdtl-chat-prompts"></div>
        <form class="zdtl-chat-form">
          <label class="zdtl-chat-label" for="zdtl-chat-input">Message</label>
          <div class="zdtl-chat-input-row">
            <textarea id="zdtl-chat-input" rows="1"></textarea>
            <button class="zdtl-chat-send" type="submit"></button>
          </div>
        </form>
      </section>
    `;
    return root;
  }

  function init(){
    const config = getConfig();
    const widget = buildWidget();
    document.body.appendChild(widget);

    const launcher = widget.querySelector('.zdtl-chat-launcher');
    const panel = widget.querySelector('.zdtl-chat-panel');
    const closeBtn = widget.querySelector('.zdtl-chat-close');
    const title = widget.querySelector('.zdtl-chat-title');
    const subtitle = widget.querySelector('.zdtl-chat-subtitle');
    const body = widget.querySelector('.zdtl-chat-body');
    const prompts = widget.querySelector('.zdtl-chat-prompts');
    const form = widget.querySelector('.zdtl-chat-form');
    const input = widget.querySelector('#zdtl-chat-input');
    const sendBtn = widget.querySelector('.zdtl-chat-send');
    const srLabel = widget.querySelector('.zdtl-chat-label');

    let messages = safeParseMessages();
    let isOpen = getOpenState();
    let isSending = false;

    function getPromptSet(lang){
      const allPrompts = config.prompts || {};
      const pageKind = currentPageKind();
      if (allPrompts[pageKind] && Array.isArray(allPrompts[pageKind][lang])) return allPrompts[pageKind][lang];
      if (allPrompts.default && Array.isArray(allPrompts.default[lang])) return allPrompts.default[lang];
      return [];
    }

    function refreshCopy(){
      const lang = getLang();
      const copy = UI[lang] || UI.en;
      launcher.textContent = copy.launcher;
      launcher.setAttribute('aria-label', copy.launcher);
      title.textContent = copy.title;
      subtitle.textContent = copy.subtitle;
      closeBtn.textContent = copy.close;
      closeBtn.setAttribute('aria-label', copy.close);
      input.placeholder = copy.placeholder;
      sendBtn.textContent = copy.send;
      srLabel.textContent = copy.placeholder;
      renderPrompts(lang);
      if (!messages.length) renderMessages();
    }

    function renderPrompts(lang){
      const promptSet = getPromptSet(lang);
      prompts.innerHTML = '';
      promptSet.forEach(promptText => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'zdtl-chat-prompt';
        btn.textContent = promptText;
        btn.addEventListener('click', () => {
          input.value = promptText;
          input.focus();
        });
        prompts.appendChild(btn);
      });
    }

    function scrollToBottom(){
      body.scrollTop = body.scrollHeight;
    }

    function renderMessages(){
      const lang = getLang();
      body.innerHTML = '';
      if (!messages.length) {
        const welcome = document.createElement('div');
        welcome.className = 'zdtl-chat-message assistant';
        welcome.appendChild(renderParagraphs((config.welcome && config.welcome[lang]) || UI[lang].subtitle));
        body.appendChild(welcome);
      } else {
        messages.forEach(message => {
          const block = document.createElement('div');
          block.className = `zdtl-chat-message ${message.role === 'user' ? 'user' : 'assistant'}`;
          block.appendChild(renderParagraphs(message.content));
          body.appendChild(block);
        });
      }
      scrollToBottom();
    }

    function setOpen(nextOpen){
      isOpen = !!nextOpen;
      widget.classList.toggle('is-open', isOpen);
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      launcher.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      saveOpenState(isOpen);
      if (isOpen) {
        setTimeout(() => input.focus(), 40);
      }
    }

    function pushMessage(role, content){
      messages = messages.concat(createMessage(role, content)).slice(-16);
      saveMessages(messages);
      renderMessages();
    }

    async function sendMessage(text){
      const lang = getLang();
      const copy = UI[lang] || UI.en;
      const value = String(text || '').trim();
      if (!value) {
        pushMessage('assistant', copy.emptyError);
        return;
      }
      if (isSending) return;

      pushMessage('user', value);
      input.value = '';
      input.style.height = 'auto';
      isSending = true;
      sendBtn.disabled = true;
      input.disabled = true;

      const typing = document.createElement('div');
      typing.className = 'zdtl-chat-message assistant is-typing';
      typing.appendChild(renderParagraphs(copy.typing));
      body.appendChild(typing);
      scrollToBottom();

      const maxTurns = Number(config.maxHistoryTurns || 12);
      const payload = {
        locale: lang,
        messages: messages.map(item => ({ role: item.role, content: item.content })).slice(-maxTurns),
        context: collectPageContext(lang)
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(config.requestTimeoutMs || 30000));

      try {
        const response = await fetch(config.endpoint || '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        body.removeChild(typing);
        if (!response.ok) {
          throw new Error(data && data.error ? data.error : copy.requestError);
        }
        const reply = normalizeResponseText(data);
        pushMessage('assistant', reply || copy.requestError);
      } catch (error) {
        if (typing.parentNode === body) body.removeChild(typing);
        pushMessage('assistant', (error && error.message) ? error.message : copy.requestError);
      } finally {
        clearTimeout(timeout);
        isSending = false;
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
      }
    }

    launcher.addEventListener('click', () => {
      refreshCopy();
      setOpen(!isOpen);
    });

    closeBtn.addEventListener('click', () => setOpen(false));

    form.addEventListener('submit', event => {
      event.preventDefault();
      sendMessage(input.value);
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 180) + 'px';
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage(input.value);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isOpen) setOpen(false);
    });

    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) {
        messages = safeParseMessages();
        renderMessages();
      }
    });

    refreshCopy();
    renderMessages();
    if (isOpen) setOpen(true);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
