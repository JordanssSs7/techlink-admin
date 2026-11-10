// Campo de búsqueda controlado: el texto vive en el padre y aquí solo se avisa del cambio.
function Buscador({ valor, onCambiar, placeholder = 'Buscar...' }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
    />
  )
}

export default Buscador
