(function(){
  "use strict";

  const chapterListEl = document.getElementById('chapterList');
  const homeGridEl = document.getElementById('homeGrid');
  const homeView = document.getElementById('homeView');
  const chapterView = document.getElementById('chapterView');
  const chapterTitleEl = document.getElementById('chapterTitle');
  const chapterBodyEl = document.getElementById('chapterBody');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuBtn = document.getElementById('menuBtn');
  const backBtn = document.getElementById('backBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');
  const bottomNav = document.querySelector('.bottom-nav');
  const installBtn = document.getElementById('installBtn');
  const offlineNote = document.getElementById('offlineNote');
  const toast = document.getElementById('toast');

  // ---------- Build navigation ----------
  function buildChapterList(){
    chapterListEl.innerHTML = '';
    GUIDE.chapters.forEach(ch => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.dataset.chapter = ch.id;
      btn.innerHTML = `<span class="ci">${ch.icon}</span><span>${ch.title}</span>`;
      btn.addEventListener('click', () => { openChapter(ch.id); closeSidebar(); });
      li.appendChild(btn);
      chapterListEl.appendChild(li);
    });
  }

  function buildHomeGrid(){
    homeGridEl.innerHTML = '';
    GUIDE.chapters.forEach(ch => {
      const card = document.createElement('button');
      card.className = 'home-card';
      card.innerHTML = `<span class="hc-icon">${ch.icon}</span><span class="hc-title">${ch.title}</span>`;
      card.addEventListener('click', () => openChapter(ch.id));
      homeGridEl.appendChild(card);
    });
  }

  // ---------- Chapter rendering ----------
  function openChapter(id, headingIndex){
    const ch = GUIDE.chapters.find(c => c.id === id);
    if(!ch) return;
    chapterTitleEl.textContent = ch.icon + '  ' + ch.title;
    chapterBodyEl.innerHTML = ch.sections.map((s,i) => `
      <section class="section-card" id="sec-${ch.id}-${i}">
        <h3>${s.heading}</h3>
        ${s.html}
      </section>
    `).join('');
    homeView.classList.add('hidden');
    chapterView.classList.remove('hidden');
    window.scrollTo(0,0);
    setActiveChapterBtn(id);
    setBottomNav('menu');
    history.replaceState(null, '', '#' + id);
    if(typeof headingIndex === 'number'){
      const target = document.getElementById(`sec-${ch.id}-${headingIndex}`);
      if(target) setTimeout(()=> target.scrollIntoView({behavior:'smooth', block:'start'}), 60);
    }
  }

  function goHome(){
    chapterView.classList.add('hidden');
    homeView.classList.remove('hidden');
    window.scrollTo(0,0);
    setActiveChapterBtn(null);
    setBottomNav('home');
    history.replaceState(null, '', '#home');
  }

  function setActiveChapterBtn(id){
    chapterListEl.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('active', b.dataset.chapter === id);
    });
  }

  backBtn.addEventListener('click', goHome);

  // ---------- Sidebar ----------
  function openSidebar(){ sidebar.classList.add('open'); overlay.classList.remove('hidden'); }
  function closeSidebar(){ sidebar.classList.remove('open'); overlay.classList.add('hidden'); }
  menuBtn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);

  // ---------- Bottom nav ----------
  function setBottomNav(action){
    bottomNav.querySelectorAll('.bn-item').forEach(b=>{
      b.classList.toggle('active', b.dataset.action === action);
    });
  }
  bottomNav.addEventListener('click', (e)=>{
    const btn = e.target.closest('.bn-item');
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === 'home'){ closeSearch(); goHome(); }
    else if(action === 'menu'){ openSidebar(); }
    else if(action === 'search'){ openSearch(); }
  });

  // ---------- Search ----------
  let searchIndex = [];
  function buildSearchIndex(){
    searchIndex = [];
    GUIDE.chapters.forEach(ch=>{
      ch.sections.forEach((s, i)=>{
        const text = (s.heading + ' ' + s.html.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
        searchIndex.push({chapterId: ch.id, chapterTitle: ch.title, heading: s.heading, text, index: i});
      });
    });
  }

  function openSearch(){
    searchBar.classList.remove('hidden');
    searchResults.classList.remove('hidden');
    setBottomNav('search');
    searchInput.focus();
    renderSearch('');
  }
  function closeSearch(){
    searchBar.classList.add('hidden');
    searchResults.classList.add('hidden');
    searchInput.value = '';
  }
  searchBtn.addEventListener('click', openSearch);
  searchClose.addEventListener('click', ()=>{ closeSearch(); setBottomNav(chapterView.classList.contains('hidden') ? 'home' : 'menu'); });
  searchInput.addEventListener('input', ()=> renderSearch(searchInput.value.trim()));

  function escapeHtml(str){
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function renderSearch(query){
    if(!query){
      searchResults.innerHTML = `<div class="sr-empty">Type to search across all ${searchIndex.length} sections of the guide…</div>`;
      return;
    }
    const q = query.toLowerCase();
    const matches = searchIndex
      .map(item => ({item, score: item.text.toLowerCase().includes(q) || item.heading.toLowerCase().includes(q) ? 1 : 0}))
      .filter(x => x.score > 0)
      .slice(0, 40);

    if(matches.length === 0){
      searchResults.innerHTML = `<div class="sr-empty">No results for "${escapeHtml(query)}"</div>`;
      return;
    }

    searchResults.innerHTML = matches.map(({item})=>{
      const lower = item.text.toLowerCase();
      const pos = lower.indexOf(q);
      let snippet = item.text;
      if(pos >= 0){
        const start = Math.max(0, pos - 40);
        const end = Math.min(item.text.length, pos + q.length + 60);
        snippet = (start>0?'…':'') + item.text.slice(start,end) + (end<item.text.length?'…':'');
      } else {
        snippet = item.text.slice(0,100) + '…';
      }
      const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'ig');
      snippet = escapeHtml(snippet).replace(re, '<mark>$1</mark>');
      return `<div class="sr-item" data-chapter="${item.chapterId}" data-index="${item.index}">
        <div class="sr-chapter">${item.chapterTitle}</div>
        <div class="sr-heading">${escapeHtml(item.heading)}</div>
        <div class="sr-snippet">${snippet}</div>
      </div>`;
    }).join('');

    searchResults.querySelectorAll('.sr-item').forEach(el=>{
      el.addEventListener('click', ()=>{
        const chapterId = el.dataset.chapter;
        const idx = parseInt(el.dataset.index, 10);
        closeSearch();
        openChapter(chapterId, idx);
      });
    });
  }

  // ---------- PWA install prompt ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', ()=>{
    installBtn.classList.add('hidden');
    showToast('Installed! You can now open the guide from your home screen.');
  });

  // ---------- Offline note / service worker ----------
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(()=> toast.classList.add('hidden'), 3200);
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('service-worker.js').then(()=>{
        offlineNote.textContent = 'Works offline once loaded.';
      }).catch(()=>{
        offlineNote.textContent = '';
      });
    });
  } else {
    offlineNote.textContent = '';
  }
  window.addEventListener('online', ()=> showToast('Back online'));
  window.addEventListener('offline', ()=> showToast('You are offline — cached content still works'));

  // ---------- Init ----------
  buildChapterList();
  buildHomeGrid();
  buildSearchIndex();

  const hash = location.hash.replace('#','');
  if(hash && hash !== 'home' && GUIDE.chapters.some(c=>c.id===hash)){
    openChapter(hash);
  } else {
    goHome();
  }
})();
