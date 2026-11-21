// Reuse the existing buttons so native filtering, focus and the lightbox keep their order.
for (const grid of document.querySelectorAll('.gallery > .gallerygrid')) {
  const cards = Array.from(grid.querySelectorAll('.photo'));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fractions = [-.88, .58, -.30, 1];
  const columns = ['--column-a', '--column-b', '--column-c', '--column-d'];
  let visibleCards = [];
  let columnCount = 4;
  let lastScroll = window.scrollY;
  let drift = 0;
  let frame = 0;
  let onscreen = false;

  function schedule() {
    if (!frame && onscreen && !motion.matches) frame = requestAnimationFrame(paint);
  }

  function measure() {
    columnCount = Number(getComputedStyle(grid).getPropertyValue('--column-count'));
    visibleCards = cards.filter(card => !card.hidden).map((card, index) => {
      card.dataset.column = String(index % columnCount);
      return { card, top: card.offsetTop, height: card.offsetHeight };
    });
    schedule();
  }

  function paint() {
    frame = 0;
    if (!onscreen || motion.matches) return;
    const scroll = window.scrollY;
    const delta = Math.min(75, Math.max(-75, scroll - lastScroll));
    lastScroll = scroll;
    drift = .82 * drift + delta * .15;
    const rect = grid.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1,
      (window.innerHeight - rect.height / 2 - rect.top) / (window.innerHeight + rect.height) * 2));
    const mobile = columnCount === 2;
    // Adjacent columns lag the page by different amounts, then settle as scrolling stops.
    const distance = mobile
      ? Math.max(-17, Math.min(17, 6 + progress * 8 + drift * .5))
      : Math.max(-37, Math.min(37, 12 + progress * 14 + drift * 1.1));
    fractions.forEach((fraction, index) => {
      grid.style.setProperty(columns[index], (fraction * distance).toFixed(2) + 'px');
    });
    for (const { card, top, height } of visibleCards) {
      const projectedTop = rect.top + top;
      if (projectedTop > innerHeight + 70 || projectedTop + height < -70) continue;
      const centered = Math.min(1, Math.max(-1,
        (innerHeight / 2 - projectedTop - height / 2) / ((innerHeight + height) / 2)));
      card.style.setProperty('--pan', (centered * height * .069).toFixed(2) + 'px');
    }
    if (Math.abs(drift) > .15) schedule();
  }

  new ResizeObserver(measure).observe(grid);
  new MutationObserver(measure).observe(grid, {
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden']
  });
  new IntersectionObserver(([entry]) => {
    onscreen = entry.isIntersecting;
    lastScroll = window.scrollY;
    drift = 0;
    schedule();
  }, { rootMargin: '110px 0px' }).observe(grid);
  motion.addEventListener('change', schedule);
  window.addEventListener('scroll', schedule, { passive: true });
  measure();
}
