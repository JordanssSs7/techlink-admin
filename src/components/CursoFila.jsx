// Fila: no guarda estado. Solo muestra el curso y avisa al padre con el id.
function CursoFila({ curso, onCambiarEstado, onEliminar }) {
  const tieneMentorias = curso.total_mentorias > 0

  return (
    <tr className={curso.activo ? '' : 'fila-inactiva'}>
      <td><strong>{curso.codigo}</strong></td>
      <td>{curso.nombre}</td>
      <td>{curso.ciclo}</td>
      <td>{curso.creditos}</td>
      <td>{curso.total_mentorias}</td>
      <td>
        <span className={curso.activo ? 'etiqueta verde' : 'etiqueta gris'}>{curso.activo ? 'Activo' : 'Inactivo'}</span>
      </td>
      <td>
        <div className="acciones">
          <button className="btn btn-borde" onClick={() => onCambiarEstado(curso.id)}>
            {curso.activo ? 'Inactivar' : 'Reactivar'}
          </button>
          <button
            className="btn btn-peligro"
            disabled={tieneMentorias}
            title={tieneMentorias ? 'Tiene mentorías asociadas: solo se puede inactivar' : 'Eliminar curso'}
            onClick={() => onEliminar(curso.id)}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  )
}

export default CursoFila
