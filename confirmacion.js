'use strict';
(() => {
  const section = document.getElementById('confirmacion');
  if (!section) return;
  const byId = id => document.getElementById(id);
  const status = byId('confirmacionEstado');
  const form = byId('confirmacionFormulario');
  const button = byId('confirmacionEnviar');
  const guest = new URLSearchParams(location.search).get('n')?.trim();
  const endpoint = window.DATOS_INVITACION?.confirmacion?.url?.trim();
  let row = null;
  let sending = false;
  const message = text => { status.textContent = text; };
  async function loadGuest() {
    if (!endpoint) {
      section.hidden = true;
      return;
    }
    if (!guest) {
      message('Para confirmar, abre el enlace personalizado que te compartió nuestra familia.');
      return;
    }
    message('Buscando tu invitación…');
    try {
      const url = new URL(endpoint);
      url.searchParams.set('n', guest);
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Connection');
      const data = await response.json();
      if (data.result !== 'success') {
        message('No encontramos tu invitación. Revisa el enlace con nuestra familia.');
        return;
      }
      if (!Number.isInteger(Number(data.fila)) || Number(data.fila) < 2 || !String(data.nombre || '').trim()) throw new Error('Invalid guest');
      if (data.formato !== 'asistencia-simple-v1') {
        message('La confirmación estará disponible en breve. Nuestra familia está actualizando el formulario.');
        return;
      }
      row = Number(data.fila);
      byId('confirmacionNombre').textContent = data.nombre;
      byId('confirmacionInvitado').hidden = false;
      message('Nos encantará compartir estos momentos contigo.');
    } catch {
      message('No pudimos cargar tu invitación. Revisa tu conexión e intenta nuevamente.');
      byId('confirmacionReintentar').hidden = false;
    }
  }
  byId('confirmacionReintentar').addEventListener('click', () => {
    byId('confirmacionReintentar').hidden = true;
    loadGuest();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || row === null) return;
    const attendance = byId('confirmacionAsistencia').value;
    if (!['SI', 'NO'].includes(attendance)) {
      message('Indica si podrás acompañarnos.');
      return;
    }
    sending = true;
    button.disabled = true;
    button.textContent = 'Enviando…';
    message('Guardando tu respuesta…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ n: guest, asistencia: attendance, mensaje: byId('confirmacionMensaje').value.trim() }),
        signal: AbortSignal.timeout(25000)
      });
      if (!response.ok) throw new Error('Connection');
      const result = await response.json();
      if (result.result !== 'success') throw new Error('Save');
      form.hidden = true;
      message(attendance === 'NO' ? 'Gracias por avisarnos que no podrás acompañarnos. Te enviamos un abrazo.' : '¡Gracias! Registramos que sí nos acompañarás.');
    } catch {
      message('No pudimos verificar que tu respuesta se guardara. Puedes intentar enviarla otra vez.');
    } finally {
      sending = false;
      button.disabled = false;
      button.textContent = 'Confirmar asistencia';
    }
  });
  loadGuest();
})();
