// Resumen, hermano del listado: todo se calcula con los cursos recibidos de la API, sin useState.
// PROPS RECIBIDOS: solo cursos; los totales de abajo son datos derivados y se recalculan en cada render.
function CursoResumen({ cursos }) {
  const activos = cursos.filter((c) => c.activo).length
  const inactivos = cursos.length - activos
  const conMentor = cursos.filter((c) => c.total_mentores > 0).length
  const solicitudes = cursos.reduce((suma, c) => suma + c.total_estudiantes, 0)

  return (
    <div className="resumen-cursos">
      <div className="metrica">
        <p className="kpi-titulo">Cursos en la lista</p>
        <p className="metrica-valor">{cursos.length}</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Activos / inactivos</p>
        <p className="metrica-valor">
          {activos} <span className="texto-suave">/ {inactivos}</span>
        </p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Cursos con mentor</p>
        <p className="metrica-valor">{conMentor}</p>
      </div>
      <div className="metrica">
        <p className="kpi-titulo">Marcados como críticos</p>
        <p className="metrica-valor">{solicitudes}</p>
      </div>
    </div>
  )
}

export default CursoResumen
