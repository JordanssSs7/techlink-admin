import { usuarios, registrosSemanales, postulaciones, mentores } from './datos'
import Sidebar from './components/Sidebar'
import Tarjeta from './components/Tarjeta'
import KpiCard from './components/KpiCard'
import GraficoBarras from './components/GraficoBarras'
import UsuarioLista from './components/UsuarioLista'
import PostulacionLista from './components/PostulacionLista'
import PanelCursos from './components/PanelCursos'
import MentorCard from './components/MentorCard'
import MetricasSesiones from './components/MetricasSesiones'

function App() {
  const estudiantes = usuarios.filter((u) => u.rol === 'Estudiante').length
  const mentoresActivos = usuarios.filter((u) => u.rol === 'Mentor' && u.activo).length
  const registrosMes = registrosSemanales.slice(-4).reduce((suma, s) => suma + s.total, 0)
  const todasSesiones = mentores.flatMap((m) => m.sesiones)

  return (
    <div className="app">
      <Sidebar />
      <main>
        <header className="portada">
          <h1>Panel de administración</h1>
          <p>Gestiona usuarios, mentores, cursos y el impacto de las mentorías en TechLink.</p>
        </header>

        <section id="resumen" className="kpis">
          <KpiCard titulo="Estudiantes inscritos" valor={estudiantes} detalle="Cuentas de estudiantes" icono="usuarios" />
          <KpiCard titulo="Mentores activos" valor={mentoresActivos} detalle="Acreditados y activos" icono="estrella" color="verde" />
          <KpiCard titulo="Registros del mes" valor={registrosMes} detalle="Últimas 4 semanas" icono="grafico" color="ambar" />
          <KpiCard titulo="Postulaciones" valor={postulaciones.length} detalle="En revisión" icono="archivo" color="rojo" />
        </section>

        <Tarjeta titulo="Crecimiento de registros" descripcion="Nuevos usuarios registrados por semana.">
          <GraficoBarras datos={registrosSemanales} />
        </Tarjeta>

        <Tarjeta id="usuarios" titulo="Usuarios y roles" descripcion="Busca, cambia el rol, activa o desactiva cuentas.">
          <UsuarioLista usuarios={usuarios} />
        </Tarjeta>

        <Tarjeta id="postulaciones" titulo="Postulaciones a mentor" descripcion="Evalúa los comprobantes y aprueba o rechaza con motivo.">
          <PostulacionLista postulaciones={postulaciones} />
        </Tarjeta>

        <Tarjeta id="cursos" titulo="Cursos críticos" descripcion="Registra, busca, inactiva o elimina los cursos del plan de estudios.">
          <PanelCursos />
        </Tarjeta>

        <Tarjeta id="mentorias" titulo="Mentorías por mentor" descripcion="Cada mentor con sus sesiones y horas impartidas.">
          <div className="grid">
            {mentores.map((m) => (
              <MentorCard key={m.id} nombre={m.nombre} sesiones={m.sesiones} />
            ))}
          </div>
        </Tarjeta>

        <Tarjeta id="metricas" titulo="Métricas del servicio" descripcion="Impacto global de las mentorías.">
          <MetricasSesiones sesiones={todasSesiones} />
        </Tarjeta>
      </main>
    </div>
  )
}

export default App
