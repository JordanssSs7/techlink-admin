import { useState } from 'react'

// Fila: muestra el curso y avisa al padre. Su único estado es de interfaz:
// si está esperando el segundo clic que confirma la eliminación.
// PROPS RECIBIDOS: curso (dato, solo lectura) y tres funciones que sirven para avisar al padre.
function CursoFila({ curso, onEditar, onCambiarEstado, onEliminar }) {
  const [confirmando, setConfirmando] = useState(false)
  const enUso = curso.total_mentores + curso.total_estudiantes > 0

  return (
    <tr className={curso.activo ? '' : 'fila-inactiva'}>
      <td><strong>{curso.nombre}</strong></td>
      <td>{curso.total_mentores}</td>
      <td>{curso.total_estudiantes}</td>
      <td>
        <span className={curso.activo ? 'etiqueta verde' : 'etiqueta gris'}>{curso.activo ? 'Activo' : 'Inactivo'}</span>
      </td>
      <td>
        {confirmando ? (
          <div className="acciones">
            <span className="texto-suave">¿Eliminar este curso?</span>
            {/* AVISO AL PADRE: la fila no borra nada, solo ejecuta onEliminar y le envía el curso. */}
            <button className="btn btn-peligro" onClick={() => onEliminar(curso)}>
              Confirmar
            </button>
            <button className="btn btn-borde" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <div className="acciones">
            <button className="btn btn-borde" onClick={() => onEditar(curso)}>
              Editar
            </button>
            <button className="btn btn-borde" onClick={() => onCambiarEstado(curso)}>
              {curso.activo ? 'Inactivar' : 'Reactivar'}
            </button>
            <button
              className="btn btn-peligro"
              disabled={enUso}
              title={enUso ? 'Lo usa algún mentor o estudiante: solo se puede inactivar' : 'Eliminar curso'}
              onClick={() => setConfirmando(true)}
            >
              Eliminar
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default CursoFila
