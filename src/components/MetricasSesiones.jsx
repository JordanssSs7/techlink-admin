// Métricas del servicio calculadas por la API a partir de la tabla de sesiones.
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

  const porcentaje = Math.round((sesiones.confirmadas / sesiones.total) * 100)

  return (
    <div className="metricas">
      <div className="metrica">
        <p className="kpi-titulo">Sesiones confirmadas vs canceladas</p>
        <div className="progreso">
          <div className="progreso-ok" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="texto-suave">
          {sesiones.confirmadas} confirmadas · {sesiones.canceladas} canceladas ({porcentaje}% confirmadas)
        </p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Horas de mentoría</p>
        <p className="metrica-valor">{sesiones.horas_confirmadas} h</p>
        <p className="texto-suave">{sesiones.proximas} sesiones próximas</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Estudiantes atendidos</p>
        <p className="metrica-valor">{sesiones.estudiantes_atendidos}</p>
      </div>
    </div>
  )
}

export default MetricasSesiones
