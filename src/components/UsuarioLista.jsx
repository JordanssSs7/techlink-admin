import { useState } from 'react'
import api from '../api'
import useApi from '../hooks/useApi'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'
import UsuarioCard from './UsuarioCard'
import Seleccion from './Seleccion'

const TAMANO_PAGINA = 12

function mensajeDeError(err) {
  const datos = err.response?.data
  if (!datos || typeof datos !== 'object') return 'No se pudo guardar el cambio.'
  return Object.values(datos).flat().join(' ')
}

// Padre de la sección de usuarios: pide los usuarios a la API por páginas, con el buscador y los filtros
// como parámetros, y guarda los cambios de rol y de estado con PATCH.
function UsuarioLista() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [errores, setErrores] = useState({})

  // Al cambiar un filtro se vuelve a la primera página.
  function cambiarFiltro(setter) {
    return (valor) => {
      setter(valor)
      setPagina(1)
    }
  }

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (busqueda.trim()) params.search = busqueda.trim()
  if (filtroRol) params.rol = filtroRol
  if (filtroEstado) params.estado = filtroEstado
  const { datos, setDatos, cargando, error, recargar } = useApi('/usuarios/', params)
  const usuarios = datos?.results ?? []
  const total = datos?.count ?? 0

  async function actualizar(usuario, cambios) {
    setErrores({ ...errores, [usuario.id]: '' })
    try {
      const respuesta = await api.patch(`/usuarios/${usuario.id}/`, cambios)
      setDatos({ ...datos, results: usuarios.map((u) => (u.id === usuario.id ? respuesta.data : u)) })
    } catch (err) {
      setErrores({ ...errores, [usuario.id]: mensajeDeError(err) })
    }
  }

  const hayFiltros = busqueda.trim() !== '' || filtroRol !== '' || filtroEstado !== ''

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar por nombre o correo..." />
        <Seleccion value={filtroRol} onChange={(e) => cambiarFiltro(setFiltroRol)(e.target.value)} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option value="ESTUDIANTE">Estudiantes</option>
          <option value="MENTOR">Mentores</option>
          <option value="ADMIN">Administradores</option>
        </Seleccion>
        <Seleccion
          value={filtroEstado}
          onChange={(e) => cambiarFiltro(setFiltroEstado)(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </Seleccion>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} usuarios`}</span>
      </div>

      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando usuarios..." />

      {!cargando && !error && usuarios.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ningún usuario coincide con la búsqueda.' : 'Todavía no hay usuarios registrados.'}</p>
      )}

      {!cargando && !error && (
        <div className="grid">
          {usuarios.map((u) => (
            <UsuarioCard
              key={u.id}
              usuario={u}
              error={errores[u.id]}
              onCambiarRol={(rol) => actualizar(u, { rol })}
              onCambiarEstado={() => actualizar(u, { estado: u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' })}
            />
          ))}
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}

      <p className="texto-suave nota">
        Las cuentas se crean en la aplicación de usuario al iniciar sesión con Google. Desactivar una cuenta impide que
        esa persona entre a TechLink.
      </p>
    </>
  )
}

export default UsuarioLista
