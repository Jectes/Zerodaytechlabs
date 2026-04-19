const DEFAULT_MODEL = 'nousresearch/hermes-3-llama-3.1-405b:free';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://zerodaytechlabs.com',
  'https://www.zerodaytechlabs.com',
  'https://project-fx5fh.vercel.app'
];

/*
  IMPORTANT:
  This file is configured to work immediately with Wix + Vercel.

  By default, CORS is open so the Wix frontend can reach the Vercel API
  without throwing "Failed to fetch".

  Later, when everything is working, you can lock it down by adding this
  environment variable in Vercel:

  STRICT_CORS=true
*/

function cleanOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '');
}

function getAllowedOrigins() {
  const configured = process.env.ALLOWED_ORIGIN;

  if (!configured) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configured
    .split(',')
    .map(value => cleanOrigin(value))
    .filter(Boolean);
}

function isTrustedPreviewOrigin(origin) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname.endsWith('.wixsite.com') ||
      hostname.endsWith('.wixstudio.io') ||
      hostname.endsWith('.wix.com') ||
      hostname === 'editor.wix.com' ||
      hostname === 'manage.wix.com'
    );
  } catch (error) {
    return false;
  }
}

function allowedOrigin(requestOrigin) {
  const origin = cleanOrigin(requestOrigin);

  /*
    Default mode: allow browser requests.
    This fixes the Wix/Vercel "Failed to fetch" issue immediately.
  */
  if (process.env.STRICT_CORS !== 'true') {
    return '*';
  }

  /*
    Strict mode:
    Only allow your configured domains and Wix preview/editor origins.
  */
  if (!origin) {
    return '*';
  }

  const allowed = getAllowedOrigins();

  if (allowed.includes(origin)) {
    return origin;
  }

  if (isTrustedPreviewOrigin(origin)) {
    return origin;
  }

  return null;
}

function setCors(req, res) {
  const origin = allowedOrigin(req.headers.origin);

  if (!origin) {
    return false;
  }

  const requestedHeaders =
    req.headers['access-control-request-headers'] ||
    'Content-Type, Authorization';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');

  if (origin !== '*') {
    res.setHeader('Vary', 'Origin');
  }

  return true;
}

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function normalizeMessages(body) {
  let messages = [];

  if (Array.isArray(body.messages)) {
    messages = body.messages;
  } else if (typeof body.message === 'string') {
    messages = [
      {
        role: 'user',
        content: body.message
      }
    ];
  } else if (typeof body.question === 'string') {
    messages = [
      {
        role: 'user',
        content: body.question
      }
    ];
  }

  return messages
    .filter(item => {
      return (
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
      );
    })
    .map(item => ({
      role: item.role,
      content: item.content.trim().slice(0, 2400)
    }))
    .filter(item => item.content)
    .slice(-12);
}

function normalizeSection(section) {
  if (!section || typeof section !== 'object') {
    return null;
  }

  const title =
    typeof section.title === 'string'
      ? section.title.trim().slice(0, 180)
      : '';

  if (!title) {
    return null;
  }

  return {
    title,
    description:
      typeof section.description === 'string'
        ? section.description.trim().slice(0, 300)
        : '',
    category:
      typeof section.category === 'string'
        ? section.category.trim().slice(0, 90)
        : '',
    pages:
      typeof section.pages === 'string'
        ? section.pages.trim().slice(0, 40)
        : '',
    sectionPath:
      typeof section.sectionPath === 'string'
        ? section.sectionPath.trim().slice(0, 220)
        : '',
    downloadPath:
      typeof section.downloadPath === 'string'
        ? section.downloadPath.trim().slice(0, 260)
        : ''
  };
}

