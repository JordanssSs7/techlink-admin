import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'
import CursosPage from './pages/CursosPage'
import LoginPage from './pages/LoginPage'
import MentoriasPage from './pages/MentoriasPage'
import MetricasPage from './pages/MetricasPage'
import PostulacionesPage from './pages/PostulacionesPage'
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
