import api from '../api'

// HU-50: descarga el reporte consolidado (indicadores, sesiones y mentores) en Excel o PDF.
// Son enlaces normales: la API responde con Content-Disposition y el navegador guarda el archivo.
function ExportarReporte() {
  const base = `${api.defaults.baseURL}/metricas/exportar/`

  return (
    <div className="exportar">
      <span className="texto-suave">Exportar reporte consolidado:</span>
      <a className="btn btn-primario" href={`${base}?formato=xlsx`}>
        Excel
      </a>
      <a className="btn btn-borde" href={`${base}?formato=pdf`}>
        PDF
      </a>
    </div>
  )
}

export default ExportarReporte
