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
  const candleKey = person => `wmodlitwie_free_candle_${person.id}`;
  function readCandle(person) {
    try { return localStorage.getItem(candleKey(person)) === 'lit'; }
    catch { return false; }
  }
  const isBurning = entry => entry === true;
  const noFrame = '<img class="gallery-card-no-frame" src="./assets/memorial-scene-no-frame.webp" alt="" width="1836" height="856" loading="lazy">';
  function card(person) {
    const burning = isBurning(readCandle(person));
    const portrait = person.portrait ? `<svg class="gallery-card-portrait" viewBox="0 0 1836 856" preserveAspectRatio="none"><defs><clipPath id="frame-${person.id}"><path d="M 145 160 L 475 181 L 525 635 L 185 658 Z"></path></clipPath></defs><g clip-path="url(#frame-${person.id})"><image href="${person.portrait}" width="600" height="750" preserveAspectRatio="xMidYMid slice" transform="matrix(.57 .035 .052 .68 145 160)"></image></g></svg><img class="gallery-card-foreground" src="./assets/memorial-scene-foreground.webp" alt="" width="1836" height="856" loading="lazy">` : noFrame;
    const birth = person.birth || (person.birthYear ? String(person.birthYear) : '');
    const death = person.death || (person.deathYear ? String(person.deathYear) : '');
    const years = birth && death ? `${birth} – ${death}` : birth ? `ur. ${birth}` : death ? `zm. ${death}` : '';
    return `<a class="gallery-card${burning ? ' is-burning' : ''}" href="./gallery-person.html?id=${person.id}"><div class="gallery-card-scene" aria-hidden="true"><div class="gallery-card-art"><img src="./assets/memorial-scene-${burning ? 'lit' : 'unlit'}.webp" alt="" width="1836" height="856" loading="lazy">${portrait}${burning ? '<span class="gallery-card-flame"><img src="./assets/memorial-scene-lit.webp" alt="" width="1836" height="856" loading="lazy"></span><span class="gallery-card-glow"></span>' : ''}</div></div><div class="gallery-card-info"><h2>${escape(person.name)}</h2><p class="gallery-card-years">${escape(years || person.dedication)}</p><div class="gallery-card-footer"><span>Zobacz wspomnienie</span><span class="gallery-card-arrow" aria-hidden="true">›</span></div></div></a>`;
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
      document.querySelector('#person-biography').hidden = true;
    }
    if (person.biography) {
      document.querySelector('#person-biography').textContent = person.biography;
      document.querySelector('#person-about').hidden = false;
    }

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
    if (document.querySelector('#person-about').hidden) {
      document.querySelector('.memorial-profile-layout').classList.add('has-no-about');
    }
    if (person.portrait) {
      document.querySelector('#person-portrait').setAttribute('href',person.portrait);
      document.querySelector('.memorial-portrait').removeAttribute('hidden');
      document.querySelector('.memorial-foreground').hidden = false;
    } else {
      document.querySelector('.memorial-no-frame').hidden = false;
    }
    // Fictional fixture content is visibly labelled as a preview.
    const memoryList = document.querySelector('#person-memories-list');
    const examples = person.id === 'helena'
      ? [
          'Dziękuję za każdą rozmowę i za to, że zawsze wierzyłaś we mnie. Będziesz na zawsze w moim sercu.',
          'Twój ciepły uśmiech i dobroć pozostają z nami na zawsze.',
          'Byłaś dla nas przykładem wiary, siły i miłości. Twoja obecność nadal nas prowadzi.'
        ]
      : [person.dedication];
    memoryList.innerHTML = examples.map((quote, index) => `<blockquote class="memorial-memory-card"><p>„${escape(quote)}”</p><footer>Przykładowe wspomnienie ${index + 1}</footer></blockquote>`).join('');

    document.querySelector('#person-album-link').href = `./album.html?id=${encodeURIComponent(person.id)}`;

    const photoDialog = document.querySelector('#person-photo-dialog');
    const photoStrip = document.querySelector('#person-photo-strip');
    const localPhotoUrls = [];
    let photos = [];
    let photoIndex = 0;
    let photoOpener = null;
    const illustrations = [
      ...(person.portrait ? [{src:person.portrait,caption:'Portret ilustracyjny',alt:`Ilustracyjny portret: ${person.name}`}] : []),
      {src:'./images/hero-memory.webp',caption:'Obraz symboliczny',alt:'Symboliczny obraz miejsca pamięci'},
      {src:'./images/memorial-creator-candle.webp',caption:'Obraz symboliczny',alt:'Symboliczna świeca pamięci'},
      {src:'./assets/memorial-prayer-candles.webp',caption:'Obraz symboliczny',alt:'Świece modlitewne'}
    ];
    function showPhoto(index) {
      photoIndex = (index + photos.length) % photos.length;
      const photo = photos[photoIndex];
      const large = document.querySelector('#person-photo-large');
      large.src = photo.src;
      large.alt = photo.alt;
      document.querySelector('#person-photo-dialog-title').textContent = photo.caption;
      document.querySelector('#person-photo-position').textContent = `${photoIndex + 1} z ${photos.length}`;
      const multiple = photos.length > 1;
      document.querySelector('#person-photo-previous').hidden = !multiple;
      document.querySelector('#person-photo-next').hidden = !multiple;
    }
    function renderPhotos(entries, illustrative) {
      photos = entries;
      const section = document.querySelector('#person-photos');
      section.hidden = !photos.length;
      document.querySelector('#person-photos-note').textContent = illustrative ? 'Obrazy ilustracyjne · podgląd' : 'Zdjęcia zapisane na tym urządzeniu';
      photoStrip.replaceChildren();
      photos.slice(0, 5).forEach((photo, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'memorial-photo-thumb';
        const more = index === 4 && photos.length > 5;
        button.setAttribute('aria-label', more ? `Zobacz wszystkie zdjęcia (${photos.length})` : `Otwórz zdjęcie ${index + 1}: ${photo.caption}`);
        const image = document.createElement('img');
        image.src = photo.src;
        image.alt = photo.alt;
        image.loading = 'lazy';
        button.append(image);
        if (more) {
          button.classList.add('memorial-photo-thumb-more');
          const count = document.createElement('span');
          count.setAttribute('aria-hidden', 'true');
          count.textContent = `+${photos.length - 5}`;
          button.append(count);
        }
        button.addEventListener('click', () => {
          photoOpener = button;
          showPhoto(index);
          photoDialog.showModal();
        });
        photoStrip.append(button);
      });
    }
    renderPhotos(illustrations, true);
    if (window.MemorialAlbumStore?.load) {
      window.MemorialAlbumStore.load(person.id).then(album => {
        if (!Array.isArray(album?.photos) || !album.photos.length) return;
        const entries = album.photos
          .filter(photo => photo.blob instanceof Blob && photo.blob.type.startsWith('image/'))
          .sort((a,b) => a.position - b.position)
          .map((photo,index) => {
            const url = URL.createObjectURL(photo.blob);
            localPhotoUrls.push(url);
            const caption = photo.caption?.trim() || `Zdjęcie ${index + 1}`;
            return {src:url,caption,alt:caption};
          });
        if (entries.length) renderPhotos(entries, false);
      }).catch(() => {
        document.querySelector('#person-photos-note').textContent = 'Obrazy ilustracyjne · album lokalny jest niedostępny';
      });
    }
    window.addEventListener('pagehide', event => {
      if (!event.persisted) localPhotoUrls.forEach(url => URL.revokeObjectURL(url));
    });
    document.querySelector('#person-photo-close').addEventListener('click', () => photoDialog.close());
    document.querySelector('#person-photo-previous').addEventListener('click', () => showPhoto(photoIndex - 1));
    document.querySelector('#person-photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
    photoDialog.addEventListener('click', event => { if (event.target === photoDialog) photoDialog.close(); });
    photoDialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(photoIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(photoIndex + 1); }
    });
    photoDialog.addEventListener('close', () => photoOpener?.focus({preventScroll:true}));

    const candleDialog = document.querySelector('#person-candle-dialog');
    const candleButton = document.querySelector('#person-light');
    const candleCard = document.querySelector('#person-candle-card');
    let candleOpener = candleButton;
    const candleStatus = document.querySelector('#person-candle-dialog-status');
    function syncCandle() {
      const lit = readCandle(person);
      document.querySelector('.memorial-scene').classList.toggle('is-burning', lit);
      document.querySelector('#person-period').textContent = lit ? 'Znicz zapalony na tym urządzeniu' : 'Bezpłatny gest pamięci';
      document.querySelector('#person-light-label').textContent = lit ? 'Znicz pamięci zapalony' : 'Zapal znicz pamięci';
      candleButton.setAttribute('aria-label', lit ? `Znicz pamięci zapalony: ${person.name}` : `Zapal znicz pamięci: ${person.name}`);
      syncMotion();
    }
    syncCandle();
    function openCandle(event) {
      candleOpener = event.currentTarget;
      document.querySelector('#person-candle-title').textContent = `Znicz pamięci — ${person.name}`;
      candleStatus.textContent = readCandle(person) ? 'Znicz jest już zapalony na tym urządzeniu.' : '';
      document.querySelector('#person-candle-confirm').textContent = readCandle(person) ? 'Zamknij' : 'Zapal znicz';
      candleDialog.showModal();
    }
    candleButton.addEventListener('click', openCandle);
    candleCard.addEventListener('click', openCandle);
    document.querySelector('#person-candle-close').addEventListener('click', () => candleDialog.close());
    candleDialog.addEventListener('click', event => { if (event.target === candleDialog) candleDialog.close(); });
    candleDialog.addEventListener('close', () => candleOpener?.focus({preventScroll:true}));
    document.querySelector('#person-candle-confirm').addEventListener('click', () => {
      if (readCandle(person)) { candleDialog.close(); return; }
      try { localStorage.setItem(candleKey(person), 'lit'); }
      catch { candleStatus.textContent = 'Przeglądarka nie pozwala zapisać znicza. Możesz pomodlić się bez zapisu na tym urządzeniu.'; return; }
      syncCandle();
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

  }
})();
