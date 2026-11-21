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
  out.src=photo.href;
  out.alt=photoImage?.alt || 'Фотография ресторана';
  dialog.querySelector('span').textContent=(slide+1)+' / '+album.length;
  dialog.querySelector('.prev').hidden=dialog.querySelector('.next').hidden=album.length<2;
}
document.querySelectorAll('a.photo').forEach(link=>link.addEventListener('click',event=>{
  if(!dialog.showModal || event.metaKey || event.ctrlKey) return;
  event.preventDefault();
  album=Array.from((link.closest('.gallerygrid,.strip') || link.parentElement).querySelectorAll('a.photo:not([hidden])'));
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

