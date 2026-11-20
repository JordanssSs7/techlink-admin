import CalificacionLista from '../components/CalificacionLista'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'

// Pantalla /moderacion — Calificaciones y comentarios de los mentores; se pueden ocultar con motivo (API /api/calificaciones/).
function ModeracionPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Moderación"
        titulo="Calificaciones y comentarios"
        intro="Oculta las calificaciones con contenido inapropiado. Una calificación oculta deja de contar para la reputación del mentor."
      />
      <Tarjeta>
        <CalificacionLista />
      </Tarjeta>
    </>
  )
}

export default ModeracionPage
