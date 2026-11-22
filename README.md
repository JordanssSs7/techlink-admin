# TechLink · Panel de administración

Panel de administración de TechLink: front-end en React + Vite y back-end en Django REST Framework.
Django usa la **misma base de datos MySQL (`techlink`)** que el backend de usuario (Spring Boot).
Todas las secciones consumen la API de Django: usuarios (con paginación), postulaciones, cursos, mentorías, sesiones y métricas.
Las tablas de postulaciones, calificaciones, sesiones, reportes y acciones del administrador las crean las migraciones V6 a V13 del backend de usuario (Spring Boot).

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

**Terminal 2 – React (puerto 5174)**

```
npm install
npm run dev
```

Abrir http://localhost:5174/ (el puerto 5173 es de la aplicación de usuario).

### Inicio de sesión del administrador

El administrador inicia sesión **en la aplicación de usuario** (http://localhost:5173, el mismo login de todos) y, al entrar, pasa directo a este panel:
la aplicación de usuario le pasa la sesión en el fragmento de la URL (`#sesion=...`), el panel la guarda en `sessionStorage` y borra el fragmento.
Al pulsar "Cerrar sesión" en el panel se vuelve a la aplicación de usuario con `/?salir`, que también cierra su sesión.
Las direcciones se pueden cambiar con `VITE_ADMIN_URL` (en la aplicación de usuario) y `VITE_USER_URL` (en el panel).

Si alguien abre el panel directamente, `/login` también pide correo y contraseña (mismo diseño). La cuenta se valida en el backend de usuario
(Spring Boot, `POST /api/auth/login`), por eso **Spring Boot debe estar encendido en el puerto 8080**. Solo las cuentas con rol `ADMIN` entran;
estudiantes y mentores ingresan desde la aplicación de TechLink. En desarrollo, Vite reenvía `/spring` hacia `http://localhost:8080`
(`vite.config.js`), así no hace falta CORS en Spring; en otro entorno se define `VITE_AUTH_URL`.
El token se guarda en `sessionStorage` y Axios lo envía en cada petición (`Authorization: Bearer ...`).

### Seguridad de la API (RNF-02): `JWT_SECRET`

Django valida el token que emite Spring Boot (HS256). Para eso **los dos backends deben tener la misma clave** en la variable de entorno `JWT_SECRET`
(mínimo 32 caracteres), definida antes de encenderlos:

```
$env:JWT_SECRET = "una-clave-de-por-lo-menos-32-caracteres-xxxx"
```

- Con `JWT_SECRET` en Django: toda la API exige un token válido de un usuario con rol `ADMIN` (401 sin token o con token vencido, 403 con otro rol).
  Las acciones del panel quedan firmadas con el id del administrador (`id_revisor` de las postulaciones y el historial de acciones).
- Sin `JWT_SECRET` en Django: la API queda abierta (modo desarrollo) y las acciones se anotan como "Sin identificar".
- Si Spring no tiene `JWT_SECRET`, usa una clave al azar distinta en cada arranque y Django no podrá validar sus tokens (el panel responderá 401).

### Pantallas (una por opción del menú)

| Ruta | Pantalla |
|---|---|
| `/login` | Inicio de sesión del administrador |
| `/` | Resumen: indicadores y crecimiento de registros |
| `/usuarios` | Usuarios y roles (paginado) |
| `/postulaciones` | Postulaciones a mentor |
| `/cursos` | Catálogo de cursos |
| `/mentorias` | Mentorías por mentor |
| `/sesiones` | Sesiones y cancelación |
| `/metricas` | Métricas y exportación del reporte |
| `/reportes` | Reportes de usuarios y sesiones: resolver o descartar con nota (HU-52) |
| `/moderacion` | Calificaciones y comentarios: ocultar con motivo o mostrar (HU-53) |
| `/demanda` | Cursos en demanda: más solicitados y con más estudiantes en riesgo, por ciclo, con exportación a Excel (HU-55) |
| `/emparejamiento` | Criterios de IA: pesos del emparejamiento con vista previa antes de guardar (HU-61) |
| `/charlas` | Charlas virtuales: crear, editar y desactivar (HU-58) |
| `/foro` | Foro y recursos: ocultar con motivo (se avisa al autor) o mostrar consultas, respuestas y recursos (HU-54) |
| `/historial` | Historial de acciones del administrador (HU-59) |

Notas del backend:

- Se usa Django 4.2 LTS porque XAMPP trae MariaDB 10.4 y Django 6 exige MariaDB 10.11 o superior.
- La conexión se puede cambiar con las variables de entorno `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`.
- No se ejecuta `python manage.py migrate`: las tablas las crea Spring Boot con Flyway. El modelo `Curso` tiene `managed = False` y Django no crea tablas propias en la base compartida.

## CORS

React (http://localhost:5174) y Django (http://127.0.0.1:8000) son orígenes distintos, por eso se usa `django-cors-headers`:
`corsheaders` en `INSTALLED_APPS`, `corsheaders.middleware.CorsMiddleware` en la parte alta de `MIDDLEWARE` y
`CORS_ALLOWED_ORIGINS` con los puertos 5173 y 5174 de `localhost` y `127.0.0.1` (`backend/config/settings.py`).

## Endpoints que usa el panel

La dirección base está en `src/api.js` (`http://127.0.0.1:8000/api`, o la variable `VITE_API_URL`).

| Operación | Método y URL | Respuesta |
|---|---|---|
| Listar, buscar y filtrar | `GET /api/cursos/?search=texto&activo=true&ordering=nombre` | 200 |
| Crear | `POST /api/cursos/` | 201, o 400 si el nombre es inválido o está repetido |
| Editar o inactivar | `PATCH /api/cursos/{id}/` | 200, 400 o 404 |
| Eliminar | `DELETE /api/cursos/{id}/` | 204, 404 si ya no existe, 400 si lo usa algún mentor o estudiante |

| Listar usuarios (HU-45) | `GET /api/usuarios/?search=texto&rol=MENTOR&estado=ACTIVO&page=1&page_size=12` | 200 con `{count, next, previous, results}` |
| Cambiar rol o estado | `PATCH /api/usuarios/{id}/` | 200, o 400 si deja el panel sin administrador activo o hace administradora a una cuenta de Google |
| Listar postulaciones (HU-48) | `GET /api/postulaciones/?estado=EN_REVISION&search=texto` | 200 |
| Ver el comprobante | `GET /api/postulaciones/{id}/comprobante/` | 200 con el PDF o la imagen, o 404 |
| Aprobar | `POST /api/postulaciones/{id}/aprobar/` | 200 (el usuario pasa a MENTOR y se crea su fila en `mentores`), 409 si ya fue evaluada |
| Rechazar | `POST /api/postulaciones/{id}/rechazar/` con `{"motivo": "..."}` | 200, 400 si falta el motivo, 409 si ya fue evaluada |
| Listar sesiones (HU-51) | `GET /api/sesiones/?estado=PROGRAMADA&desde=2026-11-01&hasta=2026-11-30&search=texto&page=1` | 200 con `{count, next, previous, results}`, o 400 si una fecha es inválida |
| Cancelar una sesión | `POST /api/sesiones/{id}/cancelar/` con `{"motivo": "..."}` | 200 (avisa por correo al estudiante y al mentor), 400 sin motivo, 409 si ya fue cancelada o ya terminó |
| Mentores con perfil y sesiones | `GET /api/mentores/` | 200 |
| Indicadores y métricas (HU-47, HU-50) | `GET /api/metricas/resumen/` | 200 (incluye calificación promedio y distribución por estrellas) |
| Exportar el reporte (HU-50) | `GET /api/metricas/exportar/?formato=xlsx` o `?formato=pdf` | 200 con el archivo, o 400 si el formato no existe |
| Listar reportes (HU-52) | `GET /api/reportes/?estado=PENDIENTE&tipo=SESION&motivo=ACOSO&search=texto&page=1` | 200 con `{count, next, previous, results}` |
| Contar reportes por estado | `GET /api/reportes/resumen/` | 200 con `{PENDIENTE, RESUELTO, DESCARTADO}` |
| Resolver o descartar un reporte | `POST /api/reportes/{id}/resolver/` o `/descartar/` con `{"nota": "..."}` | 200, 400 sin nota, 409 si ya fue revisado |
| Listar calificaciones (HU-53) | `GET /api/calificaciones/?oculto=true&estrellas=1&con_comentario=true&search=texto` | 200 con `{count, next, previous, results}` |
| Ocultar una calificación | `POST /api/calificaciones/{id}/ocultar/` con `{"motivo": "..."}` | 200 (recalcula la reputación del mentor), 400 sin motivo, 409 si ya está oculta |
| Mostrarla de nuevo | `POST /api/calificaciones/{id}/mostrar/` | 200, 409 si ya es visible |
| Ranking de cursos (HU-55) | `GET /api/cursos/demanda/?ciclo=3&limite=10` | 200 con `{ciclo, ciclos, solicitados, en_riesgo}` (sesiones por curso y estudiantes que lo marcaron como crítico, con la prioridad de sumar mentores), o 400 si el ciclo o el límite son inválidos |
| Exportar el ranking (HU-55) | `GET /api/cursos/demanda/exportar/?ciclo=3&limite=10` | 200 con un Excel de dos hojas |
| Criterios de IA (HU-61, **Spring Boot**) | `GET` y `PUT /api/admin/emparejamiento/criterios` con `{cursos, calificacion, disponibilidad}` (0 a 100 cada uno) | 200, o 400 si un peso sale de rango o los tres son 0. Solo ADMIN; el panel lo pide por `/spring` con el token de Spring |
| Vista previa de criterios (HU-61, **Spring Boot**) | `POST /api/admin/emparejamiento/vista-previa` con `{cursos: [ids], pesos?, horarios?}` | 200 con los 3 mentores que saldrían con esos pesos, sin guardar nada |
| Listar charlas (HU-58) | `GET /api/charlas/?estado=VIGENTE&desde=2026-11-01&hasta=2026-11-30&search=texto&page=1` | 200 con `{count, next, previous, results}` (cada charla trae `inscritos` y `estado`), o 400 si un filtro es inválido |
| Crear una charla | `POST /api/charlas/` con `nombre`, `tematica`, `fecha`, `hora_inicio`, `hora_fin`, `enlace` (y `descripcion`, `curso`) | 201, o 400 si la fecha ya pasó, la hora de fin no es posterior al inicio o el enlace no es http/https |
| Editar, desactivar o activar | `PATCH /api/charlas/{id}/`, `POST /api/charlas/{id}/desactivar/` o `/activar/` | 200, 409 si ya estaba en ese estado. Las charlas no se eliminan: se desactivan (y conservan sus inscripciones) |
| Contar charlas por estado | `GET /api/charlas/resumen/` | 200 con `{vigentes, pasadas, inactivas}` |
| Listar consultas del foro (HU-54) | `GET /api/foro/consultas/?oculto=true&curso=4&search=texto&page=1` | 200 con `{count, next, previous, results}` |
| Listar respuestas del foro (HU-54) | `GET /api/foro/respuestas/?oculto=false&search=texto` | 200 con `{count, next, previous, results}` |
| Listar recursos compartidos (HU-54) | `GET /api/recursos/?tipo=ARCHIVO&oculto=false&search=texto` | 200 con `{count, next, previous, results}` |
| Ocultar una consulta, respuesta o recurso | `POST /api/foro/consultas/{id}/ocultar/`, `/api/foro/respuestas/{id}/ocultar/` o `/api/recursos/{id}/ocultar/` con `{"motivo": "..."}` | 200 con `autor_notificado` (si el correo al autor salió), 400 sin motivo, 409 si ya está oculto |
| Mostrarlo de nuevo | `POST .../{id}/mostrar/` en cada una de las tres rutas | 200, 409 si ya es visible |
| Ver el archivo de un recurso | `GET /api/recursos/{id}/archivo/` | 200 con el PDF o la imagen, 404 si el recurso no es un archivo |
| Historial de acciones (HU-59) | `GET /api/historial/?tipo=SESION_CANCELADA&admin=1&desde=2026-11-01&hasta=2026-11-30&search=texto&page=1` | 200 con `{count, next, previous, results}`, o 400 si un filtro es inválido |
| Tipos de acción del historial | `GET /api/historial/tipos/` | 200 |
| Estado de la API | `GET /api/estado/` | 200 |

Las sesiones se leen de la tabla `sesiones` (V6 y V7) y las calificaciones de `calificaciones` (V7); las postulaciones, de `postulaciones` y `postulacion_archivos` (V8); los reportes, el historial de acciones y la moderación de calificaciones, de `reportes`, `acciones_admin` y `calificaciones.oculto` (V9); el foro y los recursos, de `consultas`, `respuestas`, `recursos` y `recurso_archivos` (V10); las charlas y sus inscripciones, de `charlas` y `charla_inscripciones` (V11).

Moderación del foro y los recursos (HU-54): ocultar no borra nada, solo marca `oculto = true` con el motivo y la fecha, y el backend de usuario deja de mostrarlo. Al ocultar se le envía el motivo al autor por correo (la dirección de soporte que se menciona se define con `CORREO_SOPORTE`); si el correo falla, el ocultamiento igual queda guardado y el panel avisa que no se pudo notificar.
Si esas migraciones todavía no se aplicaron en la base local, hay que arrancar una vez el backend de usuario (Spring Boot) para que Flyway las cree.

Estados de una sesión: la tabla solo guarda `CONFIRMADA` o `CANCELADA`; el panel muestra además **Programada** y **Completada**, según la fecha y la hora de fin.
Los correos de aviso salen por la consola de Django en desarrollo; para enviarlos de verdad se define `EMAIL_BACKEND` y los datos SMTP (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`).

Pendiente: el motivo de una cancelación solo viaja en el correo, porque la tabla `sesiones` no tiene una columna para guardarlo (haría falta una migración nueva en el backend de usuario).
El campo `id_revisor` de una postulación queda vacío hasta que el panel tenga login.

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
| Moderación (reportes y calificaciones) | `moderacion` | `ReportesPage`, `ModeracionPage` | **Construido** con API real (HU-52 y HU-53) |
| Foro y recursos (moderación) | `comunidad` | `ForoPage` | **Construido** con API real (HU-54) |
| Charlas virtuales | `charlas` | `CharlasPage` | **Construido** con API real (HU-58) |
| Cursos en demanda | `cursos` (`demanda.py`) | `DemandaPage` | **Construido** con API real (HU-55) |
| Criterios de IA | — (los guarda Spring Boot) | `EmparejamientoPage` | **Construido** (HU-61): lee y guarda en Spring y lo anota en el historial |
| Historial de acciones | `auditoria` | `HistorialPage` | **Construido** con API real (HU-59) |
| Autenticación del administrador | `core` (`core/auth.py`) | `LoginPage` | **Construido**: Django valida el token de Spring con `JWT_SECRET` |

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
| RNF-02 | Seguridad | Toda la API del panel exige el token de un administrador; sin token responde 401 y con otro rol 403 (requiere `JWT_SECRET`, ver arriba). |
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

Gestión de usuarios y roles, dashboard de KPI, evaluación de postulaciones, CRUD de cursos con borrado lógico y métricas de mentorías. Moderación de calificaciones (HU-53) y del foro y los recursos compartidos (HU-54).

## Pendiente

La API todavía no tiene autenticación ni permisos: cualquiera que conozca la dirección puede usarla. Falta el login del administrador.

## Verificación

```
npm run lint
npm run build
```
