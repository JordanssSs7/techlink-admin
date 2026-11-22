import EncabezadoPagina from '../components/EncabezadoPagina'
import ParametrosSeguridad from '../components/ParametrosSeguridad'
import Tarjeta from '../components/Tarjeta'

// Pantalla /seguridad — Parámetros de seguridad del sistema (API /api/parametros-seguridad/). HU-60.
function SeguridadPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Sistema"
        titulo="Parámetros de seguridad"
        intro="Define qué correos pueden entrar con Google y cuántos intentos fallidos se permiten antes de bloquear una cuenta. Los cambios rigen en los siguientes inicios de sesión."
      />
      <Tarjeta>
        <ParametrosSeguridad />
      </Tarjeta>
    </>
  )
}

export default SeguridadPage
