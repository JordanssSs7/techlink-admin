// Menú del panel agrupado por tema: el menú lateral y el inicio leen de aquí para no repetir la lista.
// Antes eran 18 opciones sueltas; ahora son 5 grupos y solo el grupo abierto muestra sus opciones.
export const INICIO = { ruta: '/', texto: 'Resumen', icono: 'inicio' }

export const GRUPOS = [
  {
    id: 'personas',
    titulo: 'Personas',
    icono: 'usuarios',
    enlaces: [
      { ruta: '/usuarios', texto: 'Usuarios y roles', icono: 'usuarios', desc: 'Busca cuentas, cambia su rol y activa o desactiva su acceso.' },
      { ruta: '/postulaciones', texto: 'Postulaciones', icono: 'archivo', desc: 'Revisa los comprobantes de quienes quieren ser mentores.' },
      { ruta: '/constancias', texto: 'Constancias', icono: 'sello', desc: 'Emite las constancias de los mentores que cumplieron sus horas.' },
    ],
  },
  {
    id: 'academico',
    titulo: 'Académico',
    icono: 'libro',
    enlaces: [
      { ruta: '/cursos', texto: 'Cursos', icono: 'libro', desc: 'Administra el catálogo de cursos.' },
      { ruta: '/demanda', texto: 'Cursos en demanda', icono: 'grafico', desc: 'Qué cursos piden más los estudiantes.' },
      { ruta: '/mentorias', texto: 'Mentorías', icono: 'estrella', desc: 'Mentores y calificaciones recibidas.' },
      { ruta: '/sesiones', texto: 'Sesiones', icono: 'reloj', desc: 'Todas las sesiones, por estado.' },
      { ruta: '/charlas', texto: 'Charlas', icono: 'video', desc: 'Programa y gestiona las charlas virtuales.' },
    ],
  },
  {
    id: 'comunidad',
    titulo: 'Comunidad',
    icono: 'chat',
    enlaces: [
      { ruta: '/foro', texto: 'Foro y recursos', icono: 'chat', desc: 'Consultas y recursos que publica la comunidad.' },
      { ruta: '/anuncios', texto: 'Anuncios', icono: 'megafono', desc: 'Avisos para estudiantes, mentores o todos.' },
      { ruta: '/reportes', texto: 'Reportes', icono: 'alerta', desc: 'Denuncias que hicieron los usuarios.' },
      { ruta: '/moderacion', texto: 'Moderación', icono: 'escudo', desc: 'Contenido retenido por el filtro automático.' },
    ],
  },
  {
    id: 'analisis',
    titulo: 'Análisis',
    icono: 'grafico',
    enlaces: [
      { ruta: '/ranking', texto: 'Ranking', icono: 'trofeo', desc: 'Mentores por calificación y horas.' },
      { ruta: '/metricas', texto: 'Métricas', icono: 'grafico', desc: 'Crecimiento, sesiones y uso del servicio.' },
    ],
  },
  {
    id: 'sistema',
    titulo: 'Sistema',
    icono: 'ajustes',
    enlaces: [
      { ruta: '/emparejamiento', texto: 'Criterios de IA', icono: 'ajustes', desc: 'Pesos con los que se recomiendan mentores.' },
      { ruta: '/seguridad', texto: 'Seguridad', icono: 'candado', desc: 'Parámetros de acceso y de las salas.' },
      { ruta: '/historial', texto: 'Historial', icono: 'lista', desc: 'Registro de las acciones del administrador.' },
    ],
  },
]

// El grupo al que pertenece una ruta (para abrirlo en el menú).
export function grupoDeRuta(ruta) {
  const g = GRUPOS.find((x) => x.enlaces.some((e) => ruta === e.ruta || ruta.startsWith(`${e.ruta}/`)))
  return g ? g.id : null
}
