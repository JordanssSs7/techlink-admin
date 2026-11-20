import { useState } from 'react'
import { descargarArchivo } from '../archivos'

// HU-50: descarga el reporte consolidado (indicadores, sesiones y mentores) en Excel o PDF.
// El archivo se pide con el token del administrador y el navegador lo guarda con el nombre que indica la API.
function ExportarReporte() {
  const [descargando, setDescargando] = useState('')
  const [error, setError] = useState('')

  async function exportar(formato) {
    setError('')
    setDescargando(formato)
    try {
      await descargarArchivo('/metricas/exportar/', { formato }, `reporte_techlink.${formato}`)
    } catch {
      setError('No se pudo descargar el reporte. Intenta de nuevo.')
    } finally {
      setDescargando('')
    }
  }

  return (
    <div className="exportar">
      <span className="texto-suave">Exportar reporte consolidado:</span>
      <button type="button" className="btn btn-primario" onClick={() => exportar('xlsx')} disabled={descargando !== ''}>
        {descargando === 'xlsx' ? 'Generando...' : 'Excel'}
      </button>
      <button type="button" className="btn btn-borde" onClick={() => exportar('pdf')} disabled={descargando !== ''}>
        {descargando === 'pdf' ? 'Generando...' : 'PDF'}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  )
}

export default ExportarReporte
