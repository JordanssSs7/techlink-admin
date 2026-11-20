import { useState } from 'react'
import { abrirArchivo } from '../archivos'
import { formatearFechaHora } from '../formatos'

const TIPOS_RECURSO = { ARCHIVO: 'Archivo', ENLACE: 'Enlace', CODIGO: 'Código' }

function tamano(bytes) {
  if (!bytes) return ''
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Lo que se muestra de cada publicación o recurso en la tabla de moderación (HU-54).
function Contenido({ tipo, item }) {
  const [error, setError] = useState('')

  async function verArchivo() {
    setError('')
    try {
      await abrirArchivo(`/recursos/${item.id}/archivo/`)
    } catch {
      setError('No se pudo abrir el archivo.')
    }
  }

  if (tipo === 'consultas') {
    return (
      <>
        <strong>{item.titulo}</strong>
        <small>{item.curso}</small>
        <p>{item.resumen}</p>
        <small>{item.total_respuestas} {item.total_respuestas === 1 ? 'respuesta' : 'respuestas'}</small>
      </>
    )
  }
  if (tipo === 'respuestas') {
    return (
      <>
        <p>{item.resumen}</p>
        <small>
          En «{item.consulta_titulo}» ({item.curso}){item.util ? ' · marcada como útil' : ''}
          {item.consulta_oculta ? ' · la consulta está oculta' : ''}
        </small>
      </>
    )
  }
  return (
    <>
      <strong>{item.titulo}</strong>
      <small>
        {TIPOS_RECURSO[item.tipo]} · {item.curso ?? 'Sin curso'} · para {item.estudiante}
      </small>
      {item.descripcion && <p>{item.descripcion}</p>}
      {item.tipo === 'ENLACE' && (
        <p>
          <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
        </p>
      )}
      {item.tipo === 'CODIGO' && <pre className="vista-codigo">{item.vista_codigo}</pre>}
      {item.tipo === 'ARCHIVO' && (
        <p>
          <button type="button" className="comprobante" onClick={verArchivo}>
            Ver {item.nombre_archivo} {item.tamano_bytes ? `(${tamano(item.tamano_bytes)})` : ''}
          </button>
        </p>
      )}
      {error && <p className="error">{error}</p>}
    </>
  )
}

// Una fila de la tabla de moderación del foro y los recursos (HU-54). Ocultar exige un motivo, que es lo que se le avisa
// al autor por correo; mostrar de nuevo no. onOcultar y onMostrar devuelven el texto de error o una cadena vacía.
function PublicacionFila({ tipo, item, onOcultar, onMostrar }) {
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
      <tr className={item.oculto ? 'fila-inactiva' : ''}>
        <td>{formatearFechaHora(item.fecha_creacion)}</td>
        <td className="celda-doble">
          {item.autor}
          <small>{item.autor_correo}</small>
        </td>
        <td className="texto-tabla">
          <Contenido tipo={tipo} item={item} />
          {item.oculto && item.motivo_moderacion && <p className="nota-revision">Motivo: {item.motivo_moderacion}</p>}
        </td>
        <td>
          <span className={`etiqueta ${item.oculto ? 'gris' : 'verde'}`}>{item.oculto ? 'Oculta' : 'Visible'}</span>
        </td>
        <td>
          {item.oculto ? (
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
          <td colSpan="5">
            {ocultando && (
              <form onSubmit={confirmarOcultar} className="form-cancelar">
                <input
                  maxLength="300"
                  placeholder="Motivo para ocultarla (se le avisa al autor)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  aria-label="Motivo para ocultar"
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
            {ocultando && <p className="texto-suave">Al ocultarla deja de verse en la aplicación y se le envía el motivo a su autor por correo.</p>}
          </td>
        </tr>
      )}
    </>
  )
}

export default PublicacionFila
