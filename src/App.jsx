import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'
import CharlasPage from './pages/CharlasPage'
import CursosPage from './pages/CursosPage'
import DemandaPage from './pages/DemandaPage'
import EmparejamientoPage from './pages/EmparejamientoPage'
import ForoPage from './pages/ForoPage'
import HistorialPage from './pages/HistorialPage'
import LoginPage from './pages/LoginPage'
import MentoriasPage from './pages/MentoriasPage'
import MetricasPage from './pages/MetricasPage'
import ModeracionPage from './pages/ModeracionPage'
import PostulacionesPage from './pages/PostulacionesPage'
import ReportesPage from './pages/ReportesPage'
import ResumenPage from './pages/ResumenPage'
import SesionesPage from './pages/SesionesPage'
import UsuariosPage from './pages/UsuariosPage'

// Una ruta por opción del menú (mapa de rutas del README).
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RutaProtegida />}>
        <Route index element={<ResumenPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="postulaciones" element={<PostulacionesPage />} />
        <Route path="cursos" element={<CursosPage />} />
        <Route path="mentorias" element={<MentoriasPage />} />
        <Route path="sesiones" element={<SesionesPage />} />
        <Route path="metricas" element={<MetricasPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="moderacion" element={<ModeracionPage />} />
        <Route path="foro" element={<ForoPage />} />
        <Route path="demanda" element={<DemandaPage />} />
        <Route path="emparejamiento" element={<EmparejamientoPage />} />
        <Route path="charlas" element={<CharlasPage />} />
        <Route path="historial" element={<HistorialPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
