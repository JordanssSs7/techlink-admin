import ConstanciaLista from '../components/ConstanciaLista'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'

// Pantalla /constancias — Constancias de mentoría por emitir (API /api/constancias/). HU-27.
function ConstanciasPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Mentorías"
        titulo="Constancias de mentoría"
        intro="Cuando un mentor completa las horas mínimas de mentoría (50) aparece aquí. Al emitir su constancia recibe un aviso y ya puede descargarla en la aplicación."
      />
      <Tarjeta>
        <ConstanciaLista />
      </Tarjeta>
    </>
  )
}

export default ConstanciasPage
