(() => {
  const track = document.querySelector('.hall-track');
  const scene = track.querySelector('.hall-scene');
  const layout = track.querySelector('.hall-layout');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const passages = Array.from(track.querySelectorAll('.hall-passages p'), paragraph => {
    const words = paragraph.textContent.trim().split(/\s+/u);
    const spans = words.map(word => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    });
    paragraph.replaceChildren(...spans.flatMap((span, i) => i ? [' ', span] : [span]));
    return {paragraph, spans};
  });

  let stops = [];
  let travel = 0;
  let active = -1;
  let frame = 0;
  let visible = true;
  const clamp = n => Math.max(0, Math.min(1, n));

  function paint() {
    frame = 0;
    if (!travel) return;
    const offset = Math.max(0, Math.min(travel, -track.getBoundingClientRect().top));
    const index = stops.findIndex(stop => offset <= stop);
    const start = index ? stops[index - 1] : 0;
    const progress = clamp((offset - start) / (stops[index] - start));
    if (index !== active) {
      if (active >= 0) passages[active].paragraph.classList.remove('is-current');
      passages[index].paragraph.classList.add('is-current');
      active = index;
    }
    const {spans} = passages[index];
    // Allow a short pause with every word fully inked before advancing.
    const ink = .12 + .99 * progress;
    spans.forEach((word, i) => {
      word.style.opacity = (.45 + .55 * clamp((ink - i / spans.length) * 8)).toFixed(3);
    });
    track.style.setProperty('--hall-progress', String(offset / travel));
  }

  function schedule() {
    if (visible && travel && !frame) frame = requestAnimationFrame(paint);
  }

  function size() {
    track.classList.toggle('is-pinned', !reduced.matches);
    const viewport = scene.clientHeight;
    const css = getComputedStyle(scene);
    const fits = layout.offsetHeight + parseFloat(css.paddingTop) + parseFloat(css.paddingBottom) <= viewport + 1;
    if (reduced.matches || !fits) {
      track.classList.remove('is-pinned');
      for (const {paragraph, spans} of passages) {
        paragraph.classList.remove('is-current');
        spans.forEach(word => word.style.removeProperty('opacity'));
      }
      active = -1;
      travel = 0;
      return;
    }
    travel = 0;
    stops = passages.map(({spans}) => {
      travel += Math.round(Math.max(viewport * .44, Math.min(viewport * 1.1, spans.length * 14)));
      return travel;
    });
    track.style.setProperty('--hall-travel', travel + 'px');
    paint();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, {rootMargin:'150px'}).observe(track);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', size);
  reduced.addEventListener('change', size);
  document.fonts.ready.then(size);
  size();
})();
