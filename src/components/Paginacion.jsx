// Controles de paginación: el padre guarda la página actual y pide los datos con ese número.
function Paginacion({ pagina, total, tamano, onCambiar }) {
  const paginas = Math.max(1, Math.ceil(total / tamano))
  if (total <= tamano) return null

  return (
    <nav className="paginacion" aria-label="Paginación">
      <button className="btn btn-borde" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        ← Anterior
      </button>
      <span className="texto-suave">
        Página {pagina} de {paginas}
      </span>
      <button className="btn btn-borde" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>
        Siguiente →
      </button>
    </nav>
  )
}

export default Paginacion
