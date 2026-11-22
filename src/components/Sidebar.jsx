import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { borrarSesion } from '../auth/sesion'
import { URL_SALIDA } from '../config'
import useApi from '../hooks/useApi'
import Icono from './Icono'

const ENLACES = [
  { ruta: '/', texto: 'Resumen', icono: 'inicio' },
  { ruta: '/usuarios', texto: 'Usuarios y roles', icono: 'usuarios' },
  { ruta: '/postulaciones', texto: 'Postulaciones', icono: 'archivo' },
  { ruta: '/cursos', texto: 'Cursos', icono: 'libro' },
  { ruta: '/mentorias', texto: 'Mentorías', icono: 'estrella' },
  { ruta: '/ranking', texto: 'Ranking', icono: 'trofeo' },
  { ruta: '/sesiones', texto: 'Sesiones', icono: 'reloj' },
  { ruta: '/metricas', texto: 'Métricas', icono: 'grafico' },
  { ruta: '/reportes', texto: 'Reportes', icono: 'alerta' },
  { ruta: '/moderacion', texto: 'Moderación', icono: 'escudo' },
  { ruta: '/foro', texto: 'Foro y recursos', icono: 'chat' },
  { ruta: '/demanda', texto: 'Cursos en demanda', icono: 'grafico' },
  { ruta: '/emparejamiento', texto: 'Criterios de IA', icono: 'ajustes' },
  { ruta: '/charlas', texto: 'Charlas', icono: 'video' },
  { ruta: '/anuncios', texto: 'Anuncios', icono: 'megafono' },
  { ruta: '/constancias', texto: 'Constancias', icono: 'sello' },
  { ruta: '/seguridad', texto: 'Seguridad', icono: 'candado' },
  { ruta: '/historial', texto: 'Historial', icono: 'lista' },
]

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
        <p className="nav-titulo">Menú</p>
        {ENLACES.map((e) => (
          <NavLink
            key={e.ruta}
            to={e.ruta}
            end={e.ruta === '/'}
            className={({ isActive }) => (isActive ? 'enlace activo' : 'enlace')}
            onClick={onCerrar}
          >
            <Icono nombre={e.icono} tam={18} />
            {e.texto}
            {e.ruta === '/constancias' && constancias?.pendientes > 0 && (
              <span className="insignia-menu" aria-label={`${constancias.pendientes} por emitir`}>
                {constancias.pendientes}
              </span>
            )}
          </NavLink>
        ))}
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
