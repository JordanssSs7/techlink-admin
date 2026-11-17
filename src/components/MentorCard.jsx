import SesionItem from './SesionItem'

// Tarjeta de un mentor con su perfil y sus sesiones (relación 1:N).
function MentorCard({ mentor }) {
  const confirmadas = mentor.sesiones.filter((s) => s.estado === 'CONFIRMADA')
  const totalHoras = confirmadas.reduce((suma, s) => suma + s.horas, 0)

  return (
    <article className="mentor">
      <header>
        <div>
          <h3>{mentor.nombre}</h3>
          <p className="texto-suave">{mentor.especialidad || 'Sin especialidad registrada'}</p>
        </div>
        <span className="etiqueta azul">{totalHoras} h</span>
      </header>

      {mentor.cursos.length > 0 && (
        <ul className="chips">
          {mentor.cursos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}

      <p className="texto-suave">
        Fortalezas: {mentor.fortalezas.join(', ') || '—'} · {mentor.horarios_activos} horarios disponibles
      </p>

      {mentor.sesiones.length === 0 ? (
        <p className="texto-suave">Sin sesiones registradas.</p>
      ) : (
        <ul>
          {mentor.sesiones.map((s) => (
            <SesionItem key={s.id} sesion={s} />
          ))}
        </ul>
      )}
    </article>
  )
}

export default MentorCard
