// El inicio de sesión lo valida el backend de usuario (Spring Boot), el mismo de la aplicación de TechLink:
// POST /api/auth/login con { correoInstitucional, password } devuelve { token, usuario: { rol, ... } }.
// En desarrollo, Vite reenvía /spring hacia http://localhost:8080 (ver vite.config.js), así no hace falta CORS.
const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? '/spring'

// Devuelve { ok, status, data }. Lanza si no hay conexión con el servidor.
export async function loginRequest(correoInstitucional, password) {
  const respuesta = await fetch(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correoInstitucional, password }),
  })
  const data = await respuesta.json().catch(() => ({}))
  return { ok: respuesta.ok, status: respuesta.status, data }
}
