import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'
import ReporteFila from './ReporteFila'

const TAMANO_PAGINA = 10

// Padre de la sección de reportes (HU-52): pide los reportes por páginas con los filtros como parámetros y los cierra
// con POST /reportes/{id}/resolver/ o /descartar/ (la nota es obligatoria). Por defecto muestra los pendientes.
function ReporteLista() {
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('PENDIENTE')
  const [tipo, setTipo] = useState('')
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
  if (estado) params.estado = estado
  if (tipo) params.tipo = tipo
  const { datos, cargando, error, recargar } = useApi('/reportes/', params)
  const { datos: resumen, recargar: recargarResumen } = useApi('/reportes/resumen/')
  const reportes = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  async function cerrar(reporte, accion, nota) {
    try {
      await api.post(`/reportes/${reporte.id}/${accion}/`, { nota })
      setAviso({ texto: accion === 'resolver' ? 'Reporte resuelto.' : 'Reporte descartado.', tipo: 'ok' })
      recargar()
      recargarResumen()
      return ''
    } catch (err) {
      if (err.response?.status === 409) {
        recargar()
        recargarResumen()
      }
      return mensajeDeError(err, 'No se pudo cerrar el reporte.')
    }
  }

  const cuenta = (clave) => (resumen ? ` (${resumen[clave]})` : '')
  const hayFiltros = busqueda.trim() !== '' || tipo !== '' || estado !== 'PENDIENTE'

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar por quien reporta o es reportado..." />
        <select value={estado} onChange={(e) => cambiarFiltro(setEstado)(e.target.value)} aria-label="Filtrar por estado">
          <option value="PENDIENTE">{`Pendientes${cuenta('PENDIENTE')}`}</option>
          <option value="RESUELTO">{`Resueltos${cuenta('RESUELTO')}`}</option>
          <option value="DESCARTADO">{`Descartados${cuenta('DESCARTADO')}`}</option>
          <option value="">Todos</option>
        </select>
        <select value={tipo} onChange={(e) => cambiarFiltro(setTipo)(e.target.value)} aria-label="Filtrar por tipo">
          <option value="">Usuarios y sesiones</option>
          <option value="USUARIO">Reportes de usuarios</option>
          <option value="SESION">Reportes de sesiones</option>
        </select>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? 'reporte' : 'reportes'}`}</span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando reportes..." />

      {!cargando && !error && reportes.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ningún reporte coincide con los filtros.' : 'No hay reportes pendientes.'}</p>
      )}

      {!cargando && !error && reportes.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Reporte</th>
                <th>Reporta</th>
                <th>Reportado</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => (
                <ReporteFila key={r.id} reporte={r} onCerrar={(accion, nota) => cerrar(r, accion, nota)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}
    </>
  )
}

export default ReporteLista
