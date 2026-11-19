import { useState } from 'react'

const ETIQUETAS = {
  PROGRAMADA: { texto: 'Programada', color: 'azul' },
  COMPLETADA: { texto: 'Completada', color: 'verde' },
  CANCELADA: { texto: 'Cancelada', color: 'rojo' },
}

function formatearFecha(texto) {
  return texto.split('-').reverse().join('/')
}

// Una fila de la tabla de sesiones. Solo una sesión programada se puede cancelar, y el motivo es obligatorio.
// onCancelar devuelve el texto de error si la API lo rechaza, o una cadena vacía si todo salió bien.
function SesionFila({ sesion, onCancelar }) {
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { texto, color } = ETIQUETAS[sesion.estado_sesion]

  async function confirmar(e) {
    e.preventDefault()
    if (motivo.trim().length < 5) {
      setError('El motivo es obligatorio: explícalo en al menos 5 caracteres.')
      return
    }
    setEnviando(true)
    const mensaje = await onCancelar(motivo.trim())
    setEnviando(false)
    setError(mensaje)
    if (!mensaje) {
      setCancelando(false)
      setMotivo('')
    }
  }

  return (
    <>
      <tr className={sesion.estado_sesion === 'CANCELADA' ? 'fila-inactiva' : ''}>
        <td>{formatearFecha(sesion.fecha)}</td>
        <td>
          {sesion.hora_inicio} - {sesion.hora_fin}
        </td>
        <td>{sesion.curso ?? '—'}</td>
        <td>{sesion.mentor}</td>
        <td>{sesion.estudiante}</td>
        <td>
          <span className={`etiqueta ${color}`}>{texto}</span>
        </td>
        <td>{sesion.calificacion ? <span className="estrellas">{'★'.repeat(sesion.calificacion)}</span> : '—'}</td>
        <td>
          {sesion.estado_sesion === 'PROGRAMADA' && !cancelando && (
            <button className="btn btn-peligro" onClick={() => setCancelando(true)}>
              Cancelar
            </button>
          )}
        </td>
      </tr>
      {cancelando && sesion.estado_sesion === 'PROGRAMADA' && (
        <tr className="fila-cancelar">
          <td colSpan="8">
            <form onSubmit={confirmar} className="form-cancelar">
              <input
                maxLength="300"
                placeholder="Motivo de la cancelación (obligatorio)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                aria-label="Motivo de la cancelación"
              />
              <button type="submit" className="btn btn-peligro" disabled={enviando}>
                Confirmar cancelación
              </button>
              <button
                type="button"
                className="btn btn-borde"
                onClick={() => {
                  setCancelando(false)
                  setError('')
                }}
              >
                Volver
              </button>
            </form>
            {error && <p className="error">{error}</p>}
            <p className="texto-suave">Se avisará por correo al estudiante y al mentor.</p>
          </td>
        </tr>
      )}
    </>
  )
}

export default SesionFila
