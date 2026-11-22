import { useEffect, useState } from 'react'
import api from '../api'
import { mensajeDeError } from '../errores'
import { formatearFechaHora } from '../formatos'
import useApi from '../hooks/useApi'
import Aviso from './Aviso'
import EstadoCarga from './EstadoCarga'

// Quita la arroba y los espacios y pasa a minúsculas: lo mismo que hace la API al guardar.
const normalizar = (texto) => texto.trim().toLowerCase().replace(/^@+/, '')

function Formulario({ datos, onGuardado }) {
  const [dominio, setDominio] = useState(datos.dominio_permitido)
  const [intentos, setIntentos] = useState(String(datos.max_intentos))
  const [bloqueo, setBloqueo] = useState(String(datos.minutos_bloqueo))
  const [impacto, setImpacto] = useState(null)
  const [entiendo, setEntiendo] = useState(false)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [minIntentos, maxIntentos] = datos.limites.intentos
  const [minBloqueo, maxBloqueo] = datos.limites.minutos_bloqueo
  const dominioNuevo = normalizar(dominio)
  const cambiaDominio = dominioNuevo !== datos.dominio_permitido
  const hayCambios = cambiaDominio || intentos !== String(datos.max_intentos) || bloqueo !== String(datos.minutos_bloqueo)

  // Avisa cuántos usuarios dejarían de poder entrar con el dominio escrito (espera un momento tras cada tecla).
  useEffect(() => {
    if (!cambiaDominio || dominioNuevo.length < 3) return undefined
    const control = new AbortController()
    const espera = setTimeout(async () => {
      try {
        const r = await api.get('/parametros-seguridad/impacto/', { params: { dominio: dominioNuevo }, signal: control.signal })
        setImpacto({ dominio: dominioNuevo, afectados: r.data.usuarios_afectados })
      } catch {
        // Si no se pudo calcular (o se canceló por otra tecla), no se muestra el aviso.
      }
    }, 400)
    return () => {
      control.abort()
      clearTimeout(espera)
    }
  }, [cambiaDominio, dominioNuevo])

  const afectados = cambiaDominio && impacto?.dominio === dominioNuevo ? impacto.afectados : 0
  const necesitaConfirmar = afectados > 0

  async function guardar(e) {
    e.preventDefault()
    setMensaje('')
    const nuevos = {}
    if (!dominioNuevo) nuevos.dominio_permitido = 'Escribe el dominio institucional.'
    if (!/^\d+$/.test(intentos)) nuevos.max_intentos = 'Escribe un número entero.'
    if (!/^\d+$/.test(bloqueo)) nuevos.minutos_bloqueo = 'Escribe un número entero de minutos.'
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos)
      return
    }
    setErrores({})
    setEnviando(true)
    try {
      const r = await api.put('/parametros-seguridad/', {
        dominio_permitido: dominioNuevo,
        max_intentos: Number(intentos),
        minutos_bloqueo: Number(bloqueo),
      })
      setEntiendo(false)
      onGuardado(r.data)
    } catch (err) {
      const campos = err.response?.status === 400 ? err.response.data : null
      if (campos && typeof campos === 'object') {
        setErrores(Object.fromEntries(Object.entries(campos).map(([c, v]) => [c, [].concat(v).join(' ')])))
      } else {
        setMensaje(mensajeDeError(err, 'No se pudieron guardar los parámetros.'))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="form-charla" onSubmit={guardar}>
      <h3 className="form-charla-titulo">Reglas de acceso</h3>

      <label className="campo-form campo-ancho">
        Dominio institucional permitido
        <input value={dominio} maxLength={100} onChange={(e) => setDominio(e.target.value)} placeholder="tecsup.edu.pe" aria-invalid={Boolean(errores.dominio_permitido)} />
        <small className="texto-suave">
          Solo los estudiantes y mentores con un correo @{dominioNuevo || 'dominio'} pueden entrar con Google. Los administradores entran con contraseña, de cualquier dominio.
        </small>
        {errores.dominio_permitido && <small className="error">{errores.dominio_permitido}</small>}
      </label>

      {necesitaConfirmar && (
        <div className="campo-ancho aviso-peligro" role="alert">
          <p>
            <strong>Atención:</strong> {afectados} {afectados === 1 ? 'estudiante o mentor activo tiene' : 'estudiantes y mentores activos tienen'} un correo que no es de @{dominioNuevo} y {afectados === 1 ? 'no podría' : 'no podrían'} volver a iniciar sesión.
          </p>
          <label className="campo-check">
            <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
            Entiendo el efecto y quiero guardar este dominio.
          </label>
        </div>
      )}

      <label className="campo-form">
        Intentos fallidos antes de bloquear
        <input type="number" inputMode="numeric" min={minIntentos} max={maxIntentos} value={intentos} onChange={(e) => setIntentos(e.target.value)} aria-invalid={Boolean(errores.max_intentos)} />
        <small className="texto-suave">De {minIntentos} a {maxIntentos}.</small>
        {errores.max_intentos && <small className="error">{errores.max_intentos}</small>}
      </label>
      <label className="campo-form">
        Minutos de bloqueo
        <input type="number" inputMode="numeric" min={minBloqueo} max={maxBloqueo} value={bloqueo} onChange={(e) => setBloqueo(e.target.value)} aria-invalid={Boolean(errores.minutos_bloqueo)} />
        <small className="texto-suave">De {minBloqueo} a {maxBloqueo} minutos (un día).</small>
        {errores.minutos_bloqueo && <small className="error">{errores.minutos_bloqueo}</small>}
      </label>

      <div className="acciones campo-ancho">
        <button type="submit" className="btn btn-primario" disabled={enviando || !hayCambios || (necesitaConfirmar && !entiendo)}>
          {enviando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {hayCambios && (
          <button
            type="button"
            className="btn btn-borde"
            onClick={() => {
              setDominio(datos.dominio_permitido)
              setIntentos(String(datos.max_intentos))
              setBloqueo(String(datos.minutos_bloqueo))
              setErrores({})
              setEntiendo(false)
            }}
          >
            Descartar
          </button>
        )}
      </div>
      {mensaje && <p className="error campo-ancho">{mensaje}</p>}
    </form>
  )
}

// Parámetros de seguridad del sistema (HU-60): pide GET /parametros-seguridad/ y los guarda con PUT. Los cambios rigen en
// los siguientes inicios de sesión.
function ParametrosSeguridad() {
  const { datos, setDatos, cargando, error, recargar } = useApi('/parametros-seguridad/')
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  function guardado(nuevos) {
    setDatos(nuevos)
    setAviso({
      texto: nuevos.sin_cambios ? 'No había cambios que guardar.' : 'Parámetros guardados. Rigen desde el siguiente inicio de sesión.',
      tipo: 'ok',
    })
  }

  return (
    <>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} texto="Cargando parámetros..." />
      {aviso && <Aviso texto={aviso.texto} tipo={aviso.tipo} />}
      {!cargando && !error && datos && (
        <>
          <Formulario key={datos.fecha_actualizacion} datos={datos} onGuardado={guardado} />
          <p className="texto-suave">
            Última actualización: {formatearFechaHora(datos.fecha_actualizacion)}
            {datos.actualizado_por ? ` por ${datos.actualizado_por}` : ''}.
          </p>
        </>
      )}
    </>
  )
}

export default ParametrosSeguridad
