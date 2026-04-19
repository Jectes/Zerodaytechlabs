
(function(){
  const translations = {
    en: {
      "brand.tagline": "Cybersecurity education • Case Studies • Tools",
      "nav.home": "Home",
      "nav.solutions": "Solutions",
      "nav.labs": "Case Studies",
      "nav.quiz": "Survey",
      "nav.toolkit": "Toolkit",
      "nav.learn": "Learn",
      "nav.blog": "Blog",
      "nav.resources": "Resources",
      "nav.about": "About",
      "nav.contact": "Contact",
      "hero.kicker": "Enterprise-grade learning, built for real life",
      "hero.title": "Security knowledge you can apply.",
      "hero.subtitle": "Structured guides, case studies, and practical tools to help families and professionals stay safer online.",
      "hero.cta.primary": "Explore Case Studies",
      "hero.cta.secondary": "Read the Blog",
      "section.value.title": "Designed for clarity and trust",
      "section.value.subtitle": "Structured guidance, applied case studies, and bilingual resources organized for practical cybersecurity learning.",
      "value.1.title": "Centralized navigation",
      "value.1.desc": "A structured menu and consistent layout keep core sections easy to navigate.",
      "value.2.title": "Enterprise experience",
      "value.2.desc": "Clean typography, professional spacing, and predictable interactions across the site.",
      "value.3.title": "Bilingual interface",
      "value.3.desc": "English and Spanish content share one layout and stay aligned across pages.",
      "section.blog.title": "Latest insights",
      "section.blog.subtitle": "New articles and updates from ZeroDay Tech Labs.",
      "section.blog.viewAll": "View all posts",
      "cta.title": "Protect your digital world, start at home.",
      "cta.subtitle": "Start with the fundamentals, then build practical habits and technical skills.",
      "cta.primary": "Get started with Case Studies",
      "cta.secondary": "Browse the Blog",
      "footer.blurb": "ZeroDay Tech Labs is a bilingual cybersecurity learning site focused on practical outcomes.",
      "footer.solutions": "Solutions",
      "footer.learn": "Learn",
      "footer.legal": "Legal",
      "footer.privacy": "Privacy Policy",
      "footer.terms": "Terms of Use",
      "footer.copy": "© ZeroDay Tech Labs"
    },
    es: {
      "brand.tagline": "Educación en ciberseguridad • Estudios de caso • Herramientas",
      "nav.home": "Inicio",
      "nav.solutions": "Soluciones",
      "nav.labs": "Estudios de caso",
      "nav.quiz": "Encuesta",
      "nav.toolkit": "Kit",
      "nav.learn": "Aprender",
      "nav.blog": "Blog",
      "nav.resources": "Recursos",
      "nav.about": "Acerca",
      "nav.contact": "Contacto",
      "hero.kicker": "Aprendizaje de nivel empresarial, para la vida real",
      "hero.title": "Conocimiento de seguridad que puedes aplicar.",
      "hero.subtitle": "Guías estructuradas, estudios de caso y herramientas prácticas para ayudar a familias y profesionales a estar más seguros en línea.",
      "hero.cta.primary": "Explorar estudios de caso",
      "hero.cta.secondary": "Leer el Blog",
      "section.value.title": "Diseñado para claridad y confianza",
      "section.value.subtitle": "Guías estructuradas, estudios de caso aplicados y recursos bilingües organizados para un aprendizaje práctico de ciberseguridad.",
      "value.1.title": "Navegación centralizada",
      "value.1.desc": "Un menú estructurado y un diseño consistente mantienen las secciones principales fáciles de navegar.",
      "value.2.title": "Experiencia empresarial",
      "value.2.desc": "Tipografía limpia, espaciado profesional e interacciones predecibles en todo el sitio.",
      "value.3.title": "Interfaz bilingüe",
      "value.3.desc": "El contenido en inglés y español comparte una sola estructura y se mantiene alineado entre páginas.",
      "section.blog.title": "Últimos artículos",
      "section.blog.subtitle": "Nuevos artículos y actualizaciones de ZeroDay Tech Labs.",
      "section.blog.viewAll": "Ver todos los posts",
      "cta.title": "Protege tu mundo digital, comienza en casa.",
      "cta.subtitle": "Empieza con lo esencial y construye hábitos y destrezas técnicas.",
      "cta.primary": "Comenzar con estudios de caso",
      "cta.secondary": "Ver el Blog",
      "footer.blurb": "ZeroDay Tech Labs es un sitio bilingüe de aprendizaje en ciberseguridad enfocado en resultados prácticos.",
      "footer.solutions": "Soluciones",
      "footer.learn": "Aprender",
      "footer.legal": "Legal",
      "footer.privacy": "Política de Privacidad",
      "footer.terms": "Términos de Uso",
      "footer.copy": "© ZeroDay Tech Labs"
    }
  };

  function getLang(){
    const url = new URL(window.location.href);
    const q = url.searchParams.get('lang');
    const saved = localStorage.getItem('zdtl_lang');
    const lang = q || saved || 'en';
    return lang === 'es' ? 'es' : 'en';
  }

  function apply(lang){
    const dict = translations[lang] || translations.en;
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.style.display = (el.getAttribute('data-lang') === lang) ? '' : 'none';
    });
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
    });
    if (window.ZDTL_renderDynamicContent) window.ZDTL_renderDynamicContent(lang);
  }

  function setLang(lang){
    localStorage.setItem('zdtl_lang', lang);
    apply(lang);
  }

  window.ZDTL_i18n = { getLang, setLang };

  document.addEventListener('DOMContentLoaded', () => {
    const lang = getLang();
    apply(lang);
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
    });
  });
})();
