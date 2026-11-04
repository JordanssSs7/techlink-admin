import SesionItem from './SesionItem'

function MentorCard({ nombre, sesiones }) {
  const completadas = sesiones.filter((s) => s.estado === 'Completada')
  const totalHoras = completadas.reduce((suma, s) => suma + s.duracion_horas, 0)

  return (
    <article className="mentor">
      <header>
        <h3>{nombre}</h3>
        <span className="etiqueta azul">{totalHoras} h impartidas</span>
      </header>
      <ul>
        {sesiones.map((s) => (
          <SesionItem
            key={s.id}
            curso={s.curso}
            fecha={s.fecha}
            horas={s.duracion_horas}
            calificacion={s.calificacion}
            estado={s.estado}
          />
        ))}
      </ul>
    </article>
  )
}

export default MentorCard
