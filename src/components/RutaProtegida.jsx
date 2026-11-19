import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import LayoutAdmin from './LayoutAdmin'

// Solo deja ver las pantallas del panel a quien ya inició sesión; si no, lo lleva al inicio de sesión.
function RutaProtegida() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <LayoutAdmin />
}

export default RutaProtegida
