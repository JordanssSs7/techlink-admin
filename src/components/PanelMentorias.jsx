import useApi from '../hooks/useApi'
import EstadoCarga from './EstadoCarga'
import MentorCard from './MentorCard'

// Sección de mentorías: cada mentor de la base compartida con su perfil y sus sesiones.
function PanelMentorias() {
  const { datos, cargando, error, recargar } = useApi('/mentores/')
  const mentores = datos?.mentores ?? []

  return (
    <>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando mentores..." />

      {!cargando && !error && datos && !datos.sesiones_disponibles && (
        <p className="aviso aviso-ambar">
          La tabla de sesiones todavía no existe en la base local: se crea al ejecutar el backend de usuario con la
          migración V6 (agendamiento, HU-07). Mientras tanto se muestran los perfiles sin sesiones.
        </p>
      )}

      {!cargando && !error && mentores.length === 0 && <p className="vacio">Todavía no hay mentores registrados.</p>}

      {!cargando && !error && (
        <div className="grid">
          {mentores.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      )}
    </>
  )
}

export default PanelMentorias
