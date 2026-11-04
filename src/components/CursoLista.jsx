import { useState } from 'react'
import CursoFila from './CursoFila'

// Regla del modelo Curso (API Semana 8): código de 2 a 4 letras mayúsculas + 3 dígitos.
const PATRON_CODIGO = /^[A-Z]{2,4}\d{3}$/

function CursoLista({ cursos }) {
  const [lista, setLista] = useState(cursos)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [creditos, setCreditos] = useState('')
  const [error, setError] = useState('')

  function manejarEnvio(e) {
    e.preventDefault()
    const codigoLimpio = codigo.trim().toUpperCase()

    if (!PATRON_CODIGO.test(codigoLimpio)) {
      setError('El código debe tener 2 a 4 letras y 3 dígitos (ej. PRG201).')
      return
    }
    if (lista.some((c) => c.codigo === codigoLimpio)) {
      setError('Ya existe un curso con ese código.')
      return
    }
    if (nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }
    if (Number(creditos) <= 0 || Number(creditos) > 6) {
      setError('Los créditos deben estar entre 1 y 6.')
      return
    }

    const nuevo = {
      id: Date.now(),
      codigo: codigoLimpio,
      nombre: nombre.trim(),
      ciclo: 1,
      creditos: Number(creditos),
      activo: true,
    }
    setLista([...lista, nuevo])
    setCodigo('')
    setNombre('')
    setCreditos('')
    setError('')
  }

  return (
    <>
      <form className="form-curso" onSubmit={manejarEnvio}>
        <input placeholder="Código (PRG201)" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        <input placeholder="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input
          type="number"
          placeholder="Créditos"
          value={creditos}
          onChange={(e) => setCreditos(e.target.value)}
        />
        <button type="submit" className="btn btn-primario">
          Agregar curso
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Curso</th>
              <th>Ciclo</th>
              <th>Créditos</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <CursoFila
                key={c.id}
                codigo={c.codigo}
                nombre={c.nombre}
                ciclo={c.ciclo}
                creditos={c.creditos}
                activoInicial={c.activo}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="texto-suave nota">Los cursos con mentorías asociadas solo se inactivan (borrado lógico).</p>
    </>
  )
}

export default CursoLista
