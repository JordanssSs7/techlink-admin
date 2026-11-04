import { useState } from 'react'

function CursoFila({ codigo, nombre, ciclo, creditos, activoInicial }) {
  const [activo, setActivo] = useState(activoInicial)

  return (
    <tr className={activo ? '' : 'fila-inactiva'}>
      <td><strong>{codigo}</strong></td>
      <td>{nombre}</td>
      <td>{ciclo}</td>
      <td>{creditos}</td>
      <td>
        <span className={activo ? 'etiqueta verde' : 'etiqueta gris'}>{activo ? 'Activo' : 'Inactivo'}</span>
      </td>
      <td>
        <button className="btn btn-borde" onClick={() => setActivo(!activo)}>
          {activo ? 'Inactivar' : 'Reactivar'}
        </button>
      </td>
    </tr>
  )
}

export default CursoFila
