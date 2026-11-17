const ROLES = { ESTUDIANTE: 'Estudiante', MENTOR: 'Mentor', ADMIN: 'Administrador' }

function iniciales(usuario) {
  return `${usuario.nombres[0] ?? ''}${usuario.apellidos[0] ?? ''}`
}

// Tarjeta de un usuario: muestra sus datos y avisa al padre cuando se cambia el rol o el estado.
function UsuarioCard({ usuario, error, onCambiarRol, onCambiarEstado }) {
  const activo = usuario.estado === 'ACTIVO'
  const detalle = [
    usuario.ciclo ? `Ciclo ${usuario.ciclo}` : null,
    usuario.especialidad,
    usuario.proveedor === 'GOOGLE' ? 'Entra con Google' : 'Entra con contraseña',
  ].filter(Boolean)

  return (
    <article className={activo ? 'usuario' : 'usuario inactivo'}>
      <div className="usuario-cabecera">
        <span className="avatar">{iniciales(usuario)}</span>
        <div>
          <h3>{usuario.nombre_completo}</h3>
          <p className="texto-suave">{usuario.correo}</p>
        </div>
        <span className={activo ? 'etiqueta verde' : 'etiqueta gris'}>{activo ? 'Activo' : 'Inactivo'}</span>
      </div>

      <p className="texto-suave">{detalle.join(' · ')}</p>
      {usuario.bloqueado && <span className="etiqueta ambar">Bloqueada por intentos fallidos</span>}

      <label className="campo">
        Rol
        <select value={usuario.rol} onChange={(e) => onCambiarRol(e.target.value)}>
          {Object.entries(ROLES).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </label>

      <div className="acciones">
        <button className="btn btn-borde" onClick={onCambiarEstado}>
          {activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </article>
  )
}

export default UsuarioCard
