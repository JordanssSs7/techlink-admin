import { useState } from 'react'
import useApi from '../hooks/useApi'
import { formatearFechaHora } from '../formatos'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'

const TAMANO_PAGINA = 15

// Padre de la sección de historial (HU-59): pide las acciones del administrador por páginas, de la más reciente
// a la más antigua, con los filtros como parámetros.
function HistorialLista() {
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  function cambiarFiltro(setter) {
    return (valor) => {
      setter(valor)
      setPagina(1)
    }
  }

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (busqueda.trim()) params.search = busqueda.trim()
  if (tipo) params.tipo = tipo
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const { datos, cargando, error, recargar } = useApi('/historial/', params)
  const { datos: tipos } = useApi('/historial/tipos/')
  const acciones = datos?.results ?? []
  const total = datos?.count ?? 0
  const hayFiltros = busqueda.trim() !== '' || tipo !== '' || desde !== '' || hasta !== ''

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar en el detalle..." />
        <select value={tipo} onChange={(e) => cambiarFiltro(setTipo)(e.target.value)} aria-label="Filtrar por tipo de acción">
          <option value="">Todas las acciones</option>
          {(tipos ?? []).map((t) => (
            <option key={t.tipo} value={t.tipo}>
              {t.texto}
            </option>
          ))}
        </select>
        <label className="campo-fecha">
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiarFiltro(setDesde)(e.target.value)} />
        </label>
        <label className="campo-fecha">
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiarFiltro(setHasta)(e.target.value)} />
        </label>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? 'acción' : 'acciones'}`}</span>
      </div>

      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando el historial..." />

      {!cargando && !error && acciones.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ninguna acción coincide con los filtros.' : 'Todavía no se ha registrado ninguna acción.'}</p>
      )}

      {!cargando && !error && acciones.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Administrador</th>
                <th>Acción</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {acciones.map((a) => (
                <tr key={a.id}>
                  <td>{formatearFechaHora(a.fecha)}</td>
                  <td className="celda-doble">
                    {a.admin ?? <span className="texto-suave">Sin identificar</span>}
                    {a.admin_correo && <small>{a.admin_correo}</small>}
                  </td>
                  <td>
                    <span className="etiqueta neutra">{a.tipo_texto}</span>
                  </td>
                  <td className="texto-tabla">{a.detalle ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}

      <p className="texto-suave nota">
        Aquí se anotan las postulaciones evaluadas, sesiones canceladas, cambios de usuarios y cursos, reportes cerrados y
        calificaciones ocultas.
      </p>
    </>
  )
}

export default HistorialLista
