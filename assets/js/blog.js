
(function(){
  function getLang(){ return (window.ZDTL_i18n && window.ZDTL_i18n.getLang) ? window.ZDTL_i18n.getLang() : "en"; }

  function formatDate(dateStr, lang){
    const d = new Date(dateStr + "T00:00:00");
    try{
      return new Intl.DateTimeFormat(lang === "es" ? "es-PR" : "en-US", { year:"numeric", month:"short", day:"2-digit" }).format(d);
    }catch(e){ return dateStr; }
  }

  function basePrefix(){
    const p = window.location.pathname;
    return p.includes("/blog/") || p.includes("/labs/") || p.includes("/quiz/") || p.includes("/toolkit/") || p.includes("/resources/") || p.includes("/about/") || p.includes("/contact/") || p.includes("/legal/")
      ? "../" : "";
  }

  function isRemote(url){ return url && (url.startsWith("http://") || url.startsWith("https://")); }

  function coverUrl(post){
    const c = post.cover;
    if (!c) return basePrefix() + "assets/images/hero-illustration.svg";
    if (isRemote(c)) return c;
    return basePrefix() + "assets/images/" + c;
  }

  function fallbackUrl(post){
    // If a remote cover fails (e.g., AVIF not supported), fall back to local SVG.
    if (!post || !post.slug) return basePrefix() + "assets/images/hero-illustration.svg";
    if (post.slug === "vlans-home-network") return basePrefix() + "assets/images/blog-router.svg";
    if (post.slug === "cybersecurity-families-pr") return basePrefix() + "assets/images/blog-family.svg";
    return basePrefix() + "assets/images/hero-illustration.svg";
  }

  function imgHtml(post){
    const src = coverUrl(post);
    const fb = fallbackUrl(post);
    if (isRemote(post.cover)){
      return `<img alt="" src="${src}" onerror="this.onerror=null;this.src='${fb}'">`;
    }
    return `<img alt="" src="${src}">`;
  }

  function imgHtmlHome(post){
    // Home page is at root, so local fallback paths are without ../
    const src = (post.cover && isRemote(post.cover)) ? post.cover : ("assets/images/" + post.cover);
    const fb = (post.slug === "vlans-home-network") ? "assets/images/blog-router.svg"
              : (post.slug === "cybersecurity-families-pr") ? "assets/images/blog-family.svg"
              : "assets/images/hero-illustration.svg";
    if (post.cover && isRemote(post.cover)){
      return `<img alt="" src="${src}" onerror="this.onerror=null;this.src='${fb}'">`;
    }
    return `<img alt="" src="${src}">`;
  }

  function renderBlogIndex(lang){
    const list = document.querySelector("[data-blog-list]");
    if (!list || !window.ZDTL_POSTS) return;

    const posts = window.ZDTL_POSTS.slice().sort((a,b)=> a.date === b.date ? 0 : (a.date < b.date ? 1 : -1));
    list.innerHTML = posts.map(p => `
      <a class="card blog-card" href="${p.url}?lang=${lang}">
        <div class="cover">${imgHtml(p)}</div>
        <div class="content">
          <div class="meta-row">
            <span>${formatDate(p.date, lang)} • ${p.readTime} min</span>
            <span class="pill"><span style="font-weight:900;">Views</span> <span data-view-slug="${p.slug}">—</span></span>
          </div>
          <h3 style="margin:12px 0 8px;">${p.title[lang] || p.title.en}</h3>
          <p>${p.excerpt[lang] || p.excerpt.en}</p>
          <div class="badges">
            ${(p.tags||[]).slice(0,3).map(t=>`<span class="badge">${t}</span>`).join("")}
          </div>
        </div>
      </a>
    `).join("");
  }

  function renderLatest(lang){
    const list = document.querySelector("[data-latest-posts]");
    if (!list || !window.ZDTL_POSTS) return;

    const posts = window.ZDTL_POSTS.slice().sort((a,b)=> a.date === b.date ? 0 : (a.date < b.date ? 1 : -1)).slice(0,2);
    list.innerHTML = posts.map(p => `
      <a class="card blog-card" href="blog/${p.url}?lang=${lang}">
        <div class="cover">${imgHtmlHome(p)}</div>
        <div class="content">
          <div class="meta-row">
            <span>${formatDate(p.date, lang)} • ${p.readTime} min</span>
            <span class="pill"><span style="font-weight:900;">Views</span> <span data-view-slug="${p.slug}">—</span></span>
          </div>
          <h3 style="margin:12px 0 8px;">${p.title[lang] || p.title.en}</h3>
          <p>${p.excerpt[lang] || p.excerpt.en}</p>
        </div>
      </a>
    `).join("");
  }

  window.ZDTL_renderDynamicContent = function(lang){
    renderBlogIndex(lang);
    renderLatest(lang);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const lang = getLang();
    renderBlogIndex(lang);
    renderLatest(lang);
  });
})();
