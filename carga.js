'use strict';
(async () => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const loader = document.getElementById('invitationLoader');
  const label = document.getElementById('loaderMessage');
  const retry = document.getElementById('loaderRetry');
  function waitForStyle(link) {
    if (link.sheet) return Promise.resolve();
    return new Promise((resolve, reject) => {
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', reject, { once: true });
    });
  }
  function imageReady(src) {
    const image = new Image();
    image.src = src;
    return image.decode();
  }
  retry.addEventListener('click', () => location.reload());
  const reminder = setTimeout(() => {
    label.textContent = 'Estamos preparando los detalles. Esto puede tardar un poco con tu conexión.';
  }, 7000);
  let limit;
  try {
    await Promise.race([
      (async () => {
        await Promise.all(Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(waitForStyle));
        if (!window.invitationInitialized) throw new Error('Initialization');
        if (document.fonts) {
          await Promise.all([
            document.fonts.load('700 32px "Great Vibes"'),
            document.fonts.load('700 20px "Cormorant Garamond"'),
            document.fonts.load('700 16px "Montserrat"')
          ]);
          await document.fonts.ready;
        }
        const sources = new Set(Array.from(document.querySelectorAll('.intro img, .hero img')).map(img => img.src));
        ['assets/papel-flores-relieve.png', 'assets/toile-carrusel.png'].forEach(src => sources.add(new URL(src, location.href).href));
        await Promise.all(Array.from(sources, imageReady));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      })(),
      new Promise((_, reject) => { limit = setTimeout(() => reject(new Error('Timeout')), 30000); })
    ]);
    window.scrollTo(0, 0);
    document.documentElement.classList.remove('invitation-loading');
    loader.classList.add('loader--ready');
    setTimeout(() => { loader.hidden = true; }, 600);
  } catch {
    label.textContent = 'No se terminó de cargar la invitación. Revisa tu conexión y vuelve a intentarlo.';
    retry.hidden = false;
  } finally {
    clearTimeout(reminder);
    clearTimeout(limit);
  }
})();
