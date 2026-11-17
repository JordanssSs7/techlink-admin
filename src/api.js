import axios from 'axios'

// Única instancia de Axios del panel: la dirección de Django se define aquí
// y los componentes solo escriben la ruta del recurso (por ejemplo, '/cursos/').
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  timeout: 8000,
})

export default api
