// Fecha y hora legibles (hora local del navegador) para las tablas del panel.
export function formatearFechaHora(texto) {
  return texto
    ? new Date(texto).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
}
