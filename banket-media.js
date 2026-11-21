(() => {
  const hasHover = matchMedia('(hover: hover) and (pointer: fine)');
  const wide = matchMedia('(min-width: 741px)');

  document.querySelectorAll('.banquet-leaves').forEach(list => {
    const leaves = Array.from(list.querySelectorAll('.banquet-leaf'));
    function reveal(leaf) {
      leaves.forEach(item => { item.open = item === leaf; });
    }
    leaves.forEach(leaf => {
      const summary = leaf.querySelector('summary');
      // A scroll or a late-loading font can move another row under a stationary
      // pointer. Keep the selected sheet until the visitor moves the pointer.
      summary.addEventListener('pointermove', event => {
        if (wide.matches && hasHover.matches && event.pointerType !== 'touch') reveal(leaf);
      });
      summary.addEventListener('focus', () => {
        if (wide.matches && summary.matches(':focus-visible')) reveal(leaf);
      });
      summary.addEventListener('click', event => {
        if (wide.matches) { event.preventDefault(); reveal(leaf); }
      });
    });
    wide.addEventListener('change', () => {
      if (wide.matches && !leaves.some(item => item.open)) reveal(leaves[0]);
    });
  });

  const viewer = document.querySelector('.banquet-viewer');
  const title = viewer.querySelector('h2');
  const scroll = viewer.querySelector('.sheet-scroll');
  const image = scroll.querySelector('img');
  const zoom = viewer.querySelector('.sheet-size');
  const setSize = large => {
    scroll.classList.toggle('is-enlarged', large);
    zoom.setAttribute('aria-pressed', String(large));
    zoom.textContent = large ? 'Уместить' : 'Увеличить';
    scroll.scrollTo(0, 0);
  };
  document.querySelectorAll('.banquet-sheet').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.querySelector('img');
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      title.textContent = button.dataset.sheetTitle;
      setSize(false);
      viewer.showModal();
      viewer.querySelector('.sheet-close').focus();
    });
  });
  const toggleSize = () => setSize(!scroll.classList.contains('is-enlarged'));
  zoom.addEventListener('click', toggleSize);
  image.addEventListener('click', toggleSize);
  viewer.querySelector('.sheet-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
})();
