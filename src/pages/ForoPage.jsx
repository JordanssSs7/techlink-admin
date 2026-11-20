import { useState } from 'react'
import EncabezadoPagina from '../components/EncabezadoPagina'
import PublicacionLista from '../components/PublicacionLista'
import Tarjeta from '../components/Tarjeta'

const PESTANAS = [
  { id: 'consultas', texto: 'Consultas' },
  { id: 'respuestas', texto: 'Respuestas' },
  { id: 'recursos', texto: 'Recursos' },
]

// Pantalla /foro — Moderación de las consultas y respuestas del foro y de los recursos que comparten los mentores
// (API /api/foro/consultas/, /api/foro/respuestas/ y /api/recursos/). HU-54.
function ForoPage() {
  const [pestana, setPestana] = useState('consultas')

  return (
    <>
      <EncabezadoPagina
        etiqueta="Moderación"
        titulo="Foro y recursos"
        intro="Oculta lo que sea inapropiado o ajeno a lo académico. Al ocultar se le envía el motivo al autor y deja de verse en la aplicación; se puede mostrar de nuevo."
      />
      <Tarjeta>
        <div className="pestanas" role="tablist" aria-label="Qué moderar">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              className={pestana === p.id ? 'activa' : ''}
              onClick={() => setPestana(p.id)}
            >
              {p.texto}
            </button>
          ))}
        </div>
        <PublicacionLista key={pestana} tipo={pestana} />
      </Tarjeta>
    </>
  )
}

export default ForoPage
