import { postulaciones } from './datos'
import useApi from './hooks/useApi'
import Sidebar from './components/Sidebar'
import Tarjeta from './components/Tarjeta'
import KpiCard from './components/KpiCard'
import GraficoBarras from './components/GraficoBarras'
import EstadoCarga from './components/EstadoCarga'
import UsuarioLista from './components/UsuarioLista'
import PostulacionLista from './components/PostulacionLista'
import PanelCursos from './components/PanelCursos'
import PanelMentorias from './components/PanelMentorias'
import MetricasSesiones from './components/MetricasSesiones'

function App() {
  // Los indicadores, el gráfico y las métricas salen de un solo endpoint de la API.
  const { datos: resumen, cargando, error, recargar } = useApi('/metricas/resumen/')
  const valor = (campo) => (resumen ? resumen[campo] : '—')

  return (
    <div className="app">
      <Sidebar />
      <main>
        <header className="portada">
          <h1>Panel de administración</h1>
          <p>Gestiona usuarios, mentores, cursos y el impacto de las mentorías en TechLink.</p>
        </header>

        <section id="resumen" className="kpis">
          <KpiCard titulo="Estudiantes" valor={valor('estudiantes')} detalle="Cuentas de estudiantes" icono="usuarios" />
          <KpiCard titulo="Mentores activos" valor={valor('mentores_activos')} detalle="Con cuenta activa" icono="estrella" color="verde" />
          <KpiCard titulo="Registros del mes" valor={valor('registros_ultimas_4_semanas')} detalle="Últimas 4 semanas" icono="grafico" color="ambar" />
          <KpiCard titulo="Cursos activos" valor={valor('cursos_activos')} detalle="En el catálogo" icono="libro" color="rojo" />
        </section>

        <Tarjeta titulo="Crecimiento de registros" descripcion="Nuevos usuarios registrados por semana (lunes de cada semana).">
          <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
          {resumen && <GraficoBarras datos={resumen.registros_semanales} />}
        </Tarjeta>

        <Tarjeta id="usuarios" titulo="Usuarios y roles" descripcion="Busca, cambia el rol, activa o desactiva cuentas de la base compartida.">
          <UsuarioLista />
        </Tarjeta>

        <Tarjeta
          id="postulaciones"
          titulo="Postulaciones a mentor"
          descripcion="Datos de prueba: la tabla de postulaciones todavía no existe en la base compartida."
        >
          <PostulacionLista postulaciones={postulaciones} />
        </Tarjeta>

        <Tarjeta id="cursos" titulo="Cursos" descripcion="Catálogo de cursos de la carrera, cargado desde la API de Django.">
          <PanelCursos />
        </Tarjeta>

        <Tarjeta id="mentorias" titulo="Mentorías por mentor" descripcion="Perfil de cada mentor con sus cursos, horarios y sesiones.">
          <PanelMentorias />
        </Tarjeta>

        <Tarjeta id="metricas" titulo="Métricas del servicio" descripcion="Impacto global de las mentorías.">
          <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
          {resumen && <MetricasSesiones sesiones={resumen.sesiones} />}
        </Tarjeta>
      </main>
    </div>
  )
}

export default App
