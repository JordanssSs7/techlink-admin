import { useState } from 'react'
import Seleccion from './Seleccion'

const MAX_TITULO = 150
const MAX_MENSAJE = 500

const DESTINOS = [
  { valor: 'ESTUDIANTE', texto: 'Estudiantes' },
  { valor: 'MENTOR', texto: 'Mentores' },
  { valor: 'TODOS', texto: 'Estudiantes y mentores' },
]

// Formulario para publicar un anuncio por rol (HU-57). Muestra a cuántos usuarios llegará (alcance) según el destino.
// Aquí solo se revisa lo básico; las reglas completas las valida la API y se muestra el error 400 que devuelve Django.
// onPublicar devuelve el texto de error del servidor, o una cadena vacía si todo salió bien.
function AnuncioForm({ alcance, onPublicar, onCancelar }) {
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [rolDestino, setRolDestino] = useState('ESTUDIANTE')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (!titulo.trim() || !mensaje.trim()) {
      setError('Escribe el título y el mensaje del anuncio.')
      return
    }
    setError('')
    setEnviando(true)
    const texto = await onPublicar({ titulo, mensaje, rol_destino: rolDestino })
    setEnviando(false)
    if (texto) setError(texto)
  }

  const llegara = alcance?.[rolDestino]

  return (
    <form className="form-charla" onSubmit={enviar}>
      <h3 className="form-charla-titulo">Nuevo anuncio</h3>

      <label className="campo-form campo-ancho">
        Título
        <input value={titulo} maxLength={MAX_TITULO} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Nueva charla de bases de datos" />
      </label>
      <label className="campo-form campo-ancho">
        Mensaje
        <textarea rows="4" value={mensaje} maxLength={MAX_MENSAJE} onChange={(e) => setMensaje(e.target.value)} />
        <small className="texto-suave">{mensaje.length}/{MAX_MENSAJE}</small>
      </label>
      <label className="campo-form">
        Dirigido a
        <Seleccion value={rolDestino} onChange={(e) => setRolDestino(e.target.value)}>
          {DESTINOS.map((d) => (
            <option key={d.valor} value={d.valor}>
              {d.texto}
            </option>
          ))}
        </Seleccion>
      </label>
      <p className="texto-suave campo-ancho">
        {llegara === undefined ? '' : `Se enviará a ${llegara} ${llegara === 1 ? 'usuario activo' : 'usuarios activos'} y lo verán en su centro de notificaciones. No se puede editar ni borrar después de publicarlo.`}
      </p>

      <div className="acciones campo-ancho">
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Publicando...' : 'Publicar anuncio'}
        </button>
        <button type="button" className="btn btn-borde" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
      {error && <p className="error campo-ancho">{error}</p>}
    </form>
  )
}

export default AnuncioForm