function normalizeContext(context) {
  if (!context || typeof context !== 'object') {
    return {};
  }

  const headings = Array.isArray(context.headings)
    ? context.headings
        .filter(item => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  const sections = Array.isArray(context.sections)
    ? context.sections.map(normalizeSection).filter(Boolean).slice(0, 24)
    : [];

  return {
    title:
      typeof context.title === 'string'
        ? context.title.trim().slice(0, 180)
        : '',
    path:
      typeof context.path === 'string'
        ? context.path.trim().slice(0, 180)
        : '/',
    pageKind:
      typeof context.pageKind === 'string'
        ? context.pageKind.trim().slice(0, 40)
        : '',
    headings,
    summary:
      typeof context.summary === 'string'
        ? context.summary.trim().slice(0, 2600)
        : '',
    sections
  };
}

function buildSectionMap(context) {
  if (!context.sections || !context.sections.length) {
    return '- No page sections were provided.';
  }

  return context.sections
    .map((section, index) => {
      const parts = [`${index + 1}. ${section.title}`];

      if (section.category) {
        parts.push(`category: ${section.category}`);
      }

      if (section.pages) {
        parts.push(`pages: ${section.pages}`);
      }

      if (section.sectionPath) {
        parts.push(`section link: ${section.sectionPath}`);
      }

      if (section.downloadPath) {
        parts.push(`download link: ${section.downloadPath}`);
      }

      let line = parts.join(' | ');

      if (section.description) {
        line += `\n   ${section.description}`;
      }

      return line;
    })
    .join('\n');
}

function extractText(content) {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item.text === 'string') {
          return item.text;
        }

        if (item && item.type === 'text' && typeof item.content === 'string') {
          return item.content;
        }

        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function resolveModel() {
  const configured = process.env.OPENROUTER_MODEL;

  if (!configured || typeof configured !== 'string') {
    return DEFAULT_MODEL;
  }

  const model = configured.trim();

  if (!model) {
    return DEFAULT_MODEL;
  }

  /*
    Safety guard:
    If an API key accidentally gets pasted into OPENROUTER_MODEL,
    do not send the secret as the model name.
  */
  if (
    model.startsWith('sk-') ||
    model.startsWith('sk-or-') ||
    model.startsWith('sk-proj-')
  ) {
    return DEFAULT_MODEL;
  }

  return model;
}

function redactSecrets(message) {
  if (typeof message !== 'string') {
    return '';
  }

  return message
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, '[redacted OpenRouter API key]')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted API key]');
}

