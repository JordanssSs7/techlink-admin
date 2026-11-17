import { useState } from 'react'

// Formulario de alta y de edición. Si recibe cursoEditando, se llena con sus datos
// (el padre cambia la key para reiniciarlo). Las reglas del nombre las valida la API:
// aquí solo se comprueba que no esté vacío y se muestra el error 400 que devuelve Django.
function CursoForm({ cursoEditando, errorServidor, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(cursoEditando ? cursoEditando.nombre : '')
  const [activo, setActivo] = useState(cursoEditando ? cursoEditando.activo : true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(e) {
    e.preventDefault()
    if (nombre.trim() === '') {
      setError('El nombre del curso es obligatorio.')
      return
    }
    setError('')
    setEnviando(true)
    const guardado = await onGuardar({ nombre, activo })
    setEnviando(false)
    if (guardado && !cursoEditando) {
      setNombre('')
      setActivo(true)
    }
  }

  const mensaje = error || errorServidor

  return (
    <>
      <form className="form-curso" onSubmit={manejarEnvio}>
        <input
          placeholder="Nombre del curso"
          value={nombre}
          maxLength={120}
          onChange={(e) => setNombre(e.target.value)}
        />
        <select value={activo ? 'true' : 'false'} onChange={(e) => setActivo(e.target.value === 'true')} aria-label="Estado">
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {cursoEditando ? 'Guardar cambios' : 'Agregar curso'}
        </button>
        {cursoEditando && (
          <button type="button" className="btn btn-borde" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </form>
      {cursoEditando && <p className="texto-suave editando">Editando: {cursoEditando.nombre}</p>}
      {mensaje && <p className="error">{mensaje}</p>}
    </>
  )
}

export default CursoForm
