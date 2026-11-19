import EncabezadoPagina from '../components/EncabezadoPagina'
import PanelMentorias from '../components/PanelMentorias'
import Tarjeta from '../components/Tarjeta'

// Pantalla /mentorias — Mentores con su perfil, horarios y sesiones (GET /api/mentores/).
function MentoriasPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Mentores"
        titulo="Mentorías por mentor"
        intro="El perfil de cada mentor con sus cursos, horarios y sesiones."
      />
      <Tarjeta>
        <PanelMentorias />
      </Tarjeta>
    </>
  )
}

export default MentoriasPage
