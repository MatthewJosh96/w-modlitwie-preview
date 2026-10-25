import { controlsForFace, detectPortraitFaces, faceThumbnail, preparePortrait } from './portrait-vision/portrait-processing.mjs?v=8808932e';

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
  const initials = name => {
    const words = name.normalize('NFC').trim().match(/\p{L}[\p{L}\p{M}]*/gu) || [];
    while (words.length > 1 && ['śp','ks','s','o','bp'].includes(words[0].toLocaleLowerCase('pl-PL'))) words.shift();
    return words.length ? [Array.from(words[0])[0], words.length > 1 ? Array.from(words[words.length - 1])[0] : ''].join('').toLocaleUpperCase('pl-PL') : '';
  };
  let step = 1;
  let image = null;
  let selection = 0;
  let manualCropTouched = false;
  let photoData = null;
  let photoChoice = null;
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
    const photoIssue = !photoChoice ? 'Wybierz, czy chcesz dodać zdjęcie.' : photoChoice === 'with' && !photoData ? image ? 'Poczekaj na przygotowanie zdjęcia.' : 'Wybierz zdjęcie albo zaznacz „Bez zdjęcia”.' : '';
    setError('photo', photoIssue);
    return name.length >= 2 && !birthIssue && !deathIssue && !deathOrderIssue && !photoIssue;
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
    const letters = initials($('#demo-name').value);
    $('#scene-initials').textContent = letters;
    $('#scene-initials').hidden = photoChoice !== 'without' || !letters;
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
    const scale = Math.max(600 / image.width, 750 / image.height) * zoom;
    const width = image.width * scale, height = image.height * scale;
    context.drawImage(image, (600 - width) * (x + 100) / 200, (750 - height) * (y + 100) / 200, width, height);
    photoData = canvas.toDataURL('image/webp', .82);
    if (!/^data:image\/(?:webp|png);base64,/.test(photoData) || photoData.length > 4_000_000) { photoData = null; setError('photo', 'Zdjęcie jest zbyt duże po przygotowaniu. Wybierz inny plik.'); return; }
    $('#crop-image').src = photoData;
    $('#portrait-image').setAttribute('href', photoData);
    $('.memorial-portrait').removeAttribute('hidden');
    $('.memorial-foreground').hidden = false;
    $('.memorial-no-frame').hidden = true;
    $('#photo-tools').hidden = false;
    $('.creator-photo-pick strong').textContent = 'Zmień zdjęcie';
    setError('photo', '');
  }

  // Recreate the native control after dismissal so a cancelled iOS picker cannot retain state.
  function renewPhotoPicker() {
    const previous = $('#demo-photo');
    const fresh = previous.cloneNode(false);
    fresh.value = '';
    previous.replaceWith(fresh);
    bindPhotoPicker(fresh);
  }
  function bindPhotoPicker(input) {
    input.addEventListener('click', () => { input.value = ''; });
    input.addEventListener('cancel', renewPhotoPicker);
    input.addEventListener('change', selectPhoto);
  }
  bindPhotoPicker($('#demo-photo'));
  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    renewPhotoPicker();
    if (!file) return;
    const current = ++selection;
    manualCropTouched = false;
    const hint = $('#photo-hint');
    hint.textContent = 'Przygotowujemy zdjęcie…'; hint.hidden = false;
    $('#face-choices').hidden = true;
    setError('photo', '');
    try {
      const prepared = await preparePortrait(file);
      if (current !== selection) return;
      image = prepared;
      choosePhoto('with');
      $('#demo-zoom').value = '1'; $('#demo-x').value = '0'; $('#demo-y').value = '0';
      drawPhoto();
      hint.textContent = 'Szukamy twarzy, aby zaproponować kadr…';
      try {
        const faces = await Promise.race([detectPortraitFaces(prepared, './portrait-vision'), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))]);
        if (current !== selection) return;
        if (faces.length === 1 && !manualCropTouched) { focusFace(faces[0]); hint.textContent = 'Zaproponowaliśmy kadr twarzy i ramion. Możesz go poprawić suwakami.'; }
        else if (faces.length === 1) { const choices = $('#face-choices'); choices.replaceChildren(); const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Zastosuj proponowany kadr'; button.addEventListener('click', () => { focusFace(faces[0]); hint.textContent = 'Możesz poprawić kadr suwakami.'; }); choices.append(button); choices.hidden = false; hint.textContent = 'Wykryliśmy twarz. Możesz zastosować proponowany kadr.'; }
        else if (faces.length > 1) {
          hint.textContent = 'Wykryliśmy kilka osób. Wybierz twarz do wykadrowania.';
          const choices = $('#face-choices'); choices.replaceChildren(); choices.hidden = false;
          faces.forEach((face, index) => { const button = document.createElement('button'); button.type = 'button'; const thumb = document.createElement('img'); thumb.src = faceThumbnail(prepared, face); thumb.alt = ''; thumb.width = 48; thumb.height = 48; button.append(thumb, `Osoba ${index + 1}`); button.addEventListener('click', () => { focusFace(face); hint.textContent = 'Możesz poprawić kadr suwakami.'; }); choices.append(button); });
        } else hint.textContent = 'Nie znaleźliśmy twarzy. Ustaw kadr ręcznie suwakami.';
      } catch { if (current === selection) hint.textContent = 'Automatyczne kadrowanie jest niedostępne. Ustaw kadr ręcznie suwakami.'; }
    } catch (error) { if (current === selection) { hint.hidden = true; setError('photo', error instanceof Error ? error.message : 'Nie udało się odczytać zdjęcia.'); } }
  }
  function focusFace(face) {
    if (!image) return;
    const crop = controlsForFace(face, image.width, image.height);
    $('#demo-zoom').value = String(crop.zoom); $('#demo-x').value = String(crop.x); $('#demo-y').value = String(crop.y);
    drawPhoto();
  }
  function choosePhoto(choice) {
    if (choice === 'without') { selection++; $('#face-choices').hidden = true; $('#photo-hint').hidden = true; }
    photoChoice = choice;
    $$('[data-photo-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.photoChoice === choice)));
    $('#photo-input-area').hidden = choice !== 'with';
    $('.memorial-portrait').toggleAttribute('hidden', choice !== 'with' || !photoData);
    $('.memorial-foreground').hidden = choice !== 'with' || !photoData;
    $('.memorial-no-frame').hidden = choice !== 'without';
    const letters = initials($('#demo-name').value);
    $('#scene-initials').textContent = letters;
    $('#scene-initials').hidden = choice !== 'without' || !letters;
    setError('photo', '');
  }
  $$('[data-photo-choice]').forEach(button => button.addEventListener('click', () => choosePhoto(button.dataset.photoChoice)));
  $('#photo-reset').addEventListener('click', () => choosePhoto('without'));
  for (const id of ['demo-zoom', 'demo-x', 'demo-y']) $(`#${id}`).addEventListener('input', () => { manualCropTouched = true; drawPhoto(); });
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
  choosePhoto('without');
  update();
})();
