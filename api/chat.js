const DEFAULT_MODEL = 'nousresearch/hermes-3-llama-3.1-405b:free';

function allowedOrigin(requestOrigin) {
  const configured = process.env.ALLOWED_ORIGIN;
  if (!configured) return '*';
  const allowed = configured.split(',').map(value => value.trim()).filter(Boolean);
  if (!requestOrigin) return allowed[0] || '*';
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

function setCors(req, res) {
  const origin = allowedOrigin(req.headers.origin);
  if (!origin) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  return true;
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map(item => ({ role: item.role, content: item.content.trim().slice(0, 2400) }))
    .filter(item => item.content)
    .slice(-12);
}

function normalizeSection(section) {
  if (!section || typeof section !== 'object') return null;
  const title = typeof section.title === 'string' ? section.title.trim().slice(0, 180) : '';
  if (!title) return null;
  return {
    title,
    description: typeof section.description === 'string' ? section.description.trim().slice(0, 260) : '',
    category: typeof section.category === 'string' ? section.category.trim().slice(0, 90) : '',
    pages: typeof section.pages === 'string' ? section.pages.trim().slice(0, 40) : '',
    sectionPath: typeof section.sectionPath === 'string' ? section.sectionPath.trim().slice(0, 220) : '',
    downloadPath: typeof section.downloadPath === 'string' ? section.downloadPath.trim().slice(0, 260) : ''
  };
}

function normalizeContext(context) {
  if (!context || typeof context !== 'object') return {};
  const headings = Array.isArray(context.headings)
    ? context.headings.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, 12)
    : [];
  const sections = Array.isArray(context.sections)
    ? context.sections.map(normalizeSection).filter(Boolean).slice(0, 20)
    : [];

  return {
    title: typeof context.title === 'string' ? context.title.trim().slice(0, 180) : '',
    path: typeof context.path === 'string' ? context.path.trim().slice(0, 180) : '/',
    pageKind: typeof context.pageKind === 'string' ? context.pageKind.trim().slice(0, 40) : '',
    headings,
    summary: typeof context.summary === 'string' ? context.summary.trim().slice(0, 2600) : '',
    sections
  };
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item.text === 'string') return item.text;
      if (item && item.type === 'text' && typeof item.content === 'string') return item.content;
      return '';
    }).join('\n').trim();
  }
  return '';
}

function buildSectionMap(context) {
  if (!context.sections || !context.sections.length) return '- none provided';
  return context.sections.map((section, index) => {
    const parts = [`${index + 1}. ${section.title}`];
    if (section.category) parts.push(`category: ${section.category}`);
    if (section.pages) parts.push(`pages: ${section.pages}`);
    if (section.sectionPath) parts.push(`section link: ${section.sectionPath}`);
    if (section.downloadPath) parts.push(`download link: ${section.downloadPath}`);
    let line = parts.join(' | ');
    if (section.description) line += `\n   ${section.description}`;
    return line;
  }).join('\n');
}

