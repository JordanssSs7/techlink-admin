import CriteriosIA from '../components/CriteriosIA'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'

// Pantalla /emparejamiento — Criterios con los que la IA ordena a los mentores (API del backend de usuario, /api/admin/emparejamiento).
function EmparejamientoPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Inteligencia artificial"
        titulo="Criterios de emparejamiento"
        intro="Ajusta cuánto pesan los cursos en común, la calificación y la disponibilidad al recomendar mentores, y mira el resultado antes de guardar."
      />
      <Tarjeta>
        <CriteriosIA />
      </Tarjeta>
    </>
  )
}

export default EmparejamientoPage
