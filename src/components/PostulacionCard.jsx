import { useState } from 'react'

function PostulacionCard({ postulante, ciclo, cursos, comprobante }) {
  const [estado, setEstado] = useState('En revisión')
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  function confirmarRechazo(e) {
    e.preventDefault()
    if (motivo.trim() === '') {
      setError('El motivo es obligatorio para rechazar una postulación.')
      return
    }
    setEstado('Rechazado')
    setRechazando(false)
    setError('')
  }

  const color = { 'En revisión': 'ambar', Aprobado: 'verde', Rechazado: 'rojo' }[estado]

  return (
    <article className="postulacion">
      <div className="postulacion-cabecera">
        <div>
          <h3>{postulante}</h3>
          <p className="texto-suave">Ciclo {ciclo}</p>
        </div>
        <span className={`etiqueta ${color}`}>{estado}</span>
      </div>

      <p className="texto-suave">Cursos aprobados:</p>
      <ul className="chips">
        {cursos.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="comprobante">📎 {comprobante}</p>

      {estado === 'Rechazado' && <p className="motivo">Motivo: {motivo}</p>}

      {estado === 'En revisión' && !rechazando && (
        <div className="acciones">
          <button className="btn btn-ok" onClick={() => setEstado('Aprobado')}>
            Aprobar
          </button>
          <button className="btn btn-peligro" onClick={() => setRechazando(true)}>
            Rechazar
          </button>
        </div>
      )}

      {rechazando && (
        <form onSubmit={confirmarRechazo} className="form-rechazo">
          <textarea
            rows="2"
            placeholder="Motivo del rechazo (obligatorio)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <div className="acciones">
            <button type="submit" className="btn btn-peligro">
              Confirmar rechazo
            </button>
            <button type="button" className="btn btn-borde" onClick={() => setRechazando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </article>
  )
}

export default PostulacionCard
