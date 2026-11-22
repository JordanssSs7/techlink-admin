import DemandaCursos from '../components/DemandaCursos'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'

// Pantalla /demanda — Cursos más solicitados y con más estudiantes en riesgo (API /api/cursos/demanda/).
function DemandaPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Analítica"
        titulo="Cursos en demanda"
        intro="Mira qué cursos piden más los estudiantes y en cuáles hay más gente en riesgo, para decidir dónde sumar mentores."
      />
      <Tarjeta>
        <DemandaCursos />
      </Tarjeta>
    </>
  )
}

export default DemandaPage
