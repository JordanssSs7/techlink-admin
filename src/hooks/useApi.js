import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api'

// Pide un recurso a la API de Django con GET y guarda la respuesta, la carga y el error.
// Vuelve a pedirlo cuando cambian los parámetros o cuando se llama a recargar().
// La limpieza cancela la petición pendiente si llega otra antes de que termine.
export default function useApi(ruta, params = {}) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const clave = JSON.stringify(params)

  useEffect(() => {
    const control = new AbortController()

    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const respuesta = await api.get(ruta, { params: JSON.parse(clave), signal: control.signal })
        setDatos(respuesta.data)
      } catch (err) {
        if (axios.isCancel(err)) return
        setError('No se pudieron cargar los datos. Verifica que el servidor de Django esté encendido.')
      } finally {
        if (!control.signal.aborted) setCargando(false)
      }
    }

    cargar()
    return () => control.abort()
  }, [ruta, clave, intento])

  return { datos, setDatos, cargando, error, recargar: () => setIntento((n) => n + 1) }
}
