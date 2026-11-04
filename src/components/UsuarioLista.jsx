import { useState } from 'react'
import UsuarioCard from './UsuarioCard'

function UsuarioLista({ usuarios }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('Todos')

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) &&
      (filtroRol === 'Todos' || u.rol === filtroRol),
  )

  return (
    <>
      <div className="barra-filtros">
        <input
          type="search"
          placeholder="Buscar usuario por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option>Todos</option>
          <option>Estudiante</option>
          <option>Mentor</option>
          <option>Admin</option>
        </select>
        <span className="texto-suave">{filtrados.length} de {usuarios.length} usuarios</span>
      </div>

      {filtrados.length === 0 && <p className="vacio">Ningún usuario coincide con la búsqueda.</p>}

      <div className="grid">
        {filtrados.map((u) => (
          <UsuarioCard
            key={u.id}
            nombre={u.nombre_completo}
            correo={u.correo}
            rolInicial={u.rol}
            ciclo={u.ciclo}
            activoInicial={u.activo}
            horas={u.horas_asesoria}
          />
        ))}
      </div>
    </>
  )
}

export default UsuarioLista
