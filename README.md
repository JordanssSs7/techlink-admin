# TechLink · Panel de administración

Panel de administración de TechLink: front-end en React + Vite y back-end en Django REST Framework.
Django usa la **misma base de datos MySQL (`techlink`)** que el backend de usuario (Spring Boot).
Todas las secciones consumen la API, salvo postulaciones, que todavía usa datos de prueba (`src/datos.js`).

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

| Listar usuarios | `GET /api/usuarios/?search=texto&rol=MENTOR&estado=ACTIVO` | 200 |
| Cambiar rol o estado | `PATCH /api/usuarios/{id}/` | 200, o 400 si deja el panel sin administrador activo o hace administradora a una cuenta de Google |
| Mentores con perfil y sesiones | `GET /api/mentores/` | 200 |
| Indicadores y métricas | `GET /api/metricas/resumen/` | 200 |
| Estado de la API | `GET /api/estado/` | 200 |

La sección de postulaciones sigue con datos de prueba (`src/datos.js`) porque todavía no existe su tabla en la base compartida.
Las sesiones se leen de la tabla `sesiones` (migración V6 del backend de usuario); si aún no existe en la base local, el panel lo indica.

Campos de un curso: `id`, `nombre`, `activo`, `total_mentores` y `total_estudiantes` (los dos últimos son de solo lectura).

## Diseño de la aplicación (Semana 13)

### Tipo de plataforma, canales y roles

TechLink no es un comercio de venta: es una **plataforma de servicios gratuita entre pares (C2C dentro de la institución)**,
donde estudiantes de Tecsup reciben mentoría de estudiantes de ciclos superiores. Canales: **web** (React) y **móvil** (Kotlin).
Este repositorio es el **panel de administración**.

| Rol | Dónde trabaja | Qué hace |
|---|---|---|
| Administrador | Panel de administración (React + Django) | Gestiona usuarios y roles, evalúa postulaciones a mentor, mantiene el catálogo de cursos y revisa métricas. |
| Mentor | Web y móvil de usuario (Spring Boot) | Registra sus cursos, fortalezas y disponibilidad, y dicta sesiones. |
| Estudiante | Web y móvil de usuario (Spring Boot) | Marca sus cursos críticos, recibe recomendaciones de mentores con IA y agenda sesiones. |

### Mapa de módulos del panel

| Módulo | App de Django | Pantalla de React | Estado |
|---|---|---|---|
| Base común | `core` | — | Creada: `GET /api/estado/` |
| Cursos | `cursos` | `CursosPage` (`PanelCursos`) | **Construido** con API real (Semana 12) |
| Usuarios y roles | `usuarios` | `UsuariosPage` (`UsuarioLista`) | **Construido** con API real |
| Postulaciones a mentor | `postulaciones` | `PostulacionesPage` | Interfaz con datos de prueba (Semanas 10–11) |
| Mentorías y métricas | `mentorias` | `MentoriasPage`, `MetricasPage`, `ResumenPage` | **Construido** con API real (sesiones cuando exista la tabla) |
| Autenticación del administrador | (pendiente) | `LoginPage` | Pendiente |

### Requisitos funcionales

| Código | Requisito |
|---|---|
| RF-01 | El administrador inicia sesión con correo y contraseña; los estudiantes y mentores no pueden entrar al panel. |
| RF-02 | El administrador lista, busca y filtra usuarios por rol y estado, cambia su rol y activa o desactiva su cuenta. |
| RF-03 | El administrador revisa las postulaciones a mentor en revisión con sus cursos aprobados y su comprobante. |
| RF-04 | El administrador aprueba una postulación, o la rechaza registrando un motivo obligatorio. |
| RF-05 | El administrador registra, edita, inactiva y elimina cursos del catálogo. |
| RF-06 | El administrador consulta las sesiones de cada mentor y las métricas del servicio (completadas, canceladas, horas y calificación). |

### Requisitos no funcionales

| Código | Requisito | Criterio de aceptación |
|---|---|---|
| RNF-01 | Rendimiento | El listado de cursos responde en menos de 1 segundo con la base local (medido en la pestaña Network). |
| RNF-02 | Seguridad | Toda la API del panel exige un token de administrador; sin token responde 401 (pendiente de implementar). |
| RNF-03 | Integridad | Django no crea ni altera tablas de la base compartida: los modelos usan `managed = False` y no se ejecuta `migrate`. |
| RNF-04 | Usabilidad | Cada pantalla muestra los estados de carga, error y lista vacía; nunca queda en blanco. |

