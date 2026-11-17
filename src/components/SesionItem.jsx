// Una sesión de mentoría: estudiante, fecha, horario y estado.
function SesionItem({ sesion }) {
  const confirmada = sesion.estado === 'CONFIRMADA'

  return (
    <li className="sesion">
      <div>
        <strong>{sesion.estudiante}</strong>
        <span className="texto-suave">
          {' '}
          · {sesion.fecha} · {sesion.hora_inicio}–{sesion.hora_fin}
        </span>
      </div>
      <div className="sesion-derecha">
        <span>{sesion.horas} h</span>
        <span className={confirmada ? 'etiqueta verde' : 'etiqueta rojo'}>{confirmada ? 'Confirmada' : 'Cancelada'}</span>
      </div>
    </li>
  )
}

export default SesionItem
