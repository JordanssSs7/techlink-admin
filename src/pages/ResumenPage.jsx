import { useAuth } from '../auth/authContext'
import useApi from '../hooks/useApi'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import GraficoBarras from '../components/GraficoBarras'
import KpiCard from '../components/KpiCard'
import Tarjeta from '../components/Tarjeta'

// Pantalla / — Dashboard con los KPI del servicio (GET /api/metricas/resumen/).
function ResumenPage() {
  const { usuario } = useAuth()
  const { datos: resumen, cargando, error, recargar } = useApi('/metricas/resumen/')
  const valor = (campo) => (resumen ? resumen[campo] : '—')
  const primerNombre = (usuario.nombres || '').split(' ')[0]

  return (
    <>
      <EncabezadoPagina
        etiqueta="Panel de administración"
        titulo={`Hola, ${primerNombre}.`}
        intro="Así está TechLink hoy. Elige una opción del menú para gestionar usuarios, postulaciones, cursos y sesiones."
      />

      <section className="kpis">
        <KpiCard oscuro titulo="Estudiantes" valor={valor('estudiantes')} detalle="Cuentas de estudiantes" icono="usuarios" />
        <KpiCard titulo="Mentores activos" valor={valor('mentores_activos')} detalle="Con cuenta activa" icono="estrella" />
        <KpiCard titulo="Registros del mes" valor={valor('registros_ultimas_4_semanas')} detalle="Últimas 4 semanas" icono="grafico" />
        <KpiCard titulo="Cursos activos" valor={valor('cursos_activos')} detalle="En el catálogo" icono="libro" />
      </section>

      <Tarjeta titulo="Crecimiento de registros" descripcion="Nuevos usuarios registrados por semana (lunes de cada semana).">
        <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
        {resumen && <GraficoBarras datos={resumen.registros_semanales} />}
      </Tarjeta>
    </>
  )
}

export default ResumenPage
