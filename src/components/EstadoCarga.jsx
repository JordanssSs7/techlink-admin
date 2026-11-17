// Muestra el estado de una petición: cargando o error con botón para reintentar.
// Si no hay carga ni error, no dibuja nada y se muestra el contenido normal.
function EstadoCarga({ cargando, error, onReintentar, texto = 'Cargando...' }) {
  if (cargando) return <p className="vacio">{texto}</p>
  if (!error) return null
  return (
    <div className="error-carga" role="alert">
      <p>{error}</p>
      <button className="btn btn-borde" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  )
}

export default EstadoCarga
