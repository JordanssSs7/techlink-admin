// La sesión del administrador se guarda en sessionStorage: se borra al cerrar la pestaña.
const CLAVE = 'techlink-admin-sesion'

export function leerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE)) ?? null
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    // Sin almacenamiento disponible: la sesión dura solo mientras la página siga abierta.
  }
}

// La aplicación de usuario abre el panel con la sesión del administrador en el fragmento de la URL (#sesion=...).
// El fragmento se borra siempre, para que el token no se quede en la barra de direcciones ni en el historial.
export function tomarSesionDeLaUrl() {
  const prefijo = '#sesion='
  if (!window.location.hash.startsWith(prefijo)) return null
  let sesion = null
  try {
    const dato = JSON.parse(decodeURIComponent(window.location.hash.slice(prefijo.length)))
    if (typeof dato?.token === 'string' && dato?.usuario?.rol === 'ADMIN') {
      sesion = { token: dato.token, usuario: dato.usuario }
    }
  } catch {
    // Fragmento dañado: se ignora y se pide iniciar sesión.
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  if (sesion) guardarSesion(sesion)
  return sesion
}

export function borrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // Nada que borrar.
  }
}
