(() => {
  'use strict';

  const scene = document.querySelector('.memorial-scene');
  const photo = document.querySelector('.memorial-photo');
  const litPhoto = document.querySelector('.memorial-lit-photo');
  const flamePatch = document.querySelector('.memorial-flame-patch');
  const backgroundLights = document.querySelector('.memorial-background-lights');
  const motionButton = document.getElementById('motion-button');
  const motionLabel = document.getElementById('motion-label');
  const activeButton = document.getElementById('state-active');
  const expiredButton = document.getElementById('state-expired');
  const stateMessage = document.getElementById('state-message');
  const dateMessage = document.getElementById('date-message');
  const photoInput = document.getElementById('photo-input');
  const photoReset = document.getElementById('photo-reset');
  const photoError = document.getElementById('photo-error');
  const portraitImage = document.getElementById('portrait-image');
  const shareMessage = document.getElementById('share-message');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaultPortrait = portraitImage.getAttribute('href');
  let active = true;
  let paused = false;
  let inView = true;
  let portraitUrl = null;

  function syncScene() {
    const burning = active;
    const animated = burning && !paused && !reducedMotion.matches && inView && document.visibilityState === 'visible';
    scene.classList.toggle('is-burning', burning);
    scene.classList.toggle('is-animated', animated);
    litPhoto.hidden = !burning;
    flamePatch.hidden = !burning;
    backgroundLights.hidden = !burning;
    photo.setAttribute('aria-label', burning
      ? 'Fotograficzna scena pamięci z zapaloną symboliczną świecą'
      : 'Fotograficzna scena pamięci z niezapalonym zniczem');
    motionButton.hidden = !burning || reducedMotion.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Wznów animację sceny' : 'Wstrzymaj animację sceny');
    motionLabel.textContent = paused ? 'Wznów ruch' : 'Wstrzymaj ruch';
    activeButton.setAttribute('aria-pressed', String(active));
    expiredButton.setAttribute('aria-pressed', String(!active));
    stateMessage.textContent = burning
      ? 'Twoja symboliczna świeca płonie.'
      : 'Okres wyświetlania świecy zakończył się. Pamięć i modlitwa mogą trwać dalej.';
    dateMessage.textContent = burning
      ? 'Przykładowy aktywny okres wyświetlania świecy.'
      : 'Przykładowy zakończony okres wyświetlania świecy.';
  }

  activeButton.addEventListener('click', () => { active = true; syncScene(); });
  expiredButton.addEventListener('click', () => { active = false; syncScene(); });
  motionButton.addEventListener('click', () => { paused = !paused; syncScene(); });
  reducedMotion.addEventListener('change', syncScene);
  document.addEventListener('visibilitychange', syncScene);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncScene();
    }, { threshold: 0.05 });
    observer.observe(scene);
  }

  function showPhotoError(message) {
    photoError.textContent = message;
    photoError.hidden = !message;
  }

  photoInput.addEventListener('change', async () => {
    showPhotoError('');
    const file = photoInput.files && photoInput.files[0];
    photoInput.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showPhotoError('Wybierz zdjęcie JPG, PNG lub WebP o rozmiarze do 10 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (portraitUrl) URL.revokeObjectURL(portraitUrl);
      portraitUrl = url;
      portraitImage.setAttribute('href', url);
      photoReset.hidden = false;
    } catch {
      URL.revokeObjectURL(url);
      showPhotoError('Nie udało się odczytać zdjęcia. Wybierz inny plik.');
    }
  });

  photoReset.addEventListener('click', () => {
    if (portraitUrl) URL.revokeObjectURL(portraitUrl);
    portraitUrl = null;
    portraitImage.setAttribute('href', defaultPortrait);
    photoReset.hidden = true;
    showPhotoError('');
  });
  window.addEventListener('pagehide', () => {
    if (portraitUrl) URL.revokeObjectURL(portraitUrl);
  });

  document.getElementById('share-button').addEventListener('click', async () => {
    shareMessage.textContent = '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Podgląd strony pamięci · W Modlitwie', url: window.location.href });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        shareMessage.textContent = 'Link do podglądu skopiowany.';
      } else {
        shareMessage.textContent = 'Skopiuj adres strony z paska przeglądarki.';
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      shareMessage.textContent = 'Nie udało się udostępnić. Skopiuj adres strony z paska przeglądarki.';
    }
  });

  syncScene();
})();
