// Cabecera de cada pantalla del panel: una etiqueta pequeña, el título grande y una explicación corta.
function EncabezadoPagina({ etiqueta, titulo, intro = '' }) {
  return (
    <header className="pagina-cabecera">
      <p className="eyebrow">{etiqueta}</p>
      <h1>{titulo}</h1>
      {intro && <p className="pagina-intro">{intro}</p>}
    </header>
  )
}

export default EncabezadoPagina
