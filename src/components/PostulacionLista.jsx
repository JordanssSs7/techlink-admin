import PostulacionCard from './PostulacionCard'

function PostulacionLista({ postulaciones }) {
  return (
    <div className="grid">
      {postulaciones.map((p) => (
        <PostulacionCard
          key={p.id}
          postulante={p.postulante}
          ciclo={p.ciclo}
          cursos={p.cursos_aprobados}
          comprobante={p.comprobante}
        />
      ))}
    </div>
  )
}

export default PostulacionLista
