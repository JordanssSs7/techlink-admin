import useApi from '../hooks/useApi'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import ExportarReporte from '../components/ExportarReporte'
import MetricasSesiones from '../components/MetricasSesiones'
import Tarjeta from '../components/Tarjeta'

// Pantalla /metricas — Impacto de las mentorías y exportación del reporte (GET /api/metricas/resumen/).
function MetricasPage() {
  const { datos: resumen, cargando, error, recargar } = useApi('/metricas/resumen/')

  return (
    <>
      <EncabezadoPagina
        etiqueta="Reportes"
        titulo="Métricas del servicio"
        intro="Sesiones, horas y calificaciones de las mentorías. Descarga el reporte consolidado cuando lo necesites."
      />
      <Tarjeta>
        <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
        {resumen && <MetricasSesiones sesiones={resumen.sesiones} />}
        <ExportarReporte />
      </Tarjeta>
    </>
  )
}

export default MetricasPage
