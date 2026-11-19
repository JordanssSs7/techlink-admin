// Gráfico de barras de registros por semana. Cada barra crece al aparecer, una tras otra (la variable --i da el turno).
function GraficoBarras({ datos }) {
  const maximo = Math.max(1, ...datos.map((d) => d.total))

  return (
    <div className="grafico">
      {datos.map((d, i) => (
        <div className="barra-col" key={d.semana} style={{ '--i': i }}>
          <span className="barra-valor">{d.total}</span>
          <div className="barra" style={{ height: `${(d.total / maximo) * 100}%` }} />
          <span className="barra-etiqueta">{d.semana}</span>
        </div>
      ))}
    </div>
  )
}

export default GraficoBarras
