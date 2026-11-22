import io

from django.db import connection
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from mentorias.metricas import ahora_local

# HU-55: qué cursos piden más los estudiantes y en cuáles están más en riesgo, para decidir dónde hacen falta más mentores.
#  - "Solicitados": cursos con más sesiones agendadas (las canceladas también cuentan como pedidas).
#  - "En riesgo": cursos que más estudiantes marcaron como críticos (los que quieren reforzar, HU-04).
# Las dos listas se pueden filtrar por el ciclo del estudiante. Las tablas de sesiones, cursos críticos y mentores son del
# backend de usuario, por eso se leen con SQL y no con modelos.

LIMITE_POR_DEFECTO = 10
LIMITE_MAXIMO = 50
# Cuántos estudiantes en riesgo le tocan a cada mentor del curso para pedir más mentores con urgencia o con prioridad.
ESTUDIANTES_POR_MENTOR_ALTA = 5
ESTUDIANTES_POR_MENTOR_MEDIA = 2


def prioridad(estudiantes, mentores):
    """ALTA si el curso no tiene mentores o cada uno atendería a muchos estudiantes; MEDIA o BAJA según la carga."""
    if mentores == 0:
        return 'ALTA'
    carga = estudiantes / mentores
    if carga >= ESTUDIANTES_POR_MENTOR_ALTA:
        return 'ALTA'
    return 'MEDIA' if carga >= ESTUDIANTES_POR_MENTOR_MEDIA else 'BAJA'


def leer_filtros(parametros):
    """Devuelve (ciclo, limite) o un texto con el error si algún valor no es válido."""
    ciclo = parametros.get('ciclo')
    if ciclo not in (None, ''):
        if not ciclo.isdigit() or not 1 <= int(ciclo) <= 12:
            return None, None, 'El ciclo debe ser un número del 1 al 12.'
        ciclo = int(ciclo)
    else:
        ciclo = None
    limite = parametros.get('limite')
    if limite not in (None, ''):
        if not limite.isdigit() or not 1 <= int(limite) <= LIMITE_MAXIMO:
            return None, None, f'El límite debe ser un número del 1 al {LIMITE_MAXIMO}.'
        limite = int(limite)
    else:
        limite = LIMITE_POR_DEFECTO
    return ciclo, limite, None


def consultar(sql, parametros):
    with connection.cursor() as cursor:
        cursor.execute(sql, parametros)
        columnas = [c[0] for c in cursor.description]
        return [dict(zip(columnas, fila)) for fila in cursor.fetchall()]


def datos_demanda(ciclo, limite):
    ahora = ahora_local()
    hoy, hora = ahora.date(), ahora.time()
    por_ciclo = ' AND e.ciclo = %s' if ciclo else ''
    extra = [ciclo] if ciclo else []

    solicitados = consultar(f"""
        SELECT c.id_curso AS id, c.nombre AS curso,
               COUNT(s.id_sesion) AS sesiones,
               COALESCE(SUM(CASE WHEN s.estado = 'CONFIRMADA' AND (s.fecha < %s OR (s.fecha = %s AND s.hora_fin <= %s))
                                 THEN 1 ELSE 0 END), 0) AS completadas,
               COALESCE(SUM(CASE WHEN s.estado = 'CANCELADA' THEN 1 ELSE 0 END), 0) AS canceladas,
               COUNT(DISTINCT s.id_estudiante) AS estudiantes,
               AVG(ca.estrellas) AS calificacion,
               (SELECT COUNT(*) FROM mentor_cursos mc WHERE mc.id_curso = c.id_curso) AS mentores
        FROM cursos c
        JOIN sesiones s ON s.id_curso = c.id_curso
        JOIN estudiantes e ON e.id_estudiante = s.id_estudiante
        LEFT JOIN calificaciones ca ON ca.id_sesion = s.id_sesion AND ca.oculto = 0
        WHERE 1 = 1 {por_ciclo}
        GROUP BY c.id_curso, c.nombre
        ORDER BY sesiones DESC, c.nombre
        LIMIT %s
    """, [hoy, hoy, hora, *extra, limite])
    for fila in solicitados:
        fila['sesiones'] = int(fila['sesiones'])
        fila['completadas'] = int(fila['completadas'])
        fila['canceladas'] = int(fila['canceladas'])
        fila['calificacion'] = round(float(fila['calificacion']), 1) if fila['calificacion'] is not None else None

    en_riesgo = consultar(f"""
        SELECT c.id_curso AS id, c.nombre AS curso,
               COUNT(DISTINCT ec.id_estudiante) AS estudiantes,
               (SELECT COUNT(*) FROM mentor_cursos mc WHERE mc.id_curso = c.id_curso) AS mentores,
               (SELECT COUNT(*) FROM sesiones s2 JOIN estudiantes e2 ON e2.id_estudiante = s2.id_estudiante
                 WHERE s2.id_curso = c.id_curso AND s2.estado = 'CONFIRMADA'{' AND e2.ciclo = %s' if ciclo else ''}) AS sesiones
        FROM cursos c
        JOIN estudiante_cursos_criticos ec ON ec.id_curso = c.id_curso
        JOIN estudiantes e ON e.id_estudiante = ec.id_estudiante
        WHERE 1 = 1 {por_ciclo}
        GROUP BY c.id_curso, c.nombre
        ORDER BY estudiantes DESC, c.nombre
        LIMIT %s
    """, [*extra, *extra, limite])
    for fila in en_riesgo:
        fila['estudiantes'] = int(fila['estudiantes'])
        fila['mentores'] = int(fila['mentores'])
        fila['sesiones'] = int(fila['sesiones'])
        fila['estudiantes_por_mentor'] = round(fila['estudiantes'] / fila['mentores'], 1) if fila['mentores'] else None
        fila['prioridad'] = prioridad(fila['estudiantes'], fila['mentores'])
    for fila in solicitados:
        fila['mentores'] = int(fila['mentores'])

    ciclos = [f['ciclo'] for f in consultar('SELECT DISTINCT ciclo FROM estudiantes WHERE ciclo IS NOT NULL ORDER BY ciclo', [])]
    return {'ciclo': ciclo, 'ciclos': ciclos, 'solicitados': solicitados, 'en_riesgo': en_riesgo}


