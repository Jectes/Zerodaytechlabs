(function(){
  const state = {
    passwordInput: null,
    passwordRing: null,
    passwordValue: null,
    passwordLabel: null,
    passwordTime: null,
    passwordFeedback: null,
    lastPassword: ''
  };

  const text = {
    en: {
      emptyLabel: 'Add a sample password.',
      emptyTime: 'Do not test a real password here.',
      emptyFeedback: ['Use this as a teaching tool only.'],
      labels: ['Very weak', 'Weak', 'Getting better', 'Strong', 'Very strong'],
      time: {
        instant: 'Rough crack estimate: instant or very fast.',
        fast: 'Rough crack estimate: seconds to minutes.',
        moderate: 'Rough crack estimate: hours to days.',
        strong: 'Rough crack estimate: months to years.',
        veryStrong: 'Rough crack estimate: many years or more.'
      },
      feedback: {
        length: 'Make it at least 15 characters when the account allows it.',
        longer: 'Longer is better. A phrase with several words is easier to remember.',
        variety: 'Mix in more character types only if it stays memorable.',
        common: 'Avoid common words, names, seasons, teams, and birthdays.',
        sequence: 'Avoid keyboard patterns or simple sequences.',
        repeated: 'Avoid repeating the same character or word too much.',
        unique: 'Great start. Make sure this password is unique for one account only.',
        manager: 'For important accounts, let a password manager create and remember it.'
      }
    },
    es: {
      emptyLabel: 'Añade una contraseña de ejemplo.',
      emptyTime: 'No pruebes una contraseña real aquí.',
      emptyFeedback: ['Usa esto solo como herramienta de aprendizaje.'],
      labels: ['Muy débil', 'Débil', 'Mejorando', 'Fuerte', 'Muy fuerte'],
      time: {
        instant: 'Estimación educativa: instantáneo o muy rápido.',
        fast: 'Estimación educativa: segundos a minutos.',
        moderate: 'Estimación educativa: horas a días.',
        strong: 'Estimación educativa: meses a años.',
        veryStrong: 'Estimación educativa: muchos años o más.'
      },
      feedback: {
        length: 'Hazla de al menos 15 caracteres cuando la cuenta lo permita.',
        longer: 'Más larga es mejor. Una frase con varias palabras es más fácil de recordar.',
        variety: 'Añade más tipos de caracteres solo si sigue siendo memorable.',
        common: 'Evita palabras comunes, nombres, temporadas, equipos y cumpleaños.',
        sequence: 'Evita patrones de teclado o secuencias simples.',
        repeated: 'Evita repetir demasiado el mismo carácter o palabra.',
        unique: 'Buen comienzo. Asegúrate de que esta contraseña sea única para una sola cuenta.',
        manager: 'Para cuentas importantes, deja que un administrador de contraseñas la cree y recuerde.'
      }
    }
  };

  function currentLang(){
    if (window.ZDTL_i18n && typeof window.ZDTL_i18n.getLang === 'function') {
      return window.ZDTL_i18n.getLang();
    }
    return document.documentElement.getAttribute('lang') === 'es' ? 'es' : 'en';
  }

  function activateTab(button, shouldFocus){
    if (!button) return;
    const shell = button.closest('[data-zdtl-tabs]');
    if (!shell) return;
    const targetId = button.getAttribute('data-tab-target');
    const target = document.getElementById(targetId);
    if (!target) return;

    shell.querySelectorAll('[data-tab-target]').forEach(tab => {
      const selected = tab === button;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
    });

    shell.querySelectorAll('.tab-panel').forEach(panel => {
      const selected = panel === target;
      panel.hidden = !selected;
      panel.classList.toggle('active', selected);
    });

    if (shouldFocus) button.focus({preventScroll: true});
  }

  function initTabs(){
    document.querySelectorAll('[data-zdtl-tabs]').forEach(shell => {
      const buttons = Array.from(shell.querySelectorAll('[data-tab-target]'));
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => activateTab(button, false));
        button.addEventListener('keydown', event => {
          const horizontal = event.key === 'ArrowRight' || event.key === 'ArrowLeft';
          const vertical = event.key === 'ArrowDown' || event.key === 'ArrowUp';
          if (!horizontal && !vertical && event.key !== 'Home' && event.key !== 'End') return;
          event.preventDefault();

          let nextIndex = index;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % buttons.length;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + buttons.length) % buttons.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = buttons.length - 1;

          activateTab(buttons[nextIndex], true);
        });
      });
    });
  }

  function initCrossLinks(){
    document.querySelectorAll('[data-open-tab]').forEach(control => {
      control.addEventListener('click', () => {
        const targetId = control.getAttribute('data-open-tab');
        const targetButton = document.querySelector(`[data-tab-target="${CSS.escape(targetId)}"]`);
        if (!targetButton) return;
        activateTab(targetButton, false);

        const scrollId = control.getAttribute('data-scroll-target');
        const scrollTarget = scrollId ? document.getElementById(scrollId) : targetButton.closest('[data-zdtl-tabs]');
        if (scrollTarget) {
          scrollTarget.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      });
    });
  }

  function hasSequence(value){
    const lower = value.toLowerCase();
    const sequences = ['abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '0123456789'];
    return sequences.some(seq => {
      for (let i = 0; i <= seq.length - 4; i += 1) {
        const slice = seq.slice(i, i + 4);
        if (lower.includes(slice) || lower.includes(slice.split('').reverse().join(''))) return true;
      }
      return false;
    });
  }

  function estimatePassword(value){
    const sample = value || '';
    const lower = /[a-z]/.test(sample);
    const upper = /[A-Z]/.test(sample);
    const digit = /\d/.test(sample);
    const symbol = /[^A-Za-z0-9\s]/.test(sample);
    const space = /\s/.test(sample);
    const categories = [lower, upper, digit, symbol, space].filter(Boolean).length;
    const length = sample.length;
    const uniqueChars = new Set(sample).size;
    const uniqueRatio = length ? uniqueChars / length : 0;
    const repeated = /(.)\1\1/.test(sample) || uniqueRatio < 0.45;
    const sequence = hasSequence(sample);
    const common = /(password|contraseña|qwerty|welcome|letmein|admin|family|familia|summer|winter|spring|fall|love|dragon|football|baseball|soccer|iloveyou|abc|1234|0000)/i.test(sample);

    let score = 0;
    score += Math.min(40, length * 2.5);
    score += categories * 9;
    if (length >= 15) score += 12;
    if (length >= 20) score += 10;
    if (space && length >= 18) score += 8;
    if (uniqueRatio > 0.7) score += 8;
    if (common) score -= 22;
    if (sequence) score -= 16;
    if (repeated) score -= 12;
    if (length < 8) score -= 18;
    score = Math.max(0, Math.min(100, Math.round(score)));

    let charset = 0;
    if (lower) charset += 26;
    if (upper) charset += 26;
    if (digit) charset += 10;
    if (symbol) charset += 32;
    if (space) charset += 1;
    charset = Math.max(charset, 1);
    let entropy = length * Math.log2(charset);
    if (common) entropy -= 20;
    if (sequence) entropy -= 14;
    if (repeated) entropy -= 10;
    entropy = Math.max(0, entropy);

    const feedbackKeys = [];
    if (length < 15) feedbackKeys.push('length');
    if (length >= 15 && length < 20) feedbackKeys.push('longer');
    if (categories < 3 && length < 22) feedbackKeys.push('variety');
    if (common) feedbackKeys.push('common');
    if (sequence) feedbackKeys.push('sequence');
    if (repeated) feedbackKeys.push('repeated');
    if (score >= 70) feedbackKeys.push('unique');
    if (score >= 55) feedbackKeys.push('manager');

    return {score, entropy, feedbackKeys};
  }

  function timeBucket(entropy, score){
    if (score < 20 || entropy < 28) return 'instant';
    if (score < 45 || entropy < 42) return 'fast';
    if (score < 65 || entropy < 56) return 'moderate';
    if (score < 82 || entropy < 72) return 'strong';
    return 'veryStrong';
  }

  function updatePasswordMeter(){
    if (!state.passwordInput) return;
    const lang = currentLang();
    const dict = text[lang] || text.en;
    const value = state.passwordInput.value;
    state.lastPassword = value;

    if (!value) {
      state.passwordRing.style.setProperty('--score', '0');
      state.passwordValue.textContent = '0';
      state.passwordLabel.textContent = dict.emptyLabel;
      state.passwordTime.textContent = dict.emptyTime;
      state.passwordFeedback.innerHTML = '';
      dict.emptyFeedback.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        state.passwordFeedback.appendChild(li);
      });
      return;
    }

    const result = estimatePassword(value);
    const labelIndex = result.score < 25 ? 0 : result.score < 45 ? 1 : result.score < 65 ? 2 : result.score < 82 ? 3 : 4;
    const bucket = timeBucket(result.entropy, result.score);

    state.passwordRing.style.setProperty('--score', String(result.score));
    state.passwordValue.textContent = String(result.score);
    state.passwordLabel.textContent = dict.labels[labelIndex];
    state.passwordTime.textContent = dict.time[bucket];
    state.passwordFeedback.innerHTML = '';

    const keys = result.feedbackKeys.length ? result.feedbackKeys : ['unique', 'manager'];
    keys.slice(0, 4).forEach(key => {
      const li = document.createElement('li');
      li.textContent = dict.feedback[key];
      state.passwordFeedback.appendChild(li);
    });
  }

  function initPasswordMeter(){
    state.passwordInput = document.getElementById('passwordMeterInput');
    state.passwordRing = document.getElementById('passwordScoreRing');
    state.passwordValue = document.getElementById('passwordScoreValue');
    state.passwordLabel = document.getElementById('passwordStrengthLabel');
    state.passwordTime = document.getElementById('passwordCrackTime');
    state.passwordFeedback = document.getElementById('passwordFeedback');
    if (!state.passwordInput || !state.passwordRing || !state.passwordValue || !state.passwordLabel || !state.passwordTime || !state.passwordFeedback) return;
    state.passwordInput.addEventListener('input', updatePasswordMeter);
    updatePasswordMeter();
  }

  const previousDynamicRender = window.ZDTL_renderDynamicContent;
  window.ZDTL_renderDynamicContent = function(lang){
    if (typeof previousDynamicRender === 'function') previousDynamicRender(lang);
    updatePasswordMeter();
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCrossLinks();
    initPasswordMeter();
  });
})();
