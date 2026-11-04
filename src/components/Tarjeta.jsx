// Contenedor reutilizable: en Django equivale a un {% block %} que se rellena desde fuera.
function Tarjeta({ id, titulo, descripcion = '', children }) {
  return (
    <section className="tarjeta" id={id}>
      <header className="tarjeta-cabecera">
        <h2>{titulo}</h2>
        {descripcion && <p>{descripcion}</p>}
      </header>
      {children}
    </section>
  )
}

export default Tarjeta
