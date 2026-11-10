import { useEffect, useState } from 'react'
import { cursos as cursosIniciales } from '../datos'
import Aviso from './Aviso'
import Buscador from './Buscador'
import CursoForm from './CursoForm'
import CursoLista from './CursoLista'
import CursoResumen from './CursoResumen'

// Minúsculas y sin tildes, para que "calculo" encuentre "Cálculo I".
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

// Componente padre de la pantalla de cursos críticos (HU-49).
// Guarda el estado que comparten sus hijos: los datos bajan por props
// y los avisos suben por las funciones que este componente entrega.
function PanelCursos() {
  const [cursos, setCursos] = useState(cursosIniciales)
  const [busqueda, setBusqueda] = useState('')
  const [aviso, setAviso] = useState(null)

  // Datos derivados: se calculan en cada render, no necesitan useState.
  const texto = normalizar(busqueda.trim())
  const cursosFiltrados = cursos.filter(
    (c) => normalizar(c.nombre).includes(texto) || normalizar(c.codigo).includes(texto),
  )
  const codigosExistentes = cursos.map((c) => c.codigo)
  const totalCursos = cursos.length

  // Al montar y cada vez que cambia la cantidad de cursos: título de la pestaña.
  useEffect(() => {
    document.title = `Cursos (${totalCursos}) · TechLink Admin`
  }, [totalCursos])

  // Cada aviso nuevo se oculta a los 3 segundos; la limpieza cancela el temporizador
  // si llega otro aviso antes o si el componente se desmonta.
  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(() => setAviso(null), 3000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  function guardarCurso(datos) {
    const id = Math.max(0, ...cursos.map((c) => c.id)) + 1
    const nuevo = { id, ...datos, activo: true, total_mentorias: 0 }
    setCursos([...cursos, nuevo])
    setAviso({ texto: `Curso agregado: ${nuevo.nombre}` })
  }

  function cambiarEstado(id) {
    const curso = cursos.find((c) => c.id === id)
    setCursos(cursos.map((c) => (c.id === id ? { ...c, activo: !c.activo } : c)))
    setAviso({ texto: `${curso.nombre}: ${curso.activo ? 'inactivado' : 'reactivado'}` })
  }

  function eliminarCurso(id) {
    const curso = cursos.find((c) => c.id === id)
    setCursos(cursos.filter((c) => c.id !== id))
    setAviso({ texto: `Curso eliminado: ${curso.nombre}` })
  }

  return (
    <>
      <CursoResumen cursos={cursos} />

      <CursoForm codigosExistentes={codigosExistentes} onGuardar={guardarCurso} />

      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar curso por nombre o código..." />
        <span className="texto-suave">
          {cursosFiltrados.length} de {totalCursos} cursos
        </span>
      </div>

      {aviso && <Aviso texto={aviso.texto} />}

      <CursoLista cursos={cursosFiltrados} onCambiarEstado={cambiarEstado} onEliminar={eliminarCurso} />

      <p className="texto-suave nota">
        Los cursos con mentorías asociadas solo se inactivan (borrado lógico); los demás se pueden eliminar.
      </p>
    </>
  )
}

export default PanelCursos
