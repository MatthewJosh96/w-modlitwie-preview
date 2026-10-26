(() => {
 const normalize=value=>value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l');
 const search=document.querySelector('#saint-search');
 if(search){const cards=[...document.querySelectorAll('[data-saint-card]')];search.addEventListener('input',()=>{const q=normalize(search.value.trim());let count=0;cards.forEach(card=>{card.hidden=!normalize(card.dataset.search).includes(q);if(!card.hidden)count++});document.querySelector('#saint-results').textContent=`Znaleziono: ${count}`;document.querySelector('#saint-empty').hidden=count>0})}
 document.querySelector('[data-saint-share]')?.addEventListener('click',async()=>{const status=document.querySelector('[data-share-status]');const url=location.href.split('#')[0];try{if(navigator.share)await navigator.share({title:document.title,url});else{await navigator.clipboard.writeText(url);status.textContent='Link skopiowany.'}}catch(error){if(error.name!=='AbortError')status.textContent=`Skopiuj adres: ${url}`}});
})();
