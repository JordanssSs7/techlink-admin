import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import { formatearFechaHora } from '../formatos'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'

const TAMANO_PAGINA = 10
const horas = (h) => `${String(Number(h)).replace('.', ',')} h`

// Constancias de mentoría (HU-27): los mentores que llegaron a las horas mínimas. Se pide la lista por páginas y se emite
// cada constancia con POST /constancias/{id}/emitir/; el mentor recibe un aviso y ya puede descargarla.
function ConstanciaLista() {
  const [estado, setEstado] = useState('PENDIENTE')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState(null)
  const [emitiendo, setEmitiendo] = useState(null)

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (estado) params.estado = estado
  if (busqueda.trim()) params.search = busqueda.trim()
  const { datos, cargando, error, recargar } = useApi('/constancias/', params)
  const { datos: resumen, recargar: recargarResumen } = useApi('/constancias/resumen/')
  const constancias = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  function cambiarEstado(nuevo) {
    setEstado(nuevo)
    setPagina(1)
  }

  async function emitir(c) {
    if (!window.confirm(`¿Emitir la constancia de ${c.mentor_nombre}? Recibirá un aviso y podrá descargarla.`)) return
    setEmitiendo(c.id)
    try {
      await api.post(`/constancias/${c.id}/emitir/`)
      setAviso({ texto: `Constancia emitida. ${c.mentor_nombre} ya puede descargarla.`, tipo: 'ok' })
    } catch (err) {
      setAviso({ texto: mensajeDeError(err, 'No se pudo emitir la constancia.'), tipo: 'error' })
    } finally {
      setEmitiendo(null)
      recargar()
      recargarResumen()
    }
  }

  const cuenta = (clave) => (resumen ? ` (${resumen[clave]})` : '')

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={(v) => { setBusqueda(v); setPagina(1) }} placeholder="Buscar por nombre o correo..." />
        <button className={`btn ${estado === 'PENDIENTE' ? 'btn-primario' : 'btn-borde'}`} onClick={() => cambiarEstado('PENDIENTE')}>
          {`Por emitir${cuenta('pendientes')}`}
        </button>
        <button className={`btn ${estado === 'EMITIDA' ? 'btn-primario' : 'btn-borde'}`} onClick={() => cambiarEstado('EMITIDA')}>
          {`Emitidas${cuenta('emitidas')}`}
        </button>
        <button className={`btn ${estado === '' ? 'btn-primario' : 'btn-borde'}`} onClick={() => cambiarEstado('')}>
          Todas
        </button>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? 'constancia' : 'constancias'}`}</span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando constancias..." />

      {!cargando && !error && constancias.length === 0 && (
        <p className="vacio">
          {estado === 'PENDIENTE' && busqueda.trim() === ''
            ? 'No hay constancias por emitir. Aparecerán aquí cuando un mentor complete las horas mínimas.'
            : 'Ninguna constancia coincide con los filtros.'}
        </p>
      )}

      {!cargando && !error && constancias.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Mentor</th>
                <th>Horas</th>
                <th>Cumplió el</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {constancias.map((c) => (
                <tr key={c.id}>
                  <td className="celda-doble">
                    {c.mentor_nombre}
                    <small>{c.especialidad ? `${c.especialidad} · ` : ''}{c.mentor_correo}</small>
                  </td>
                  <td>
                    <strong>{horas(c.horas_al_cumplir)}</strong>
                  </td>
                  <td>{formatearFechaHora(c.fecha_elegible)}</td>
                  <td>
                    {c.estado === 'EMITIDA' ? (
                      <span className="etiqueta verde">Emitida</span>
                    ) : (
                      <span className="etiqueta ambar">Por emitir</span>
                    )}
                    {c.estado === 'EMITIDA' && (
                      <small className="texto-suave">
                        {formatearFechaHora(c.fecha_emision)}
                        {c.emitida_por ? ` · ${c.emitida_por}` : ''}
                      </small>
                    )}
                  </td>
                  <td>
                    {c.estado === 'PENDIENTE' && (
                      <button className="btn btn-primario" disabled={emitiendo === c.id} onClick={() => emitir(c)}>
                        {emitiendo === c.id ? 'Emitiendo...' : 'Emitir constancia'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}
    </>
  )
}

export default ConstanciaLista
