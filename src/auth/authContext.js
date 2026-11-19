import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// Datos de la sesión del administrador: { usuario, login, logout }.
export function useAuth() {
  return useContext(AuthContext)
}
