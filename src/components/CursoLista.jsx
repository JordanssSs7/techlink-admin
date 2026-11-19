import CursoFila from './CursoFila'

// Listado: recibe los cursos que devolvió la API y reenvía a cada fila las funciones del padre.
// PROPS RECIBIDOS: los datos (cursos, hayFiltros) y las funciones del padre (on...), entre llaves.
function CursoLista({ cursos, hayFiltros, onEditar, onCambiarEstado, onEliminar }) {
  if (cursos.length === 0) {
    return (
      <p className="vacio">
        {hayFiltros ? 'No hay cursos que coincidan con la búsqueda.' : 'Todavía no hay cursos registrados.'}
      </p>
    )
  }

  return (
    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th>Curso</th>
            <th>Mentores</th>
            <th>Estudiantes</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* Una fila por curso; cada una recibe su curso y reenvía las mismas funciones del padre. */}
          {cursos.map((c) => (
            <CursoFila
              key={c.id}
              curso={c}
              onEditar={onEditar}
              onCambiarEstado={onCambiarEstado}
              onEliminar={onEliminar}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CursoLista
