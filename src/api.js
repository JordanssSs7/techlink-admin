import axios from 'axios'
import { borrarSesion, leerSesion } from './auth/sesion'
import { URL_SALIDA } from './config'

// Única instancia de Axios del panel: la dirección de Django se define aquí
// y los componentes solo escriben la ruta del recurso (por ejemplo, '/cursos/').
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  timeout: 8000,
})

// Cada petición lleva el token del administrador (cuando Django lo exija, ya estará listo).
api.interceptors.request.use((config) => {
  const sesion = leerSesion()
  if (sesion?.token) config.headers.Authorization = `Bearer ${sesion.token}`
  return config
})

// Si la API responde 401, la sesión venció: se cierra y se vuelve al inicio de sesión de la aplicación de usuario.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401) {
      borrarSesion()
      window.location.assign(URL_SALIDA)
    }
    return Promise.reject(error)
  },
)

export default api
