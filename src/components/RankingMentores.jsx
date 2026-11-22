import { useState } from 'react'
import useApi from '../hooks/useApi'
import EstadoCarga from './EstadoCarga'

const MEDALLAS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function dos(n) {
  return String(n).padStart(2, '0')
}

function fechaIso(f) {
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`
}

// Períodos de un clic: devuelven [desde, hasta] como AAAA-MM-DD (vacíos = sin límite).
const PERIODOS = [
  { id: 'todo', texto: 'Todo el tiempo', rango: () => ['', ''] },
  { id: 'mes', texto: 'Este mes', rango: (h) => [fechaIso(new Date(h.getFullYear(), h.getMonth(), 1)), fechaIso(h)] },
  { id: '3m', texto: 'Últimos 3 meses', rango: (h) => [fechaIso(new Date(h.getFullYear(), h.getMonth() - 2, 1)), fechaIso(h)] },
  { id: 'anio', texto: 'Este año', rango: (h) => [fechaIso(new Date(h.getFullYear(), 0, 1)), fechaIso(h)] },
]

const horas = (h) => `${Number.isInteger(h) ? h : String(h).replace('.', ',')} h`
const nota = (n) => (n == null ? '—' : n.toFixed(1).replace('.', ','))

// Ranking de mentores por horas y calificación (HU-56). Pide GET /mentores/ranking/ con los filtros como parámetros:
// curso, período (desde y hasta), orden y cuántos mostrar. Solo cuentan las sesiones completadas y las calificaciones
// visibles, igual que el ranking que ven los estudiantes.
function RankingMentores() {
  const [curso, setCurso] = useState('')
  const [periodo, setPeriodo] = useState('todo')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [orden, setOrden] = useState('calificacion')
  const [limite, setLimite] = useState('20')

  const params = { orden, limite }
  if (curso) params.curso = curso
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const { datos, cargando, error, recargar } = useApi('/mentores/ranking/', params)
  const { datos: cursos } = useApi('/cursos/', { activo: true })
  const mentores = datos?.mentores ?? []
  const total = datos?.total_mentores ?? 0
  const hayFiltros = curso !== '' || desde !== '' || hasta !== ''

  function elegirPeriodo(id) {
    const [d, h] = PERIODOS.find((p) => p.id === id).rango(new Date())
    setPeriodo(id)
    setDesde(d)
    setHasta(h)
  }

  // Si se escriben las fechas a mano, el período deja de ser uno de los atajos.
  function cambiarFecha(setter, valor) {
    setter(valor)
    setPeriodo('personalizado')
  }

  function limpiar() {
    setCurso('')
    elegirPeriodo('todo')
  }

  return (
    <>
      <div className="barra-filtros">
        <select value={curso} onChange={(e) => setCurso(e.target.value)} aria-label="Filtrar por curso">
          <option value="">Todos los cursos</option>
          {(cursos ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar por">
          <option value="calificacion">Ordenar por calificación</option>
          <option value="horas">Ordenar por horas</option>
        </select>
        <select value={limite} onChange={(e) => setLimite(e.target.value)} aria-label="Cuántos mostrar">
          <option value="10">Mostrar 10</option>
          <option value="20">Mostrar 20</option>
          <option value="50">Mostrar 50</option>
          <option value="100">Mostrar 100</option>
        </select>
      </div>

      <div className="barra-filtros">
        {PERIODOS.map((p) => (
          <button key={p.id} className={`btn ${periodo === p.id ? 'btn-primario' : 'btn-borde'}`} onClick={() => elegirPeriodo(p.id)}>
            {p.texto}
          </button>
        ))}
        <label className="campo-fecha">
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiarFecha(setDesde, e.target.value)} />
        </label>
        <label className="campo-fecha">
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiarFecha(setHasta, e.target.value)} />
        </label>
        {hayFiltros && (
          <button className="btn btn-borde" onClick={limpiar}>
            Limpiar filtros
          </button>
        )}
        <span className="texto-suave">
          {cargando ? 'Cargando...' : `${total} ${total === 1 ? 'mentor' : 'mentores'}${total > mentores.length ? ` (se muestran ${mentores.length})` : ''}`}
        </span>
      </div>

      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Calculando el ranking..." />

      {!cargando && !error && datos?.sesiones_disponibles === false && (
        <p className="vacio">Todavía no hay sesiones registradas: el ranking aparecerá cuando se apliquen las migraciones de sesiones.</p>
      )}

      {!cargando && !error && datos?.sesiones_disponibles && mentores.length === 0 && (
        <p className="vacio">
          {hayFiltros ? 'Ningún mentor tiene sesiones completadas con esos filtros. Prueba con otro curso o un período más amplio.' : 'Todavía no hay sesiones completadas para armar el ranking.'}
        </p>
      )}

      {!cargando && !error && mentores.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mentor</th>
                <th>Horas</th>
                <th>Sesiones</th>
                <th>Estudiantes</th>
                <th>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {mentores.map((m) => (
                <tr key={m.id} className={m.estado === 'INACTIVO' ? 'fila-inactiva' : ''}>
                  <td>
                    <span aria-label={`Puesto ${m.posicion}`}>{MEDALLAS[m.posicion] ?? m.posicion}</span>
                  </td>
                  <td className="celda-doble">
                    {m.nombre}
                    <small>
                      {m.especialidad ? `${m.especialidad} · ` : ''}
                      {m.correo}
                      {m.estado === 'INACTIVO' ? ' · inactivo' : ''}
                    </small>
                  </td>
                  <td>
                    <strong>{horas(m.horas)}</strong>
                  </td>
                  <td>{m.sesiones}</td>
                  <td>{m.estudiantes_atendidos}</td>
                  <td>
                    {m.promedio == null ? (
                      <span className="texto-suave">Sin calificaciones</span>
                    ) : (
                      <>
                        <strong>{nota(m.promedio)} ★</strong> <span className="texto-suave">({m.calificaciones})</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default RankingMentores
