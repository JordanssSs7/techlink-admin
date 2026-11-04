# TechLink · Panel de administración (frontend)

Interfaz de administración de TechLink hecha con React + Vite. Usa datos de prueba (`src/datos.js`) con la forma de la API REST de Django; todavía no consume la API.

## Ejecutar

```
npm install
npm run dev
```

Abrir http://localhost:5173/

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
| `CursoLista` / `CursoFila` | Formulario controlado para agregar cursos con validación y borrado lógico por fila. |
| `MentorCard` / `SesionItem` | Relación 1:N: un mentor con sus sesiones y el total de horas calculado. |
| `MetricasSesiones` | Sesiones completadas vs canceladas, horas y calificación promedio. |
| `Icono` | Iconos SVG por nombre. |

## Historias de usuario cubiertas

Gestión de usuarios y roles, dashboard de KPI, evaluación de postulaciones, CRUD de cursos con borrado lógico y métricas de mentorías.

## Verificación

```
npm run lint
npm run build
```
