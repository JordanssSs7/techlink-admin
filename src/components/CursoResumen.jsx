// Resumen, hermano del listado: todo se calcula a partir de la prop cursos, sin useState.
function CursoResumen({ cursos }) {
  const activos = cursos.filter((c) => c.activo)
  const inactivos = cursos.length - activos.length
  const creditosActivos = activos.reduce((suma, c) => suma + c.creditos, 0)
  const mentorias = cursos.reduce((suma, c) => suma + c.total_mentorias, 0)

  return (
    <div className="resumen-cursos">
      <div className="metrica">
        <p className="kpi-titulo">Cursos registrados</p>
        <p className="metrica-valor">{cursos.length}</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Activos / inactivos</p>
        <p className="metrica-valor">
          {activos.length} <span className="texto-suave">/ {inactivos}</span>
        </p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Créditos en cursos activos</p>
        <p className="metrica-valor">{creditosActivos}</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Mentorías asociadas</p>
        <p className="metrica-valor">{mentorias}</p>
      </div>
    </div>
  )
}

export default CursoResumen
