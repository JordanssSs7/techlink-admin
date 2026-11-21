import CharlaLista from '../components/CharlaLista'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'

// Pantalla /charlas — Charlas virtuales que se recomiendan a los estudiantes (API /api/charlas/).
function CharlasPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Comunidad"
        titulo="Charlas virtuales"
        intro="Registra las charlas con su temática, fecha, hora y enlace. Los estudiantes las ven según sus intereses y se inscriben."
      />
      <Tarjeta>
        <CharlaLista />
      </Tarjeta>
    </>
  )
}

export default CharlasPage
