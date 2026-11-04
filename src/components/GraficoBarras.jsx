function GraficoBarras({ datos }) {
  const maximo = Math.max(...datos.map((d) => d.total))

  return (
    <div className="grafico">
      {datos.map((d) => (
        <div className="barra-col" key={d.semana}>
          <span className="barra-valor">{d.total}</span>
          <div className="barra" style={{ height: `${(d.total / maximo) * 100}%` }} />
          <span className="barra-etiqueta">{d.semana}</span>
        </div>
      ))}
    </div>
  )
}

export default GraficoBarras
