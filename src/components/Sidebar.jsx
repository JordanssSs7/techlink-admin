import Icono from './Icono'

const ENLACES = [
  { href: '#resumen', texto: 'Resumen', icono: 'inicio' },
  { href: '#usuarios', texto: 'Usuarios y roles', icono: 'usuarios' },
  { href: '#postulaciones', texto: 'Postulaciones', icono: 'archivo' },
  { href: '#cursos', texto: 'Cursos críticos', icono: 'libro' },
  { href: '#mentorias', texto: 'Mentorías', icono: 'reloj' },
  { href: '#metricas', texto: 'Métricas', icono: 'grafico' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-marca">TL</span>
        <div>
          <strong>TechLink</strong>
          <small>Panel de administración</small>
        </div>
      </div>
      <nav>
        {ENLACES.map((e) => (
          <a key={e.href} href={e.href}>
            <Icono nombre={e.icono} tam={18} />
            {e.texto}
          </a>
        ))}
      </nav>
      <p className="sidebar-pie">Datos de prueba · Lab 10</p>
    </aside>
  )
}

export default Sidebar
