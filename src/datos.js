// Datos de prueba con la forma que tendrá la API REST de Django (snake_case).

// HU-45 / HU-46: gestión de usuarios y roles
export const usuarios = [
  { id: 1, nombre_completo: 'Ana Torres Quispe', correo: 'ana.torres@tecsup.edu.pe', rol: 'Mentor', ciclo: 5, activo: true, horas_asesoria: 14 },
  { id: 2, nombre_completo: 'Luis Ramírez Soto', correo: 'luis.ramirez@tecsup.edu.pe', rol: 'Estudiante', ciclo: 2, activo: true, horas_asesoria: 0 },
  { id: 3, nombre_completo: 'Carla Mendoza Rojas', correo: 'carla.mendoza@tecsup.edu.pe', rol: 'Mentor', ciclo: 6, activo: true, horas_asesoria: 22 },
  { id: 4, nombre_completo: 'Diego Paredes Vega', correo: 'diego.paredes@tecsup.edu.pe', rol: 'Estudiante', ciclo: 1, activo: false, horas_asesoria: 3 },
  { id: 5, nombre_completo: 'Sofía Herrera Díaz', correo: 'sofia.herrera@tecsup.edu.pe', rol: 'Estudiante', ciclo: 3, activo: true, horas_asesoria: 6 },
  { id: 6, nombre_completo: 'Mateo Salazar Cruz', correo: 'mateo.salazar@tecsup.edu.pe', rol: 'Estudiante', ciclo: 2, activo: true, horas_asesoria: 2 },
  { id: 7, nombre_completo: 'Valeria Núñez Castro', correo: 'valeria.nunez@tecsup.edu.pe', rol: 'Mentor', ciclo: 6, activo: true, horas_asesoria: 18 },
  { id: 8, nombre_completo: 'Jordan Reyes Lima', correo: 'jordan.reyes@tecsup.edu.pe', rol: 'Admin', ciclo: 6, activo: true, horas_asesoria: 0 },
]

// HU-47: crecimiento de registros por semana
export const registrosSemanales = [
  { semana: 'S1', total: 8 },
  { semana: 'S2', total: 14 },
  { semana: 'S3', total: 11 },
  { semana: 'S4', total: 19 },
  { semana: 'S5', total: 23 },
  { semana: 'S6', total: 17 },
  { semana: 'S7', total: 28 },
  { semana: 'S8', total: 31 },
]

// HU-48: postulaciones a mentor en revisión
export const postulaciones = [
  { id: 1, postulante: 'Renzo Alarcón Gil', ciclo: 5, cursos_aprobados: ['Programación I', 'Base de Datos', 'Algoritmos'], comprobante: 'record_notas_renzo.pdf' },
  { id: 2, postulante: 'Daniela Flores Ayala', ciclo: 6, cursos_aprobados: ['Cálculo I', 'Física', 'Estadística'], comprobante: 'constancia_daniela.png' },
  { id: 3, postulante: 'Marco Vilca Pinto', ciclo: 4, cursos_aprobados: ['Programación I', 'Redes'], comprobante: 'notas_marco.pdf' },
]

// HU-49: cursos críticos del plan de estudios.
// total_mentorias: sesiones asociadas; si es mayor que 0 el curso solo se puede inactivar.
export const cursos = [
  { id: 1, codigo: 'PRG101', nombre: 'Programación I', ciclo: 1, creditos: 4, activo: true, total_mentorias: 3 },
  { id: 2, codigo: 'MAT101', nombre: 'Cálculo I', ciclo: 1, creditos: 4, activo: true, total_mentorias: 1 },
  { id: 3, codigo: 'BDD201', nombre: 'Base de Datos', ciclo: 3, creditos: 4, activo: true, total_mentorias: 2 },
  { id: 4, codigo: 'FIS101', nombre: 'Física', ciclo: 2, creditos: 3, activo: false, total_mentorias: 1 },
  { id: 5, codigo: 'EST201', nombre: 'Estadística', ciclo: 3, creditos: 3, activo: true, total_mentorias: 0 },
  { id: 6, codigo: 'RED301', nombre: 'Redes de Computadoras', ciclo: 4, creditos: 3, activo: false, total_mentorias: 0 },
]

// HU-50: mentores con sus sesiones (relación 1:N)
export const mentores = [
  {
    id: 1,
    nombre: 'Ana Torres Quispe',
    sesiones: [
      { id: 11, curso: 'Programación I', fecha: '2026-10-20', duracion_horas: 2, calificacion: 5, estado: 'Completada' },
      { id: 12, curso: 'Base de Datos', fecha: '2026-10-27', duracion_horas: 1.5, calificacion: 4, estado: 'Completada' },
      { id: 13, curso: 'Programación I', fecha: '2026-11-02', duracion_horas: 1, calificacion: 0, estado: 'Cancelada' },
    ],
  },
  {
    id: 2,
    nombre: 'Carla Mendoza Rojas',
    sesiones: [
      { id: 21, curso: 'Cálculo I', fecha: '2026-10-22', duracion_horas: 1, calificacion: 5, estado: 'Completada' },
      { id: 22, curso: 'Física', fecha: '2026-10-29', duracion_horas: 2.5, calificacion: 3, estado: 'Completada' },
    ],
  },
  {
    id: 3,
    nombre: 'Valeria Núñez Castro',
    sesiones: [
      { id: 31, curso: 'Base de Datos', fecha: '2026-10-25', duracion_horas: 2, calificacion: 5, estado: 'Completada' },
      { id: 32, curso: 'Programación I', fecha: '2026-10-30', duracion_horas: 1, calificacion: 4, estado: 'Completada' },
    ],
  },
]
