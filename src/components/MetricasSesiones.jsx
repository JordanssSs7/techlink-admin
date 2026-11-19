// Métricas del servicio calculadas por la API a partir de las tablas de sesiones y calificaciones.
function MetricasSesiones({ sesiones }) {
  if (!sesiones) {
    return (
      <p className="vacio">
        Las métricas de sesiones aparecerán cuando exista la tabla de sesiones (migración V6 del backend de usuario).
      </p>
    )
  }
  if (sesiones.total === 0) {
    return <p className="vacio">Todavía no se ha agendado ninguna sesión.</p>
  }

  // Éxito = sesiones completadas entre las que ya se decidieron (completadas o canceladas).
  const decididas = sesiones.completadas + sesiones.canceladas
  const porcentaje = decididas === 0 ? 0 : Math.round((sesiones.completadas / decididas) * 100)
  const maximo = Math.max(1, ...Object.values(sesiones.por_estrellas))

  return (
    <div className="metricas">
      <div className="metrica">
        <p className="kpi-titulo">Sesiones completadas vs canceladas</p>
        <div className="progreso">
          <div className="progreso-ok" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="texto-suave">
          {sesiones.completadas} completadas · {sesiones.canceladas} canceladas ({porcentaje}% de las finalizadas)
        </p>
        <p className="texto-suave">{sesiones.proximas} sesiones programadas</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Horas impartidas</p>
        <p className="metrica-valor">{sesiones.horas_impartidas} h</p>
        <p className="texto-suave">{sesiones.estudiantes_atendidos} estudiantes atendidos</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Calificación promedio</p>
        <p className="metrica-valor">
          {sesiones.calificacion_promedio ?? '—'} <span className="estrellas">★</span>
        </p>
        <p className="texto-suave">
          {sesiones.total_calificaciones === 0 ? 'Aún no hay calificaciones.' : `${sesiones.total_calificaciones} calificaciones`}
        </p>
        <ul className="distribucion">
          {[5, 4, 3, 2, 1].map((n) => (
            <li key={n}>
              <span>{n}★</span>
              <div className="distribucion-barra">
                <div style={{ width: `${(sesiones.por_estrellas[n] / maximo) * 100}%` }} />
              </div>
              <span>{sesiones.por_estrellas[n]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MetricasSesiones
