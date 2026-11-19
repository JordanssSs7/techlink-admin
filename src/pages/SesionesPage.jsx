import EncabezadoPagina from '../components/EncabezadoPagina'
import SesionLista from '../components/SesionLista'
import Tarjeta from '../components/Tarjeta'

// Pantalla /sesiones — Todas las sesiones de mentoría; se puede cancelar una programada con motivo (API /api/sesiones/).
function SesionesPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Mentorías"
        titulo="Sesiones"
        intro="Consulta todas las sesiones y cancela una programada indicando el motivo."
      />
      <Tarjeta>
        <SesionLista />
      </Tarjeta>
    </>
  )
}

export default SesionesPage
