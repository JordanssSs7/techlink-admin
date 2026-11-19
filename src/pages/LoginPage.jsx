import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import '../login.css'
import loginBg from '../assets/login-bg.webp'
import { loginRequest } from '../auth/authApi'
import { useAuth } from '../auth/authContext'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Pantalla /login — Inicio de sesión del administrador con correo y contraseña.
// Se valida en el backend de usuario (POST /api/auth/login), igual que en la aplicación de TechLink.
function LoginPage() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ correo: '', password: '' })
  const [errors, setErrors] = useState({})
  const [verClave, setVerClave] = useState(false)
  const [mostrarAyuda, setMostrarAyuda] = useState(false)
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  function cambiar(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    setErrors({ ...errors, [name]: '', global: '' })
  }

  async function enviar(e) {
    e.preventDefault()
    const nuevos = {}
    if (!form.correo.trim()) nuevos.correo = 'El correo es obligatorio.'
    else if (!EMAIL_REGEX.test(form.correo.trim())) nuevos.correo = 'Escribe un correo válido.'
    if (!form.password) nuevos.password = 'La contraseña es obligatoria.'
    if (Object.keys(nuevos).length > 0) {
      setErrors(nuevos)
      return
    }

    setEnviando(true)
    try {
      const respuesta = await loginRequest(form.correo.trim(), form.password)
      if (!respuesta.ok) {
        setErrors({ global: respuesta.data?.error || `No se pudo iniciar sesión (el servidor respondió ${respuesta.status}). Intenta de nuevo.` })
      } else if (respuesta.data.usuario?.rol !== 'ADMIN') {
        setErrors({ global: 'Esta cuenta no tiene acceso al panel de administración.' })
      } else {
        login(respuesta.data)
        navigate('/', { replace: true })
      }
    } catch {
      setErrors({ global: 'No se pudo conectar con el servidor de usuarios. Verifica que Spring Boot esté encendido.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-panel">
        <div className="login-box">
          <svg className="login-logo" width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3h8l-3 9H3z" fill="currentColor" />
            <path d="M13 3h8v9h-5l-3 9H9z" fill="currentColor" />
          </svg>

          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">Accede al panel de administración de TechLink</p>

          <form onSubmit={enviar} noValidate>
            {errors.global && (
              <div className="login-alert" role="alert">
                {errors.global}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="correo">Correo</label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="username"
                placeholder="correo@dominio.com"
                value={form.correo}
                onChange={cambiar}
                aria-invalid={!!errors.correo}
              />
              {errors.correo && <span className="login-error">{errors.correo}</span>}
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password">Contraseña</label>
                <a
                  href="#recuperar"
                  className="login-forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    setMostrarAyuda((v) => !v)
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="login-password">
                <input
                  id="password"
                  name="password"
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={form.password}
                  onChange={cambiar}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verClave}
                >
                  {verClave ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && <span className="login-error">{errors.password}</span>}
              {mostrarAyuda && (
                <p className="login-hint" role="note">
                  Aún no hay recuperación automática. Pide a otro administrador que restablezca tu contraseña.
                </p>
              )}
            </div>

            <button type="submit" className="login-submit" disabled={enviando}>
              {enviando ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="login-note">Los estudiantes y mentores ingresan desde la aplicación de TechLink.</p>
        </div>
      </section>

      <aside className="login-art" aria-hidden="true">
        <img src={loginBg} alt="" />
      </aside>
    </div>
  )
}

export default LoginPage
