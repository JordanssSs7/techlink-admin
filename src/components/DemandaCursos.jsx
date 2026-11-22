import { useState } from 'react'
import { descargarArchivo } from '../archivos'
import useApi from '../hooks/useApi'
import EstadoCarga from './EstadoCarga'

const PRIORIDADES = {
  ALTA: { texto: 'Alta', color: 'rojo' },
  MEDIA: { texto: 'Media', color: 'ambar' },
  BAJA: { texto: 'Baja', color: 'gris' },
}

// Una barra horizontal cuyo largo es proporcional al valor más alto de la lista.
function BarraValor({ valor, maximo }) {
  return (
    <div className="barra-valor-caja">
      <div className="barra-valor-pista">
        <span style={{ width: `${maximo ? Math.max(4, (valor / maximo) * 100) : 0}%` }} />
      </div>
      <strong>{valor}</strong>
    </div>
  )
}

// HU-55: ranking de cursos por sesiones solicitadas y por estudiantes en riesgo (los que lo marcaron como curso crítico), para
// decidir dónde hacen falta más mentores. Se filtra por ciclo y se exporta a Excel.
function DemandaCursos() {
  const [ciclo, setCiclo] = useState('')
  const [limite, setLimite] = useState('10')
  const [exportando, setExportando] = useState(false)
  const [errorExportar, setErrorExportar] = useState('')

  const params = { limite }
  if (ciclo) params.ciclo = ciclo
  const { datos, cargando, error, recargar } = useApi('/cursos/demanda/', params)
  const solicitados = datos?.solicitados ?? []
  const enRiesgo = datos?.en_riesgo ?? []
  const maxSesiones = Math.max(0, ...solicitados.map((c) => c.sesiones))
  const maxRiesgo = Math.max(0, ...enRiesgo.map((c) => c.estudiantes))

  async function exportar() {
    setExportando(true)
    setErrorExportar('')
    try {
      await descargarArchivo('/cursos/demanda/exportar/', params, 'cursos_demanda.xlsx')
    } catch {
      setErrorExportar('No se pudo descargar el Excel. Intenta de nuevo.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <div className="barra-filtros">
        <select value={ciclo} onChange={(e) => setCiclo(e.target.value)} aria-label="Filtrar por ciclo académico">
          <option value="">Todos los ciclos</option>
          {(datos?.ciclos ?? []).map((c) => (
            <option key={c} value={c}>{`Ciclo ${c}`}</option>
          ))}
        </select>
        <select value={limite} onChange={(e) => setLimite(e.target.value)} aria-label="Cantidad de cursos">
          {[5, 10, 20].map((n) => (
            <option key={n} value={n}>{`Top ${n}`}</option>
          ))}
        </select>
        <button className="btn btn-primario" onClick={exportar} disabled={exportando || cargando || !!error}>
          {exportando ? 'Generando...' : 'Exportar a Excel'}
        </button>
        {errorExportar && <span className="error">{errorExportar}</span>}
      </div>

      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Calculando la demanda de cursos..." />

      {!cargando && !error && (
        <div className="demanda-grid">
          <section aria-label="Cursos más solicitados">
            <h3 className="demanda-titulo">Más solicitados</h3>
            <p className="texto-suave">Por sesiones agendadas{ciclo ? ` por estudiantes del ciclo ${ciclo}` : ''}.</p>
            {solicitados.length === 0 ? (
              <p className="vacio">Todavía no hay sesiones con curso{ciclo ? ' en este ciclo' : ''}.</p>
            ) : (
              <div className="tabla-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Curso</th>
                      <th>Sesiones</th>
                      <th>Completadas</th>
                      <th>Nota</th>
                      <th>Mentores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitados.map((c, i) => (
                      <tr key={c.id}>
                        <td>{i + 1}</td>
                        <td className="texto-tabla celda-doble">
                          {c.curso}
                          <small>
                            {c.estudiantes} {c.estudiantes === 1 ? 'estudiante' : 'estudiantes'}
                            {c.canceladas > 0 ? ` · ${c.canceladas} ${c.canceladas === 1 ? 'cancelada' : 'canceladas'}` : ''}
                          </small>
                        </td>
                        <td><BarraValor valor={c.sesiones} maximo={maxSesiones} /></td>
                        <td>{c.completadas}</td>
                        <td>{c.calificacion !== null ? `${c.calificacion} ★` : '—'}</td>
                        <td>{c.mentores}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-label="Cursos con más estudiantes en riesgo">
            <h3 className="demanda-titulo">Estudiantes en riesgo</h3>
            <p className="texto-suave">Estudiantes que marcaron el curso como crítico{ciclo ? ` (ciclo ${ciclo})` : ''}.</p>
            {enRiesgo.length === 0 ? (
              <p className="vacio">Ningún estudiante marcó cursos críticos{ciclo ? ' en este ciclo' : ''}.</p>
            ) : (
              <div className="tabla-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Curso</th>
                      <th>En riesgo</th>
                      <th>Mentores</th>
                      <th>Por mentor</th>
                      <th>Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enRiesgo.map((c, i) => {
                      const prioridad = PRIORIDADES[c.prioridad]
                      return (
                        <tr key={c.id}>
                          <td>{i + 1}</td>
                          <td className="texto-tabla celda-doble">
                            {c.curso}
                            <small>{c.sesiones} {c.sesiones === 1 ? 'sesión agendada' : 'sesiones agendadas'}</small>
                          </td>
                          <td><BarraValor valor={c.estudiantes} maximo={maxRiesgo} /></td>
                          <td>{c.mentores}</td>
                          <td>{c.estudiantes_por_mentor === null ? 'Sin mentores' : c.estudiantes_por_mentor}</td>
                          <td><span className={`etiqueta ${prioridad.color}`}>{prioridad.texto}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <p className="texto-suave nota">
        La prioridad es <strong>alta</strong> si el curso no tiene mentores o le tocan 5 o más estudiantes por mentor, <strong>media</strong> con
        2 o más, y <strong>baja</strong> en los demás casos. Sirve para decidir en qué cursos conviene sumar mentores.
      </p>
    </>
  )
}

export default DemandaCursos
