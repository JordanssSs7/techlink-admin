import io

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from cursos.models import Curso
from usuarios.models import Mentor, Usuario

from .metricas import ahora_local, estado_sesion, horas, resumen_sesiones
from .models import Sesion

ETIQUETAS_ESTADO = {'COMPLETADA': 'Completada', 'PROGRAMADA': 'Programada', 'CANCELADA': 'Cancelada'}


def datos_reporte():
    """Reúne los datos del reporte consolidado: indicadores, sesiones y mentores."""
    ahora = ahora_local()
    r = resumen_sesiones()
    promedio = f"{r['calificacion_promedio']} / 5" if r['calificacion_promedio'] is not None else 'Sin calificaciones'
    indicadores = [
        ('Estudiantes registrados', Usuario.objects.filter(rol__nombre='ESTUDIANTE').count()),
        ('Mentores', Usuario.objects.filter(rol__nombre='MENTOR').count()),
        ('Mentores activos', Usuario.objects.filter(rol__nombre='MENTOR', estado='ACTIVO').count()),
        ('Administradores', Usuario.objects.filter(rol__nombre='ADMIN').count()),
        ('Cursos activos', Curso.objects.filter(activo=True).count()),
        ('Sesiones en total', r['total']),
        ('Sesiones completadas', r['completadas']),
        ('Sesiones programadas', r['proximas']),
        ('Sesiones canceladas', r['canceladas']),
        ('Horas impartidas', r['horas_impartidas']),
        ('Calificación promedio', promedio),
        ('Total de calificaciones', r['total_calificaciones']),
    ]

    sesiones = []
    por_mentor = {}
    consulta = Sesion.objects.select_related('mentor__usuario', 'estudiante__usuario', 'curso', 'calificacion')
    for s in consulta.order_by('-fecha', '-hora_inicio'):
        situacion = estado_sesion(s, ahora)
        try:
            estrellas = s.calificacion.estrellas
        except Sesion.calificacion.RelatedObjectDoesNotExist:
            estrellas = None
        sesiones.append([
            s.fecha.strftime('%d/%m/%Y'),
            f'{s.hora_inicio:%H:%M} - {s.hora_fin:%H:%M}',
            s.curso.nombre if s.curso_id else '-',
            f'{s.mentor.usuario.nombres} {s.mentor.usuario.apellidos}',
            f'{s.estudiante.usuario.nombres} {s.estudiante.usuario.apellidos}',
            ETIQUETAS_ESTADO[situacion],
            estrellas if estrellas is not None else '-',
        ])
        if situacion == 'COMPLETADA':
            acumulado = por_mentor.setdefault(s.mentor_id, {'sesiones': 0, 'horas': 0})
            acumulado['sesiones'] += 1
            acumulado['horas'] += horas(s)

    mentores = []
    for m in Mentor.objects.select_related('usuario').order_by('-reputacion', 'usuario__nombres'):
        acumulado = por_mentor.get(m.id, {'sesiones': 0, 'horas': 0})
        mentores.append([f'{m.usuario.nombres} {m.usuario.apellidos}', float(m.reputacion), m.total_calificaciones,
                         acumulado['sesiones'], round(acumulado['horas'], 2)])
    return indicadores, sesiones, mentores


COLUMNAS_SESIONES = ['Fecha', 'Horario', 'Curso', 'Mentor', 'Estudiante', 'Estado', 'Estrellas']
COLUMNAS_MENTORES = ['Mentor', 'Reputación', 'Calificaciones', 'Sesiones completadas', 'Horas impartidas']


def generar_excel(indicadores, sesiones, mentores):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    libro = Workbook()
    relleno = PatternFill('solid', fgColor='4F46E5')
    encabezado = Font(bold=True, color='FFFFFF')

    def hoja(titulo, columnas, filas, anchos):
        h = libro.create_sheet(titulo)
        h.append(columnas)
        for celda in h[1]:
            celda.font, celda.fill = encabezado, relleno
            celda.alignment = Alignment(horizontal='center')
        for fila in filas:
            h.append(fila)
        for indice, ancho in enumerate(anchos, start=1):
            h.column_dimensions[chr(64 + indice)].width = ancho
        h.freeze_panes = 'A2'

    libro.remove(libro.active)
    hoja('Resumen', ['Indicador', 'Valor'], indicadores, [32, 22])
    hoja('Sesiones', COLUMNAS_SESIONES, sesiones, [12, 16, 24, 28, 28, 12, 10])
    hoja('Mentores', COLUMNAS_MENTORES, mentores, [30, 12, 15, 22, 18])
    salida = io.BytesIO()
    libro.save(salida)
    return salida.getvalue()


def generar_pdf(indicadores, sesiones, mentores):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    estilos = getSampleStyleSheet()
    salida = io.BytesIO()
    documento = SimpleDocTemplate(salida, pagesize=A4, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
                                  topMargin=1.5 * cm, bottomMargin=1.5 * cm, title='Reporte de TechLink')

    def tabla(columnas, filas, anchos):
        t = Table([columnas] + [[str(c) for c in f] for f in filas], colWidths=[a * cm for a in anchos], repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        return t

    contenido = [
        Paragraph('TechLink · Reporte consolidado', estilos['Title']),
        Paragraph(f'Generado el {timezone.localtime():%d/%m/%Y %H:%M}', estilos['Normal']),
        Spacer(1, 0.5 * cm),
        Paragraph('Indicadores', estilos['Heading2']),
        tabla(['Indicador', 'Valor'], indicadores, [9, 6]),
        Spacer(1, 0.5 * cm),
        Paragraph('Mentores', estilos['Heading2']),
        tabla(COLUMNAS_MENTORES, mentores or [['Sin mentores', '', '', '', '']], [5.5, 2.5, 3, 3.5, 3]),
        Spacer(1, 0.5 * cm),
        Paragraph('Sesiones', estilos['Heading2']),
        tabla(COLUMNAS_SESIONES, sesiones or [['Sin sesiones', '', '', '', '', '', '']], [2.2, 2.6, 3.2, 3.4, 3.4, 2, 1.6]),
    ]
    documento.build(contenido)
    return salida.getvalue()


@api_view(['GET'])
def exportar(request):
    """HU-50: descarga el reporte consolidado en Excel (?formato=xlsx) o PDF (?formato=pdf)."""
    formato = request.query_params.get('formato', 'xlsx').lower()
    if formato not in ('xlsx', 'pdf'):
        return Response({'formato': 'Usa formato=xlsx o formato=pdf.'}, status=400)
    indicadores, sesiones, mentores = datos_reporte()
    if formato == 'xlsx':
        contenido = generar_excel(indicadores, sesiones, mentores)
        tipo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    else:
        contenido = generar_pdf(indicadores, sesiones, mentores)
        tipo = 'application/pdf'
    respuesta = HttpResponse(contenido, content_type=tipo)
    respuesta['Content-Disposition'] = f'attachment; filename="reporte_techlink_{timezone.localdate():%Y-%m-%d}.{formato}"'
    return respuesta
