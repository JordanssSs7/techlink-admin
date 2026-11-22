import axios from 'axios'
import { borrarSesion, leerSesion } from './auth/sesion'
import { URL_SALIDA } from './config'

// Cada petición lleva el token del administrador. Django lo valida cuando tiene JWT_SECRET (ver README) y Spring Boot siempre.
// Si la API responde 401, la sesión venció: se cierra y se vuelve al inicio de sesión de la aplicación de usuario.
function conSesion(instancia) {
  instancia.interceptors.request.use((config) => {
    const sesion = leerSesion()
    if (sesion?.token) config.headers.Authorization = `Bearer ${sesion.token}`
    return config
  })
  instancia.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
      if (error.response?.status === 401) {
        borrarSesion()
        window.location.assign(URL_SALIDA)
      }
      return Promise.reject(error)
    },
  )
  return instancia
}

// Instancia de Axios para la API de Django: la dirección se define aquí y los componentes solo escriben
// la ruta del recurso (por ejemplo, '/cursos/').
const api = conSesion(axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  timeout: 8000,
}))

// Instancia para la API del backend de usuario (Spring Boot): la usan las pantallas que ajustan sus reglas, como los criterios
// del emparejamiento con IA (HU-61). En desarrollo Vite reenvía /spring hacia el puerto 8080 (ver vite.config.js).
export const springApi = conSesion(axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL ?? '/spring',
  timeout: 15000,
}))

export default api