### Reglas de negocio

| Código | Regla | Dónde se aplica |
|---|---|---|
| RN-01 | Para rechazar una postulación el motivo es obligatorio. | React (formulario) y Django (serializer) |
| RN-02 | Solo una postulación **En revisión** se puede aprobar o rechazar, y una sola vez. | Django (ViewSet) |
| RN-03 | Al aprobar una postulación, el usuario pasa al rol MENTOR y se crea su perfil de mentor en la misma transacción. | Django (servicio con transacción) |
| RN-04 | El postulante debe estar en un ciclo superior (ciclo 3 o más) y tener aprobado cada curso que quiere enseñar. | Django (serializer) |
| RN-05 | Un curso que usa algún mentor o estudiante no se elimina: solo se inactiva. | Django (ViewSet, ya implementado) y React (botón desactivado) |
| RN-06 | El nombre de un curso tiene al menos 3 caracteres y no se repite. | Django (`validate_nombre`, ya implementado) |

### Arquitectura

```
                 ADMINISTRACIÓN                                   USUARIO
  React + Vite (5173) ──Axios/HTTP──► Django REST (8000)     React web / Kotlin ──► Spring Boot (8080)
                                           │                                              │
                                           └──────────────► MySQL "techlink" ◄────────────┘
                                                  (tablas creadas por Spring Boot con Flyway)
```

### Flujo principal: evaluar una postulación a mentor

```
Administrador → PostulacionesPage (React) → api.post('/postulaciones/{id}/aprobar/' o '/rechazar/')
  → Django: URL → Router → PostulacionViewSet
      valida RN-01, RN-02 y RN-04 → transacción RN-03 (cambia el rol y crea el perfil de mentor)
  → Response 200 (o 400 con el mensaje) → React actualiza el estado y la tarjeta muestra Aprobado o Rechazado
```

### Entidades previstas (Semana 14)

- **Usuario** (tabla `usuarios`, con su **Rol**)
- **Mentor** (tabla `mentores`)
- **Curso** (tabla `cursos`, ya modelada)
- **PostulacionMentor** — entidad principal del flujo
- **PostulacionCurso** — detalle: cada curso aprobado que presenta el postulante, con su nota
- **SesionMentoria** — sesiones dictadas, para las métricas

`PostulacionMentor` y `PostulacionCurso` todavía no existen en la base compartida: hay que acordarlas con el backend de usuario y crearlas con una migración de Flyway.

### Estructura de carpetas

```
techlink-admin/
├── backend/                 Django
│   ├── config/              settings.py y urls.py
│   ├── core/                base común (GET /api/estado/)
│   ├── cursos/              catálogo de cursos (API completa)
│   ├── usuarios/            usuarios y roles
│   ├── postulaciones/       postulaciones a mentor
│   └── mentorias/           sesiones y métricas
└── src/                     React
    ├── api.js               instancia de Axios
    ├── components/          piezas reutilizables (tarjetas, filas, formularios)
    └── pages/               una pantalla por ruta
```

### Mapa de rutas

| Recurso | Ruta de la API (Django) | Ruta de React | Estado |
|---|---|---|---|
| Estado de la API | `GET /api/estado/` | — | Hecho |
| Login del administrador | `POST /api/auth/login/` | `/login` | Pendiente |
| Resumen (KPI) | `GET /api/metricas/resumen/` | `/` | Hecho |
| Usuarios | `/api/usuarios/` y `/api/usuarios/{id}/` | `/usuarios` | Hecho |
| Postulaciones | `/api/postulaciones/`, `POST /api/postulaciones/{id}/aprobar/` y `/rechazar/` | `/postulaciones` | Pendiente |
| Cursos | `/api/cursos/` y `/api/cursos/{id}/` | `/cursos` | Hecho |
| Mentorías | `GET /api/mentores/` | `/mentorias` | Hecho |
| Métricas | `GET /api/metricas/resumen/` | `/metricas` | Hecho |

Las rutas de React están previstas: hoy el panel es una sola página con anclas y se pasará a React Router cuando las pantallas tengan contenido.

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
