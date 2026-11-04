import Icono from './Icono'

function KpiCard({ titulo, valor, detalle, icono, color = 'azul' }) {
  return (
    <article className="kpi">
      <span className={`kpi-icono ${color}`}>
        <Icono nombre={icono} />
      </span>
      <div>
        <p className="kpi-titulo">{titulo}</p>
        <p className="kpi-valor">{valor}</p>
        <p className="kpi-detalle">{detalle}</p>
      </div>
    </article>
  )
}

export default KpiCard
