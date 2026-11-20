import { useState } from 'react'
import { formatearFechaHora } from '../formatos'

// Una fila de la tabla de calificaciones (HU-53). Ocultar exige un motivo; mostrar de nuevo no.
// onOcultar y onMostrar devuelven el texto de error si la API lo rechaza, o una cadena vacía si todo salió bien.
function CalificacionFila({ calificacion, onOcultar, onMostrar }) {
  const [ocultando, setOcultando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function confirmarOcultar(e) {
    e.preventDefault()
    if (motivo.trim().length < 5) {
      setError('El motivo es obligatorio: explícalo en al menos 5 caracteres.')
      return
    }
    setEnviando(true)
    const mensaje = await onOcultar(motivo.trim())
    setEnviando(false)
    setError(mensaje)
    if (!mensaje) {
      setOcultando(false)
      setMotivo('')
    }
  }

  async function mostrar() {
    setEnviando(true)
    setError(await onMostrar())
    setEnviando(false)
  }

  return (
    <>
      <tr className={calificacion.oculto ? 'fila-inactiva' : ''}>
        <td>{formatearFechaHora(calificacion.fecha_creacion)}</td>
        <td className="celda-doble">
          {calificacion.mentor}
          <small>{calificacion.curso ?? 'Sin curso'}</small>
        </td>
        <td>{calificacion.estudiante}</td>
        <td>
          <span className="estrellas">{'★'.repeat(calificacion.estrellas)}</span>
          <span className="texto-suave">{'★'.repeat(5 - calificacion.estrellas)}</span>
        </td>
        <td className="texto-tabla">
          {calificacion.comentario ? `“${calificacion.comentario}”` : <span className="texto-suave">Sin comentario</span>}
          {calificacion.oculto && calificacion.motivo_moderacion && (
            <p className="nota-revision">Motivo: {calificacion.motivo_moderacion}</p>
          )}
        </td>
        <td>
          <span className={`etiqueta ${calificacion.oculto ? 'gris' : 'verde'}`}>{calificacion.oculto ? 'Oculta' : 'Visible'}</span>
        </td>
        <td>
          {calificacion.oculto ? (
            <button className="btn btn-borde" onClick={mostrar} disabled={enviando}>
              Mostrar
            </button>
          ) : (
            !ocultando && (
              <button className="btn btn-peligro" onClick={() => setOcultando(true)}>
                Ocultar
              </button>
            )
          )}
        </td>
      </tr>
      {(ocultando || error) && (
        <tr className="fila-cancelar">
          <td colSpan="7">
            {ocultando && (
              <form onSubmit={confirmarOcultar} className="form-cancelar">
                <input
                  maxLength="300"
                  placeholder="Motivo para ocultarla (obligatorio)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  aria-label="Motivo para ocultar la calificación"
                />
                <button type="submit" className="btn btn-peligro" disabled={enviando}>
                  Confirmar
                </button>
                <button
                  type="button"
                  className="btn btn-borde"
                  onClick={() => {
                    setOcultando(false)
                    setError('')
                  }}
                >
                  Volver
                </button>
              </form>
            )}
            {error && <p className="error">{error}</p>}
            {ocultando && (
              <p className="texto-suave">Una calificación oculta no se muestra en el perfil del mentor ni cuenta para su reputación.</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default CalificacionFila
