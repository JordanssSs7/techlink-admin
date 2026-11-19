import EncabezadoPagina from '../components/EncabezadoPagina'
import PanelCursos from '../components/PanelCursos'
import Tarjeta from '../components/Tarjeta'

// Pantalla /cursos — Catálogo de cursos conectado a la API (PanelCursos, /api/cursos/).
function CursosPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Catálogo"
        titulo="Cursos"
        intro="Registra, edita, inactiva o elimina los cursos de la carrera."
      />
      <Tarjeta>
        <PanelCursos />
      </Tarjeta>
    </>
  )
}

export default CursosPage
