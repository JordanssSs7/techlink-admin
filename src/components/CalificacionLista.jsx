import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import Buscador from './Buscador'
import CalificacionFila from './CalificacionFila'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'

const TAMANO_PAGINA = 10

// Padre de la sección de moderación (HU-53): pide las calificaciones por páginas con los filtros como parámetros,
// y las oculta (con motivo) o las muestra de nuevo con POST /calificaciones/{id}/ocultar/ y /mostrar/.
function CalificacionLista() {
  const [busqueda, setBusqueda] = useState('')
  const [visibilidad, setVisibilidad] = useState('')
  const [estrellas, setEstrellas] = useState('')
  const [conComentario, setConComentario] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState(null)

  function cambiarFiltro(setter) {
    return (valor) => {
      setter(valor)
      setPagina(1)
    }
  }

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (busqueda.trim()) params.search = busqueda.trim()
  if (visibilidad) params.oculto = visibilidad
  if (estrellas) params.estrellas = estrellas
  if (conComentario) params.con_comentario = 'true'
  const { datos, setDatos, cargando, error, recargar } = useApi('/calificaciones/', params)
  const calificaciones = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  async function cambiar(calificacion, accion, cuerpo, mensajeOk) {
    try {
      const respuesta = await api.post(`/calificaciones/${calificacion.id}/${accion}/`, cuerpo)
      // Si se filtra por visibilidad, la calificación sale de la lista; si no, se actualiza en su lugar.
      const quitar = visibilidad !== ''
      setDatos({
        ...datos,
        count: quitar ? total - 1 : total,
        results: quitar
          ? calificaciones.filter((c) => c.id !== calificacion.id)
          : calificaciones.map((c) => (c.id === calificacion.id ? respuesta.data : c)),
      })
      setAviso({ texto: mensajeOk, tipo: 'ok' })
      return ''
    } catch (err) {
      if (err.response?.status === 409) recargar()
      return mensajeDeError(err, 'No se pudo hacer el cambio.')
    }
  }

  const hayFiltros = busqueda.trim() !== '' || visibilidad !== '' || estrellas !== '' || !conComentario

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar en comentarios, mentores o estudiantes..." />
        <select value={visibilidad} onChange={(e) => cambiarFiltro(setVisibilidad)(e.target.value)} aria-label="Filtrar por visibilidad">
          <option value="">Visibles y ocultas</option>
          <option value="false">Solo visibles</option>
          <option value="true">Solo ocultas</option>
        </select>
        <select value={estrellas} onChange={(e) => cambiarFiltro(setEstrellas)(e.target.value)} aria-label="Filtrar por estrellas">
          <option value="">Todas las estrellas</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'estrella' : 'estrellas'}
            </option>
          ))}
        </select>
        <label className="campo-check">
          <input type="checkbox" checked={conComentario} onChange={(e) => cambiarFiltro(setConComentario)(e.target.checked)} />
          Solo con comentario
        </label>
        <span className="texto-suave">
          {cargando ? 'Cargando...' : `${total} ${total === 1 ? 'calificación' : 'calificaciones'}`}
        </span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando calificaciones..." />

      {!cargando && !error && calificaciones.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ninguna calificación coincide con los filtros.' : 'Todavía no hay calificaciones.'}</p>
      )}

      {!cargando && !error && calificaciones.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Mentor</th>
                <th>Estudiante</th>
                <th>Estrellas</th>
                <th>Comentario</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {calificaciones.map((c) => (
                <CalificacionFila
                  key={c.id}
                  calificacion={c}
                  onOcultar={(motivo) => cambiar(c, 'ocultar', { motivo }, 'Calificación oculta. La reputación del mentor se recalculó.')}
                  onMostrar={() => cambiar(c, 'mostrar', {}, 'Calificación visible de nuevo. La reputación del mentor se recalculó.')}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}
    </>
  )
}

export default CalificacionLista
