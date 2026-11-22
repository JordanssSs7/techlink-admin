import EncabezadoPagina from '../components/EncabezadoPagina'
import RankingMentores from '../components/RankingMentores'
import Tarjeta from '../components/Tarjeta'

// Pantalla /ranking — Ranking de mentores por horas y calificación, con filtros por curso y período (API /api/mentores/ranking/). HU-56.
function RankingPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Mentorías"
        titulo="Ranking de mentores"
        intro="Reconoce a los mentores más destacados por sus horas dictadas y su calificación. Filtra por curso y por período."
      />
      <Tarjeta>
        <RankingMentores />
      </Tarjeta>
    </>
  )
}

export default RankingPage
