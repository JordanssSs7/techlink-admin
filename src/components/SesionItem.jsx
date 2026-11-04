function SesionItem({ curso, fecha, horas, calificacion, estado }) {
  const completada = estado === 'Completada'

  return (
    <li className="sesion">
      <div>
        <strong>{curso}</strong>
        <span className="texto-suave"> · {fecha}</span>
      </div>
      <div className="sesion-derecha">
        <span>{horas} h</span>
        <span className="estrellas">{completada ? '★'.repeat(calificacion) : '—'}</span>
        <span className={completada ? 'etiqueta verde' : 'etiqueta rojo'}>{estado}</span>
      </div>
    </li>
  )
}

export default SesionItem
