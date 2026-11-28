import { Link } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import useApi from '../hooks/useApi'
import EncabezadoPagina from '../components/EncabezadoPagina'
import Icono from '../components/Icono'
import { GRUPOS } from '../menu'

// Pantalla / — Inicio del panel: un saludo, lo que está pendiente y accesos ordenados por tema (los datos numéricos están en Métricas).
function ResumenPage() {
  const { usuario } = useAuth()
  const { datos: constancias } = useApi('/constancias/resumen/')
  const primerNombre = (usuario.nombres || '').split(' ')[0]
  const pendientes = constancias?.pendientes ?? 0

  return (
    <>
      <EncabezadoPagina
        etiqueta="Panel de administración"
        titulo={`Hola, ${primerNombre}.`}
        intro="Elige a dónde quieres ir. Las cifras y gráficos del servicio están en Métricas."
      />

      {pendientes > 0 && (
        <Link to="/constancias" className="inicio-aviso">
          <span><strong>{pendientes} {pendientes === 1 ? 'constancia espera' : 'constancias esperan'}</strong> que las emitas</span>
          <span aria-hidden="true">Ir a Constancias →</span>
        </Link>
      )}

      {GRUPOS.map((g, i) => (
        <section key={g.id} className="inicio-grupo" style={{ '--i': i }} aria-label={g.titulo}>
          <h2>{g.titulo}</h2>
          <div className="inicio-rejilla">
            {g.enlaces.map((e) => (
              <Link key={e.ruta} to={e.ruta} className="inicio-acceso">
                <span className="inicio-acceso-cab"><Icono nombre={e.icono} tam={18} />{e.texto}</span>
                <p>{e.desc}</p>
                <span className="inicio-flecha" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default ResumenPage
