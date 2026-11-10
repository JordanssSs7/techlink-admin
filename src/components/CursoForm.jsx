import { useState } from 'react'

// Regla del modelo Curso (API Semana 8): código de 2 a 4 letras mayúsculas + 3 dígitos.
const PATRON_CODIGO = /^[A-Z]{2,4}\d{3}$/

// Formulario de alta: sus campos son estado propio (solo le interesan a él),
// pero el curso nuevo se entrega al padre con onGuardar.
function CursoForm({ codigosExistentes, onGuardar }) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [ciclo, setCiclo] = useState('')
  const [creditos, setCreditos] = useState('')
  const [error, setError] = useState('')

  function manejarEnvio(e) {
    e.preventDefault()
    const codigoLimpio = codigo.trim().toUpperCase()
    const nombreLimpio = nombre.trim()
    const numCiclo = Number(ciclo)
    const numCreditos = Number(creditos)

    if (!PATRON_CODIGO.test(codigoLimpio)) {
      setError('El código debe tener 2 a 4 letras y 3 dígitos (ej. PRG201).')
      return
    }
    if (codigosExistentes.includes(codigoLimpio)) {
      setError('Ya existe un curso con ese código.')
      return
    }
    if (nombreLimpio.length < 3) {
      setError('El nombre es obligatorio y debe tener al menos 3 caracteres.')
      return
    }
    if (!Number.isInteger(numCiclo) || numCiclo < 1 || numCiclo > 6) {
      setError('El ciclo debe ser un número entero entre 1 y 6.')
      return
    }
    if (!Number.isInteger(numCreditos) || numCreditos < 1 || numCreditos > 6) {
      setError('Los créditos deben ser un número entero entre 1 y 6.')
      return
    }

    onGuardar({ codigo: codigoLimpio, nombre: nombreLimpio, ciclo: numCiclo, creditos: numCreditos })
    setCodigo('')
    setNombre('')
    setCiclo('')
    setCreditos('')
    setError('')
  }

  return (
    <>
      <form className="form-curso" onSubmit={manejarEnvio}>
        <input placeholder="Código (PRG201)" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        <input placeholder="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input type="number" placeholder="Ciclo" value={ciclo} onChange={(e) => setCiclo(e.target.value)} />
        <input type="number" placeholder="Créditos" value={creditos} onChange={(e) => setCreditos(e.target.value)} />
        <button type="submit" className="btn btn-primario">
          Agregar curso
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </>
  )
}

export default CursoForm
