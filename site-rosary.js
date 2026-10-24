(() => {
  const root = document.querySelector('[data-rosary]');
  if (!root) return;
  fetch(root.dataset.source).then(response => response.json()).then(sets => {
    const select = root.querySelector('select');
    const output = root.querySelector('.static-step');
    const progress = root.querySelector('[data-progress]');
    const previous = root.querySelector('[data-previous]');
    const next = root.querySelector('[data-next]');
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Warsaw' }).format(new Date());
    select.value = ({ Mon:'radosne', Sat:'radosne', Tue:'bolesne', Fri:'bolesne', Thu:'swiatla', Wed:'chwalebne', Sun:'chwalebne' })[weekday];
    let index = 0;
    try {
      const saved = JSON.parse(localStorage.getItem('wmodlitwie-static-rosary') || 'null');
      const chosen = sets.find(set => set.key === saved?.key);
      if (chosen) { select.value = chosen.key; index = Math.max(0, Math.min(chosen.steps.length, Number(saved.index) || 0)); }
    } catch {}
    function render() {
      const set = sets.find(item => item.key === select.value);
      const step = set.steps[index];
      output.replaceChildren();
      const title = document.createElement('h2');
      title.textContent = step?.title || 'Dziękujemy za wspólną modlitwę';
      output.append(title);
      if (step) {
        if (step.decade) { const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'Dziesiątka ' + step.decade + (step.bead ? ' · paciorek ' + step.bead : ''); output.prepend(eyebrow); }
        for (const paragraph of step.body) { const p = document.createElement('p'); p.textContent = paragraph; output.append(p); }
        if (step.mystery && step.kind !== 'mystery') { const p = document.createElement('p'); p.className = 'status-text'; p.textContent = step.mystery.title; output.append(p); }
        if (step.optional) { const p = document.createElement('p'); p.className = 'status-tag'; p.textContent = 'Modlitwa opcjonalna'; output.append(p); }
      } else { const p = document.createElement('p'); p.textContent = 'Pozostań przez chwilę w ciszy. Zabierz tę uważność w swój dzień.'; output.append(p); }
      previous.disabled = index === 0;
      next.textContent = !step ? 'Rozpocznij ponownie' : index === set.steps.length - 1 ? 'Zakończ' : 'Dalej →';
      progress.textContent = !step ? 'Ukończono' : 'Krok ' + (index + 1) + ' z ' + set.steps.length;
      try { localStorage.setItem('wmodlitwie-static-rosary', JSON.stringify({ key:set.key, index })); } catch {}
    }
    select.addEventListener('change', () => { index = 0; render(); });
    previous.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
    next.addEventListener('click', () => { const set = sets.find(item => item.key === select.value); index = index >= set.steps.length ? 0 : index + 1; render(); });
    render();
  }).catch(() => { root.textContent = 'Nie udało się wczytać różańca.'; });
})();