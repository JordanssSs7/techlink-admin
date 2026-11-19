// Contenedor reutilizable: en Django equivale a un {% block %} que se rellena desde fuera.
// Sin título ni descripción, solo envuelve el contenido (por ejemplo, el de una pantalla completa).
function Tarjeta({ id, titulo = '', descripcion = '', children }) {
  return (
    <section className="tarjeta" id={id}>
      {(titulo || descripcion) && (
        <header className="tarjeta-cabecera">
          {titulo && <h2>{titulo}</h2>}
          {descripcion && <p>{descripcion}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export default Tarjeta
