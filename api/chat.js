const DEFAULT_MODEL = 'nousresearch/hermes-3-llama-3.1-405b:free';

const WELCOME = {
  en: 'Hi, I’m the ZeroDay Tech Labs Assistant. I can help with phishing, scam texts, malware basics, home Wi-Fi security, account protection, reporting fraud, and finding the right toolkit. What can I help you with?',
  es: 'Hola, soy el asistente de ZeroDay Tech Labs. Puedo ayudarte con phishing, textos de estafa, malware, seguridad de Wi-Fi, protección de cuentas, reportes de fraude y encontrar el toolkit correcto. ¿En qué puedo ayudarte?'
};

function setCors(req, res) {
  const requestedHeaders = req.headers['access-control-request-headers'] || 'Content-Type, Authorization';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function redactSecrets(value) {
  return String(value || '')
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, '[redacted OpenRouter API key]')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted API key]');
}

function resolveModel() {
  const configured = String(process.env.OPENROUTER_MODEL || '').trim();

  if (!configured) return DEFAULT_MODEL;

  if (
    configured.startsWith('sk-') ||
    configured.startsWith('sk-or-') ||
    configured.startsWith('sk-proj-')
  ) {
    return DEFAULT_MODEL;
  }

  return configured;
}

function normalizeMessages(body) {
  let messages = [];

  if (Array.isArray(body.messages)) {
    messages = body.messages;
  } else if (typeof body.message === 'string') {
    messages = [{ role: 'user', content: body.message }];
  } else if (typeof body.question === 'string') {
    messages = [{ role: 'user', content: body.question }];
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

function normalizeContext(context) {
  if (!context || typeof context !== 'object') return {};

  return {
    title: typeof context.title === 'string' ? context.title.slice(0, 180) : '',
    path: typeof context.path === 'string' ? context.path.slice(0, 180) : '/',
    pageKind: typeof context.pageKind === 'string' ? context.pageKind.slice(0, 50) : 'default',
    headings: Array.isArray(context.headings)
      ? context.headings.filter(item => typeof item === 'string').slice(0, 12)
      : [],
    summary: typeof context.summary === 'string' ? context.summary.slice(0, 2200) : ''
  };
}

function extractText(content) {
  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        if (item && typeof item.content === 'string') return item.content;
        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function buildSystemPrompt(locale, rawContext) {
  const isSpanish = locale === 'es';
  const context = normalizeContext(rawContext);

  return `
${isSpanish ? 'Respond mainly in Spanish unless the visitor clearly asks in English.' : 'Respond mainly in English unless the visitor clearly asks in Spanish.'}

You are the public website assistant for ZeroDay Tech Labs.

Voice:
- Professional, calm, clear, and human.
- Keep answers practical and concise.
- No emojis.
- For simple questions, answer in 2 to 4 short paragraphs.

Your job:
- Help visitors understand cybersecurity basics.
- Help visitors find the right ZeroDay Tech Labs page, case study, toolkit section, download, or resource.
- Give defensive, legal, practical guidance for households, students, families, and everyday users.

Safety:
- Never ask for passwords, MFA codes, recovery codes, Social Security numbers, payment card numbers, or remote access.
- Never provide instructions for phishing, malware deployment, credential theft, evasion, unauthorized access, surveillance abuse, sabotage, or harmful cyber activity.
- If asked for harmful instructions, refuse briefly and redirect to prevention, recovery, incident response, or reporting.

Site map:
- Home: /
- Case Studies: /labs/
- Toolkit: /toolkit/
- Blog: /blog/
- Resources: /resources/
- Survey: /survey/
- About: /about/
- Contact: /contact/

Known toolkit sections:
- Minimum Home Network Baseline Checklist: /toolkit/#baseline-checklist
- 30 Day Home Cyber Improvement Plan: /toolkit/#thirty-day-plan
- Stop Verify Report Playbook: /toolkit/#stop-verify-report
- Incident Response and Recovery Checklist: /toolkit/#incident-response
- Mobile and Phone Number Protection: /toolkit/#mobile-phone-protection
- Safer Shopping and Payments: /toolkit/#shopping-payments
- Privacy and Online Presence: /toolkit/#privacy-online-presence
- Family Online Safety Plan: /toolkit/#family-online-safety

Useful guidance:
- For phishing and scam texts: stop, verify through official channels, do not tap suspicious links, do not reply, and report suspicious messages.
- Scam texts can often be forwarded to 7726. Serious fraud can be reported through ReportFraud.ftc.gov, IC3.gov, or IdentityTheft.gov.
- For malware: explain that malware is malicious software. Examples include viruses, ransomware, spyware, trojans, fake apps, and malicious browser extensions. Give safe next steps only.
- For home Wi-Fi: change router admin password, use WPA3 or WPA2/WPA3, disable WPS if unused, update firmware, and use guest Wi-Fi.

Current page context:
- Page title: ${context.title || 'Unknown page'}
- Page path: ${context.path || '/'}
- Page kind: ${context.pageKind || 'default'}
- Page headings: ${context.headings.join(' | ') || 'No headings provided'}
- Page summary: ${context.summary || 'No summary provided'}
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
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      service: 'ZeroDay Tech Labs Assistant API',
      message: 'API route is live. Use POST to send chat messages.',
      model: resolveModel(),
      welcome: WELCOME.en
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      error: 'Method not allowed.'
    });
  }

  let body = {};

  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    body = {};
  }

  const locale = body.locale === 'es' ? 'es' : 'en';
  const messages = normalizeMessages(body);

  if (!messages.length) {
    return sendJson(res, 200, {
      reply: WELCOME[locale]
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'Missing OPENROUTER_API_KEY in Vercel environment variables.'
    });
  }

  try {
    const upstream = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'https://zerodaytechlabs.com',
          'X-Title': process.env.SITE_TITLE || 'ZeroDay Tech Labs'
        },
        body: JSON.stringify({
          model: resolveModel(),
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt(locale, body.context)
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
      const message =
        data && data.error && data.error.message
          ? data.error.message
          : 'The model request could not be completed.';

      return sendJson(res, upstream.status || 502, {
        error: redactSecrets(message)
      });
    }

    const reply =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? extractText(data.choices[0].message.content)
        : '';

    if (!reply) {
      return sendJson(res, 502, {
        error: 'The model did not return a valid response.'
      });
    }

    return sendJson(res, 200, {
      reply
    });
  } catch (error) {
    const timedOut = error && (error.name === 'AbortError' || error.code === 'ABORT_ERR');

    return sendJson(res, timedOut ? 504 : 500, {
      error: timedOut
        ? 'The assistant took too long to respond. Please try again.'
        : `Assistant internal error: ${redactSecrets(error && error.message ? error.message : 'unknown')}`
    });
  }
};
