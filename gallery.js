(() => {
  'use strict';
  // The gallery contains illustrative people and memories only.
  const people = [
    {id:'maria',name:'Maria Wesołowska',birth:'12 marca 1942',death:'5 października 2023',portrait:'./assets/memorial-reference-portrait.webp',dedication:'Z wdzięcznością za ciepło, które zostaje z nami.'},
    {id:'jan',name:'Jan Kowalski',portrait:null,dedication:'Pamięć o wspólnych chwilach trwa w naszych sercach.'},
    {id:'helena',name:'Helena Nowak',portrait:'./assets/memorial-demo-portrait.webp',dedication:'Za dobro, uśmiech i bliskość — dziękujemy.',birth:'27 lipca 1938',death:'2 stycznia 2024',birthPlace:'Kraków',deathPlace:'Kraków',family:'Córka, syn, wnuki',biography:'Helena Nowak była osobą niezwykle ciepłą, pogodną i pełną życzliwości. Zawsze miała czas dla innych, potrafiła słuchać i wspierać. Jej dom był miejscem, w którym każdy czuł się przyjęty. Kochająca mama, babcia i przyjaciółka. Jej wiara i dobroć pozostają w naszych sercach.'},
    {id:'stanislaw',name:'Stanisław Wiśniewski',portrait:null,dedication:'W ciszy i modlitwie zachowujemy wspomnienie.'},
    {id:'zofia',name:'Zofia Kamińska',portrait:null,dedication:'Zawsze obecna w naszej pamięci.'},
    {id:'tadeusz',name:'Tadeusz Zieliński',portrait:null,dedication:'Wspominamy z wdzięcznością wspólnie spędzony czas.'}
  ];
  const searchKey = value => value.normalize('NFKD').toLocaleLowerCase('pl-PL').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const escape = value => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const lights = '<span class="memorial-background-glow glow-left"></span><span class="memorial-background-glow glow-middle"></span><span class="memorial-background-glow glow-upper-one"></span><span class="memorial-background-glow glow-upper-two"></span><span class="memorial-background-glow glow-lower"></span><span class="memorial-background-glow glow-edge"></span><span class="memorial-background-glow glow-reflection-one"></span><span class="memorial-background-glow glow-reflection-two"></span>';

  const DAY = 86_400_000;
  const candleKey = person => `wmodlitwie_gallery_candle_${person.id}`;
  function readCandle(person) {
    try {
      const entry = JSON.parse(localStorage.getItem(candleKey(person)) || 'null');
      if (!entry || typeof entry !== 'object') return null;
      const endsAt = Number(entry.endsAt);
      return {words: typeof entry.words === 'string' ? entry.words : '', signature: typeof entry.signature === 'string' ? entry.signature : '', endsAt: Number.isFinite(endsAt) && endsAt > 0 ? endsAt : 0};
    } catch { return null; }
  }
  const isBurning = entry => !!entry && entry.endsAt > Date.now();
  const formatEnd = entry => new Intl.DateTimeFormat('pl-PL',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Warsaw'}).format(entry.endsAt);
  const noFrame = '<img class="gallery-card-no-frame" src="./assets/memorial-scene-no-frame.webp" alt="" width="1836" height="856" loading="lazy">';
  function card(person) {
    const burning = isBurning(readCandle(person));
    const portrait = person.portrait ? `<svg class="gallery-card-portrait" viewBox="0 0 1836 856" preserveAspectRatio="none"><defs><clipPath id="frame-${person.id}"><path d="M 145 160 L 475 181 L 525 635 L 185 658 Z"></path></clipPath></defs><g clip-path="url(#frame-${person.id})"><image href="${person.portrait}" width="600" height="750" preserveAspectRatio="xMidYMid slice" transform="matrix(.57 .035 .052 .68 145 160)"></image></g></svg><img class="gallery-card-foreground" src="./assets/memorial-scene-foreground.webp" alt="" width="1836" height="856" loading="lazy">` : noFrame;
    const candleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10h8v11H8zM12 8c2-2 .7-3.8 0-5-.7 1.2-2 3 0 5Z"/></svg>';
    const rememberCount = Number.isInteger(person.rememberCount) && person.rememberCount >= 0 ? person.rememberCount.toLocaleString('pl-PL') : null;
    const birth = person.birth || (person.birthYear ? String(person.birthYear) : '');
    const death = person.death || (person.deathYear ? String(person.deathYear) : '');
    const years = birth && death ? `${birth} – ${death}` : birth ? `ur. ${birth}` : death ? `zm. ${death}` : '';
    return `<a class="gallery-card${burning ? ' is-burning' : ''}" href="./gallery-person.html?id=${person.id}"><div class="gallery-card-scene" aria-hidden="true"><div class="gallery-card-art"><img src="./assets/memorial-scene-${burning ? 'lit' : 'unlit'}.webp" alt="" width="1836" height="856" loading="lazy">${portrait}${burning ? '<span class="gallery-card-flame"><img src="./assets/memorial-scene-lit.webp" alt="" width="1836" height="856" loading="lazy"></span><span class="gallery-card-glow"></span>' : ''}</div></div><div class="gallery-card-info"><h2>${escape(person.name)}</h2><p class="gallery-card-years">${escape(years || person.dedication)}</p><div class="gallery-card-footer">${rememberCount !== null ? `<span class="gallery-memory-count">${candleIcon}${rememberCount} osób pamięta</span>` : '<span>Zobacz wspomnienie</span>'}<span class="gallery-card-arrow" aria-hidden="true">›</span></div></div></a>`;
  }

  function syncMotion() {
    document.querySelectorAll('.gallery-card,.memorial-scene').forEach(element => {
      element.classList.toggle('is-animated',element.classList.contains('is-visible') && !reduced.matches && document.visibilityState === 'visible');
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-visible',entry.isIntersecting));
    syncMotion();
  }, {threshold:.05});
  reduced.addEventListener('change',syncMotion);
  document.addEventListener('visibilitychange',syncMotion);

  if (document.body.dataset.galleryPage === 'list') {
    const input = document.querySelector('#gallery-search');
    const target = document.querySelector('#gallery-results');
    // In this static sample, the array's order is the authored addition order.
    const recentList = document.querySelector('#gallery-recent-list');
    if (recentList) recentList.innerHTML = people.slice(-3).reverse().map(person => {
      const thumbnail = person.portrait
        ? `<img src="${person.portrait}" alt="" width="48" height="48" loading="lazy">`
        : '<img src="./assets/memorial-scene-no-frame.webp" alt="" width="46" height="46" loading="lazy">';
      return `<a class="gallery-recent-item" href="./gallery-person.html?id=${person.id}"><span class="gallery-recent-thumb">${thumbnail}</span><span class="gallery-recent-name">${escape(person.name)}</span><span class="gallery-recent-arrow" aria-hidden="true">›</span></a>`;
    }).join('');
    let renderedState = null;
    function render() {
      const query = searchKey(input.value);
      const visible = people.filter(person => searchKey(person.name).includes(query));
      const state = query + '|' + visible.map(person => `${person.id}:${isBurning(readCandle(person))}`).join(',');
      if (state === renderedState) return;
      renderedState = state;
      if (!visible.length) target.innerHTML = `<div class="gallery-feedback" role="status"><h2>Nie znaleziono osoby</h2><p>Sprawdź pisownię imienia lub nazwiska i spróbuj ponownie.</p></div>`;
      else target.innerHTML = `<div class="gallery-grid">${visible.map(card).join('')}</div>`;
      observer.disconnect();
      target.querySelectorAll('.gallery-card').forEach(element => observer.observe(element));
    }
    input.addEventListener('input',render);
    document.querySelector('.gallery-search button').addEventListener('click',render);
    document.querySelector('#gallery-show-all')?.addEventListener('click', event => {
      event.preventDefault();
      input.value = '';
      render();
      input.focus();
    });
    render();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
    window.addEventListener('focus', render);
    window.addEventListener('storage', render);
    window.setInterval(render, 15_000);
  } else {
    const id = new URLSearchParams(location.search).get('id');
    const person = people.find(entry => entry.id === id);
    if (!person) {
      document.querySelector('#person').innerHTML = '<div class="gallery-feedback"><h1>Nie znaleziono wspomnienia</h1><p>Wybierz osobę z galerii.</p><a class="button secondary" href="./gallery.html">Wróć do galerii</a></div>';
      return;
    }
    document.title = `${person.name} · W Modlitwie`;
    if (person.id === 'helena') document.querySelector('#person-about-title').textContent = 'O Helenie';
    document.querySelector('#person-name').textContent = person.name;
    document.querySelector('#person-dedication').textContent = person.dedication;
    if (!person.biography) {
      document.querySelector('#person-about').classList.add('memorial-about-facts-only');
      document.querySelector('#person-about-title').textContent = 'Życie';
    }
    if (person.biography) {
      document.querySelector('#person-biography').textContent = person.biography;
      document.querySelector('#person-about').hidden = false;
    }
    document.querySelector('#person-memory').textContent = person.dedication;
    document.querySelector('#person-period').textContent = 'Symboliczny znicz pamięci';
    const candleCount = Number.isInteger(person.candleCount) && person.candleCount >= 0 ? person.candleCount.toLocaleString('pl-PL') : null;
    document.querySelector('#person-count').textContent = candleCount ?? '';
    document.querySelector('.memorial-detail-count').hidden = candleCount === null;
    document.querySelector('.memorial-detail-count').setAttribute('aria-label',`Osób, które zapaliły znicz: ${candleCount || 'brak danych'}`);
    if (person.birth || person.death) {
      const dates = document.querySelector('#person-dates');
      dates.textContent = [person.birth,person.death].filter(Boolean).join(' – ');
      dates.hidden = false;
    }
    const facts = [
      person.birthPlace && ['place','Miejsce urodzenia',person.birthPlace,''],
      person.birth && ['birth','Data urodzenia',person.birth,''],
      person.death && ['death','Data śmierci',person.death,''],
      person.family && ['family','Najbliżsi',person.family,'']
    ].filter(Boolean);
    if (facts.length) {
      const icons = {place:'<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/></svg>',birth:'<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/></svg>',death:'<span class="cross-mark memorial-fact-cross" aria-hidden="true"></span>',family:'<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>'};
      const target = document.querySelector('#person-facts');
      target.innerHTML = facts.map(([icon,label,value,extra]) => `<div><span class="person-fact-icon" aria-hidden="true">${icons[icon]}</span><span><small>${escape(label)}</small><strong>${escape(value)}</strong>${extra ? `<small>${escape(extra)}</small>` : ''}</span></div>`).join('');
      target.hidden = false;
      document.querySelector('#person-about').hidden = false;
    }
    if (person.portrait) {
      document.querySelector('#person-portrait').setAttribute('href',person.portrait);
      document.querySelector('.memorial-portrait').removeAttribute('hidden');
      document.querySelector('.memorial-foreground').hidden = false;
    } else {
      document.querySelector('.memorial-no-frame').hidden = false;
    }
    const candleDialog = document.querySelector('#person-candle-dialog');
    const candleButton = document.querySelector('#person-light');
    const candleCard = document.querySelector('#person-candle-card');
    let candleOpener = candleButton;
    [candleButton, candleCard].forEach(button => {
      button.addEventListener('pointerdown', () => { candleDialog.dataset.pointerOpen = 'true'; });
      button.addEventListener('keydown', () => { delete candleDialog.dataset.pointerOpen; });
    });
    candleDialog.addEventListener('keydown', () => { delete candleDialog.dataset.pointerOpen; });
    candleDialog.addEventListener('close', () => {
      delete candleDialog.dataset.pointerOpen;
      candleOpener.focus({ preventScroll: true });
    });
    const candleStatus = document.querySelector('#person-candle-dialog-status');
    let localCandle = readCandle(person);
    function syncCandle() {
      localCandle = readCandle(person);
      document.querySelector('.memorial-scene').classList.toggle('is-burning',isBurning(localCandle));
      document.querySelector('#person-period').textContent = isBurning(localCandle) ? `Podgląd świecy do ${formatEnd(localCandle)}` : localCandle ? 'Okres podglądu świecy zakończony' : 'Bez zapalonej świecy';
      document.querySelector('#person-light-label').textContent = isBurning(localCandle) ? 'Przedłuż podgląd świecy' : 'Zapal znicz w podglądzie';
      candleButton.setAttribute('aria-label',isBurning(localCandle) ? `Przedłuż podgląd świecy: ${person.name}` : `Zapal znicz w podglądzie: ${person.name}`);
      syncMotion();
    }
    syncCandle();
    function openCandle(event) {
      localCandle = readCandle(person);
      candleOpener = event.currentTarget;
      candleOpener.focus({ preventScroll: true });
      document.querySelector('#person-candle-title').textContent = `Znicz pamięci — ${person.name}`;
      document.querySelector('#person-candle-words').value = localCandle?.words || '';
      document.querySelector('#person-candle-signature').value = localCandle?.signature || '';
      candleStatus.textContent = isBurning(localCandle) ? `Świeca w podglądzie płonie do ${formatEnd(localCandle)}. Kolejny okres doda się do aktualnego końca.` : localCandle ? 'Poprzedni okres podglądu się skończył. Możesz zapalić świecę ponownie.' : '';
      candleDialog.showModal();
    }
    candleButton.addEventListener('click', openCandle);
    candleCard.addEventListener('click', openCandle);
    document.querySelector('#person-candle-close').addEventListener('click',() => candleDialog.close());
    candleDialog.addEventListener('click',event => { if (event.target === candleDialog) candleDialog.close(); });
    document.querySelector('#person-candle-confirm').addEventListener('click',() => {
      const days = Number(document.querySelector('input[name="person-candle-duration"]:checked')?.value);
      if (![30,90].includes(days)) { candleStatus.textContent = 'Wybierz czas świecy.'; return; }
      const latestCandle = readCandle(person);
      const entry = {endsAt:Math.max(Date.now(),latestCandle?.endsAt || 0)+days*DAY,words:document.querySelector('#person-candle-words').value.trim(),signature:document.querySelector('#person-candle-signature').value.trim()};
      try { localStorage.setItem(candleKey(person),JSON.stringify(entry)); }
      catch { candleStatus.textContent = 'Nie udało się zapisać znicza na tym urządzeniu. Sprawdź ustawienia przeglądarki.'; return; }
      localCandle = entry;
      syncCandle();
      candleStatus.textContent = `Świeca w podglądzie płonie do ${formatEnd(entry)}.`;
      candleDialog.close();
    });
    document.querySelector('#person-share').addEventListener('click',async () => {
      const status = document.querySelector('#person-share-status');
      try {
        const shareUrl = location.href.split('#')[0];
        if (navigator.share) await navigator.share({title:person.name,url:shareUrl});
        else if (navigator.clipboard?.writeText) {await navigator.clipboard.writeText(shareUrl);status.textContent='Link skopiowany.';}
        else status.textContent='Skopiuj adres z paska przeglądarki.';
      } catch (error) {if (error?.name !== 'AbortError') status.textContent='Skopiuj adres z paska przeglądarki.';}
    });
    document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', async () => {
      const url = location.href.split('#')[0];
      const kind = button.dataset.share;
      const status = document.querySelector('#memorial-panel-status');
      if (kind === 'copy') {
        try { await navigator.clipboard.writeText(url); status.textContent = 'Link skopiowany.'; }
        catch { status.textContent = `Skopiuj adres: ${url}`; }
      } else if (kind === 'email') location.href = `mailto:?subject=${encodeURIComponent(person.name + ' — Miejsce Pamięci')}&body=${encodeURIComponent(url)}`;
      else window.open(kind === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` : `https://wa.me/?text=${encodeURIComponent(person.name + ' — ' + url)}`, '_blank', 'noopener,noreferrer');
    }));
    observer.observe(document.querySelector('.memorial-scene'));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncCandle(); });
    window.addEventListener('focus', syncCandle);
    window.addEventListener('storage', syncCandle);
    window.setInterval(syncCandle, 15_000);
  }
})();
