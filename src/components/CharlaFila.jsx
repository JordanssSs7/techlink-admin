import { useState } from 'react'

const ESTADOS = {
  VIGENTE: { texto: 'Vigente', color: 'verde' },
  PASADA: { texto: 'Pasada', color: 'gris' },
  INACTIVA: { texto: 'Desactivada', color: 'rojo' },
}

function formatearFecha(texto) {
  return texto.split('-').reverse().join('/')
}

// Una fila de la tabla de charlas (HU-58). Se puede editar, abrir el enlace y activar o desactivar.
// onCambiarEstado devuelve el texto de error si la API lo rechaza, o una cadena vacía si todo salió bien.
function CharlaFila({ charla, onEditar, onCambiarEstado }) {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { texto, color } = ESTADOS[charla.estado]

  async function cambiar() {
    if (charla.activo) {
      const detalle = charla.inscritos > 0 ? ` Sus ${charla.inscritos} inscripciones se conservan.` : ''
      if (!window.confirm(`¿Desactivar "${charla.nombre}"? Dejará de recomendarse y de verse en los calendarios.${detalle}`)) return
    }
    setEnviando(true)
    setError(await onCambiarEstado())
    setEnviando(false)
  }

  return (
    <>
      <tr className={charla.activo ? '' : 'fila-inactiva'}>
        <td>
          {formatearFecha(charla.fecha)}
          <br />
          <small className="texto-suave">
            {charla.hora_inicio} - {charla.hora_fin}
          </small>
        </td>
        <td className="texto-tabla celda-doble">
          {charla.nombre}
          <small>
            {charla.tematica}
            {charla.curso_nombre ? ` · Refuerza ${charla.curso_nombre}` : ''}
          </small>
        </td>
        <td>{charla.inscritos}</td>
        <td>
          <span className={`etiqueta ${color}`}>{texto}</span>
        </td>
        <td>
          <div className="acciones">
            <button className="btn btn-borde" onClick={() => onEditar(charla)}>
              Editar
            </button>
            <button className={charla.activo ? 'btn btn-peligro' : 'btn btn-ok'} onClick={cambiar} disabled={enviando}>
              {charla.activo ? 'Desactivar' : 'Activar'}
            </button>
            <a className="btn btn-borde" href={charla.enlace} target="_blank" rel="noreferrer">
              Enlace
            </a>
          </div>
        </td>
      </tr>
      {error && (
        <tr className="fila-cancelar">
          <td colSpan="5">
            <p className="error">{error}</p>
          </td>
        </tr>
      )}
    </>
  )
}

export default CharlaFila
