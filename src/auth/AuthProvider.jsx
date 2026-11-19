import { useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { borrarSesion, guardarSesion, leerSesion, tomarSesionDeLaUrl } from './sesion'

// Guarda quién inició sesión. Los componentes lo leen con useAuth().
// Si el administrador llega desde la aplicación de usuario, su sesión viene en la URL y no vuelve a pedir la contraseña.
function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => tomarSesionDeLaUrl() ?? leerSesion())

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      login: (respuesta) => {
        const nueva = { token: respuesta.token, usuario: respuesta.usuario }
        guardarSesion(nueva)
        setSesion(nueva)
      },
      logout: () => {
        borrarSesion()
        setSesion(null)
      },
    }),
    [sesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export default AuthProvider
