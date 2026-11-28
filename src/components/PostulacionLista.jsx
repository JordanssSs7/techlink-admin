import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import EstadoCarga from './EstadoCarga'
import PostulacionCard from './PostulacionCard'
import Seleccion from './Seleccion'

const FILTROS = [
  { valor: 'EN_REVISION', texto: 'En revisión' },
  { valor: 'APROBADA', texto: 'Aprobadas' },
  { valor: 'RECHAZADA', texto: 'Rechazadas' },
  { valor: '', texto: 'Todas' },
]

// Padre de la sección de postulaciones: pide la lista a la API (por defecto las que están en revisión)
// y envía la decisión del administrador con POST /postulaciones/{id}/aprobar/ o /rechazar/.
function PostulacionLista() {
  const [estado, setEstado] = useState('EN_REVISION')
  const [aviso, setAviso] = useState(null)
  const { datos, setDatos, cargando, error, recargar } = useApi('/postulaciones/', estado ? { estado } : {})
  const postulaciones = datos ?? []

  // El aviso se oculta solo a los 3,5 segundos; la limpieza evita ocultar uno más nuevo.
  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 3500)
    return () => clearTimeout(temporizador)
  }, [aviso])

  async function evaluar(p, accion, cuerpo) {
    try {
      const respuesta = await api.post(`/postulaciones/${p.id}/${accion}/`, cuerpo)
      // En la vista "En revisión" la postulación evaluada sale de la lista; en las demás se actualiza.
      setDatos(
        estado === 'EN_REVISION'
          ? postulaciones.filter((x) => x.id !== p.id)
          : postulaciones.map((x) => (x.id === p.id ? respuesta.data : x)),
      )
      setAviso({
        texto: accion === 'aprobar' ? `${p.postulante} ahora es mentor.` : `Se rechazó la postulación de ${p.postulante}.`,
        tipo: 'ok',
      })
      return ''
    } catch (err) {
      // 409: otra persona ya la evaluó; se vuelve a pedir la lista para mostrar su estado real.
      if (err.response?.status === 409) recargar()
      return mensajeDeError(err)
    }
  }

  return (
    <>
      <div className="barra-filtros">
        <Seleccion value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.texto}
            </option>
          ))}
        </Seleccion>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${postulaciones.length} ${postulaciones.length === 1 ? 'postulación' : 'postulaciones'}`}</span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando postulaciones..." />

      {!cargando && !error && postulaciones.length === 0 && (
        <p className="vacio">
          {estado === 'EN_REVISION' ? 'No hay postulaciones pendientes de revisión.' : 'No hay postulaciones en este estado.'}
        </p>
      )}

      {!cargando && !error && (
        <div className="grid">
          {postulaciones.map((p) => (
            <PostulacionCard
              key={p.id}
              postulacion={p}
              onAprobar={() => evaluar(p, 'aprobar', {})}
              onRechazar={(motivo) => evaluar(p, 'rechazar', { motivo })}
            />
          ))}
        </div>
      )}

      <p className="texto-suave nota">
        Al aprobar, la cuenta pasa al rol Mentor y puede registrar sus cursos y su disponibilidad en la aplicación de usuario.
      </p>
    </>
  )
}

export default PostulacionLista
