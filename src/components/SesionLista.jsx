import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'
import SesionFila from './SesionFila'
import Seleccion from './Seleccion'

const TAMANO_PAGINA = 10

// Padre de la sección de sesiones (HU-51): pide las sesiones por páginas con los filtros como parámetros
// y cancela una sesión con POST /sesiones/{id}/cancelar/ (el motivo es obligatorio).
function SesionLista() {
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState(null)

  // Al cambiar un filtro se vuelve a la primera página.
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
  const { datos, setDatos, cargando, error, recargar } = useApi('/sesiones/', params)
  const sesiones = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  async function cancelar(sesion, motivo) {
    try {
      const respuesta = await api.post(`/sesiones/${sesion.id}/cancelar/`, { motivo })
      // Si se filtra por "Programadas", la sesión cancelada sale de la lista; en las demás se actualiza.
      const quitar = estado === 'PROGRAMADA'
      setDatos({
        ...datos,
        count: quitar ? total - 1 : total,
        results: quitar
          ? sesiones.filter((s) => s.id !== sesion.id)
          : sesiones.map((s) => (s.id === sesion.id ? respuesta.data : s)),
      })
      setAviso({ texto: `Sesión cancelada. Se avisó por correo a ${respuesta.data.correos_enviados} personas.`, tipo: 'ok' })
      return ''
    } catch (err) {
      if (err.response?.status === 409) recargar()
      return mensajeDeError(err, 'No se pudo cancelar la sesión.')
    }
  }

  const hayFiltros = busqueda.trim() !== '' || estado !== '' || desde !== '' || hasta !== ''

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar por mentor o estudiante..." />
        <Seleccion value={estado} onChange={(e) => cambiarFiltro(setEstado)(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">Programadas</option>
          <option value="COMPLETADA">Completadas</option>
          <option value="CANCELADA">Canceladas</option>
        </Seleccion>
        <label className="campo-fecha">
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiarFiltro(setDesde)(e.target.value)} />
        </label>
        <label className="campo-fecha">
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiarFiltro(setHasta)(e.target.value)} />
        </label>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? 'sesión' : 'sesiones'}`}</span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando sesiones..." />

      {!cargando && !error && sesiones.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ninguna sesión coincide con los filtros.' : 'Todavía no se ha agendado ninguna sesión.'}</p>
      )}

      {!cargando && !error && sesiones.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Curso</th>
                <th>Mentor</th>
                <th>Estudiante</th>
                <th>Estado</th>
                <th>Nota</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <SesionFila key={s.id} sesion={s} onCancelar={(motivo) => cancelar(s, motivo)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}

      <p className="texto-suave nota">
        Una sesión se considera completada cuando ya pasó su hora de fin. Solo las sesiones programadas se pueden cancelar.
      </p>
    </>
  )
}

export default SesionLista
