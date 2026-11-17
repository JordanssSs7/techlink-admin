# TechLink · Panel de administración

Panel de administración de TechLink: front-end en React + Vite y back-end en Django REST Framework.
Django usa la **misma base de datos MySQL (`techlink`)** que el backend de usuario (Spring Boot).
La pantalla de cursos ya consume la API; el resto de secciones todavía usa datos de prueba (`src/datos.js`).

## Ejecutar Django y React a la vez

Requisitos: MySQL encendido (XAMPP) con la base `techlink` ya creada por el backend de usuario (Flyway).

**Terminal 1 – Django (puerto 8000)**

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```

**Terminal 2 – React (puerto 5173)**

```
npm install
npm run dev
```

Abrir http://localhost:5173/

Notas del backend:

- Se usa Django 4.2 LTS porque XAMPP trae MariaDB 10.4 y Django 6 exige MariaDB 10.11 o superior.
- La conexión se puede cambiar con las variables de entorno `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`.
- No se ejecuta `python manage.py migrate`: las tablas las crea Spring Boot con Flyway. El modelo `Curso` tiene `managed = False` y Django no crea tablas propias en la base compartida.

## CORS

React (http://localhost:5173) y Django (http://127.0.0.1:8000) son orígenes distintos, por eso se usa `django-cors-headers`:
`corsheaders` en `INSTALLED_APPS`, `corsheaders.middleware.CorsMiddleware` en la parte alta de `MIDDLEWARE` y
`CORS_ALLOWED_ORIGINS` con `http://localhost:5173` y `http://127.0.0.1:5173` (`backend/config/settings.py`).

## Endpoints que usa el panel

La dirección base está en `src/api.js` (`http://127.0.0.1:8000/api`, o la variable `VITE_API_URL`).

| Operación | Método y URL | Respuesta |
|---|---|---|
| Listar, buscar y filtrar | `GET /api/cursos/?search=texto&activo=true&ordering=nombre` | 200 |
| Crear | `POST /api/cursos/` | 201, o 400 si el nombre es inválido o está repetido |
| Editar o inactivar | `PATCH /api/cursos/{id}/` | 200, 400 o 404 |
| Eliminar | `DELETE /api/cursos/{id}/` | 204, 404 si ya no existe, 400 si lo usa algún mentor o estudiante |

Campos de un curso: `id`, `nombre`, `activo`, `total_mentores` y `total_estudiantes` (los dos últimos son de solo lectura).

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
| `PanelCursos` | Padre de la pantalla de cursos: pide los cursos a la API con `useEffect`, guarda `cursos`, `cargando`, `error`, `busqueda`, `filtroActivo` y `cursoEditando`, y define `guardarCurso` (POST/PATCH), `cambiarEstado` (PATCH) y `eliminarCurso` (DELETE). |
| `CursoForm` | Formulario controlado de alta y edición; entrega el curso al padre con `onGuardar` y muestra el error 400 de la API. |
| `CursoLista` / `CursoFila` | Listado y fila; cada fila avisa al padre con `onEditar`, `onCambiarEstado` y `onEliminar` (con confirmación previa). |
| `CursoResumen` | Hermano del listado: total, activos/inactivos, cursos con mentor y cursos marcados como críticos, calculados con los datos de la API. |
| `Buscador` | Campo de búsqueda controlado por el padre (`valor`, `onCambiar`). |
| `Aviso` | Mensaje temporal que el padre oculta a los 3 segundos con `useEffect` y su limpieza. |
| `MentorCard` / `SesionItem` | Relación 1:N: un mentor con sus sesiones y el total de horas calculado. |
| `MetricasSesiones` | Sesiones completadas vs canceladas, horas y calificación promedio. |
| `Icono` | Iconos SVG por nombre. |

## Pantalla de cursos (Ajax con la API)

El estado vive en `PanelCursos`, que es el único componente que habla con la API:

```
PanelCursos  (estado: cursos, cargando, error, busqueda, filtroActivo, cursoEditando, aviso)
├── CursoResumen   ↓ cursos
├── CursoForm      ↓ cursoEditando, errorServidor   ↑ onGuardar(datos), onCancelar()
├── Buscador       ↓ valor                          ↑ onCambiar(texto)
├── Aviso          ↓ texto, tipo
└── CursoLista     ↓ cursos, hayFiltros
    └── CursoFila  ↓ curso                          ↑ onEditar, onCambiarEstado, onEliminar
```

- El listado se carga con GET dentro de un `useEffect` que depende del buscador y del filtro de estado; la limpieza cancela la petición pendiente con `AbortController`.
- La pantalla muestra tres estados: cargando, error (con botón Reintentar) y lista vacía.
- El alta envía POST y la edición PATCH; los errores 400 del serializer se muestran junto al formulario.
- Eliminar pide confirmación y envía DELETE; si el servidor responde 404 se avisa y se quita de la lista.
- Un curso que ya usa algún mentor o estudiante solo se puede inactivar (borrado lógico).

## Historias de usuario cubiertas

Gestión de usuarios y roles, dashboard de KPI, evaluación de postulaciones, CRUD de cursos con borrado lógico y métricas de mentorías.

## Pendiente

La API todavía no tiene autenticación ni permisos: cualquiera que conozca la dirección puede usarla. Falta el login del administrador.

## Verificación

```
npm run lint
npm run build
```