function buildSystemPrompt(locale, rawContext) {
  const isSpanish = locale === 'es';
  const context = normalizeContext(rawContext);

  const pageTitle = context.title || 'Unknown page';
  const pagePath = context.path || '/';
  const headings = context.headings.length
    ? context.headings.join(' | ')
    : 'No headings provided.';
  const summary = context.summary || 'No summary provided.';
  const sectionMap = buildSectionMap(context);

  return `
${isSpanish ? 'Respond mainly in Spanish unless the visitor clearly asks in English.' : 'Respond mainly in English unless the visitor clearly asks in Spanish.'}

You are the public website assistant for ZeroDay Tech Labs.

Voice:
- Professional, calm, clear, and human.
- Helpful without being too long.
- No emojis.
- No hype.
- No scary language.
- For simple questions, answer in 2 to 4 short paragraphs.
- For recommendations, give the best-fit answer first.

Your job:
- Help visitors understand the ZeroDay Tech Labs website.
- Point visitors to the right page, case study, toolkit section, download, or resource.
- Give safe, practical cybersecurity guidance for households, families, students, and everyday users.

Safety rules:
- Never ask for passwords, MFA codes, recovery codes, Social Security numbers, payment card numbers, or remote access.
- Never provide instructions for phishing, malware, credential theft, evasion, unauthorized access, surveillance abuse, sabotage, or harmful cyber activity.
- If asked for harmful instructions, refuse briefly and redirect to prevention, recovery, incident response, or reporting.
- Keep all cybersecurity guidance legal, defensive, and practical.

Site map:
- Home: /index.html
- Case Studies: /labs/index.html
- Toolkit: /toolkit/index.html
- Blog: /blog/index.html
- Resources: /resources/index.html
- Survey: /quiz/index.html
- About: /about/index.html
- Contact: /contact/index.html

Known case studies:
- Credential Exposure at the Point of Entry: /labs/index.html#credential-exposure-case-study
- Malicious App Entry to a Mobile Device: /labs/index.html#malicious-app-case-study
- Browser-Based Location Disclosure: /labs/index.html#location-disclosure-case-study

Known toolkit sections:
- Minimum Home Network Baseline Checklist: /toolkit/index.html#baseline-checklist
- 30 Day Home Cyber Improvement Plan: /toolkit/index.html#thirty-day-plan
- Stop Verify Report Playbook: /toolkit/index.html#stop-verify-report
- Incident Response and Recovery Checklist: /toolkit/index.html#incident-response
- Age-Tailored Cyber Safety Cards: /toolkit/index.html#age-cards-all
- Mobile and Phone Number Protection: /toolkit/index.html#mobile-phone-protection
- Safer Shopping and Payments: /toolkit/index.html#shopping-payments
- Privacy and Online Presence: /toolkit/index.html#privacy-online-presence
- Family Online Safety Plan: /toolkit/index.html#family-online-safety
- Safe Device Handoff and Disposal: /toolkit/index.html#device-handoff-disposal

Useful guidance:
- For phishing and scam texts: stop, verify through official channels, and report suspicious activity.
- For account protection: secure email first, enable MFA, use long unique passwords, use a password manager, and keep recovery options current.
- For home networks: change the router admin password, use WPA3 or WPA2/WPA3, disable WPS if unused, enable updates, and use guest Wi-Fi when possible.
- For suspected fraud or account compromise: use a clean device if needed, change important passwords, review account sessions, and contact the bank or card provider if money may be at risk.
- For mobile safety: add a carrier PIN, ask about port-out protection, enable SIM-change alerts, and reduce reliance on SMS codes when possible.
- Reporting references include 7726, ReportFraud.ftc.gov, IC3.gov, and IdentityTheft.gov.

Phishing and scam text answer guidance:
- Mention urgent language, strange links, unexpected package/bank alerts, requests for passwords or codes, and pressure to act immediately.
- Tell users not to tap links or reply.
- Tell users to open the official app or website directly, or call the number on the back of their card or official account page.
- Mention forwarding scam texts to 7726 when appropriate.
- Mention ReportFraud.ftc.gov, IC3.gov, and IdentityTheft.gov when appropriate.

Case study answer guidance:
- Credential Exposure: explain visual trust, domain verification, password managers, passkeys, sign-in alerts, and unexpected login errors as warning signs.
- Malicious App Entry: explain sideloading risk, trusted app stores, supported Android versions, permission review, uninstall steps, and credential rotation.
- Browser-Based Location Disclosure: explain permission prompts as trust decisions, deny location from unfamiliar links, verify the domain, revoke browser site permissions, and limit precise location.
- Always frame case studies as controlled, defensive learning material.

Website grounding:
- Use the current page context and section map as the source of truth for exact section names on the current page.
- Do not invent pages, anchors, downloads, or claims.
- Only include internal links that are listed in the site map, known sections, or current page section map.
- If you are not sure where something is, say the closest helpful section instead.

Current page context:
- Page title: ${pageTitle}
- Page path: ${pagePath}
- Page kind: ${context.pageKind || 'general'}
- Page headings: ${headings}
- Page summary: ${summary}

Current page section map:
${sectionMap}
`.trim();
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  if (!setCors(req, res)) {
    return sendJson(res, 403, {
      error: 'Origin not allowed.'
    });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      service: 'ZeroDay Tech Labs Assistant API',
      message: 'API route is live. Use POST to send chat messages.'
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      error: 'Method not allowed.'
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'Missing OPENROUTER_API_KEY in Vercel environment variables.'
    });
  }

  let body = {};

  try {
    body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : req.body || {};
  } catch (error) {
    body = {};
  }

  const locale = body.locale === 'es' ? 'es' : 'en';
  const messages = normalizeMessages(body);
  const context = normalizeContext(body.context);

  if (!messages.length) {
    return sendJson(res, 400, {
      error:
        locale === 'es'
          ? 'No se recibió ningún mensaje.'
          : 'No message was provided.'
    });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.SITE_URL || 'https://zerodaytechlabs.com',
    'X-Title': process.env.SITE_TITLE || 'ZeroDay Tech Labs'
  };

  try {
    const upstream = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: resolveModel(),
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt(locale, context)
            },
            ...messages
          ],
          temperature: 0.2,
          max_tokens: 700
        })
      },
      Number(process.env.OPENROUTER_TIMEOUT_MS || 25000)
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const errorMessage =
        data && data.error && data.error.message
          ? data.error.message
          : locale === 'es'
            ? 'La solicitud al modelo no se pudo completar.'
            : 'The model request could not be completed.';

      return sendJson(res, upstream.status || 502, {
        error: redactSecrets(errorMessage)
      });
    }

    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message
        ? extractText(data.choices[0].message.content)
        : '';

    if (!reply) {
      return sendJson(res, 502, {
        error:
          locale === 'es'
            ? 'No llegó una respuesta válida del modelo.'
            : 'The model did not return a valid response.'
      });
    }

    return sendJson(res, 200, {
      reply
    });
  } catch (error) {
    const timedOut =
      error && (error.name === 'AbortError' || error.code === 'ABORT_ERR');

    return sendJson(res, timedOut ? 504 : 500, {
      error:
        locale === 'es'
          ? timedOut
            ? 'El asistente tardó demasiado en responder. Inténtalo de nuevo.'
            : 'El asistente no está disponible ahora mismo. Inténtalo de nuevo en breve.'
          : timedOut
            ? 'The assistant took too long to respond. Please try again.'
            : 'The assistant is unavailable right now. Please try again shortly.'
    });
  }
};
