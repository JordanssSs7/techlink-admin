import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

// Estructura de todas las pantallas del panel: menú a la izquierda y, a la derecha, la pantalla elegida (Outlet).
function LayoutAdmin() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="app">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      {menuAbierto && <div className="velo" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}

      <div className="contenido">
        <header className="barra-movil">
          <button type="button" className="btn btn-borde" onClick={() => setMenuAbierto(true)} aria-label="Abrir el menú">
            ☰ Menú
          </button>
          <strong>TechLink</strong>
        </header>
        {/* La clave reinicia la animación de entrada cada vez que cambia la pantalla. */}
        <main key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default LayoutAdmin
