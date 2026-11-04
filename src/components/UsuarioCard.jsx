import { useState } from 'react'

function iniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}

function UsuarioCard({ nombre, correo, rolInicial, ciclo, activoInicial, horas = 0 }) {
  const [rol, setRol] = useState(rolInicial)
  const [activo, setActivo] = useState(activoInicial)
  const [advertencias, setAdvertencias] = useState(0)

  return (
    <article className={activo ? 'usuario' : 'usuario inactivo'}>
      <div className="usuario-cabecera">
        <span className="avatar">{iniciales(nombre)}</span>
        <div>
          <h3>{nombre}</h3>
          <p className="texto-suave">{correo}</p>
        </div>
        <span className={activo ? 'etiqueta verde' : 'etiqueta gris'}>{activo ? 'Activo' : 'Inactivo'}</span>
      </div>

      <p className="texto-suave">
        Ciclo {ciclo} · {horas} h de asesoría
      </p>

      <label className="campo">
        Rol
        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option>Estudiante</option>
          <option>Mentor</option>
          <option>Admin</option>
        </select>
      </label>

      <div className="acciones">
        <button className="btn btn-borde" onClick={() => setActivo(!activo)}>
          {activo ? 'Desactivar' : 'Activar'}
        </button>
        <button className="btn btn-aviso" disabled={!activo} onClick={() => setAdvertencias(advertencias + 1)}>
          Advertir
        </button>
        {advertencias > 0 && <span className="etiqueta ambar">Advertencias: {advertencias}</span>}
      </div>
    </article>
  )
}

export default UsuarioCard
