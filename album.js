(() => {
  'use strict';
  const people = {
    maria: {name:'Maria Wesołowska', dates:'12 marca 1942 – 5 października 2023', portrait:'./assets/memorial-reference-portrait.webp'},
    jan: {name:'Jan Kowalski'},
    helena: {name:'Helena Nowak', dates:'27 lipca 1938 – 2 stycznia 2024', portrait:'./assets/memorial-demo-portrait.webp'},
    stanislaw: {name:'Stanisław Wiśniewski'},
    zofia: {name:'Zofia Kamińska'},
    tadeusz: {name:'Tadeusz Zieliński'}
  };
  const params = new URLSearchParams(location.search);
  const profileId = Object.hasOwn(people, params.get('id')) ? params.get('id') : null;
  if (!profileId) {
    const shell = document.querySelector('.album-shell');
    shell.replaceChildren();
    const heading = document.createElement('h1');
    heading.textContent = 'Nie znaleziono przykładowego profilu';
    const note = document.createElement('p');
    note.textContent = 'Wybierz osobę z galerii, aby otworzyć jej lokalny album.';
    const link = document.createElement('a');
    link.href = './gallery.html';
    link.textContent = 'Przejdź do galerii pamięci';
    link.className = 'album-back';
    shell.append(heading, note, link);
    return;
  }
  const person = people[profileId];
  const name = person.name;
  const store = window.MemorialAlbumStore;
  const status = document.querySelector('#album-status');
  const purchaseStatus = document.querySelector('#album-purchase-status');
  const grid = document.querySelector('#album-grid');
  const cardPhotos = document.querySelector('#album-card-photos');
  const fileInput = document.querySelector('#album-files');
  const publicProfileUrl = `https://matthewjosh96.github.io/w-modlitwie-preview/gallery-person.html?id=${profileId}`;
  let photos = [];
  let objectUrls = [];
  let purchaseState = 'idle';
  let albumLoaded = false;

  document.querySelector('#album-person').textContent = `Profil: ${name}`;
  document.querySelector('#album-card-name').textContent = name;
  document.querySelector('#album-card-dates').textContent = person.dates || 'Daty niepodane';
  if (person.portrait) {
    const portrait = document.createElement('img');
    portrait.src = person.portrait;
    portrait.alt = `Portret przykładowej osoby: ${name}`;
    document.querySelector('#album-card-portrait').append(portrait);
  } else document.querySelector('#album-card-portrait').textContent = 'Portret nie został dodany';
  document.querySelector('#album-summary-name').textContent = name;
  document.querySelector('#album-back').href = `./gallery-person.html?id=${profileId}`;
  document.querySelector('#album-card-link').textContent = 'Kod prowadzi do publicznego profilu przykładowego. Lokalne zdjęcia pozostają na tym urządzeniu.';
  if (typeof window.qrcode === 'function') {
    const code = window.qrcode(0, 'M');
    code.addData(publicProfileUrl);
    code.make();
    const image = document.createElement('img');
    image.src = code.createDataURL(5, 2);
    image.alt = `Kod QR do profilu przykładowego: ${name}`;
    image.width = 78;
    image.height = 78;
    document.querySelector('#album-card-qr').append(image);
  }

  function setStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  }
  function setPurchaseStatus(message, state) {
    purchaseStatus.textContent = message;
    purchaseStatus.dataset.state = state;
  }
  function photoUrl(blob) {
    const url = URL.createObjectURL(blob);
    objectUrls.push(url);
    return url;
  }
  function cleanupUrls() {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls = [];
  }
  function button(label, action, id, disabled = false) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.dataset.action = action;
    element.dataset.id = id;
    element.disabled = disabled;
    return element;
  }
  function renderPhotos() {
    cleanupUrls();
    grid.replaceChildren();
    cardPhotos.replaceChildren();
    const limit = store.isUpgraded(profileId) ? 50 : 10;
    document.querySelector('#album-count').textContent = `${photos.length} z ${limit} zdjęć`;
    fileInput.disabled = photos.length >= limit;
    if (photos.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'album-empty';
      empty.textContent = 'Ten lokalny album jest pusty. Dodaj pierwsze zdjęcie, aby zachować wspomnienie na tym urządzeniu.';
      grid.append(empty);
    }
    photos.forEach((photo, index) => {
      const figure = document.createElement('figure');
      figure.className = 'album-photo';
      const img = document.createElement('img');
      img.src = photoUrl(photo.blob);
      img.alt = photo.caption || `Zdjęcie ${index + 1} w albumie ${name}`;
      img.loading = 'lazy';
      const caption = document.createElement('figcaption');
      const label = document.createElement('label');
      label.textContent = `Opis zdjęcia ${index + 1}`;
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 180;
      input.value = photo.caption || '';
      input.dataset.id = photo.id;
      input.placeholder = 'Dodaj krótki opis';
      label.append(input);
      const actions = document.createElement('div');
      actions.className = 'album-photo-actions';
      actions.append(button('W lewo', 'left', photo.id, index === 0), button('W prawo', 'right', photo.id, index === photos.length - 1), button('Usuń', 'remove', photo.id));
      caption.append(label, actions);
      figure.append(img, caption);
      grid.append(figure);
      if (index < 3) {
        const cardImg = document.createElement('img');
        cardImg.src = photoUrl(photo.blob);
        cardImg.alt = img.alt;
        cardPhotos.append(cardImg);
      }
    });
    if (!cardPhotos.children.length) {
      const placeholder = document.createElement('p');
      placeholder.textContent = 'Miejsce na Wasze wspólne zdjęcia';
      cardPhotos.append(placeholder);
    }
  }
  async function refresh() {
    try {
      photos = await store.list(profileId);
      albumLoaded = true;
      renderPhotos();
      renderPurchase();
    } catch (error) {
      albumLoaded = false;
      document.querySelector('#album-print').disabled = true;
      document.querySelector('#album-export').disabled = true;
      fileInput.disabled = true;
      throw error;
    }
  }
  function renderPurchase() {
    const upgraded = store.isUpgraded(profileId);
    document.querySelector('#album-print').disabled = !upgraded || !albumLoaded;
    document.querySelector('#album-export').disabled = !albumLoaded;
    const actions = document.querySelector('#album-checkout-actions');
    const start = document.querySelector('#album-start-purchase');
    document.querySelector('#album-paid-state').textContent = upgraded ? 'Aktywny tylko w tej przeglądarce' : 'Symulacja zakupu';
    const planPurchase = document.querySelector('#album-plan-purchase');
    planPurchase.disabled = upgraded;
    planPurchase.textContent = upgraded ? 'Aktywny w podglądzie' : 'Zobacz podsumowanie · 49 zł';
    document.querySelector('#album-purchase-copy').textContent = upgraded
      ? 'Symulowany Album pamięci jest już aktywny na tym urządzeniu. Możesz dodać do 50 zdjęć.'
      : 'Album pamięci · 49 zł jednorazowo · do 50 zdjęć i karta PDF.';
    document.querySelector('#album-purchase-panel').hidden = upgraded || purchaseState === 'idle' || purchaseState === 'cancelled';
    actions.hidden = upgraded;
    start.textContent = purchaseState === 'failed' ? 'Spróbuj ponownie' : 'Zobacz podsumowanie';
    if (upgraded) setPurchaseStatus('Symulacja zakończona. Nie pobrano pieniędzy. Lokalny limit wynosi teraz 50 zdjęć.', 'success');
  }
  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    fileInput.value = '';
    if (!files.length) return;
    fileInput.disabled = true;
    let added = 0;
    for (const file of files) {
      try {
        const limit = store.isUpgraded(profileId) ? 50 : 10;
        await store.add(profileId, file, limit);
        added++;
      } catch (error) {
        setStatus(`${file.name}: ${error.message}`, true);
        break;
      }
    }
    try {
      await refresh();
      if (added === files.length) setStatus(added === 1 ? 'Zdjęcie zapisane na tym urządzeniu.' : `Zapisano ${added} zdjęć na tym urządzeniu.`);
    } catch (error) { setStatus(error.message, true); }
  });
  grid.addEventListener('change', async event => {
    const input = event.target.closest('input[data-id]');
    if (!input) return;
    try {
      await store.updateCaption(profileId, input.dataset.id, input.value);
      await refresh();
      setStatus('Opis zapisany na tym urządzeniu.');
    } catch (error) { setStatus(error.message, true); }
  });
  grid.addEventListener('click', async event => {
    const control = event.target.closest('button[data-action]');
    if (!control) return;
    if (control.dataset.action === 'remove' && !window.confirm('Usunąć to zdjęcie z lokalnego albumu? Tej zmiany nie można cofnąć.')) return;
    control.disabled = true;
    try {
      if (control.dataset.action === 'remove') await store.remove(profileId, control.dataset.id);
      else await store.move(profileId, control.dataset.id, control.dataset.action === 'left' ? -1 : 1);
      await refresh();
      setStatus(control.dataset.action === 'remove' ? 'Zdjęcie usunięte z tego urządzenia.' : 'Zmieniono kolejność zdjęć.');
    } catch (error) { control.disabled = false; setStatus(error.message, true); }
  });
  function fillWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = String(text).split(/\s+/);
    let line = '';
    let count = 0;
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        ctx.fillText(line, x, y + count * lineHeight);
        count++;
        line = word;
        if (count >= maxLines) return;
      } else line = next;
    }
    if (line && count < maxLines) ctx.fillText(line, x, y + count * lineHeight);
  }
  async function drawPhoto(ctx, blob, x, y, width, height) {
    const image = await createImageBitmap(blob);
    try {
      const crop = Math.min(image.width / width, image.height / height);
      const sourceWidth = width * crop;
      const sourceHeight = height * crop;
      ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
    } finally { image.close(); }
  }
  async function imageFromSource(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Nie udało się dodać kodu QR do karty.'));
      image.src = source;
    });
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }
  async function exportPhotos() {
    if (!albumLoaded) throw new Error('Lokalny album nie został załadowany. Odśwież stronę i spróbuj ponownie.');
    const parts = ['<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zdjęcia i opisy</title><style>body{font:17px/1.5 Georgia,serif;max-width:960px;margin:30px auto;padding:20px;color:#172139;background:#faf8f5}h1{font-size:36px}figure{margin:32px 0;padding-bottom:24px;border-bottom:1px solid #bbb}img{display:block;max-width:100%;max-height:700px;object-fit:contain}figcaption{margin-top:12px;white-space:pre-wrap}small{color:#555}</style><h1>Album pamięci — ', escapeHtml(name), '</h1><p>Eksport lokalnych zdjęć i opisów. Plik można otworzyć bez połączenia z internetem.</p>'];
    for (const photo of photos) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Nie udało się odczytać zdjęcia do eksportu.'));
        reader.readAsDataURL(photo.blob);
      });
      parts.push('<figure><img src="', dataUrl, '" alt="', escapeHtml(photo.caption || 'Zdjęcie w albumie'), '"><figcaption>', escapeHtml(photo.caption || 'Bez opisu'), '</figcaption></figure>');
    }
    parts.push('<small>W Modlitwie · lokalny eksport demonstracyjny</small></html>');
    const url = URL.createObjectURL(new Blob(parts, {type:'text/html;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `album-pamieci-${profileId}-zdjecia.html`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  document.querySelector('#album-export').addEventListener('click', async event => {
    const control = event.currentTarget;
    control.disabled = true;
    setStatus('Przygotowuję eksport zdjęć i opisów…');
    try { await exportPhotos(); setStatus('Eksport zdjęć i opisów został przygotowany do pobrania.'); }
    catch (error) { setStatus(error.message, true); }
    finally { control.disabled = false; }
  });
  async function downloadPdf() {
    if (!albumLoaded) throw new Error('Lokalny album nie został załadowany. Odśwież stronę i spróbuj ponownie.');
    if (!window.jspdf?.jsPDF) throw new Error('Moduł PDF nie jest dostępny. Odśwież stronę i spróbuj ponownie.');
    await Promise.all([document.fonts.load('600 72px Lora'), document.fonts.load('400 32px Inter')]);
    const canvas = document.createElement('canvas');
    canvas.width = 1480;
    canvas.height = 2100;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Ta przeglądarka nie może przygotować karty PDF.');
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 1480, 2100);
    ctx.fillStyle = '#172139';
    ctx.fillRect(0, 0, 1480, 260);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8efe1';
    ctx.font = '500 40px Lora';
    ctx.fillText('W Modlitwie', 740, 108);
    ctx.font = '400 24px Inter';
    ctx.fillText('ALBUM PAMIĘCI · PODGLĄD PRZYKŁADOWY', 740, 167);
    ctx.fillStyle = '#172139';
    ctx.font = '600 73px Lora';
    fillWrappedText(ctx, name, 740, 380, 1250, 85, 2);
    ctx.font = '400 31px Lora';
    ctx.fillStyle = '#455268';
    ctx.fillText(person.dates || 'Daty niepodane', 740, 480);
    ctx.fillStyle = '#965d2b';
    ctx.fillRect(655, 545, 170, 4);
    if (person.portrait) {
      const portrait = await imageFromSource(person.portrait);
      const size = 330;
      const scale = Math.min(portrait.naturalWidth / size, portrait.naturalHeight / size);
      ctx.drawImage(portrait, (portrait.naturalWidth - size * scale) / 2, (portrait.naturalHeight - size * scale) / 2, size * scale, size * scale, 575, 585, size, size);
    } else {
      ctx.fillStyle = '#ece5da';
      ctx.fillRect(575, 585, 330, 330);
      ctx.fillStyle = '#5b6473';
      ctx.font = '400 23px Inter';
      ctx.fillText('Portret nie został dodany', 740, 755);
    }
    const top = 970;
    const gap = 18;
    const imageWidth = 410;
    const imageHeight = 430;
    const left = (1480 - 3 * imageWidth - 2 * gap) / 2;
    for (let index = 0; index < 3; index++) {
      const x = left + index * (imageWidth + gap);
      ctx.fillStyle = '#ece5da';
      ctx.fillRect(x, top, imageWidth, imageHeight);
      if (photos[index]) await drawPhoto(ctx, photos[index].blob, x, top, imageWidth, imageHeight);
      if (photos[index]?.caption) {
        ctx.fillStyle = '#34405a';
        ctx.font = '400 20px Inter';
        const shortCaption = photos[index].caption.length > 32 ? `${photos[index].caption.slice(0, 31)}…` : photos[index].caption;
        ctx.fillText(shortCaption, x + imageWidth / 2, 1433);
      }
    }
    ctx.fillStyle = '#172139';
    ctx.font = '400 37px Lora';
    ctx.fillText('Wieczny odpoczynek racz im dać, Panie.', 740, 1510);
    ctx.fillStyle = '#626b7c';
    ctx.font = '400 23px Inter';
    ctx.fillText('Zdjęcia pochodzą z lokalnego podglądu na tym urządzeniu.', 740, 1565);
    if (typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M');
      qr.addData(publicProfileUrl);
      qr.make();
      const qrImage = await imageFromSource(qr.createDataURL(8, 4));
      ctx.drawImage(qrImage, 630, 1640, 220, 220);
      ctx.fillStyle = '#34405a';
      ctx.font = '400 20px Inter';
      ctx.fillText('Publiczny profil przykładowy', 740, 1890);
      ctx.fillText('Lokalne zdjęcia nie są udostępniane', 740, 1920);
    }
    ctx.fillStyle = '#5b6473';
    ctx.font = '400 18px Inter';
    ctx.fillText('W Modlitwie · karta demonstracyjna · bez prawdziwego zakupu', 740, 2020);
    const pdf = new window.jspdf.jsPDF({unit: 'mm', format: [148, 210], compress: true});
    pdf.addImage(canvas.toDataURL('image/jpeg', .91), 'JPEG', 0, 0, 148, 210);
    pdf.save(`album-pamieci-${profileId}.pdf`);
  }
  document.querySelector('#album-print').addEventListener('click', async event => {
    const control = event.currentTarget;
    if (!store.isUpgraded(profileId) || !albumLoaded) return;
    control.disabled = true;
    setStatus('Przygotowuję kartę PDF…');
    try {
      await downloadPdf();
      setStatus('Karta PDF została przygotowana do pobrania.');
    } catch (error) { setStatus(error.message, true); }
    finally { control.disabled = false; }
  });
  function showSummary() {
    if (store.isUpgraded(profileId)) return;
    purchaseState = 'summary';
    renderPurchase();
    document.querySelector('#album-purchase-panel').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'});
    setPurchaseStatus('Sprawdź podsumowanie lokalnej symulacji.', 'summary');
  }
  document.querySelector('#album-start-purchase').addEventListener('click', showSummary);
  document.querySelector('#album-plan-purchase').addEventListener('click', showSummary);
  document.querySelector('#album-cancel').addEventListener('click', () => {
    if (purchaseState === 'pending') return;
    purchaseState = 'cancelled';
    renderPurchase();
    setPurchaseStatus('Symulacja anulowana. Zdjęcia pozostały w lokalnym albumie.', 'cancelled');
  });
  async function simulate(result) {
    if (store.isUpgraded(profileId) || purchaseState === 'pending') return;
    purchaseState = 'pending';
    document.querySelectorAll('.album-purchase-actions button').forEach(control => { control.disabled = true; });
    setPurchaseStatus('Trwa symulacja odpowiedzi płatności…', 'pending');
    await new Promise(resolve => setTimeout(resolve, 750));
    document.querySelectorAll('.album-purchase-actions button').forEach(control => { control.disabled = false; });
    if (result === 'success') {
      try {
        store.setUpgraded(profileId);
        purchaseState = 'success';
        await refresh();
      } catch (error) {
        purchaseState = 'failed';
        setPurchaseStatus(error.message, 'failed');
      }
    } else {
      purchaseState = 'failed';
      setPurchaseStatus('Symulowany błąd płatności. Nie pobrano pieniędzy. Możesz spróbować ponownie.', 'failed');
      renderPurchase();
    }
  }
  document.querySelector('#album-simulate-success').addEventListener('click', () => simulate('success'));
  document.querySelector('#album-simulate-failure').addEventListener('click', () => simulate('failure'));
  window.addEventListener('pagehide', event => { if (!event.persisted) cleanupUrls(); });
  refresh().catch(error => {
    setStatus(error.message, true);
    grid.textContent = 'Nie można otworzyć lokalnego albumu w tej przeglądarce.';
    fileInput.disabled = true;
    renderPurchase();
  });
})();
