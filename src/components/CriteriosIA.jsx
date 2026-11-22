import { useEffect, useState } from 'react'
import { springApi } from '../api'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import EstadoCarga from './EstadoCarga'

const CRITERIOS = [
  { clave: 'cursos', nombre: 'Cursos en común', ayuda: 'Cuántos de los cursos que el estudiante pide domina el mentor.' },
  { clave: 'calificacion', nombre: 'Calificación', ayuda: 'El promedio de estrellas del mentor. Sin calificaciones vale 2,5 de 5.' },
  { clave: 'disponibilidad', nombre: 'Disponibilidad', ayuda: 'Cuánto horario libre comparte con el estudiante (3 horas ya es el máximo).' },
]

// Texto de error de Spring Boot: { status, error } (o el de validación con campos).
function mensajeSpring(err, porDefecto) {
  const datos = err.response?.data
  return (typeof datos?.error === 'string' && datos.error) || porDefecto
}

const iguales = (a, b) => a.cursos === b.cursos && a.calificacion === b.calificacion && a.disponibilidad === b.disponibilidad

function Porcentaje({ pesos, clave }) {
  const suma = pesos.cursos + pesos.calificacion + pesos.disponibilidad
  return <>{suma === 0 ? 0 : Math.round((100 * pesos[clave]) / suma)} %</>
}

// Los 3 mentores de una vista previa.
function ListaMentores({ titulo, datos, cargando }) {
  return (
    <div className="vista-previa">
      <h4>{titulo}</h4>
      {cargando && <p className="texto-suave">Calculando...</p>}
      {!cargando && datos && datos.mentores.length === 0 && (
        <p className="vacio">Ningún mentor domina esos cursos con horario libre.</p>
      )}
      {!cargando && datos && datos.mentores.length > 0 && (
        <ol className="vista-previa-lista">
          {datos.mentores.map((m, i) => (
            <li key={m.idMentor}>
              <span className="vista-previa-puesto">{i + 1}</span>
              <div className="vista-previa-datos">
                <strong>{m.nombres} {m.apellidos}</strong>
                <small>
                  {m.cursosEnComun}/{m.cursosPedidos} cursos · {m.calificacion} ★ ({m.totalCalificaciones}) · {Math.round(m.minutosEnComun / 6) / 10} h libres
                </small>
                <div className="barra-valor-pista"><span style={{ width: `${m.puntaje}%` }} /></div>
              </div>
              <b>{m.puntaje}</b>
            </li>
          ))}
        </ol>
      )}
      {!cargando && datos && <p className="texto-suave">{datos.candidatos} {datos.candidatos === 1 ? 'mentor cumple' : 'mentores cumplen'} las condiciones.</p>}
    </div>
  )
}

