import AnuncioLista from '../components/AnuncioLista'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'

// Pantalla /anuncios — Anuncios dirigidos por rol que llegan al centro de notificaciones (API /api/anuncios/). HU-57.
function AnunciosPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Comunidad"
        titulo="Anuncios"
        intro="Comunica novedades a los estudiantes, a los mentores o a ambos. Cada usuario lo ve en su centro de notificaciones."
      />
      <Tarjeta>
        <AnuncioLista />
      </Tarjeta>
    </>
  )
}

export default AnunciosPage
