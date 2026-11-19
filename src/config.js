// El administrador inicia sesión en la aplicación de usuario (con el mismo login de todos) y desde ahí pasa al panel.
// Al cerrar sesión se vuelve a ella con ?salir para que también cierre su sesión (cada aplicación guarda la suya).
export const URL_USUARIO = import.meta.env.VITE_USER_URL ?? 'http://localhost:5173'
export const URL_SALIDA = `${URL_USUARIO}/?salir`