// HU-61: el administrador ajusta cuánto pesa cada criterio con el que la IA ordena a los mentores y, antes de guardar, ve qué
// 3 mentores saldrían con los pesos nuevos frente a los de ahora, para un caso de prueba (los cursos que elija).
function CriteriosIA() {
  const [criterios, setCriterios] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)
  const [pesos, setPesos] = useState(null)
  const [cursosElegidos, setCursosElegidos] = useState([])
  const [previa, setPrevia] = useState(null) // { actual, nuevo, pesos, cursos }
  const [calculando, setCalculando] = useState(false)
  const [errorPrevia, setErrorPrevia] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [errorGuardar, setErrorGuardar] = useState('')
  const { datos: cursos } = useApi('/cursos/', { activo: true })

  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const { data } = await springApi.get('/api/admin/emparejamiento/criterios')
        if (!vigente) return
        setCriterios(data)
        setPesos(data.pesos)
        setErrorCarga('')
      } catch (err) {
        if (vigente) setErrorCarga(mensajeSpring(err, 'No se pudieron cargar los criterios. Verifica que Spring Boot esté encendido.'))
      }
    }
    cargar()
    return () => { vigente = false }
  }, [intento])

  useEffect(() => {
    if (!aviso) return undefined
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  function cambiarPeso(clave, valor) {
    setPesos({ ...pesos, [clave]: Number(valor) })
    setErrorGuardar('')
  }

  function alternarCurso(id) {
    setCursosElegidos((actuales) => {
      if (actuales.includes(id)) return actuales.filter((c) => c !== id)
      return actuales.length >= 5 ? actuales : [...actuales, id]
    })
  }

  async function verVistaPrevia() {
    setCalculando(true)
    setErrorPrevia('')
    setErrorGuardar('')
    try {
      const [actual, nuevo] = await Promise.all([
        springApi.post('/api/admin/emparejamiento/vista-previa', { cursos: cursosElegidos }),
        springApi.post('/api/admin/emparejamiento/vista-previa', { cursos: cursosElegidos, pesos }),
      ])
      setPrevia({ actual: actual.data, nuevo: nuevo.data, pesos: { ...pesos }, cursos: [...cursosElegidos] })
    } catch (err) {
      setPrevia(null)
      setErrorPrevia(mensajeSpring(err, 'No se pudo calcular la vista previa.'))
    } finally {
      setCalculando(false)
    }
  }

  async function guardar() {
    setGuardando(true)
    setErrorGuardar('')
    try {
      const { data } = await springApi.put('/api/admin/emparejamiento/criterios', pesos)
      setCriterios(data)
      setPesos(data.pesos)
      setPrevia(null)
      setAviso({ texto: 'Criterios guardados. El agente ya recomienda con los pesos nuevos.', tipo: 'ok' })
    } catch (err) {
      setErrorGuardar(mensajeSpring(err, 'No se pudieron guardar los criterios.'))
    } finally {
      setGuardando(false)
    }
  }

  if (!criterios || !pesos) {
    return <EstadoCarga cargando={!errorCarga} error={errorCarga} onReintentar={() => setIntento((n) => n + 1)} texto="Cargando los criterios..." />
  }

  const cambiaron = !iguales(pesos, criterios.pesos)
  const suma = pesos.cursos + pesos.calificacion + pesos.disponibilidad
  // Solo se puede guardar después de ver la vista previa de ESTOS pesos (si se mueve un control, hay que volver a verla).
  const previaVigente = previa !== null && iguales(previa.pesos, pesos)
  const idsActual = previa?.actual.mentores.map((m) => m.idMentor).join(',')
  const idsNuevo = previa?.nuevo.mentores.map((m) => m.idMentor).join(',')

  return (
    <>
      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}

      <div className="criterios">
        {CRITERIOS.map((c) => (
          <div className="criterio" key={c.clave}>
            <label htmlFor={`peso-${c.clave}`}>
              <strong>{c.nombre}</strong>
              <span className="criterio-valor">
                <b>{pesos[c.clave]}</b>
                <small>(<Porcentaje pesos={pesos} clave={c.clave} /> del total)</small>
              </span>
            </label>
            <input id={`peso-${c.clave}`} type="range" min="0" max="100" step="5" value={pesos[c.clave]} onChange={(e) => cambiarPeso(c.clave, e.target.value)} />
            <small className="texto-suave">{c.ayuda}</small>
          </div>
        ))}
      </div>

      {suma === 0 && <p className="error">Al menos un criterio debe pesar más que 0.</p>}
      <p className="texto-suave">
        Los pesos se usan en proporción: 70 / 0 / 30 es lo mismo que 7 / 0 / 3. Valores actuales guardados: {criterios.pesos.cursos} / {criterios.pesos.calificacion} / {criterios.pesos.disponibilidad}
        {criterios.actualizado ? ` (cambiados el ${new Date(criterios.actualizado).toLocaleDateString('es-PE')})` : ' (valores iniciales)'}.
      </p>

      <h3 className="demanda-titulo">Probar con un caso</h3>
      <p className="texto-suave">Elige hasta 5 cursos que un estudiante necesitaría reforzar y compara qué mentores saldrían.</p>
      <div className="cursos-prueba">
        {(cursos ?? []).map((c) => {
          const marcado = cursosElegidos.includes(c.id)
          return (
            <button key={c.id} type="button" className={`curso-chip${marcado ? ' marcado' : ''}`} aria-pressed={marcado}
              disabled={!marcado && cursosElegidos.length >= 5} onClick={() => alternarCurso(c.id)}>
              {c.nombre}
            </button>
          )
        })}
      </div>

      <div className="acciones">
        <button className="btn btn-primario" onClick={verVistaPrevia} disabled={calculando || cursosElegidos.length === 0 || suma === 0}>
          {calculando ? 'Calculando...' : 'Ver vista previa'}
        </button>
        <button className="btn btn-borde" onClick={() => { setPesos(criterios.predeterminados); setErrorGuardar('') }}
          disabled={iguales(pesos, criterios.predeterminados)}>
          Volver a los valores iniciales
        </button>
      </div>
      {errorPrevia && <p className="error">{errorPrevia}</p>}

      {previa && (
        <>
          <div className="vista-previa-doble">
            <ListaMentores titulo={`Con los pesos guardados (${previa.actual.pesos.cursos}/${previa.actual.pesos.calificacion}/${previa.actual.pesos.disponibilidad})`}
              datos={previa.actual} cargando={calculando} />
            <ListaMentores titulo={`Con los pesos nuevos (${previa.nuevo.pesos.cursos}/${previa.nuevo.pesos.calificacion}/${previa.nuevo.pesos.disponibilidad})`}
              datos={previa.nuevo} cargando={calculando} />
          </div>
          <p className="texto-suave">
            {idsActual === idsNuevo ? 'Los 3 mentores y su orden no cambian con estos pesos para este caso.' : 'Con los pesos nuevos cambian los mentores o su orden.'}
          </p>
        </>
      )}

      <div className="acciones criterios-guardar">
        <button className="btn btn-ok" onClick={guardar} disabled={!cambiaron || !previaVigente || guardando || suma === 0}>
          {guardando ? 'Guardando...' : 'Guardar criterios'}
        </button>
        {cambiaron && !previaVigente && <span className="texto-suave">Mira la vista previa de estos pesos para poder guardarlos.</span>}
        {!cambiaron && <span className="texto-suave">No hay cambios por guardar.</span>}
      </div>
      {errorGuardar && <p className="error">{errorGuardar}</p>}
    </>
  )
}

export default CriteriosIA