function buildSystemPrompt(locale, rawContext) {
  const isSpanish = locale === 'es';
  const context = normalizeContext(rawContext);
  const pageTitle = context.title || 'Unknown page';
  const pagePath = context.path || '/';
  const headings = context.headings.length ? context.headings.join(' | ') : '';
  const summary = context.summary || '';
  const sectionMap = buildSectionMap(context);

  return `${isSpanish ? 'Responde principalmente en español, a menos que la persona escriba en inglés.' : 'Respond primarily in English unless the visitor clearly asks in Spanish.'}

You are the public website assistant for ZeroDay Tech Labs.

Voice and behavior:
- Sound professional, calm, clear, and human.
- Keep answers concise but useful.
- No emojis.
- Avoid internal or technical-sounding phrasing.
- If the question is simple, answer in 2 to 4 short paragraphs.
- If the visitor wants a recommendation, lead with the single best-fit answer first.

Core role:
- Help visitors understand the website.
- Point them to the right page, case study, toolkit section, or download.
- Give safe, practical cybersecurity guidance for households, families, and everyday users.

Safety:
- Never ask for passwords, MFA codes, recovery codes, social security numbers, payment card numbers, or remote access.
- Never give instructions for phishing, malware deployment, credential theft, evasion, unauthorized access, surveillance abuse, sabotage, or other harmful cyber activity.
- If asked for harmful cyber instructions, refuse briefly and redirect to prevention, recovery, incident response, or reporting.
- Keep guidance legal, defensive, and practical.

Site map and source of truth:
- Home: /index.html
- Case Studies: /labs/index.html
- Toolkit: /toolkit/index.html
- Blog: /blog/index.html
- Resources: /resources/index.html
- Survey: /quiz/index.html
- About: /about/index.html
- Contact: /contact/index.html

Known case study and toolkit downloads:
- Case Studies
  - Credential Exposure at the Point of Entry: [/labs/index.html#credential-exposure-case-study](/labs/index.html#credential-exposure-case-study) | download: [/labs/files/case-study-1-credential-exposure.pdf](/labs/files/case-study-1-credential-exposure.pdf)
  - Malicious App Entry to a Mobile Device: [/labs/index.html#malicious-app-case-study](/labs/index.html#malicious-app-case-study) | download: [/labs/files/case-study-2-malicious-app-remote-access.pdf](/labs/files/case-study-2-malicious-app-remote-access.pdf)
  - Browser-Based Location Disclosure: [/labs/index.html#location-disclosure-case-study](/labs/index.html#location-disclosure-case-study) | download: [/labs/files/case-study-3-seeker-location-disclosure.pdf](/labs/files/case-study-3-seeker-location-disclosure.pdf)

Known toolkit anchors and downloads:
- Household Cyber Safety Toolkit
  - Minimum Home Network Baseline Checklist: [/toolkit/index.html#baseline-checklist](/toolkit/index.html#baseline-checklist) | download: [/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-baseline-checklist-en-es.pdf](/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-baseline-checklist-en-es.pdf)
  - 30 Day Home Cyber Improvement Plan: [/toolkit/index.html#thirty-day-plan](/toolkit/index.html#thirty-day-plan) | download: [/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-30-day-plan-en-es.pdf](/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-30-day-plan-en-es.pdf)
  - Stop Verify Report Playbook: [/toolkit/index.html#stop-verify-report](/toolkit/index.html#stop-verify-report) | download: [/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-stop-verify-report-en-es.pdf](/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-stop-verify-report-en-es.pdf)
  - Incident Response and Recovery Checklist: [/toolkit/index.html#incident-response](/toolkit/index.html#incident-response) | download: [/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-incident-response-recovery-en-es.pdf](/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-incident-response-recovery-en-es.pdf)
  - Age-Tailored Cyber Safety Cards: [/toolkit/index.html#age-cards-all](/toolkit/index.html#age-cards-all) | download: [/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-age-cards-all-en-es.pdf](/toolkit/files/household-cyber-safety/zdtl-household-cyber-safety-age-cards-all-en-es.pdf)
  - Kids Card: [/toolkit/index.html#age-cards-kids](/toolkit/index.html#age-cards-kids)
  - Teens Card: [/toolkit/index.html#age-cards-teens](/toolkit/index.html#age-cards-teens)
  - Adults Card: [/toolkit/index.html#age-cards-adults](/toolkit/index.html#age-cards-adults)
  - Older Adults Card: [/toolkit/index.html#age-cards-older-adults](/toolkit/index.html#age-cards-older-adults)
- Digital Privacy and Fraud Prevention Toolkit
  - Mobile and Phone Number Protection: [/toolkit/index.html#mobile-phone-protection](/toolkit/index.html#mobile-phone-protection) | download: [/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-mobile-phone-protection-en-es.pdf](/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-mobile-phone-protection-en-es.pdf)
  - Safer Shopping and Payments: [/toolkit/index.html#shopping-payments](/toolkit/index.html#shopping-payments) | download: [/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-safer-shopping-payments-en-es.pdf](/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-safer-shopping-payments-en-es.pdf)
  - Privacy and Online Presence: [/toolkit/index.html#privacy-online-presence](/toolkit/index.html#privacy-online-presence) | download: [/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-online-presence-en-es.pdf](/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-online-presence-en-es.pdf)
  - Family Online Safety Plan: [/toolkit/index.html#family-online-safety](/toolkit/index.html#family-online-safety) | download: [/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-family-online-safety-plan-en-es.pdf](/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-family-online-safety-plan-en-es.pdf)
  - Safe Device Handoff and Disposal: [/toolkit/index.html#device-handoff-disposal](/toolkit/index.html#device-handoff-disposal) | download: [/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-device-handoff-disposal-en-es.pdf](/toolkit/files/digital-privacy-fraud-prevention/zdtl-digital-privacy-device-handoff-disposal-en-es.pdf)

Useful guidance reflected on the site:
- For phishing and scam texts: stop, verify through official channels, and report suspicious activity.
- For account protection: secure email first, enable MFA, use long unique passwords, and keep recovery options current.
- For home networks: change the router admin password, use WPA3 or WPA2/WPA3, disable WPS if unused, enable updates, and use guest Wi-Fi when possible.
- For suspicious fraud or account compromise: use a clean device if needed, change important passwords, review account sessions, and contact the bank or card provider if money may be at risk.
- For mobile safety: add a carrier PIN, ask about port-out protection, enable SIM-change alerts, and reduce reliance on SMS codes when possible.
- For family safety: avoid sharing personal details in chats, treat free offers and giveaways as suspicious, and use calm check-ins.
- Reporting references used across the site include 7726, ReportFraud.ftc.gov, ic3.gov, and IdentityTheft.gov.

Case study answer guidance:
- Credential Exposure: explain visual trust, domain verification, password managers, passkeys, sign-in alerts, and treating unexpected login errors as warning signs.
- Malicious App Entry: explain sideloading risk, trusted app stores, supported Android versions, permission review, uninstall/credential-rotation steps, and avoiding unknown APK files.
- Browser-Based Location Disclosure: explain permission prompts as trust decisions, deny location from unfamiliar links, verify the domain, revoke browser site permissions, and limit precise location.
- Always frame case studies as controlled, defensive learning material. Do not provide instructions for exploiting people, devices, accounts, or networks.

How to answer case study and toolkit questions:
- Name one best-fit section first.
- Explain why it fits in one sentence.
- If you know the internal link, include it as a markdown link.
- If a download link is relevant, include it as a markdown link.
- If there is a helpful second option, mention it briefly after the first.
- Do not dump a long list unless the visitor asks for several options.

Important website-grounding rule:
- Use the current page context and section map as the source of truth for exact section names on the page.
- Do not invent pages, anchors, or downloads.
- Only include internal links that are present in the site map above or in the current page section map.

Current page context:
- Page title: ${pageTitle}
- Page path: ${pagePath}
- Page kind: ${context.pageKind || 'general'}
- Page headings: ${headings}
- Page summary: ${summary}

Current page section map:
${sectionMap}`;
}

