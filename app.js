'use strict';
/* Lógica de la invitación. Personaliza contenido en datos.js; no necesitas tocar este archivo. */
(() => {
  const d = window.DATOS_INVITACION || {};
  const $ = id => document.getElementById(id);
  const write = (id, value) => { const node=$(id); if (node) node.textContent=String(value ?? ''); };
  const valueOr = (v, alt) => String(v || '').trim() || alt;
  const fullNames = (id, names) => {
    const target = $(id); if (!target) return; target.replaceChildren();
    (Array.isArray(names) ? names : []).forEach(n => {
      const line = document.createElement('span'); line.textContent = n; target.appendChild(line);
    });
  };

  const { bautizo, cumpleanos } = d;
  const nombres = `${cumpleanos.nombreCorto} y ${bautizo.nombreCorto}`;
  write('nombreSobre', nombres);
  write('nombreCumpleanos', cumpleanos.nombrePortada);
  write('nombreBautizo', bautizo.nombrePortada);
  write('tituloCumpleanos', `Mis ${cumpleanos.edad} años`);
  const birthdayTitle = document.getElementById('tituloCumpleanos');
  const birthdayNumber = document.createElement('span');
  birthdayNumber.className = 'hero__age';
  birthdayNumber.textContent = cumpleanos.edad;
  birthdayTitle.replaceChildren('Mis ', birthdayNumber, ' años');
  write('dedicatoria', d.dedicatoria);
  document.title = `${cumpleanos.edad} años de ${cumpleanos.nombreCorto} y bautizo de ${bautizo.nombreCorto} | Invitación`;
  const oracion = $('oracion'); oracion.replaceChildren();
  (Array.isArray(d.oracion) ? d.oracion : []).forEach(line => {
    const p=document.createElement('p');p.textContent=line;oracion.appendChild(p);
  });
  fullNames('padres', d.padres);
  write('tituloPadrinosCumpleanos', `Padrinos de ${cumpleanos.nombreCorto}`);
  fullNames('padrinosCumpleanos', cumpleanos.padrinos);
  write('tituloPadrinosBautizo', `Padrinos de ${bautizo.nombreCorto}`);
  fullNames('padrinosBautizo', bautizo.padrinos);

  // Álbum de recuerdos, con navegación táctil y botones.
  const photos = [...(d.fotos || [])];
  [cumpleanos, bautizo].forEach(girl => {
    if (girl.foto) photos.push({ src: girl.foto, texto: girl.nombrePortada });
  });
  const track = $('fotosCarrusel');
  photos.forEach(photo => {
    const figure = document.createElement('figure');
    figure.className = 'memory';
    for (const edge of ['top', 'bottom']) {
      const strip = document.createElement('span');
      strip.className = 'photo-light-strip photo-light-strip--' + edge;
      strip.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 7; index++) strip.appendChild(document.createElement('i'));
      figure.appendChild(strip);
    }
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.texto || 'Un recuerdo de Nora y Chloe';
    image.loading = 'lazy';
    if (photo.ajuste) image.style.objectFit = photo.ajuste;
    if (photo.posicion) image.style.objectPosition = photo.posicion;
    image.draggable = false;
    image.addEventListener('contextmenu', event => event.preventDefault());
    image.addEventListener('dragstart', event => event.preventDefault());
    const photoWindow = document.createElement('div');
    photoWindow.className = 'memory__window';
    photoWindow.appendChild(image);
    figure.appendChild(photoWindow);
    track.appendChild(figure);
  });
  $('retratos').hidden = !photos.length;
  let photoIndex = 0;
  let orbitPosition = 0;
  let photoAnimation = 0;
  let movingPhoto = false;
  let carouselTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  track.classList.add('memories__track--orbit');
  track.parentElement.classList.add('memories__stage--radial');
  function renderOrbit(position, sideVisibility = 0) {
    const width = track.clientWidth;
    track.style.setProperty('--carousel-reveal', String(sideVisibility));
    track.parentElement.style.setProperty('--scene-visibility', String(sideVisibility));
    const sceneScale = 1 - sideVisibility * .40;
    const stageHeight = track.clientHeight;
    const frameWidth = track.querySelector('.memory')?.offsetWidth || 0;
    const orbitWidth = width * .80 + (track.querySelector('.memory')?.offsetWidth || 0) * .60;
    track.parentElement.style.setProperty('--orbit-width', Math.min(width * 1.18, orbitWidth).toFixed(2) + 'px');
    const depth = Math.min(width * .4, 180);
    track.style.setProperty('--orbit-depth', depth + 'px');
    const baseWidth = Math.min(width * 1.18, orbitWidth);
    const baseImageHeight = Math.min(stageHeight * .24, baseWidth * 793 / 1983);
    const baseCenterY = stageHeight * .76 + baseImageHeight * .34;
    const axisProjection = 1100 / (1100 + depth);
    const axisEndY = stageHeight / 2 + (baseCenterY - stageHeight / 2) / axisProjection;
    track.style.setProperty('--axis-bottom', (stageHeight - axisEndY).toFixed(2) + 'px');
    Array.from(track.querySelectorAll('.memory')).forEach((frame, index) => {
      const angle = photos.length > 1 ? (index - position) * Math.PI * 2 / photos.length : 0;
      const front = (1 - Math.sin(angle)) / 2;
      const spokeRadius = frameWidth * sceneScale / 2;
      const x = Math.cos(angle) * spokeRadius * sideVisibility;
      const y = 0;
      const z = (-depth - Math.sin(angle) * spokeRadius) * sideVisibility;
      frame.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,' + z.toFixed(2) + 'px) rotateY(' + (angle * 180 / Math.PI).toFixed(2) + 'deg) scale(' + sceneScale.toFixed(3) + ')';
      const centered = sideVisibility === 0 ? (Math.abs(Math.sin(angle / 2)) < .0001 ? 1 : 0) : Math.pow(Math.max(0, Math.cos(angle)), 8);
      frame.style.opacity = String((1 - sideVisibility + sideVisibility * (.65 + front * .35)) * (sideVisibility + (1 - sideVisibility) * centered));
      frame.style.zIndex = String(Math.round(front * 100));
      frame.classList.toggle('is-current', index === photoIndex);
      frame.setAttribute('aria-hidden', String(index !== photoIndex));
    });
  }
  function updatePhotoControls() {
    $('fotoPosicion').textContent = photos.length ? (photoIndex + 1) + ' / ' + photos.length : '';
    $('fotoAnterior').disabled = photos.length < 2;
    $('fotoSiguiente').disabled = photos.length < 2;
  }
  function movePhoto(direction) {
    if (movingPhoto || photos.length < 2) return;
    const origin = orbitPosition;
    const destination = origin + direction;
    photoIndex = ((Math.round(destination) % photos.length) + photos.length) % photos.length;
    updatePhotoControls();
    if (reducedMotion.matches) {
      orbitPosition = destination;
      renderOrbit(orbitPosition);
      return;
    }
    movingPhoto = true;
    track.classList.add('is-gliding');
    const started = performance.now();
    function turn(now) {
      const progress = Math.min(1, (now - started) / 5000);
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      orbitPosition = origin + direction * eased;
      const reveal = Math.min(1, progress / .2, (1 - progress) / .2);
      renderOrbit(orbitPosition, Math.max(0, reveal));
      if (progress < 1) photoAnimation = requestAnimationFrame(turn);
      else {
        orbitPosition = destination;
        movingPhoto = false;
        track.classList.remove('is-gliding');
      }
    }
    photoAnimation = requestAnimationFrame(turn);
  }
  function startCarousel() {
    clearInterval(carouselTimer);
    const photoBounds = track.getBoundingClientRect();
    const headingBounds = $('retratos').querySelector('.section-heading').getBoundingClientRect();
    const inView = bounds => bounds.top < window.innerHeight * .95 && bounds.bottom > window.innerHeight * .05;
    if ((!inView(photoBounds) && !inView(headingBounds)) || photos.length < 2 || reducedMotion.matches || document.hidden || !document.body.classList.contains('opened')) return;
    carouselTimer = setInterval(() => movePhoto(1), 11500);
  }
  $('fotoAnterior').addEventListener('click', () => movePhoto(-1));
  $('fotoSiguiente').addEventListener('click', () => movePhoto(1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      movePhoto(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  Array.from(track.querySelectorAll('.memory')).forEach((frame, index) => frame.addEventListener('click', () => {
    let steps = (index - photoIndex + photos.length) % photos.length;
    if (steps > photos.length / 2) steps -= photos.length;
    if (steps) movePhoto(steps);
  }));
  let swipeStart = null;
  track.addEventListener('touchstart', event => {
    clearInterval(carouselTimer);
    swipeStart = event.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', event => {
    if (swipeStart !== null) {
      const distance = event.changedTouches[0].clientX - swipeStart;
      if (Math.abs(distance) > 35) movePhoto(distance < 0 ? 1 : -1);
    }
    swipeStart = null;
    startCarousel();
  }, { passive: true });
  track.addEventListener('touchcancel', () => { swipeStart = null; startCarousel(); }, { passive: true });
  document.addEventListener('visibilitychange', startCarousel);
  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(photoAnimation);
    movingPhoto = false;
    orbitPosition = photoIndex;
    track.classList.remove('is-gliding');
    renderOrbit(orbitPosition);
    startCarousel();
  });
  if ('IntersectionObserver' in window) {
    const galleryObserver = new IntersectionObserver(startCarousel, { threshold: [0, .1], rootMargin: '-5% 0px -5% 0px' });
    galleryObserver.observe(track);
    galleryObserver.observe($('retratos').querySelector('.section-heading'));
  } else {
    window.addEventListener('scroll', startCarousel, { passive: true });
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => renderOrbit(orbitPosition)).observe(track);
  else window.addEventListener('resize', () => renderOrbit(orbitPosition));
  renderOrbit(orbitPosition);
  updatePhotoControls();

  // Fecha: se muestra solo si tiene formato válido AAAA-MM-DD, para no inventar datos.
  const fechaTexto = /^\d{4}-\d{2}-\d{2}$/.test(d.fecha || '') ? d.fecha : '';
  const [yyyy, mm, dd] = fechaTexto ? fechaTexto.split('-').map(Number) : [0,0,0];
  const fecha = yyyy ? new Date(yyyy, mm-1, dd, 12) : null;
  const fechaValida = fecha && fecha.getFullYear()===yyyy && fecha.getMonth()===mm-1 && fecha.getDate()===dd;
  if (fechaValida && /^([01]\d|2[0-3]):[0-5]\d$/.test(d.ceremonia?.hora || '')) {
    const target = new Date(`${fechaTexto}T${d.ceremonia.hora}:00-06:00`);
    const countdown = $('cuentaRegresiva');
    const tick = () => {
      const diff=target.getTime()-Date.now();
      if(diff<=0){countdown.hidden=true;return false;}
      countdown.hidden=false;
      const seconds=Math.floor(diff/1000);
      const min=Math.floor(seconds/60);
      write('dias',String(Math.floor(min/1440)).padStart(2,'0'));
      write('horas',String(Math.floor(min%1440/60)).padStart(2,'0'));
      write('minutos',String(min%60).padStart(2,'0'));
      write('segundos',String(seconds%60).padStart(2,'0'));
      return true;
    };
    if(tick()) { const timer=setInterval(()=>{if(!tick())clearInterval(timer);},1000); }
  }

  function isHttpsUrl(url) { try { const u=new URL(url); return u.protocol === 'https:'; } catch { return false; } }
  [ ['ceremonia', 'Ceremonia'], ['recepcion', 'Recepcion'] ].forEach(([key, suffix]) => {
    const item=d[key] || {};
    write(key+'Titulo', valueOr(item.titulo, key==='ceremonia'?'Ceremonia religiosa':'Recepción'));
    write(key+'Fecha', item.fecha ? new Intl.DateTimeFormat('es-MX', {day:'numeric', month:'long', year:'numeric', timeZone:'America/Mexico_City'}).format(new Date(item.fecha + 'T12:00:00-06:00')) : '');
    write(key+'Hora', item.hora ? new Intl.DateTimeFormat('es-MX', {hour:'numeric', minute:'2-digit', hour12:true, timeZone:'America/Mexico_City'}).format(new Date(item.fecha + 'T' + item.hora + ':00-06:00')) : 'Horario por confirmar');
    write(key+'Lugar',valueOr(item.lugar,'Lugar por confirmar'));
    write(key+'Direccion', item.direccion);
    if ($(key+'Direccion')) $(key+'Direccion').hidden = !item.direccion;
    const button=$('mapa'+suffix);
    if (!button) return;
    if (isHttpsUrl(item.maps)) {
      button.addEventListener('click',()=>window.open(item.maps,'_blank','noopener,noreferrer'));
    } else {button.disabled=true;button.title='Ubicación pendiente de confirmar';}
  });

  // Apertura del sobre: compatible con clic, toque y teclado.
  const intro=$('intro'), page=$('contenido');
  let opening=false;
  function enter(skip=false){
    if(opening)return;
    opening=true;
    tryPlayMusic();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = !skip && !reduced;
    if(animate) {
      intro.classList.add('intro--opening');
    }
    window.setTimeout(()=>{
      page.hidden = false;
      page.setAttribute('aria-hidden','false');
      renderOrbit(orbitPosition);
      document.body.classList.add('opened');
      startCarousel();
      portada.classList.add('visible');
      if(animate) page.classList.add('page--arriving');
      window.scrollTo({top:0,behavior:'instant'});
      intro.classList.add('intro--leaving');
      window.setTimeout(()=>{
        intro.hidden=true;
        intro.setAttribute('aria-hidden','true');
        $('tituloPrincipal').setAttribute('tabindex','-1');
        $('tituloPrincipal').focus({preventScroll:true});
              page.classList.remove('page--arriving');
      },animate ? 3350 : 0);
    },animate ? 6300 : 0);
  }
  $('abrirSobre').addEventListener('click',()=>enter(false));
  $('saltarIntro').addEventListener('click',()=>enter(true));

  // Música opcional, inicia solo como consecuencia de interacción del usuario.
  const audio=$('musicaAudio'), musicButton=$('musicaBoton');
  if (d.musica && typeof d.musica === 'string') {
    audio.src=d.musica;musicButton.hidden=false;
  }
  audio.loop = true;
  audio.volume = 1;
  function updateMusicButton() {
    const audible = !audio.paused && !audio.muted;
    musicButton.classList.toggle('is-playing', audible);
    musicButton.textContent = audible ? '🔊' : '🔇';
    musicButton.setAttribute('aria-label', audible ? 'Silenciar música' : 'Activar música');
    musicButton.setAttribute('aria-pressed', String(audible));
  }
  async function tryPlayMusic(){
    if(!audio.src)return;
    try { await audio.play(); } catch {}
    updateMusicButton();
  }
  audio.addEventListener('play', updateMusicButton);
  audio.addEventListener('pause', updateMusicButton);
  audio.addEventListener('volumechange', updateMusicButton);
  musicButton.addEventListener('click',()=>{
    if (audio.paused) {
      audio.muted = false;
      tryPlayMusic();
    } else {
      audio.muted = !audio.muted;
    }
    updateMusicButton();
  });

  // Aparición suave de secciones al desplazarse.
  const els=document.querySelectorAll('.section');
  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}
    }),{threshold:.07});
    els.forEach(el=>{el.classList.add('reveal');observer.observe(el);});
  }
  window.invitationInitialized = true;
})();
