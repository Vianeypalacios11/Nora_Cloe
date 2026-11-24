// Código para pegar en el proyecto de Google Apps Script de esta invitación.
// Hoja: A = Nombre, B = Asistencia (SI / NO), C = Mensaje.
const NOMBRE_HOJA = ''; // Vacío: primera pestaña. O escribe el nombre exacto.
const FORMATO = 'asistencia-simple-v1';
function salida(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}
function normalizar(nombre) {
  return String(nombre || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
}
function hojaInvitados() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = NOMBRE_HOJA ? libro.getSheetByName(NOMBRE_HOJA) : libro.getSheets()[0];
  if (!hoja) throw new Error('No se encontró la hoja de invitados.');
  return hoja;
}
function buscarInvitado(hoja, nombre) {
  const buscado = normalizar(nombre);
  if (!buscado) return null;
  const filas = hoja.getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    if (normalizar(filas[i][0]) === buscado) return { fila: i + 1, nombre: String(filas[i][0]) };
  }
  return null;
}
function doGet(e) {
  try {
    const invitado = buscarInvitado(hojaInvitados(), e && e.parameter && e.parameter.n);
    if (!invitado) return salida({ result: 'error', error: 'Invitado no encontrado.' });
    return salida({ result: 'success', formato: FORMATO, fila: invitado.fila, nombre: invitado.nombre });
  } catch (error) {
    return salida({ result: 'error', error: 'No se pudo consultar la invitación.' });
  }
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  let adquirido = false;
  try {
    const datos = JSON.parse(e.postData.contents);
    if (!['SI', 'NO'].includes(datos.asistencia)) return salida({ result: 'error', error: 'Respuesta inválida.' });
    const mensaje = String(datos.mensaje || '').trim();
    if (mensaje.length > 1500) return salida({ result: 'error', error: 'Mensaje demasiado largo.' });
    adquirido = lock.tryLock(10000);
    if (!adquirido) return salida({ result: 'error', error: 'Intenta nuevamente.' });
    const hoja = hojaInvitados();
    const invitado = buscarInvitado(hoja, datos.n);
    if (!invitado) return salida({ result: 'error', error: 'Invitado no encontrado.' });
    // Prefijo para que un mensaje que empiece con =, +, - o @ no sea fórmula.
    const textoSeguro = /^[=+\-@]/.test(mensaje) ? "'" + mensaje : mensaje;
    hoja.getRange(invitado.fila, 2, 1, 2).setValues([[datos.asistencia, textoSeguro]]);
    return salida({ result: 'success', formato: FORMATO });
  } catch (error) {
    return salida({ result: 'error', error: 'No se pudo guardar la respuesta.' });
  } finally {
    if (adquirido) lock.releaseLock();
  }
}
