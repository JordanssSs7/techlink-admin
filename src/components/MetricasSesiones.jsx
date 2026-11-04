function MetricasSesiones({ sesiones }) {
  const completadas = sesiones.filter((s) => s.estado === 'Completada')
  const canceladas = sesiones.length - completadas.length
  const horas = completadas.reduce((suma, s) => suma + s.duracion_horas, 0)
  const promedio = completadas.reduce((suma, s) => suma + s.calificacion, 0) / completadas.length
  const porcentaje = Math.round((completadas.length / sesiones.length) * 100)

  return (
    <div className="metricas">
      <div className="metrica">
        <p className="kpi-titulo">Sesiones completadas vs canceladas</p>
        <div className="progreso">
          <div className="progreso-ok" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="texto-suave">
          {completadas.length} completadas · {canceladas} canceladas ({porcentaje}% de éxito)
        </p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Horas impartidas</p>
        <p className="metrica-valor">{horas} h</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Calificación promedio</p>
        <p className="metrica-valor">
          {promedio.toFixed(1)} <span className="estrellas">★</span>
        </p>
      </div>
    </div>
  )
}

export default MetricasSesiones
