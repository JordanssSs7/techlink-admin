import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import Buscador from './Buscador'
import EstadoCarga from './EstadoCarga'
import Paginacion from './Paginacion'
import PublicacionFila from './PublicacionFila'

const TAMANO_PAGINA = 10

// Cada pestaña de "Foro y recursos" pide una lista distinta a la API de Django (HU-54).
const SECCIONES = {
  consultas: { ruta: '/foro/consultas/', articulo: 'la', ninguno: 'Ninguna', singular: 'consulta', plural: 'consultas', buscar: 'Buscar en consultas, cursos o autores...' },
  respuestas: { ruta: '/foro/respuestas/', articulo: 'la', ninguno: 'Ninguna', singular: 'respuesta', plural: 'respuestas', buscar: 'Buscar en respuestas o autores...' },
  recursos: { ruta: '/recursos/', articulo: 'el', ninguno: 'Ningún', singular: 'recurso', plural: 'recursos', buscar: 'Buscar en recursos, cursos o mentores...' },
}

// Padre de una pestaña de moderación del foro y los recursos (HU-54): pide la lista por páginas con los filtros como
// parámetros y oculta (con motivo) o muestra de nuevo con POST /{id}/ocultar/ y /{id}/mostrar/.
function PublicacionLista({ tipo }) {
  const seccion = SECCIONES[tipo]
  const [busqueda, setBusqueda] = useState('')
  const [visibilidad, setVisibilidad] = useState('')
  const [tipoRecurso, setTipoRecurso] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState(null)

  function cambiarFiltro(setter) {
    return (valor) => {
      setter(valor)
      setPagina(1)
    }
  }

  const params = { page: pagina, page_size: TAMANO_PAGINA }
  if (busqueda.trim()) params.search = busqueda.trim()
  if (visibilidad) params.oculto = visibilidad
  if (tipo === 'recursos' && tipoRecurso) params.tipo = tipoRecurso
  const { datos, setDatos, cargando, error, recargar } = useApi(seccion.ruta, params)
  const items = datos?.results ?? []
  const total = datos?.count ?? 0

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  async function cambiar(item, accion, cuerpo, mensajeOk) {
    try {
      const respuesta = await api.post(`${seccion.ruta}${item.id}/${accion}/`, cuerpo)
      // Si se filtra por visibilidad, el elemento sale de la lista; si no, se actualiza en su lugar.
      const quitar = visibilidad !== ''
      setDatos({
        ...datos,
        count: quitar ? total - 1 : total,
        results: quitar ? items.filter((i) => i.id !== item.id) : items.map((i) => (i.id === item.id ? respuesta.data : i)),
      })
      const avisoCorreo =
        accion === 'ocultar'
          ? respuesta.data.autor_notificado
            ? ' Se le avisó al autor por correo.'
            : ' No se pudo enviar el correo al autor (revisa la configuración de correo).'
          : ''
      setAviso({ texto: mensajeOk + avisoCorreo, tipo: accion === 'ocultar' && !respuesta.data.autor_notificado ? 'error' : 'ok' })
      return ''
    } catch (err) {
      if (err.response?.status === 409) recargar()
      return mensajeDeError(err, 'No se pudo hacer el cambio.')
    }
  }

  const hayFiltros = busqueda.trim() !== '' || visibilidad !== '' || tipoRecurso !== ''
  const cabecera = tipo === 'recursos' ? 'Recurso' : tipo === 'consultas' ? 'Consulta' : 'Respuesta'

  return (
    <>
      <div className="barra-filtros">
        <Buscador valor={busqueda} onCambiar={cambiarFiltro(setBusqueda)} placeholder={seccion.buscar} />
        <select value={visibilidad} onChange={(e) => cambiarFiltro(setVisibilidad)(e.target.value)} aria-label="Filtrar por visibilidad">
          <option value="">Visibles y ocultas</option>
          <option value="false">Solo visibles</option>
          <option value="true">Solo ocultas</option>
        </select>
        {tipo === 'recursos' && (
          <select value={tipoRecurso} onChange={(e) => cambiarFiltro(setTipoRecurso)(e.target.value)} aria-label="Filtrar por tipo de recurso">
            <option value="">Todos los tipos</option>
            <option value="ARCHIVO">Archivos</option>
            <option value="ENLACE">Enlaces</option>
            <option value="CODIGO">Código</option>
          </select>
        )}
        <span className="texto-suave">{cargando ? 'Cargando...' : `${total} ${total === 1 ? seccion.singular : seccion.plural}`}</span>
      </div>

      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto={`Cargando ${seccion.plural}...`} />

      {!cargando && !error && items.length === 0 && (
        <p className="vacio">{hayFiltros ? `${seccion.ninguno} ${seccion.singular} coincide con los filtros.` : `Todavía no hay ${seccion.plural}.`}</p>
      )}

      {!cargando && !error && items.length > 0 && (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Autor</th>
                <th>{cabecera}</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <PublicacionFila
                  key={item.id}
                  tipo={tipo}
                  item={item}
                  onOcultar={(motivo) => cambiar(item, 'ocultar', { motivo }, `Se ocultó ${seccion.articulo} ${seccion.singular}.`)}
                  onMostrar={() => cambiar(item, 'mostrar', {}, `${seccion.articulo === 'la' ? 'La' : 'El'} ${seccion.singular} se muestra de nuevo.`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Paginacion pagina={pagina} total={total} tamano={TAMANO_PAGINA} onCambiar={setPagina} />}
    </>
  )
}

export default PublicacionLista
