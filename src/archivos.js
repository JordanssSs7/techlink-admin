import api from './api'

// Cuando Django exige el token, un enlace normal no sirve para abrir o descargar un archivo (el navegador no
// manda el encabezado Authorization). Por eso el archivo se pide con Axios y se entrega desde la memoria.

function nombreDeArchivo(cabecera, porDefecto) {
  const coincidencia = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cabecera ?? '')
  return coincidencia ? decodeURIComponent(coincidencia[1]) : porDefecto
}

// Abre el archivo en una pestaña nueva (por ejemplo, el comprobante en PDF o imagen).
export async function abrirArchivo(ruta) {
  // La pestaña se abre antes de pedir el archivo: así el navegador no la bloquea como ventana emergente.
  const ventana = window.open('', '_blank')
  try {
    const respuesta = await api.get(ruta, { responseType: 'blob', timeout: 30000 })
    const url = URL.createObjectURL(respuesta.data)
    if (ventana) {
      ventana.opener = null
      ventana.location.href = url
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000)
  } catch (err) {
    ventana?.close()
    throw err
  }
}

// Descarga el archivo con el nombre que indica la API.
export async function descargarArchivo(ruta, params, nombreAlternativo = 'archivo') {
  const respuesta = await api.get(ruta, { params, responseType: 'blob', timeout: 30000 })
  const url = URL.createObjectURL(respuesta.data)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreDeArchivo(respuesta.headers['content-disposition'], nombreAlternativo)
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
