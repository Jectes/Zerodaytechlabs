
(function(){
  function closeAllDropdowns(except){
    document.querySelectorAll(".dropdown.open").forEach(d => {
      if (except && d === except) return;
      d.classList.remove("open");
      const btn = d.querySelector("[data-dropdown-btn]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function setupDropdowns(){
    const CLOSE_DELAY_MS = 850;

    document.querySelectorAll(".dropdown").forEach(drop => {
      const btn = drop.querySelector("[data-dropdown-btn]");
      const menu = drop.querySelector(".dropdown-menu");
      if (!btn || !menu) return;

      let closeTimer = null;

      function open(){
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        closeAllDropdowns(drop);
        drop.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }

      function closeWithDelay(){
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          drop.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        }, CLOSE_DELAY_MS);
      }

      function cancelClose(){
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      }

      // Click-to-toggle (enterprise friendly)
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = drop.classList.contains("open");
        if (isOpen){
          drop.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        } else {
          open();
        }
      });

      // Hover behavior (with delay so it doesn't disappear while you move down)
      drop.addEventListener("mouseenter", open);
      drop.addEventListener("mouseleave", closeWithDelay);
      menu.addEventListener("mouseenter", cancelClose);
      menu.addEventListener("mouseleave", closeWithDelay);

      // When user clicks a menu item, close the dropdown
      menu.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", () => {
          drop.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        });
      });
    });

    document.addEventListener("click", (e) => {
      // Close when clicking anywhere outside
      if (!e.target.closest(".dropdown")) closeAllDropdowns();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllDropdowns();
    });
  }

  function setupMobileDrawer(){
    const toggle = document.querySelector("[data-mobile-toggle]");
    const drawer = document.querySelector("[data-mobile-drawer]");
    const closeBtn = document.querySelector("[data-mobile-close]");
    if (!toggle || !drawer) return;

    function open(){ drawer.classList.add("open"); }
    function close(){ drawer.classList.remove("open"); }

    toggle.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    drawer.addEventListener("click", (e) => { if (e.target === drawer) close(); });
  }

  function markActive(){
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    document.querySelectorAll(".nav a, .mobile-panel a").forEach(a => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      const url = new URL(href, window.location.href);
      const ap = url.pathname.replace(/\/index\.html$/, "/");
      if (ap === path) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupDropdowns();
    setupMobileDrawer();
    markActive();
  });
})();
