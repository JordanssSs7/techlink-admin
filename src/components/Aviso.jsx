// Mensaje temporal: el padre decide cuándo aparece, de qué tipo es y cuándo se oculta.
function Aviso({ texto, tipo = 'ok' }) {
  return (
    <p className={tipo === 'error' ? 'aviso aviso-error' : 'aviso'} role="status">
      {texto}
    </p>
  )
}

export default Aviso
