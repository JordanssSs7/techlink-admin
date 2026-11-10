# TechLink · Panel de administración (frontend)

Interfaz de administración de TechLink hecha con React + Vite. Usa datos de prueba (`src/datos.js`) con la forma de la API REST de Django; todavía no consume la API.

## Ejecutar

```
npm install
npm run dev
```

Abrir http://localhost:5173/

## Backend (Django)

El backend del panel está en `backend/` (Django + Django REST Framework + django-cors-headers). Por ahora solo tiene el proyecto base `config`; todavía no hay modelos ni API, y la base de datos MySQL compartida aún no está configurada.

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```

Abrir http://localhost:8000/

## Componentes (`src/components`)

| Componente | Qué hace |
|---|---|
| `Sidebar` | Menú lateral con enlaces a cada sección. |
| `Tarjeta` | Contenedor con `titulo`, `descripcion` (valor por defecto) y `children`. |
| `KpiCard` | Tarjeta de indicador; `color` tiene valor por defecto. |
| `GraficoBarras` | Gráfico de barras de registros por semana (`map` + `key`). |
| `UsuarioLista` | Buscador y filtro de rol controlados; lista de `UsuarioCard`. |
| `UsuarioCard` | Cambia rol (`select` controlado), activa/desactiva la cuenta y registra advertencias con `useState`. |
| `PostulacionLista` / `PostulacionCard` | Aprueba o rechaza postulaciones a mentor; el rechazo exige un motivo (formulario con `onSubmit`). |
| `PanelCursos` | Padre de la pantalla de cursos: guarda `cursos`, `busqueda` y `aviso`, y define `guardarCurso`, `cambiarEstado` y `eliminarCurso`. |
| `CursoForm` | Formulario controlado de alta; valida y entrega el curso al padre con `onGuardar`. |
| `CursoLista` / `CursoFila` | Listado y fila sin estado; cada fila avisa al padre con `onCambiarEstado(id)` y `onEliminar(id)`. |
| `CursoResumen` | Hermano del listado: totales, activos/inactivos, créditos y mentorías calculados sin `useState`. |
| `Buscador` | Campo de búsqueda controlado por el padre (`valor`, `onCambiar`). |
| `Aviso` | Mensaje temporal que el padre oculta a los 3 segundos con `useEffect` y su limpieza. |
| `MentorCard` / `SesionItem` | Relación 1:N: un mentor con sus sesiones y el total de horas calculado. |
| `MetricasSesiones` | Sesiones completadas vs canceladas, horas y calificación promedio. |
| `Icono` | Iconos SVG por nombre. |

## Pantalla de cursos críticos (comunicación entre componentes)

El estado vive en `PanelCursos` y se comparte con sus hijos:

```
PanelCursos  (estado: cursos, busqueda, aviso)
├── CursoResumen   ↓ cursos
├── CursoForm      ↓ codigosExistentes      ↑ onGuardar(curso)
├── Buscador       ↓ valor                  ↑ onCambiar(texto)
├── Aviso          ↓ texto
└── CursoLista     ↓ cursos filtrados
    └── CursoFila  ↓ curso                  ↑ onCambiarEstado(id), onEliminar(id)
```

- Los datos bajan por props y los avisos suben por funciones; el estado se actualiza siempre con un arreglo nuevo (spread, `map` o `filter`).
- El buscador filtra por nombre o código, sin distinguir tildes ni mayúsculas.
- Un curso con mentorías asociadas solo se puede inactivar (borrado lógico); sin mentorías se puede eliminar.
- `useEffect` actualiza el título de la pestaña con la cantidad de cursos y oculta el aviso a los 3 segundos.

## Historias de usuario cubiertas

Gestión de usuarios y roles, dashboard de KPI, evaluación de postulaciones, CRUD de cursos con borrado lógico y métricas de mentorías.

## Verificación

```
npm run lint
npm run build
```
