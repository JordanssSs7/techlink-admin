import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { borrarSesion } from '../auth/sesion'
import { URL_SALIDA } from '../config'
import useApi from '../hooks/useApi'
import { GRUPOS, INICIO, grupoDeRuta } from '../menu'
import Icono from './Icono'

function iniciales(usuario) {
  return `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`
    .split(' ')
    .filter((p) => p && p !== '-')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// Menú lateral: cada opción abre su propia pantalla. En pantallas pequeñas se abre y se cierra desde la barra superior.
function Sidebar({ abierto, onCerrar }) {
  const { usuario } = useAuth()
  // HU-27: constancias de mentores que ya cumplieron las horas y esperan que el administrador las emita.
  const { datos: constancias } = useApi('/constancias/resumen/')
  // Solo un grupo abierto a la vez: el de la pantalla actual; se puede abrir otro tocándolo.
  const { pathname } = useLocation()
  const grupoActivo = grupoDeRuta(pathname)
  const [grupoAbierto, setAbiertoGrupo] = useState(grupoActivo)
  const [grupoPrevio, setGrupoPrevio] = useState(grupoActivo)
  if (grupoPrevio !== grupoActivo) {
    setGrupoPrevio(grupoActivo)
    setAbiertoGrupo(grupoActivo)
  }
  const nombre = `${usuario.nombres} ${usuario.apellidos && usuario.apellidos !== '-' ? usuario.apellidos : ''}`.trim()

  // Cierra la sesión del panel y vuelve al inicio de sesión de la aplicación de usuario (que cierra la suya).
  // Se borra directo del almacenamiento y no con logout(): así el router no cambia de ruta a /login y cancela la salida.
  function salir() {
    borrarSesion()
    window.location.assign(URL_SALIDA)
  }

  return (
    <aside className={abierto ? 'sidebar abierto' : 'sidebar'}>
      <div className="logo">
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3h8l-3 9H3z" fill="currentColor" />
          <path d="M13 3h8v9h-5l-3 9H9z" fill="currentColor" />
        </svg>
        <div>
          <strong>TechLink</strong>
          <small>Administración</small>
        </div>
      </div>

      <nav aria-label="Secciones del panel">
        <NavLink to={INICIO.ruta} end className={({ isActive }) => (isActive ? 'enlace activo' : 'enlace')} onClick={onCerrar}>
          <Icono nombre={INICIO.icono} tam={18} />
          {INICIO.texto}
        </NavLink>

        {GRUPOS.map((g) => {
          const pendientes = g.enlaces.some((e) => e.ruta === '/constancias') && constancias?.pendientes > 0 ? constancias.pendientes : 0
          const esAbierto = grupoAbierto === g.id
          return (
            <div key={g.id} className={`nav-grupo${esAbierto ? ' abierto' : ''}${g.id === grupoActivo ? ' con-activo' : ''}`}>
              <button type="button" className="nav-grupo-btn" aria-expanded={esAbierto} onClick={() => setAbiertoGrupo(esAbierto ? null : g.id)}>
                <Icono nombre={g.icono} tam={18} />
                <span>{g.titulo}</span>
                {pendientes > 0 && !esAbierto && <span className="insignia-menu" aria-label={`${pendientes} por emitir`}>{pendientes}</span>}
                <svg className="nav-flecha" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <div className="nav-sub"><div>
                {g.enlaces.map((e) => (
                  <NavLink key={e.ruta} to={e.ruta} tabIndex={esAbierto ? 0 : -1} className={({ isActive }) => (isActive ? 'enlace sub activo' : 'enlace sub')} onClick={onCerrar}>
                    {e.texto}
                    {e.ruta === '/constancias' && constancias?.pendientes > 0 && (
                      <span className="insignia-menu" aria-label={`${constancias.pendientes} por emitir`}>{constancias.pendientes}</span>
                    )}
                  </NavLink>
                ))}
              </div></div>
            </div>
          )
        })}
      </nav>

      <div className="sidebar-usuario">
        <div className="sidebar-usuario-fila">
          <span className="sidebar-avatar">{iniciales(usuario)}</span>
          <div className="sidebar-usuario-texto">
            <p className="sidebar-usuario-nombre">{nombre}</p>
            <p className="sidebar-usuario-dato">Administrador</p>
          </div>
        </div>
        <button type="button" className="sidebar-salir" onClick={salir}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
