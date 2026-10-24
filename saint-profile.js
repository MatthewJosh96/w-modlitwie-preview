(() => {
  const key = 'w-modlitwie-favorite-saints';
  const favorite = document.querySelector('[data-saint-favorite]');
  const share = document.querySelector('[data-saint-share]');
  const feedback = document.querySelector('[data-saint-feedback]');
  const label = document.querySelector('[data-favorite-label]');
  if (!favorite || !share || !feedback || !label) return;
  const slug = 'franciszek-z-asyzu';
  const read = () => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const paint = () => { const saved = read().includes(slug); favorite.setAttribute('aria-pressed', String(saved)); label.textContent = saved ? 'W ulubionych' : 'Dodaj do ulubionych'; };
  paint();
  favorite.addEventListener('click', () => { try { const current = read(); const saved = current.includes(slug); localStorage.setItem(key, JSON.stringify(saved ? current.filter(item => item !== slug) : [...current, slug])); paint(); feedback.textContent = saved ? 'Usunięto z ulubionych.' : 'Dodano do ulubionych na tym urządzeniu.'; } catch { feedback.textContent = 'Nie udało się zapisać na tym urządzeniu.'; } });
  share.addEventListener('click', async () => { const data = { title: 'Św. Franciszek z Asyżu · W Modlitwie', url: location.href }; try { if (navigator.share) { await navigator.share(data); feedback.textContent = 'Udostępniono stronę.'; } else if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(data.url); feedback.textContent = 'Skopiowano link do strony.'; } else { feedback.textContent = 'Link do skopiowania: ' + data.url; } } catch (error) { if (error && error.name !== 'AbortError') feedback.textContent = 'Link do skopiowania: ' + data.url; } });
})();