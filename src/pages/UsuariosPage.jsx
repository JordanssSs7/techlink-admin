import EncabezadoPagina from '../components/EncabezadoPagina'
import Tarjeta from '../components/Tarjeta'
import UsuarioLista from '../components/UsuarioLista'

// Pantalla /usuarios — Usuarios y roles: buscar, cambiar rol, activar o desactivar cuentas (GET y PATCH /api/usuarios/).
function UsuariosPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Gestión"
        titulo="Usuarios y roles"
        intro="Busca cuentas de la base compartida, cambia su rol y activa o desactiva su acceso."
      />
      <Tarjeta>
        <UsuarioLista />
      </Tarjeta>
    </>
  )
}

export default UsuariosPage
