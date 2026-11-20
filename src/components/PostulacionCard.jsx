import { useState } from 'react'
import { abrirArchivo } from '../archivos'

const ETIQUETAS = {
  EN_REVISION: { texto: 'En revisión', color: 'ambar' },
  APROBADA: { texto: 'Aprobada', color: 'verde' },
  RECHAZADA: { texto: 'Rechazada', color: 'rojo' },
}

function formatearFecha(texto) {
  return texto ? new Date(texto).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
}

// Una postulación a mentor. El padre decide qué pasa al aprobar o rechazar (onAprobar y onRechazar
// devuelven el texto de error si la API lo rechaza, o una cadena vacía si todo salió bien).
function PostulacionCard({ postulacion, onAprobar, onRechazar }) {
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { texto, color } = ETIQUETAS[postulacion.estado]

  // El comprobante se pide con el token del administrador y se abre en una pestaña nueva.
  async function verComprobante() {
    setError('')
    try {
      await abrirArchivo(`/postulaciones/${postulacion.id}/comprobante/`)
    } catch {
      setError('No se pudo abrir el comprobante.')
    }
  }

  async function aprobar() {
    if (!window.confirm(`¿Aprobar a ${postulacion.postulante}? Su cuenta pasará al rol Mentor.`)) return
    setEnviando(true)
    setError(await onAprobar())
    setEnviando(false)
  }

  async function confirmarRechazo(e) {
    e.preventDefault()
    if (motivo.trim() === '') {
      setError('El motivo es obligatorio para rechazar una postulación.')
      return
    }
    setEnviando(true)
    const mensaje = await onRechazar(motivo.trim())
    setEnviando(false)
    setError(mensaje)
    if (!mensaje) setRechazando(false)
  }

  return (
    <article className="postulacion">
      <div className="postulacion-cabecera">
        <div>
          <h3>{postulacion.postulante}</h3>
          <p className="texto-suave">
            {postulacion.correo} · Ciclo {postulacion.ciclo ?? '—'}
          </p>
        </div>
        <span className={`etiqueta ${color}`}>{texto}</span>
      </div>

      <p className="texto-suave">Enviada el {formatearFecha(postulacion.fecha_envio)}</p>
      {postulacion.comentario && <p className="comentario">“{postulacion.comentario}”</p>}

      <button type="button" className="comprobante" onClick={verComprobante}>
        📎 {postulacion.nombre_archivo} ({Math.max(1, Math.round(postulacion.tamano_bytes / 1024))} KB)
      </button>

      {postulacion.estado === 'RECHAZADA' && <p className="motivo">Motivo: {postulacion.motivo_revision}</p>}
      {postulacion.fecha_revision && postulacion.estado !== 'EN_REVISION' && (
        <p className="texto-suave">Evaluada el {formatearFecha(postulacion.fecha_revision)}</p>
      )}

      {postulacion.estado === 'EN_REVISION' && !rechazando && (
        <div className="acciones">
          <button className="btn btn-ok" onClick={aprobar} disabled={enviando}>
            Aprobar
          </button>
          <button className="btn btn-peligro" onClick={() => setRechazando(true)} disabled={enviando}>
            Rechazar
          </button>
        </div>
      )}

      {rechazando && (
        <form onSubmit={confirmarRechazo} className="form-rechazo">
          <textarea
            rows="2"
            maxLength="500"
            placeholder="Motivo del rechazo (obligatorio)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="acciones">
            <button type="submit" className="btn btn-peligro" disabled={enviando}>
              Confirmar rechazo
            </button>
            <button
              type="button"
              className="btn btn-borde"
              onClick={() => {
                setRechazando(false)
                setError('')
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </article>
  )
}

export default PostulacionCard
