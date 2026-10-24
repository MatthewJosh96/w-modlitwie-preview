(() => {
  'use strict';
  // These people and periods exist only in this self-contained demonstration.
  const people = [
    {id:'maria',name:'Maria Wesołowska',duration:90,remaining:62,portrait:'./assets/memorial-reference-portrait.webp',dedication:'Z wdzięcznością za ciepło, które zostaje z nami.'},
    {id:'jan',name:'Jan Kowalski',duration:90,remaining:71,portrait:null,dedication:'Pamięć o wspólnych chwilach trwa w naszych sercach.'},
    {id:'helena',name:'Helena Nowak',duration:30,remaining:18,portrait:'./assets/memorial-demo-portrait.webp',dedication:'Za dobro, uśmiech i bliskość — dziękujemy.'},
    {id:'stanislaw',name:'Stanisław Wiśniewski',duration:30,remaining:12,portrait:null,dedication:'W ciszy i modlitwie zachowujemy wspomnienie.'},
    {id:'zofia',name:'Zofia Kamińska',duration:7,remaining:3,portrait:null,dedication:'Zawsze obecna w naszej pamięci.'}
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const escape = value => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const lights = '<span class="memorial-background-glow glow-left"></span><span class="memorial-background-glow glow-middle"></span><span class="memorial-background-glow glow-upper-one"></span><span class="memorial-background-glow glow-upper-two"></span><span class="memorial-background-glow glow-lower"></span><span class="memorial-background-glow glow-edge"></span><span class="memorial-background-glow glow-reflection-one"></span><span class="memorial-background-glow glow-reflection-two"></span>';

  function card(person, large) {
    const portrait = person.portrait ? `<svg class="gallery-card-portrait" viewBox="0 0 1836 856" preserveAspectRatio="none"><defs><clipPath id="frame-${person.id}"><path d="M 145 160 L 475 181 L 525 635 L 185 658 Z"></path></clipPath></defs><g clip-path="url(#frame-${person.id})"><image href="${person.portrait}" width="600" height="750" preserveAspectRatio="xMidYMid slice" transform="matrix(.57 .035 .052 .68 145 160)"></image></g></svg><img class="gallery-card-foreground" src="./assets/memorial-scene-foreground.webp" alt="" width="1836" height="856" loading="lazy">` : '<span class="gallery-card-empty-frame" aria-hidden="true">✝</span>';
    return `<a class="gallery-card${large ? ' gallery-card-large' : ''}" href="./gallery-person.html?id=${person.id}"><div class="gallery-card-scene" aria-hidden="true"><img src="./assets/memorial-scene-lit.webp" alt="" width="1836" height="856" loading="lazy">${portrait}<span class="gallery-card-flame"><img src="./assets/memorial-scene-lit.webp" alt="" width="1836" height="856" loading="lazy"></span><span class="gallery-card-glow"></span></div><div class="gallery-card-info"><h3>${escape(person.name)}</h3><div class="gallery-card-facts"><span>Znicz na ${person.duration} dni</span><span>Pozostało ${person.remaining} dni</span></div><span class="gallery-card-action"><span>Odwiedź stronę</span><span aria-hidden="true">→</span></span></div></a>`;
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
    const buttons = [...document.querySelectorAll('[data-duration]')];
    const target = document.querySelector('#gallery-results');
    let duration = 'all';
    function render() {
      const query = input.value.trim().toLocaleLowerCase('pl-PL');
      const visible = people.filter(person => (duration === 'all' || String(person.duration) === duration) && person.name.toLocaleLowerCase('pl-PL').includes(query));
      const featured = visible.filter(person => person.duration === 90);
      const remaining = visible.filter(person => person.duration !== 90);
      if (!visible.length) target.innerHTML = `<div class="gallery-feedback" role="status"><h2>Nie znaleziono pasujących stron</h2><p>Zmień wyszukiwanie lub okres świecy i spróbuj ponownie.</p></div>`;
      else target.innerHTML = `${featured.length ? `<section class="gallery-group" aria-labelledby="gallery-featured"><h2 id="gallery-featured">Znicze na 90 dni</h2><div class="gallery-grid gallery-grid-featured">${featured.map(person => card(person,true)).join('')}</div></section>` : ''}${remaining.length ? `<section class="gallery-group" aria-labelledby="gallery-remaining"><h2 id="gallery-remaining">Pozostałe zapalone znicze</h2><div class="gallery-grid gallery-grid-remaining">${remaining.map(person => card(person,false)).join('')}</div></section>` : ''}`;
      observer.disconnect();
      target.querySelectorAll('.gallery-card').forEach(element => observer.observe(element));
    }
    input.addEventListener('input',render);
    buttons.forEach(button => button.addEventListener('click',() => {
      duration = button.dataset.duration;
      buttons.forEach(option => option.setAttribute('aria-pressed',String(option === button)));
      render();
    }));
    render();
  } else {
    const id = new URLSearchParams(location.search).get('id');
    const person = people.find(entry => entry.id === id);
    if (!person) {
      document.querySelector('#person').innerHTML = '<div class="gallery-feedback"><h1>Nie ma takiego przykładu</h1><p>Wybierz osobę z demonstracyjnej galerii.</p><a class="button secondary" href="./gallery.html">Wróć do galerii</a></div>';
      return;
    }
    document.title = `${person.name} · fikcyjny podgląd · W Modlitwie`;
    document.querySelector('#person-name').textContent = person.name;
    document.querySelector('#person-dedication').textContent = person.dedication;
    document.querySelector('#person-period').textContent = `Przykładowy znicz na ${person.duration} dni · pozostało ${person.remaining} dni.`;
    if (person.portrait) {
      document.querySelector('#person-portrait').setAttribute('href',person.portrait);
      document.querySelector('.memorial-portrait').removeAttribute('hidden');
      document.querySelector('.memorial-foreground').hidden = false;
      document.querySelector('.memorial-empty-frame').hidden = true;
    }
    observer.observe(document.querySelector('.memorial-scene'));
  }
})();