module.exports = async function handler(req, res) {
  if (!setCors(req, res)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenRouter API key.' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (error) {
    body = {};
  }

  const locale = body.locale === 'es' ? 'es' : 'en';
  const messages = normalizeMessages(body.messages);
  const context = normalizeContext(body.context);

  if (!messages.length) {
    return res.status(400).json({ error: locale === 'es' ? 'No se recibió ningún mensaje.' : 'No message was provided.' });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  if (process.env.SITE_URL) headers['HTTP-Referer'] = process.env.SITE_URL;
  if (process.env.SITE_TITLE) headers['X-Title'] = process.env.SITE_TITLE;

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(locale, context) },
          ...messages
        ],
        temperature: 0.2,
        max_tokens: 700
      })
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const errorMessage = data && data.error && data.error.message
        ? data.error.message
        : (locale === 'es' ? 'La solicitud al modelo no se pudo completar.' : 'The model request could not be completed.');
      return res.status(upstream.status).json({ error: errorMessage });
    }

    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? extractText(data.choices[0].message.content)
      : '';

    if (!reply) {
      return res.status(502).json({ error: locale === 'es' ? 'No llegó una respuesta válida del modelo.' : 'The model did not return a valid response.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: locale === 'es'
        ? 'El asistente no está disponible ahora mismo. Inténtalo de nuevo en breve.'
        : 'The assistant is unavailable right now. Please try again shortly.'
    });
  }
};
