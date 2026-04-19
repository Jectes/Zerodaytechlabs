
(function(){
  const NAMESPACE = 'zdtl-enterprise-demo';

  function key(type, slug){ return `${type}:${slug}`; }

  async function hit(type, slug, amount){
    const url = `https://api.countapi.xyz/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key(type, slug))}` + (amount ? `?amount=${amount}` : '');
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('countapi hit failed');
    const j = await r.json();
    return j.value ?? 0;
  }
  async function get(type, slug){
    const url = `https://api.countapi.xyz/get/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key(type, slug))}`;
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('countapi get failed');
    const j = await r.json();
    return j.value ?? 0;
  }

  function localKey(type, slug){ return 'local_' + key(type, slug); }
  function localHit(type, slug, amount){
    const k = localKey(type, slug);
    const v = Number(localStorage.getItem(k) || '0') + (amount || 1);
    localStorage.setItem(k, String(v));
    return v;
  }
  function localGet(type, slug){ return Number(localStorage.getItem(localKey(type, slug)) || '0'); }

  async function getViews(slug, { increment=false } = {}){
    try{ return increment ? await hit('views', slug) : await get('views', slug); }
    catch(e){ return increment ? localHit('views', slug) : localGet('views', slug); }
  }

  async function rate(slug, stars){
    try{
      const sum = await hit('rating_sum', slug, stars);
      const votes = await hit('rating_votes', slug);
      return { sum, votes };
    }catch(e){
      const sum = localHit('rating_sum', slug, stars);
      const votes = localHit('rating_votes', slug);
      return { sum, votes };
    }
  }

  async function getRating(slug){
    try{
      const [sum, votes] = await Promise.all([get('rating_sum', slug), get('rating_votes', slug)]);
      return { sum, votes };
    }catch(e){
      return { sum: localGet('rating_sum', slug), votes: localGet('rating_votes', slug) };
    }
  }

  function fmt(n){
    try{ return new Intl.NumberFormat().format(n); }
    catch(e){ return String(n); }
  }

  async function fillViews(){
    const els = document.querySelectorAll('[data-view-slug]');
    await Promise.all(Array.from(els).map(async el => {
      const slug = el.getAttribute('data-view-slug');
      const count = await getViews(slug, { increment:false });
      el.textContent = fmt(count);
    }));
  }

  async function setupArticle(){
    const slug = document.body.getAttribute('data-post-slug');
    if (!slug) return;

    const v = await getViews(slug, { increment:true });
    const viewEl = document.querySelector('[data-article-views]');
    if (viewEl) viewEl.textContent = fmt(v);

    const ratingEl = document.querySelector('[data-rating]');
    if (!ratingEl) return;

    const starsEls = ratingEl.querySelectorAll('.star');
    const stored = localStorage.getItem('rated_' + slug);
    function setActive(n){ starsEls.forEach((s,i)=> s.classList.toggle('active', i < n)); }
    if (stored) setActive(Number(stored));

    async function refresh(){
      const { sum, votes } = await getRating(slug);
      const avg = votes ? (sum / votes) : 0;
      const avgEl = ratingEl.querySelector('[data-rating-avg]');
      const votesEl = ratingEl.querySelector('[data-rating-votes]');
      if (avgEl) avgEl.textContent = votes ? avg.toFixed(1) : '—';
      if (votesEl) votesEl.textContent = fmt(votes);
    }

    starsEls.forEach((btn, idx) => {
      btn.addEventListener('click', async () => {
        const stars = idx + 1;
        if (localStorage.getItem('rated_' + slug)) return;
        localStorage.setItem('rated_' + slug, String(stars));
        setActive(stars);
        await rate(slug, stars);
        await refresh();
      });
    });

    await refresh();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await fillViews();
    await setupArticle();
  });
})();
