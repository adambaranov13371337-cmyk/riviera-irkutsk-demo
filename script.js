const navButton = document.querySelector('.navtoggle');
const allSections = document.querySelector('#fullnav');
function setNavigation(open) {
  allSections.hidden = !open;
  navButton.setAttribute('aria-expanded',String(open));
}
navButton.addEventListener('click',()=>setNavigation(allSections.hidden));
document.addEventListener('click',event=>{
  if (!navButton.contains(event.target) && (!allSections.contains(event.target) || event.target.closest('a'))) setNavigation(false);
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && !allSections.hidden){setNavigation(false);navButton.focus();}
});
const slides = Array.from(document.querySelectorAll('[data-slide]'));
const frames = document.querySelectorAll('.heroframe');
const captions = document.querySelectorAll('.caption');
function setSlide(index) {
  slides.forEach((button,i)=>{
    button.setAttribute('aria-pressed',String(i===index));
    captions[i].hidden = frames[i].hidden = i!==index;
  });
}
slides.forEach((button,i)=>button.addEventListener('click',()=>setSlide(i)));
const gallery = document.querySelector('.gallerygrid');
const filters = [...document.querySelectorAll('[data-filter]')];
filters.forEach(button=>button.addEventListener('click',()=>{
  const selection=button.dataset.filter;
  filters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  gallery.querySelectorAll('.photo').forEach(photo=>{photo.hidden=selection!=='Все' && selection!==photo.dataset.tag;});
}));
const dialog=document.querySelector('.lightbox');
let album=[];
let slide=0;
function showPhoto(index) {
  slide=(index+album.length)%album.length;
  const photo=album[slide], photoImage=photo.querySelector('img'),out=dialog.querySelector('img');
  out.src=photo.dataset.image;
  out.alt=photoImage?.alt || 'Фотография ресторана';
  dialog.querySelector('span').textContent=(slide+1)+' / '+album.length;
  dialog.querySelector('.prev').hidden=dialog.querySelector('.next').hidden=album.length<2;
}
document.querySelectorAll('button.photo[data-image]').forEach(link=>link.addEventListener('click',()=>{
  album=Array.from((link.closest('.gallerygrid,.strip') || link.parentElement).querySelectorAll('button.photo[data-image]:not([hidden])'));
  showPhoto(album.indexOf(link));
  dialog.showModal();
  dialog.querySelector('.close').focus();
}));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.querySelector('.next').addEventListener('click',()=>showPhoto(slide+1));
dialog.querySelector('.prev').addEventListener('click',()=>showPhoto(slide-1));
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
dialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight')showPhoto(slide+1);
  if(event.key==='ArrowLeft')showPhoto(slide-1);
});
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}
    });
  },{threshold:.08});
  document.querySelectorAll('.story, .menucards>a, .gallery h2, .booking h2, .doc, .product').forEach(el=>observer.observe(el));
}

// Preserve native touch and trackpad momentum. Ease only the discrete steps
// of a mouse wheel; align a nearby section once the gesture has finished.
function enableSectionScrolling() {
  const sections = [...document.querySelectorAll('main > section')];
  if (!sections[0]?.matches('.hero')) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let gestureStart = null;
  let target = null;
  let frame = 0;
  let timer = 0;
  let lastTime = 0;
  let touching = false;

  function reset() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    frame = 0;
    target = null;
    gestureStart = null;
  }

  function settle() {
    if (target !== null || touching || gestureStart === null) return;
    const from = gestureStart;
    reset();
    if (reduced.matches || document.querySelector('dialog[open]')) return;
    const range = Math.min(110, innerHeight * 0.12);
    // A small movement away from an aligned section must let the reader leave it.
    const offsets = sections.map(section => section.getBoundingClientRect().top)
      .filter(offset => Math.abs(offset) <= range && Math.abs(offset) > 1
        && Math.abs(scrollY + offset - from) > range);
    offsets.sort((a, b) => Math.abs(a) - Math.abs(b));
    if (offsets.length) scrollBy({top: offsets[0], behavior: 'smooth'});
  }

  function scheduleSettle() {
    clearTimeout(timer);
    timer = setTimeout(settle, 160);
  }

  function advance(now) {
    const elapsed = Math.min(48, now - lastTime);
    lastTime = now;
    target = Math.min(target, Math.max(0, document.documentElement.scrollHeight - innerHeight));
    const distance = target - scrollY;
    if (Math.abs(distance) <= 2) {
      scrollTo({top: target, behavior: 'instant'});
      target = null;
      frame = 0;
      scheduleSettle();
      return;
    }
    const step = Math.max(1, Math.abs(distance) * (1 - Math.exp(-elapsed / 58)));
    scrollTo({top: scrollY + Math.sign(distance) * step, behavior: 'instant'});
    frame = requestAnimationFrame(advance);
  }

  window.addEventListener('wheel', event => {
    if (reduced.matches || !event.cancelable || event.defaultPrevented || event.ctrlKey ||
        event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        document.querySelector('dialog[open]') || event.target.closest?.('select,textarea,iframe,[data-native-scroll]')) {
      reset();
      return;
    }
    gestureStart ??= scrollY;
    const delta = event.deltaY;
    const stepped = event.deltaMode === 1 ||
      (event.deltaMode === 0 && Math.abs(delta) >= 100 && (delta % 100 === 0 || delta % 120 === 0));
    if (!stepped) {
      cancelAnimationFrame(frame);
      frame = 0;
      target = null;
      scheduleSettle();
      return;
    }
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    target = Math.max(0, Math.min(max, (target ?? scrollY) + delta * (event.deltaMode === 1 ? 28 : 1)));
    event.preventDefault();
    if (!frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(advance);
    }
  }, {passive: false});

  window.addEventListener('scroll', () => {
    if (gestureStart !== null && target === null && !touching) scheduleSettle();
  }, {passive: true});
  window.addEventListener('pointerdown', reset, {passive: true});
  window.addEventListener('keydown', reset);
  window.addEventListener('touchstart', () => {
    reset();
    touching = true;
    if (!reduced.matches && !document.querySelector('dialog[open]')) gestureStart = scrollY;
  }, {passive: true});
  window.addEventListener('touchend', () => { touching = false; scheduleSettle(); }, {passive: true});
  window.addEventListener('touchcancel', () => { touching = false; reset(); }, {passive: true});
  reduced.addEventListener('change', reset);
}
enableSectionScrolling();

