import { useState } from 'react'
import api from '../api'
import useApi from '../hooks/useApi'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import UsuarioCard from './UsuarioCard'

function mensajeDeError(err) {
  const datos = err.response?.data
  if (!datos || typeof datos !== 'object') return 'No se pudo guardar el cambio.'
  return Object.values(datos).flat().join(' ')
}

// Padre de la sección de usuarios: pide los usuarios a la API con el buscador y los filtros
// como parámetros, y guarda los cambios de rol y de estado con PATCH.
function UsuarioLista() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [errores, setErrores] = useState({})

  const params = {}
  if (busqueda.trim()) params.search = busqueda.trim()
  if (filtroRol) params.rol = filtroRol
  if (filtroEstado) params.estado = filtroEstado
  const { datos, setDatos, cargando, error, recargar } = useApi('/usuarios/', params)
  const usuarios = datos ?? []

  async function actualizar(usuario, cambios) {
    setErrores({ ...errores, [usuario.id]: '' })
    try {
      const respuesta = await api.patch(`/usuarios/${usuario.id}/`, cambios)
      setDatos(usuarios.map((u) => (u.id === usuario.id ? respuesta.data : u)))
    } catch (err) {
      setErrores({ ...errores, [usuario.id]: mensajeDeError(err) })
    }
  }

  const hayFiltros = busqueda.trim() !== '' || filtroRol !== '' || filtroEstado !== ''

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre o correo..." />
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option value="ESTUDIANTE">Estudiantes</option>
          <option value="MENTOR">Mentores</option>
          <option value="ADMIN">Administradores</option>
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${usuarios.length} usuarios`}</span>
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

      <p className="texto-suave nota">
        Las cuentas se crean en la aplicación de usuario al iniciar sesión con Google. Desactivar una cuenta impide que
        esa persona entre a TechLink.
      </p>
    </>
  )
}

export default UsuarioLista
