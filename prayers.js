(() => {
  'use strict';
  const {prayers, categories} = JSON.parse(document.getElementById('pr-data').textContent);
  const root = document.body.dataset.root;
  const params = new URLSearchParams(location.search);
  const $ = id => document.getElementById(id);
  const normalize = text => text.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l');
  const key = 'wmodlitwie_prayer_favorites_v1';
  function favorites() { try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v.filter(id => prayers.some(p => p.slug === id)) : []; } catch { return []; } }
  const url = p => `${root}modlitwy/codzienne.html?modlitwa=${encodeURIComponent(p.slug)}`;
  function link(p, compact=false) {
    const a = document.createElement('a'); a.href = url(p); a.className = compact ? 'pr-other-link' : 'pr-result-link';
    if (compact) {const img = document.createElement('img'); img.src = `${root}images/${p.slug==='wieczorna'?'hero-home.webp':p.slug==='zawierzenie'?'memorial-creator-candle.webp':p.image}`; img.alt=''; a.append(img);}
    const span = document.createElement('span'), title = document.createElement('strong'), desc=document.createElement('small');
    title.textContent=p.title; desc.textContent=p.description; span.append(title,desc);a.append(span);
    return a;
  }
  if (document.body.dataset.prMode === 'index') {
    const input=$('pr-search'); let all=false;
    const synonyms={'wdziecznosc':'dziekczynna','w trudnosciach':'zawierzenie','przed praca':'poranna','wieczorne':'wieczorna'};
    function render(){const query=normalize(input.value.trim());const q=synonyms[query]||query;const active=all||!!query;$('pr-results').hidden=!active;$('pr-categories').hidden=active;const list=$('pr-result-list');list.replaceChildren();
      const found=prayers.filter(p=>normalize([p.title,p.label,p.description,...p.body].join(' ')).includes(q));
      found.forEach(p=>list.append(link(p)));
      $('pr-result-status').textContent=found.length?`Znaleziono: ${found.length}`:'Nie znaleziono modlitwy. Spróbuj innego słowa, np. „rodzina” lub „pokój”.';
    }
    input.addEventListener('input',()=>{all=false;render()});
    document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.topic;all=false;render();input.focus()}));
    $('pr-show-all').addEventListener('click',()=>{all=true;input.value='';render();input.focus()});
    $('pr-reset').addEventListener('click',()=>{all=false;input.value='';render();input.focus()});
    document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus()}});
    function renderFavorites(){const saved=favorites();$('pr-favorites-section').hidden=!saved.length;$('pr-favorites-list').replaceChildren(...prayers.filter(p=>saved.includes(p.slug)).map(p=>link(p)));}
    window.addEventListener('storage',renderFavorites);renderFavorites();
    if(params.get('q')){input.value=params.get('q');render()}
    return;
  }
  let selected=prayers.find(p=>p.slug===(params.get('modlitwa')||document.body.dataset.prSlug));
  const requestedCategory=params.get('kategoria');
  let category=categories.find(c=>c[0]===requestedCategory)?.[0] || selected?.categories[0] || 'codzienne';

  let filter=params.get('filtr') || 'wszystkie';
  const pool=()=>prayers.filter(p=>p.categories.includes(category));
  if(requestedCategory&&!params.has('modlitwa'))selected=pool()[0];
  if(!selected || (requestedCategory!=='tradycyjne'&&requestedCategory&&!categories.some(c=>c[0]===requestedCategory))) {
    $('pr-title').textContent='Nie znaleziono modlitwy';$('pr-subtitle').textContent='Wybierz modlitwę z listy lub wróć do katalogu.';$('pr-text').replaceChildren();$('pr-audio').hidden=true;$('pr-favorite').disabled=true;$('pr-share').disabled=true;
    $('pr-source').textContent='';$('pr-audio-note').textContent='';return;
  }
  if (!selected.categories.includes(category)) category=selected.categories[0];
  if (![...document.querySelectorAll('[data-pr-filter]')].some(b=>b.dataset.prFilter===filter)) filter='wszystkie';
  const categoryLabel=categories.find(c=>c[0]===category)?.[1]||'Modlitwy tradycyjne';
  $('pr-category-title').textContent=categoryLabel;$('pr-category-name').textContent=categoryLabel;
  if(category!=='codzienne')$('pr-category-description').textContent='Znajdź chwilę ciszy i powierz Bogu swoje sprawy.';
  const filterNav=document.querySelector('.pr-filters');filterNav.hidden=category!=='codzienne';
  function syncFavorite(){const saved=favorites().includes(selected.slug);$('pr-favorite').setAttribute('aria-pressed',String(saved));$('pr-favorite').querySelector('span').textContent=saved?'Usuń z ulubionych':'Dodaj do ulubionych';}
  function renderMenu(){const available=pool().filter(p=>filter==='wszystkie'||p.tag===filter);const menu=$('pr-prayer-menu');menu.replaceChildren();$('pr-menu-empty').hidden=!!available.length;
    available.forEach(p=>{const a=link(p);a.className='pr-menu-link';a.querySelector('strong').textContent=p.label;a.querySelector('small').remove();const glyph=document.createElementNS('http://www.w3.org/2000/svg','svg');glyph.setAttribute('viewBox','0 0 24 24');glyph.setAttribute('class','pr-icon');glyph.setAttribute('fill','none');glyph.setAttribute('stroke','currentColor');glyph.setAttribute('stroke-width','1.5');glyph.setAttribute('aria-hidden','true');
      const shapes={moon:'<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',heart:'<path d="M12 21 3 12a5 5 0 0 1 9-7 5 5 0 0 1 9 7Z"/>',bell:'<path d="M4 17h16l-3-4V8a5 5 0 0 0-10 0v5ZM10 21h4"/>',people:'<circle cx="12" cy="7" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M3 9a3 3 0 0 1 3-5M21 9a3 3 0 0 0-3-5M2 18v-4M22 18v-4"/>',hands:'<path d="m12 4-3-2-2 11-4 5 5 4 4-7 4 7 5-4-4-5-2-11-3 2v11"/>',dove:'<path d="M3 12c5 2 6-1 7-6l4 4 4-4 3 2-4 3c-1 7-7 11-14 9l4-5Z"/>',cross:'<path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6Z"/>'};glyph.innerHTML=shapes[p.icon]||'<circle cx="12" cy="12" r="4"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M17 17l3 3M20 4l-3 3M7 17l-3 3"/>';a.prepend(glyph);
      if(p.slug===selected.slug)a.setAttribute('aria-current','page');a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();select(p,true)});menu.append(a)});
  }
  function select(p,focus=false){selected=p;document.title=`${p.title} · W Modlitwie`;$('pr-title').textContent=p.title;$('pr-subtitle').textContent=p.description;
    $('pr-text').replaceChildren(...p.body.map(text=>{const el=document.createElement('p');el.textContent=text;return el}));
    $('pr-source').textContent=p.contentKind==='introduction'?'Autorskie wprowadzenie do modlitwy':p.sourceLabel;
    $('pr-editorial-note').textContent=p.editorialNote||'';
    const sourceLink=$('pr-source-link');
    sourceLink.hidden=!p.sourceUrl;
    if(p.sourceUrl)sourceLink.href=p.sourceUrl;
    const audio=$('pr-audio');audio.pause();audio.src=`${root}assets/prayers/${p.slug}.mp3`;audio.load();$('pr-audio-note').textContent='Odczyt syntetyczny';
    const others=pool().filter(q=>q.slug!==p.slug).slice(0,4);$('pr-other-list').replaceChildren(...others.map(q=>link(q,true)));document.querySelector('.pr-other').hidden=!others.length;
    syncFavorite();renderMenu();if(focus){const next=new URL(location.href);next.searchParams.set('modlitwa',p.slug);next.searchParams.set('kategoria',category);next.searchParams.set('filtr',filter);history.pushState({},'',next);$('pr-title').focus({preventScroll:true})}
  }
  document.querySelectorAll('[data-pr-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.prFilter;document.querySelectorAll('[data-pr-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const next=pool().find(p=>filter==='wszystkie'||p.tag===filter);if(next)select(next,true);else renderMenu()}));
  $('pr-favorite').addEventListener('click',()=>{const current=favorites();const had=current.includes(selected.slug);try{localStorage.setItem(key,JSON.stringify(had?current.filter(id=>id!==selected.slug):[...current,selected.slug]));syncFavorite();$('pr-action-status').textContent=had?'Usunięto z ulubionych.':'Zapisano w ulubionych na tym urządzeniu.';}catch{$('pr-action-status').textContent='Nie udało się zapisać ulubionych. Sprawdź ustawienia pamięci przeglądarki.'}});
  window.addEventListener('storage',syncFavorite);
  $('pr-share').addEventListener('click',async()=>{const shareUrl=new URL(url(selected),location.href).href;try{if(navigator.share)await navigator.share({title:selected.title,url:shareUrl});else {await navigator.clipboard.writeText(shareUrl);$('pr-action-status').textContent='Link do modlitwy skopiowany.'}}catch(e){if(e.name!=='AbortError')$('pr-action-status').textContent=`Skopiuj link: ${shareUrl}`}});
  $('pr-audio').addEventListener('error',()=>{$('pr-audio-note').textContent='Nagranie jest niedostępne. Możesz przeczytać tekst powyżej.'});
  const date=$('pr-date');const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw'}).format(new Date());
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
  date.value=validDate(params.get('date'))?params.get('date'):today;
  function updateDate(){if(!validDate(date.value))date.value=today;$('pr-readings-link').href=`${root}czytania/index.html?date=${date.value}`;const u=new URL(location.href);u.searchParams.set('date',date.value);history.replaceState({},'',u)}
  date.addEventListener('change',updateDate);for(const [id,offset]of[['pr-day-prev',-1],['pr-day-next',1]])$(id).addEventListener('click',()=>{const d=new Date(date.value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);date.value=d.toISOString().slice(0,10);updateDate()});
  window.addEventListener('popstate',()=>{
    const q=new URLSearchParams(location.search);
    const requested=q.get('kategoria');
    const known=categories.some(c=>c[0]===requested)||requested==='tradycyjne';
    const p=q.has('modlitwa')?prayers.find(p=>p.slug===q.get('modlitwa')):requested?prayers.find(p=>p.categories.includes(requested)):prayers.find(p=>p.slug===document.body.dataset.prSlug);
    if(!p)return;
    category=known?requested:p.categories[0];
    filter=q.get('filtr')||'wszystkie';
    const label=categories.find(c=>c[0]===category)?.[1]||'Modlitwy tradycyjne';
    $('pr-category-title').textContent=label;$('pr-category-name').textContent=label;
    $('pr-category-description').textContent=category==='codzienne'?'Modlitwy, które możesz odmawiać każdego dnia. Znajdź chwilę ciszy i powierz Bogu swoje sprawy.':'Znajdź chwilę ciszy i powierz Bogu swoje sprawy.';
    filterNav.hidden=category!=='codzienne';
    document.querySelectorAll('[data-pr-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.prFilter===filter)));
    select(p);date.value=validDate(q.get('date'))?q.get('date'):today;
    $('pr-readings-link').href=`${root}czytania/index.html?date=${date.value}`;
  });
  document.querySelectorAll('[data-pr-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.prFilter===filter)));
  select(selected);updateDate();
})();
