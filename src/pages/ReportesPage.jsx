import EncabezadoPagina from '../components/EncabezadoPagina'
import ReporteLista from '../components/ReporteLista'
import Tarjeta from '../components/Tarjeta'

// Pantalla /reportes — Reportes de usuarios y sesiones enviados por estudiantes y mentores (API /api/reportes/).
function ReportesPage() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Moderación"
        titulo="Reportes"
        intro="Revisa lo que reportan estudiantes y mentores. Cierra cada reporte con una nota de lo que se decidió."
      />
      <Tarjeta>
        <ReporteLista />
      </Tarjeta>
    </>
  )
}

export default ReportesPage
