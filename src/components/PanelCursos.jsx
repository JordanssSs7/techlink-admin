import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api'
import Aviso from './Aviso'
import Buscador from './Buscador'
import CursoForm from './CursoForm'
import CursoLista from './CursoLista'
import CursoResumen from './CursoResumen'
import Seleccion from './Seleccion'

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')

// Convierte la respuesta de error de Django REST Framework en un texto para el usuario.
// 400 de un serializer: { nombre: ['mensaje'] }; otros errores: { detail: 'mensaje' }.
function mensajeDeError(err, porDefecto) {
  const datos = err.response?.data
  if (!datos || typeof datos !== 'object') return porDefecto
  if (datos.detail) return datos.detail
  return Object.values(datos).flat().join(' ')
}

// Componente padre de la pantalla de cursos (HU-49).
// Pide los cursos a la API de Django y guarda el estado que comparten sus hijos:
// los datos bajan por props y los avisos suben por las funciones que este componente entrega.
function PanelCursos() {
  // ESTADO: el padre es el único dueño de los datos; los hijos solo los reciben por props.
  const [cursos, setCursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const [intento, setIntento] = useState(0)
  const [cursoEditando, setCursoEditando] = useState(null)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [aviso, setAviso] = useState(null)

  // GET: se ejecuta al montar y cada vez que cambian el buscador, el filtro o se reintenta.
  // La limpieza cancela la petición pendiente si llega otra antes de que termine.
  useEffect(() => {
    const control = new AbortController()

    async function cargarCursos() {
      setCargando(true)
      setError('')
      try {
        const params = { ordering: 'nombre' }
        if (busqueda.trim()) params.search = busqueda.trim()
        if (filtroActivo) params.activo = filtroActivo
        const respuesta = await api.get('/cursos/', { params, signal: control.signal })
        setCursos(respuesta.data)
      } catch (err) {
        if (axios.isCancel(err)) return
        setError('No se pudo cargar la lista de cursos. Verifica que el servidor de Django esté encendido.')
      } finally {
        if (!control.signal.aborted) setCargando(false)
      }
    }

    cargarCursos()
    return () => control.abort()
  }, [busqueda, filtroActivo, intento])

  // Título de la pestaña con la cantidad de cursos recibidos.
  const totalCursos = cursos.length
  useEffect(() => {
    document.title = `Cursos (${totalCursos}) · TechLink Admin`
  }, [totalCursos])

  // Cada aviso se oculta a los 4 segundos; la limpieza cancela el temporizador anterior.
  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  // POST (alta) o PATCH (edición). Devuelve true si se guardó, para que el formulario se limpie.
  // AVISO QUE SUBE: CursoForm llama a esta función por la prop onGuardar.
  async function guardarCurso(datos) {
    setErrorFormulario('')
    try {
      if (cursoEditando) {
        const respuesta = await api.patch(`/cursos/${cursoEditando.id}/`, datos)
        setCursos(cursos.map((c) => (c.id === cursoEditando.id ? respuesta.data : c)).sort(porNombre))
        setAviso({ texto: `Curso actualizado: ${respuesta.data.nombre}` })
        setCursoEditando(null)
      } else {
        const respuesta = await api.post('/cursos/', datos)
        setCursos([...cursos, respuesta.data].sort(porNombre))
        setAviso({ texto: `Curso agregado: ${respuesta.data.nombre}` })
      }
      return true
    } catch (err) {
      setErrorFormulario(mensajeDeError(err, 'No se pudo guardar el curso. Inténtalo de nuevo.'))
      return false
    }
  }

  // PATCH de un solo campo: activa o inactiva el curso (borrado lógico).
  // AVISO QUE SUBE: CursoFila la llama por la prop onCambiarEstado (pasa por CursoLista).
  async function cambiarEstado(curso) {
    try {
      const respuesta = await api.patch(`/cursos/${curso.id}/`, { activo: !curso.activo })
      setCursos(cursos.map((c) => (c.id === curso.id ? respuesta.data : c)))
      setAviso({ texto: `${respuesta.data.nombre}: ${respuesta.data.activo ? 'reactivado' : 'inactivado'}` })
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo cambiar el estado del curso.') })
    }
  }

  // DELETE: la fila ya pidió la confirmación. Con 204 se quita del estado;
  // con 404 el curso ya no existía en el servidor y también se quita de la lista.
  // AVISO QUE SUBE: CursoFila la llama por la prop onEliminar (pasa por CursoLista).
  async function eliminarCurso(curso) {
    try {
      await api.delete(`/cursos/${curso.id}/`)
      setCursos(cursos.filter((c) => c.id !== curso.id))
      setAviso({ texto: `Curso eliminado: ${curso.nombre}` })
    } catch (err) {
      if (err.response?.status === 404) {
        setCursos(cursos.filter((c) => c.id !== curso.id))
        setAviso({ tipo: 'error', texto: `"${curso.nombre}" ya no existe en el servidor; se quitó de la lista.` })
      } else {
        setAviso({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo eliminar el curso.') })
      }
    }
    if (cursoEditando?.id === curso.id) setCursoEditando(null)
  }

  function editarCurso(curso) {
    setErrorFormulario('')
    setCursoEditando(curso)
  }

  function cancelarEdicion() {
    setErrorFormulario('')
    setCursoEditando(null)
  }

  const hayFiltros = busqueda.trim() !== '' || filtroActivo !== ''

  // PROPS: aquí el padre reparte datos (cursos=...) y funciones (onGuardar=...) a cada hijo.
  return (
    <>
      <CursoResumen cursos={cursos} />

      <CursoForm
        key={cursoEditando ? cursoEditando.id : 'nuevo'}
        cursoEditando={cursoEditando}
        errorServidor={errorFormulario}
        onGuardar={guardarCurso}
        onCancelar={cancelarEdicion}
      />

      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar curso por nombre..." />
        <Seleccion value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </Seleccion>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${totalCursos} cursos`}</span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}

      {cargando && <p className="vacio">Cargando cursos...</p>}

      {!cargando && error && (
        <div className="error-carga" role="alert">
          <p>{error}</p>
          <button className="btn btn-borde" onClick={() => setIntento(intento + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <CursoLista
          cursos={cursos}
          hayFiltros={hayFiltros}
          onEditar={editarCurso}
          onCambiarEstado={cambiarEstado}
          onEliminar={eliminarCurso}
        />
      )}

      <p className="texto-suave nota">
        Los cursos que ya usa algún mentor o estudiante solo se pueden inactivar (borrado lógico); los demás se pueden eliminar.
      </p>
    </>
  )
}

export default PanelCursos
