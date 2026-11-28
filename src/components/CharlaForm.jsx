import { useState } from 'react'
import Seleccion from './Seleccion'

const MAX_NOMBRE = 150
const MAX_TEMATICA = 60
const MAX_DESCRIPCION = 500

// Reduce la foto en el navegador (lado mayor de 1000 px, JPEG) para que pese poco y se guarde junto con la charla.
function reducirImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    if (!archivo.type.startsWith('image/')) {
      rechazar(new Error('Elige un archivo de imagen (JPG, PNG o WebP).'))
      return
    }
    const url = URL.createObjectURL(archivo)
    const imagen = new Image()
    imagen.onload = () => {
      const escala = Math.min(1, 1000 / Math.max(imagen.width, imagen.height))
      const lienzo = document.createElement('canvas')
      lienzo.width = Math.round(imagen.width * escala)
      lienzo.height = Math.round(imagen.height * escala)
      lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
      URL.revokeObjectURL(url)
      resolver(lienzo.toDataURL('image/jpeg', 0.82))
    }
    imagen.onerror = () => {
      URL.revokeObjectURL(url)
      rechazar(new Error('No se pudo leer esa imagen.'))
    }
    imagen.src = url
  })
}

function hoyLocal() {
  const f = new Date()
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

// Formulario de alta y de edición de una charla virtual (HU-58). Si recibe charlaEditando se llena con sus datos
// (el padre cambia la key para reiniciarlo). Aquí solo se revisa lo básico; las reglas completas (fecha no pasada,
// hora de fin posterior) las valida la API y se muestra el error 400 que devuelve Django.
// onGuardar devuelve el texto de error del servidor, o una cadena vacía si todo salió bien.
function CharlaForm({ charlaEditando, cursos, onGuardar, onCancelar }) {
  const c = charlaEditando
  const [nombre, setNombre] = useState(c?.nombre ?? '')
  const [tematica, setTematica] = useState(c?.tematica ?? '')
  const [descripcion, setDescripcion] = useState(c?.descripcion ?? '')
  const [curso, setCurso] = useState(c?.curso ? String(c.curso) : '')
  const [fecha, setFecha] = useState(c?.fecha ?? '')
  const [horaInicio, setHoraInicio] = useState(c?.hora_inicio ?? '')
  const [horaFin, setHoraFin] = useState(c?.hora_fin ?? '')
  const [imagen, setImagen] = useState(c?.imagen ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function elegirImagen(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    try {
      setImagen(await reducirImagen(archivo))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function enviar(e) {
    e.preventDefault()
    if (!nombre.trim() || !tematica.trim() || !fecha || !horaInicio || !horaFin) {
      setError('Completa el nombre, la temática, la fecha y las horas.')
      return
    }
    setError('')
    setEnviando(true)
    const mensaje = await onGuardar({
      nombre,
      tematica,
      descripcion: descripcion.trim() === '' ? null : descripcion,
      curso: curso === '' ? null : Number(curso),
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      imagen: imagen || null,
    })
    setEnviando(false)
    if (mensaje) setError(mensaje)
  }

  return (
    <form className="form-charla" onSubmit={enviar}>
      <h3 className="form-charla-titulo">{c ? `Editando: ${c.nombre}` : 'Nueva charla'}</h3>

      <label className="campo-form campo-ancho">
        Nombre de la charla
        <input value={nombre} maxLength={MAX_NOMBRE} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Bases de datos en la industria" />
      </label>
      <label className="campo-form">
        Temática
        <input value={tematica} maxLength={MAX_TEMATICA} onChange={(e) => setTematica(e.target.value)} placeholder="Ej. Bases de datos" />
      </label>
      <label className="campo-form">
        Curso que refuerza (opcional)
        <Seleccion value={curso} onChange={(e) => setCurso(e.target.value)}>
          <option value="">Ninguno</option>
          {(cursos ?? []).map((cu) => (
            <option key={cu.id} value={cu.id}>
              {cu.nombre}
            </option>
          ))}
        </Seleccion>
      </label>
      <label className="campo-form">
        Fecha
        {/* Al crear no se aceptan fechas pasadas; al editar se deja la que ya tenía. */}
        <input type="date" value={fecha} min={c ? undefined : hoyLocal()} onChange={(e) => setFecha(e.target.value)} />
      </label>
      <label className="campo-form">
        Hora de inicio
        <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
      </label>
      <label className="campo-form">
        Hora de fin
        <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
      </label>
      <div className="campo-form campo-ancho">
        Foto del invitado (opcional)
        <div className="imagen-charla">
          {imagen ? <img src={imagen} alt="Vista previa de la foto del invitado" /> : <span className="texto-ayuda">Sin foto: la tarjeta de la charla quedará en blanco.</span>}
          <div className="acciones">
            <label className="btn btn-borde">
              {imagen ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" hidden onChange={elegirImagen} />
            </label>
            {imagen && <button type="button" className="btn btn-borde" onClick={() => setImagen('')}>Quitar</button>}
          </div>
        </div>
      </div>
      <p className="campo-ancho texto-ayuda">
        La charla se hace en la sala de videollamada de TechLink. Al crearla se genera un enlace secreto para tu invitado: cópialo con «Enlace del
        invitado» en la lista y mándaselo. Los estudiantes y mentores solo ven la charla (nombre, día y hora) y entran desde su sección Charlas.
      </p>
      <label className="campo-form campo-ancho">
        Descripción (opcional)
        <textarea rows="3" value={descripcion} maxLength={MAX_DESCRIPCION} onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      <div className="acciones campo-ancho">
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Guardando...' : c ? 'Guardar cambios' : 'Crear charla'}
        </button>
        <button type="button" className="btn btn-borde" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
      {error && <p className="error campo-ancho">{error}</p>}
    </form>
  )
}

export default CharlaForm
