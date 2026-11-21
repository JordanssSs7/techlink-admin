import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import Buscador from './Buscador'
import CharlaFila from './CharlaFila'
import CharlaForm from './CharlaForm'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'

const TAMANO_PAGINA = 10

// Padre de la sección de charlas (HU-58): pide las charlas por páginas con los filtros como parámetros, y las crea,
// edita (PATCH) y activa o desactiva (POST /charlas/{id}/desactivar/ y /activar/). No se eliminan.
function CharlaLista() {
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [formulario, setFormulario] = useState(null) // null = oculto, {} = nueva, charla = editando
  const [aviso, setAviso] = useState(null)

  function cambiarFiltro(setter) {
    return (valor) => {
      setter(valor)
      setPagina(1)
    }
  }

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (busqueda.trim()) params.search = busqueda.trim()
  if (estado) params.estado = estado
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const { datos, cargando, error, recargar } = useApi('/charlas/', params)
  const { datos: resumen, recargar: recargarResumen } = useApi('/charlas/resumen/')
  const { datos: cursos } = useApi('/cursos/', { activo: true })
  const charlas = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  function refrescar() {
    recargar()
    recargarResumen()
  }

  async function guardar(cuerpo) {
    try {
      if (formulario?.id) {
        await api.patch(`/charlas/${formulario.id}/`, cuerpo)
        setAviso({ texto: 'Charla actualizada.', tipo: 'ok' })
      } else {
        await api.post('/charlas/', cuerpo)
        setAviso({ texto: 'Charla creada. Ya se recomienda a los estudiantes que coinciden con su temática.', tipo: 'ok' })
      }
      setFormulario(null)
      refrescar()
      return ''
    } catch (err) {
      return mensajeDeError(err, 'No se pudo guardar la charla.')
    }
  }

  async function cambiarEstado(charla) {
    try {
      await api.post(`/charlas/${charla.id}/${charla.activo ? 'desactivar' : 'activar'}/`)
      setAviso({ texto: charla.activo ? 'Charla desactivada.' : 'Charla activada.', tipo: 'ok' })
      refrescar()
      return ''
    } catch (err) {
      if (err.response?.status === 409) refrescar()
      return mensajeDeError(err, 'No se pudo cambiar el estado de la charla.')
    }
  }

  const cuenta = (clave) => (resumen ? ` (${resumen[clave]})` : '')
  const hayFiltros = busqueda.trim() !== '' || estado !== '' || desde !== '' || hasta !== ''

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar por nombre o temática..." />
        <select value={estado} onChange={(e) => cambiarFiltro(setEstado)(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todas</option>
          <option value="VIGENTE">{`Vigentes${cuenta('vigentes')}`}</option>
          <option value="PASADA">{`Pasadas${cuenta('pasadas')}`}</option>
          <option value="INACTIVA">{`Desactivadas${cuenta('inactivas')}`}</option>
        </select>
        <label className="campo-fecha">
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiarFiltro(setDesde)(e.target.value)} />
        </label>
        <label className="campo-fecha">
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiarFiltro(setHasta)(e.target.value)} />
        </label>
        <button className="btn btn-primario" onClick={() => setFormulario({})} disabled={formulario !== null && !formulario.id}>
          Nueva charla
        </button>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? 'charla' : 'charlas'}`}</span>
      </div>

      {formulario !== null && (
        <CharlaForm
          key={formulario.id ?? 'nueva'}
          charlaEditando={formulario.id ? formulario : null}
          cursos={cursos}
          onGuardar={guardar}
          onCancelar={() => setFormulario(null)}
        />
      )}

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={refrescar} texto="Cargando charlas..." />

      {!cargando && !error && charlas.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ninguna charla coincide con los filtros.' : 'Todavía no hay charlas. Crea la primera con "Nueva charla".'}</p>
      )}

      {!cargando && !error && charlas.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Charla</th>
                <th>Inscritos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {charlas.map((c) => (
                <CharlaFila key={c.id} charla={c} onEditar={setFormulario} onCambiarEstado={() => cambiarEstado(c)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}

      <p className="texto-suave nota">
        Una charla vigente se recomienda a los estudiantes cuyos intereses o cursos críticos coinciden con ella. Una charla
        desactivada deja de recomendarse y de verse en los calendarios, pero conserva sus inscripciones.
      </p>
    </>
  )
}

export default CharlaLista
