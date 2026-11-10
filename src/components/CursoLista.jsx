import CursoFila from './CursoFila'

// Listado: recibe los cursos ya filtrados y reenvía a cada fila las funciones del padre.
function CursoLista({ cursos, onCambiarEstado, onEliminar }) {
  if (cursos.length === 0) {
    return <p className="vacio">No hay cursos que coincidan con la búsqueda.</p>
  }

  return (
    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Curso</th>
            <th>Ciclo</th>
            <th>Créditos</th>
            <th>Mentorías</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((c) => (
            <CursoFila key={c.id} curso={c} onCambiarEstado={onCambiarEstado} onEliminar={onEliminar} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CursoLista
