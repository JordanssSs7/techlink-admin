// Convierte el error de una petición de Axios en un texto para mostrar al administrador.
// La API de Django responde con { campo: ['mensaje'] } o { detalle: 'mensaje' }.
export function mensajeDeError(err, porDefecto = 'No se pudo guardar el cambio. Intenta de nuevo.') {
  const datos = err.response?.data
  if (!datos || typeof datos !== 'object') return porDefecto
  return Object.values(datos).flat().join(' ')
}
