import { useState } from 'react'
import { formatearFechaHora } from '../formatos'

const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente', color: 'ambar' },
  RESUELTO: { texto: 'Resuelto', color: 'verde' },
  DESCARTADO: { texto: 'Descartado', color: 'gris' },
}

// Una fila de la tabla de reportes (HU-52). Un reporte pendiente se revisa con una nota: se resuelve (ya se tomó una
// acción) o se descarta (no procede). onCerrar devuelve el texto de error si la API lo rechaza, o una cadena vacía.
function ReporteFila({ reporte, onCerrar }) {
  const [revisando, setRevisando] = useState(false)
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { texto, color } = ESTADOS[reporte.estado]
  const pendiente = reporte.estado === 'PENDIENTE'

  async function cerrar(accion) {
    if (nota.trim().length < 5) {
      setError('Escribe una nota de al menos 5 caracteres con lo que se decidió.')
      return
    }
    setEnviando(true)
    const mensaje = await onCerrar(accion, nota.trim())
    setEnviando(false)
    setError(mensaje)
    if (!mensaje) {
      setRevisando(false)
      setNota('')
    }
  }

  return (
    <>
      <tr className={pendiente ? '' : 'fila-inactiva'}>
        <td>{formatearFechaHora(reporte.fecha_creacion)}</td>
        <td>
          {reporte.tipo === 'SESION' ? 'Sesión' : 'Usuario'}
          <br />
          <small className="texto-suave">{reporte.motivo_texto}</small>
        </td>
        <td className="celda-doble">
          {reporte.reportante}
          <small>{reporte.reportante_correo}</small>
        </td>
        <td className="celda-doble">
          {reporte.reportado}
          <small>
            {reporte.reportado_rol === 'MENTOR' ? 'Mentor' : 'Estudiante'} · {reporte.reportes_contra_usuario}{' '}
            {reporte.reportes_contra_usuario === 1 ? 'reporte' : 'reportes'}
          </small>
        </td>
        <td>
          <span className={`etiqueta ${color}`}>{texto}</span>
        </td>
        <td>
          <button className="btn btn-borde" onClick={() => setRevisando(!revisando)} aria-expanded={revisando}>
            {revisando ? 'Cerrar' : pendiente ? 'Revisar' : 'Ver'}
          </button>
        </td>
      </tr>
      {revisando && (
        <tr className="fila-cancelar">
          <td colSpan="6">
            <div className="detalle-reporte">
              <p className="descripcion">“{reporte.descripcion}”</p>
              {reporte.sesion && (
                <p className="texto-suave">
                  Sesión #{reporte.sesion.id}: {reporte.sesion.fecha.split('-').reverse().join('/')} de {reporte.sesion.hora_inicio} a{' '}
                  {reporte.sesion.hora_fin}
                  {reporte.sesion.curso ? ` · ${reporte.sesion.curso}` : ''}
                </p>
              )}
              {!pendiente && (
                <p className="nota-revision">
                  Revisado el {formatearFechaHora(reporte.fecha_revision)}. Nota: {reporte.nota_revision}
                </p>
              )}
            </div>
            {pendiente && (
              <form className="form-cancelar" onSubmit={(e) => e.preventDefault()}>
                <input
                  maxLength="500"
                  placeholder="Nota de la revisión (obligatoria)"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  aria-label="Nota de la revisión"
                />
                <button type="button" className="btn btn-ok" disabled={enviando} onClick={() => cerrar('resolver')}>
                  Resolver
                </button>
                <button type="button" className="btn btn-borde" disabled={enviando} onClick={() => cerrar('descartar')}>
                  Descartar
                </button>
              </form>
            )}
            {error && <p className="error">{error}</p>}
            {pendiente && (
              <p className="texto-suave">Resolver: el reporte era válido y ya se actuó. Descartar: no procede.</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default ReporteFila