@api_view(['GET'])
def demanda(request):
    """GET /api/cursos/demanda/?ciclo=3&limite=10: ranking de cursos por sesiones solicitadas y por estudiantes en riesgo (HU-55)."""
    ciclo, limite, error = leer_filtros(request.query_params)
    if error:
        return Response({'detalle': error}, status=400)
    return Response(datos_demanda(ciclo, limite))


def generar_excel(datos):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    libro = Workbook()
    relleno = PatternFill('solid', fgColor='111111')
    encabezado = Font(bold=True, color='FFFFFF')
    nota = 'Todos los ciclos' if datos['ciclo'] is None else f"Ciclo {datos['ciclo']}"

    def hoja(titulo, columnas, filas, anchos):
        h = libro.create_sheet(titulo)
        h.append([f'{titulo} · {nota} · generado el {timezone.localtime():%d/%m/%Y %H:%M}'])
        h['A1'].font = Font(bold=True)
        h.append(columnas)
        for celda in h[2]:
            celda.font, celda.fill = encabezado, relleno
            celda.alignment = Alignment(horizontal='center', wrap_text=True)
        for fila in filas:
            h.append(fila)
        for indice, ancho in enumerate(anchos, start=1):
            h.column_dimensions[chr(64 + indice)].width = ancho
        h.freeze_panes = 'A3'

    libro.remove(libro.active)
    hoja('Más solicitados', ['#', 'Curso', 'Sesiones', 'Completadas', 'Canceladas', 'Estudiantes', 'Calificación', 'Mentores'],
         [[i, f['curso'], f['sesiones'], f['completadas'], f['canceladas'], f['estudiantes'],
           f['calificacion'] if f['calificacion'] is not None else '-', f['mentores']]
          for i, f in enumerate(datos['solicitados'], start=1)], [5, 40, 11, 13, 12, 13, 13, 10])
    hoja('Estudiantes en riesgo', ['#', 'Curso', 'Estudiantes en riesgo', 'Mentores', 'Estudiantes por mentor', 'Sesiones', 'Prioridad'],
         [[i, f['curso'], f['estudiantes'], f['mentores'],
           f['estudiantes_por_mentor'] if f['estudiantes_por_mentor'] is not None else 'Sin mentores', f['sesiones'], f['prioridad']]
          for i, f in enumerate(datos['en_riesgo'], start=1)], [5, 40, 20, 10, 22, 10, 11])
    salida = io.BytesIO()
    libro.save(salida)
    return salida.getvalue()


@api_view(['GET'])
def exportar_demanda(request):
    """GET /api/cursos/demanda/exportar/?ciclo=3&limite=10: el mismo ranking en un Excel con una hoja por lista."""
    ciclo, limite, error = leer_filtros(request.query_params)
    if error:
        return Response({'detalle': error}, status=400)
    contenido = generar_excel(datos_demanda(ciclo, limite))
    respuesta = HttpResponse(contenido, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    sufijo = f'_ciclo{ciclo}' if ciclo else ''
    respuesta['Content-Disposition'] = f'attachment; filename="cursos_demanda{sufijo}_{timezone.localdate():%Y-%m-%d}.xlsx"'
    return respuesta
