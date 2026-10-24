(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const scene = $('.creator-preview .memorial-scene');
  const photo = $('.creator-preview .memorial-photo');
  const motionButton = $('#motion-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const inspirations = {
    mama: 'Za ciepło, troskę i każdą wspólną chwilę — dziękuję.',
    tata: 'Za obecność, wsparcie i dobro, które pozostało ze mną.',
    babcia: 'Za opowieści, bliskość i dom pełen miłości.',
    dziadek: 'Za rozmowy, cierpliwość i wspólne wspomnienia.'
  };
  const eternalRest = 'Wieczny odpoczynek racz im dać, Panie, a światłość wiekuista niechaj im świeci. Niech odpoczywają w pokoju wiecznym. Amen.';
  let step = 1;
  let image = null;
  let imageUrl = null;
  let photoData = null;
  let paused = false;
  let inView = true;

  function eventDate(kind) {
    const value = $(`#demo-${kind}`).value;
    if (!value) return null;
    return { precision: $(`#demo-${kind}-precision`).value, value };
  }

  function issue(event) {
    if (!event) return '';
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (event.precision === 'year') return /^\d{4}$/.test(event.value) && Number(event.value) >= 1 && Number(event.value) <= today.getFullYear() ? '' : 'Podaj rok od 0001 do bieżącego roku.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.value)) return 'Podaj pełną datę.';
    const [year, month, day] = event.value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return 'Ta data nie istnieje w kalendarzu.';
    return event.value > todayIso ? 'Data nie może być z przyszłości.' : '';
  }

  function age(birth, death) {
    if (!birth || !death || birth.precision !== 'date' || death.precision !== 'date') return null;
    const [by, bm, bd] = birth.value.split('-').map(Number);
    const [dy, dm, dd] = death.value.split('-').map(Number);
    return dy - by - (dm < bm || (dm === bm && dd < bd) ? 1 : 0);
  }

  function niceDate(event) {
    return event.precision === 'year' ? event.value : new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${event.value}T12:00:00Z`));
  }

  function dateLine() {
    const birth = eventDate('birth'), death = eventDate('death');
    const years = age(birth, death);
    const ageText = $('#demo-age').checked && years !== null && years >= 0 ? ` · ${years} lat` : '';
    return `${birth ? `Ur. ${niceDate(birth)}` : ''}${birth && death ? ' · ' : ''}${death ? `Zm. ${niceDate(death)}` : ''}${ageText}`;
  }

  function setError(id, message) {
    const element = $(`#${id}-error`);
    element.textContent = message;
    element.hidden = !message;
  }

  function validateStepOne() {
    const name = $('#demo-name').value.trim();
    const birth = eventDate('birth'), death = eventDate('death');
    const birthIssue = issue(birth), deathIssue = issue(death);
    let deathOrderIssue = '';
    if (!birthIssue && !deathIssue && birth && death && (death.value.slice(0, 4) < birth.value.slice(0, 4) || (birth.precision === 'date' && death.precision === 'date' && death.value < birth.value))) deathOrderIssue = 'Data śmierci nie może poprzedzać daty urodzenia.';
    setError('name', name.length < 2 ? 'Podaj imię — co najmniej dwa znaki.' : '');
    setError('birth', birthIssue);
    setError('death', deathIssue || deathOrderIssue);
    if (imageUrl && !photoData) setError('photo', 'Poczekaj na przygotowanie zdjęcia albo je usuń.');
    return name.length >= 2 && !birthIssue && !deathIssue && !deathOrderIssue && (!imageUrl || !!photoData);
  }

  function validateStepTwo() {
    const error = $('input[name="prayer"]:checked').value === 'own' && !$('#demo-prayer').value.trim() ? 'Wpisz własną modlitwę albo wybierz inną opcję.' : '';
    setError('prayer', error);
    return !error;
  }

  function shorten(value, limit) {
    if (value.length <= limit) return value;
    const cut = value.lastIndexOf(' ', limit);
    return `${value.slice(0, cut > limit / 2 ? cut : limit).trimEnd()}…`;
  }

  function syncMotion() {
    const burning = $('input[name="candle"]:checked').value === 'on';
    scene.classList.toggle('is-burning', burning);
    scene.classList.toggle('is-animated', burning && !paused && !reducedMotion.matches && inView && document.visibilityState === 'visible');
    photo.setAttribute('aria-label', burning ? 'Fotograficzna scena pamięci z zapaloną symboliczną świecą' : 'Fotograficzna scena pamięci z niezapalonym zniczem');
    for (const selector of ['.memorial-lit-photo', '.memorial-flame-patch', '.memorial-background-lights']) $(selector).hidden = !burning;
    motionButton.hidden = !burning || reducedMotion.matches;
    motionButton.setAttribute('aria-label', paused ? 'Wznów animację sceny' : 'Wstrzymaj animację sceny');
    $('#motion-label').textContent = paused ? 'Wznów ruch' : 'Wstrzymaj ruch';
  }

  function update() {
    const name = $('#demo-name').value.trim() || 'Imię bliskiej osoby';
    const words = $('#demo-dedication').value.trim() || 'W ciszy i wdzięczności zachowujemy pamięć.';
    const signature = $('#demo-signature').value.trim();
    const birth = eventDate('birth'), death = eventDate('death');
    const years = age(birth, death);
    $('#age-row').hidden = years === null || years < 0;
    if (years !== null && years >= 0) $('#age-value').textContent = String(years);
    const dates = dateLine();
    $('#scene-name').textContent = shorten(name, 34);
    $('#scene-dedication').textContent = shorten(words, 85);
    $('#scene-dates').textContent = dates;
    $('#scene-dates').hidden = !dates;
    $('#scene-signature').textContent = signature ? `Od: ${signature}` : '';
    $('#scene-signature').hidden = !signature;
    $('#scene-access').textContent = $('input[name="visibility"]:checked').value === 'private' ? 'Tylko dla właściciela' : $('input[name="visibility"]:checked').value === 'public' ? 'Publiczna galeria' : 'Dostęp przez link';
    $('#full-words').textContent = words;
    $('#full-words').hidden = words.length <= 85;
    const prayer = $('input[name="prayer"]:checked').value;
    $('#demo-prayer').hidden = prayer !== 'own';
    $('#full-prayer').textContent = prayer === 'eternal_rest' ? eternalRest : prayer === 'own' ? $('#demo-prayer').value : '';
    $('#full-prayer').hidden = prayer === 'none';
    $('#dedication-count').textContent = String($('#demo-dedication').value.length);
    scene.classList.toggle('has-long-copy', name.length > 34 || words.length > 85);
    $('#summary-name').textContent = name;
    $('#summary-dates').textContent = dates;
    $('#summary-dates-row').hidden = !dates;
    $('#summary-words').textContent = $('#demo-dedication').value.trim();
    $('#summary-words-row').hidden = !$('#demo-dedication').value.trim();
    syncMotion();
  }

  function setStep(next) {
    step = next;
    $$('.creator-steps button').forEach((button) => { if (Number(button.dataset.step) === next) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    $$('[data-panel]').forEach((panel) => { panel.hidden = Number(panel.dataset.panel) !== next; });
    $('.creator-layout').dataset.step = String(next);
    $('#step-back').hidden = next === 1;
    $('#step-next').hidden = next === 3;
    update();
  }

  function drawPhoto() {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 750;
    const context = canvas.getContext('2d');
    if (!context) { setError('photo', 'Nie udało się przygotować zdjęcia w tej przeglądarce.'); return; }
    const zoom = Number($('#demo-zoom').value), x = Number($('#demo-x').value), y = Number($('#demo-y').value);
    const scale = Math.max(600 / image.naturalWidth, 750 / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    context.drawImage(image, (600 - width) * (x + 100) / 200, (750 - height) * (y + 100) / 200, width, height);
    photoData = canvas.toDataURL('image/webp', .82);
    if (!/^data:image\/(?:webp|png);base64,/.test(photoData) || photoData.length > 4_000_000) { photoData = null; setError('photo', 'Zdjęcie jest zbyt duże po przygotowaniu. Wybierz inny plik.'); return; }
    $('#crop-image').src = photoData;
    $('#portrait-image').setAttribute('href', photoData);
    $('.memorial-portrait').removeAttribute('hidden');
    $('.memorial-foreground').hidden = false;
    $('.memorial-empty-frame').hidden = true;
    $('#photo-tools').hidden = false;
    setError('photo', '');
  }

  $('#demo-photo').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('photo', 'Wybierz zdjęcie JPG, PNG lub WebP do 10 MB.'); return; }
    const url = URL.createObjectURL(file);
    try {
      const nextImage = new Image(); nextImage.src = url; await nextImage.decode();
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageUrl = url; image = nextImage;
      $('#demo-zoom').value = '1'; $('#demo-x').value = '0'; $('#demo-y').value = '0';
      drawPhoto();
    } catch { URL.revokeObjectURL(url); setError('photo', 'Nie udało się odczytać zdjęcia. Wybierz inny plik.'); }
  });
  $('#photo-reset').addEventListener('click', () => { if (imageUrl) URL.revokeObjectURL(imageUrl); imageUrl = null; image = null; photoData = null; $('#photo-tools').hidden = true; $('.memorial-portrait').setAttribute('hidden', ''); $('.memorial-foreground').hidden = true; $('.memorial-empty-frame').hidden = false; $('#portrait-image').removeAttribute('href'); setError('photo', ''); });
  for (const id of ['demo-zoom', 'demo-x', 'demo-y']) $(`#${id}`).addEventListener('input', drawPhoto);
  for (const kind of ['birth', 'death']) {
    $(`#demo-${kind}-precision`).addEventListener('change', (event) => { const input = $(`#demo-${kind}`); input.value = ''; input.type = event.target.value === 'date' ? 'date' : 'text'; input.inputMode = event.target.value === 'year' ? 'numeric' : ''; input.placeholder = event.target.value === 'year' ? 'np. 1948' : ''; input.maxLength = event.target.value === 'year' ? 4 : 20; setError(kind, ''); update(); });
  }
  $$('[data-inspiration]').forEach(button => button.addEventListener('click', () => { $('#demo-dedication').value = inspirations[button.dataset.inspiration]; update(); }));
  $$('.creator-form input:not([type="file"]):not([type="range"]),.creator-form textarea,.creator-form select').forEach(input => { input.addEventListener('input', update); input.addEventListener('change', update); });
  $('#step-next').addEventListener('click', () => { if (step === 1 && !validateStepOne()) return; if (step === 2 && !validateStepTwo()) return; setStep(step + 1); });
  $('#step-back').addEventListener('click', () => setStep(step - 1));
  $$('.creator-steps button').forEach(button => button.addEventListener('click', () => { const next = Number(button.dataset.step); if (next > 1 && !validateStepOne()) { setStep(1); return; } if (next > 2 && !validateStepTwo()) { setStep(2); return; } setStep(next); }));
  $('#show-final').addEventListener('click', () => { if (!validateStepOne() || !validateStepTwo()) return; $('.memorial-creator').classList.add('is-final'); $('.creator-form').hidden = true; $('.creator-steps').hidden = true; $('#final-result').hidden = false; $('.creator-preview-heading span').textContent = 'Pełna strona pamięci'; $('.creator-preview').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#edit-again').addEventListener('click', (event) => { event.preventDefault(); $('.memorial-creator').classList.remove('is-final'); $('.creator-form').hidden = false; $('.creator-steps').hidden = false; $('#final-result').hidden = true; $('.creator-preview-heading span').textContent = 'Zmienia się wraz z formularzem'; $('#creator').scrollIntoView({ behavior: 'smooth' }); });
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reducedMotion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncMotion(); }, { threshold: 0.05 }).observe(scene);
  window.addEventListener('pagehide', () => { if (imageUrl) URL.revokeObjectURL(imageUrl); });
  update();
})();
