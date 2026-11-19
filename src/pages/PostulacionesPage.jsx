import EncabezadoPagina from '../components/EncabezadoPagina'
import PostulacionLista from '../components/PostulacionLista'
import Tarjeta from '../components/Tarjeta'

// Pantalla /postulaciones — Postulaciones a mentor: aprobar o rechazar con motivo (API /api/postulaciones/).
function PostulacionesPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Mentores"
        titulo="Postulaciones a mentor"
        intro="Revisa el comprobante de cada postulante y apruébala, o recházala indicando el motivo."
      />
      <Tarjeta>
        <PostulacionLista />
      </Tarjeta>
    </>
  )
}

export default PostulacionesPage
