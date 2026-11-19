import ContadorAnimado from './ContadorAnimado'
import Icono from './Icono'

// Tarjeta de indicador. Con oscuro={true} es la tarjeta negra de énfasis; el valor numérico se cuenta con una animación.
function KpiCard({ titulo, valor, detalle, icono, oscuro = false }) {
  return (
    <article className={oscuro ? 'kpi kpi-oscuro' : 'kpi'}>
      <span className="kpi-icono">
        <Icono nombre={icono} />
      </span>
      <div>
        <p className="kpi-titulo">{titulo}</p>
        <p className="kpi-valor">
          <ContadorAnimado valor={valor} />
        </p>
        <p className="kpi-detalle">{detalle}</p>
      </div>
    </article>
  )
}

export default KpiCard
