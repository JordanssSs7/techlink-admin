import EncabezadoPagina from '../components/EncabezadoPagina'
import HistorialLista from '../components/HistorialLista'
import Tarjeta from '../components/Tarjeta'

// Pantalla /historial — Auditoría de las acciones del administrador en el panel (API /api/historial/).
function HistorialPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Seguridad"
        titulo="Historial de acciones"
        intro="Consulta qué hizo cada administrador y cuándo. Sirve para auditar los cambios del panel."
      />
      <Tarjeta>
        <HistorialLista />
      </Tarjeta>
    </>
  )
}

export default HistorialPage
