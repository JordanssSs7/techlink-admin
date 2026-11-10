// Mensaje temporal: el padre decide cuándo aparece y cuándo se oculta.
function Aviso({ texto }) {
  return (
    <p className="aviso" role="status">
      {texto}
    </p>
  )
}

export default Aviso
