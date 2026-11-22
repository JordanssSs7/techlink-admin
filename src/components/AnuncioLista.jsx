import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import { formatearFechaHora } from '../formatos'
import useApi from '../hooks/useApi'
import AnuncioForm from './AnuncioForm'
import Aviso from './Aviso'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'

const TAMANO_PAGINA = 10

// Padre de la sección de anuncios (HU-57): lista los anuncios publicados por páginas con los filtros como parámetros y
// publica uno nuevo con POST /anuncios/. Un anuncio publicado no se edita ni se elimina.
function AnuncioLista() {
  const [busqueda, setBusqueda] = useState('')
  const [rolDestino, setRolDestino] = useState('')
  const [pagina, setPagina] = useState(1)
  const [formulario, setFormulario] = useState(false)
  const [aviso, setAviso] = useState(null)

  function cambiarFiltro(setter) {
    return (valor) => {
      setter(valor)
      setPagina(1)
    }
  }

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (busqueda.trim()) params.search = busqueda.trim()
  if (rolDestino) params.rol_destino = rolDestino
  const { datos, cargando, error, recargar } = useApi('/anuncios/', params)
  const { datos: alcance, recargar: recargarAlcance } = useApi('/anuncios/alcance/')
  const anuncios = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  async function publicar(cuerpo) {
    try {
      const respuesta = await api.post('/anuncios/', cuerpo)
      const n = respuesta.data.destinatarios
      setAviso({ texto: `Anuncio publicado: llegó a ${n} ${n === 1 ? 'usuario' : 'usuarios'}.`, tipo: 'ok' })
      setFormulario(false)
      setPagina(1)
      recargar()
      recargarAlcance()
      return ''
    } catch (err) {
      return mensajeDeError(err, 'No se pudo publicar el anuncio.')
    }
  }

  const hayFiltros = busqueda.trim() !== '' || rolDestino !== ''

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder="Buscar por título o mensaje..." />
        <select value={rolDestino} onChange={(e) => cambiarFiltro(setRolDestino)(e.target.value)} aria-label="Filtrar por destino">
          <option value="">Todos los destinos</option>
          <option value="ESTUDIANTE">Estudiantes</option>
          <option value="MENTOR">Mentores</option>
          <option value="TODOS">Estudiantes y mentores</option>
        </select>
        <button className="btn btn-primario" onClick={() => setFormulario(true)} disabled={formulario}>
          Nuevo anuncio
        </button>
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? 'anuncio' : 'anuncios'}`}</span>
      </div>

      {formulario && <AnuncioForm alcance={alcance} onPublicar={publicar} onCancelar={() => setFormulario(false)} />}

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando anuncios..." />

      {!cargando && !error && anuncios.length === 0 && (
        <p className="vacio">{hayFiltros ? 'Ningún anuncio coincide con los filtros.' : 'Todavía no hay anuncios. Publica el primero con "Nuevo anuncio".'}</p>
      )}

      {!cargando && !error && anuncios.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Anuncio</th>
                <th>Dirigido a</th>
                <th>Llegó a</th>
                <th>Publicó</th>
              </tr>
            </thead>
            <tbody>
              {anuncios.map((a) => (
                <tr key={a.id}>
                  <td>{formatearFechaHora(a.fecha_creacion)}</td>
                  <td className="texto-tabla">
                    <strong>{a.titulo}</strong>
                    <p>{a.mensaje}</p>
                  </td>
                  <td>
                    <span className="etiqueta gris">{a.rol_destino_texto}</span>
                  </td>
                  <td>{a.destinatarios}</td>
                  <td>{a.admin_nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}
    </>
  )
}

export default AnuncioLista
