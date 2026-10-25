(() => {
  'use strict';
  // The gallery contains illustrative people and memories only.
  const people = [
    {id:'maria',name:'Maria Wesołowska',eternalLight:true,portrait:'./assets/memorial-reference-portrait.webp',dedication:'Z wdzięcznością za ciepło, które zostaje z nami.'},
    {id:'jan',name:'Jan Kowalski',eternalLight:true,portrait:null,dedication:'Pamięć o wspólnych chwilach trwa w naszych sercach.'},
    {id:'helena',name:'Helena Nowak',portrait:'./assets/memorial-demo-portrait.webp',dedication:'Za dobro, uśmiech i bliskość — dziękujemy.'},
    {id:'stanislaw',name:'Stanisław Wiśniewski',portrait:null,dedication:'W ciszy i modlitwie zachowujemy wspomnienie.'},
    {id:'zofia',name:'Zofia Kamińska',portrait:null,dedication:'Zawsze obecna w naszej pamięci.'},
    {id:'tadeusz',name:'Tadeusz Zieliński',portrait:null,dedication:'Wspominamy z wdzięcznością wspólnie spędzony czas.'}
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const escape = value => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const lights = '<span class="memorial-background-glow glow-left"></span><span class="memorial-background-glow glow-middle"></span><span class="memorial-background-glow glow-upper-one"></span><span class="memorial-background-glow glow-upper-two"></span><span class="memorial-background-glow glow-lower"></span><span class="memorial-background-glow glow-edge"></span><span class="memorial-background-glow glow-reflection-one"></span><span class="memorial-background-glow glow-reflection-two"></span>';

  const noFrame = '<img class="gallery-card-no-frame" src="./assets/memorial-scene-no-frame.webp" alt="" width="1836" height="856" loading="lazy">';
  function card(person) {
    const portrait = person.portrait ? `<svg class="gallery-card-portrait" viewBox="0 0 1836 856" preserveAspectRatio="none"><defs><clipPath id="frame-${person.id}"><path d="M 145 160 L 475 181 L 525 635 L 185 658 Z"></path></clipPath></defs><g clip-path="url(#frame-${person.id})"><image href="${person.portrait}" width="600" height="750" preserveAspectRatio="xMidYMid slice" transform="matrix(.57 .035 .052 .68 145 160)"></image></g></svg><img class="gallery-card-foreground" src="./assets/memorial-scene-foreground.webp" alt="" width="1836" height="856" loading="lazy">` : noFrame;
    const flameIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c4.1 0 7-2.9 7-7 0-2.7-1.6-5-4.5-8-.1 2.3-1.1 3.4-2 3.9C12.1 7.4 10.3 5 8 2c.4 3.5-.7 5.3-2 7.3A9.4 9.4 0 0 0 5 15c0 4.1 2.9 7 7 7Z"/></svg>';
    const candleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10h8v11H8zM12 8c2-2 .7-3.8 0-5-.7 1.2-2 3 0 5Z"/></svg>';
    const rememberCount = Number.isInteger(person.rememberCount) && person.rememberCount >= 0 ? person.rememberCount.toLocaleString('pl-PL') : '—';
    const years = person.birthYear && person.deathYear ? `${person.birthYear} – ${person.deathYear}` : person.birthYear ? `ur. ${person.birthYear}` : person.deathYear ? `zm. ${person.deathYear}` : '';
    return `<a class="gallery-card${person.eternalLight ? ' gallery-card-eternal' : ''}" href="./gallery-person.html?id=${person.id}"><div class="gallery-card-scene" aria-hidden="true"><div class="gallery-card-art"><img src="./assets/memorial-scene-lit.webp" alt="" width="1836" height="856" loading="lazy">${portrait}<span class="gallery-card-flame"><img src="./assets/memorial-scene-lit.webp" alt="" width="1836" height="856" loading="lazy"></span><span class="gallery-card-glow"></span></div></div><div class="gallery-card-info"><h2>${escape(person.name)}</h2><p class="gallery-card-years">${years || escape(person.dedication)}</p>${person.eternalLight ? `<span class="gallery-eternal-label">${flameIcon}Wieczny znicz</span>` : ''}<div class="gallery-card-footer"><span class="gallery-memory-count" aria-label="Osób pamiętających: ${rememberCount === '—' ? 'brak danych' : rememberCount}">${candleIcon}${rememberCount} osób pamięta</span><span class="gallery-card-arrow" aria-hidden="true">›</span></div></div></a>`;
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
    function render() {
      const query = input.value.trim().toLocaleLowerCase('pl-PL');
      const visible = people.filter(person => person.name.toLocaleLowerCase('pl-PL').includes(query));
      if (!visible.length) target.innerHTML = `<div class="gallery-feedback" role="status"><h2>Nie znaleziono osoby</h2><p>Sprawdź pisownię imienia lub nazwiska i spróbuj ponownie.</p></div>`;
      else target.innerHTML = `<div class="gallery-grid">${visible.map(card).join('')}</div>`;
      observer.disconnect();
      target.querySelectorAll('.gallery-card').forEach(element => observer.observe(element));
    }
    input.addEventListener('input',render);
    document.querySelector('.gallery-search button').addEventListener('click',render);
    render();
  } else {
    const id = new URLSearchParams(location.search).get('id');
    const person = people.find(entry => entry.id === id);
    if (!person) {
      document.querySelector('#person').innerHTML = '<div class="gallery-feedback"><h1>Nie znaleziono wspomnienia</h1><p>Wybierz osobę z galerii.</p><a class="button secondary" href="./gallery.html">Wróć do galerii</a></div>';
      return;
    }
    document.title = `${person.name} · W Modlitwie`;
    document.querySelector('#person-name').textContent = person.name;
    document.querySelector('#person-dedication').textContent = person.dedication;
    document.querySelector('#person-period').textContent = person.eternalLight ? 'Wieczny znicz' : 'Świeca pamięci.';
    if (person.portrait) {
      document.querySelector('#person-portrait').setAttribute('href',person.portrait);
      document.querySelector('.memorial-portrait').removeAttribute('hidden');
      document.querySelector('.memorial-foreground').hidden = false;
      document.querySelector('.memorial-empty-frame').hidden = true;
    }
    observer.observe(document.querySelector('.memorial-scene'));
  }
})();
