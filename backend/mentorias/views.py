from datetime import date, datetime, time, timedelta

from django.db import connection
from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from cursos.models import Curso
from usuarios.models import Mentor, Usuario

from .models import Sesion


def hay_tabla_sesiones():
    return 'sesiones' in connection.introspection.table_names()


def horas(sesion):
    inicio = datetime.combine(date.min, sesion.hora_inicio)
    fin = datetime.combine(date.min, sesion.hora_fin)
    return round((fin - inicio).total_seconds() / 3600, 2)


def agrupar_por_mentor(sql):
    """Ejecuta una consulta que devuelve (id_mentor, valor) y la agrupa en {id_mentor: [valores]}."""
    with connection.cursor() as c:
        c.execute(sql)
        resultado = {}
        for id_mentor, valor in c.fetchall():
            resultado.setdefault(id_mentor, []).append(valor)
        return resultado


@api_view(['GET'])
def mentores(request):
    """GET /api/mentores/: cada mentor con su perfil, horarios y sesiones (relación 1:N)."""
    cursos = agrupar_por_mentor('SELECT mc.id_mentor, cu.nombre FROM mentor_cursos mc '
                                'JOIN cursos cu ON cu.id_curso = mc.id_curso ORDER BY cu.nombre')
    fortalezas = agrupar_por_mentor('SELECT id_mentor, fortaleza FROM mentor_fortalezas ORDER BY fortaleza')
    areas = agrupar_por_mentor('SELECT id_mentor, area FROM mentor_areas ORDER BY area')
    with connection.cursor() as c:
        c.execute('SELECT id_mentor, COUNT(*) FROM mentor_disponibilidad WHERE activo = 1 GROUP BY id_mentor')
        horarios = dict(c.fetchall())

    con_sesiones = hay_tabla_sesiones()
    sesiones = {}
    if con_sesiones:
        for s in Sesion.objects.select_related('estudiante__usuario'):
            sesiones.setdefault(s.mentor_id, []).append({
                'id': s.id,
                'estudiante': str(s.estudiante.usuario),
                'fecha': s.fecha,
                'hora_inicio': s.hora_inicio.strftime('%H:%M'),
                'hora_fin': s.hora_fin.strftime('%H:%M'),
                'horas': horas(s),
                'estado': s.estado,
            })

    datos = []
    for m in Mentor.objects.select_related('usuario').order_by('usuario__nombres'):
        datos.append({
            'id': m.id,
            'nombre': str(m.usuario),
            'correo': m.usuario.correo,
            'estado': m.usuario.estado,
            'especialidad': m.especialidad,
            'cursos': cursos.get(m.id, []),
            'fortalezas': fortalezas.get(m.id, []),
            'areas': areas.get(m.id, []),
            'horarios_activos': horarios.get(m.id, 0),
            'sesiones': sesiones.get(m.id, []),
        })
    return Response({'sesiones_disponibles': con_sesiones, 'mentores': datos})


@api_view(['GET'])
def resumen(request):
    """GET /api/metricas/resumen/: indicadores del panel calculados con la base compartida."""
    por_rol = dict(Usuario.objects.values_list('rol__nombre').annotate(total=Count('id')))

    # Registros de las últimas 8 semanas (cada semana empieza el lunes).
    hoy = date.today()
    lunes = hoy - timedelta(days=hoy.weekday())
    semanas = [lunes - timedelta(weeks=i) for i in range(7, -1, -1)]
    registros = [{'semana': s.strftime('%d/%m'), 'total': 0} for s in semanas]
    # Se compara con una fecha y hora completas: MySQL de XAMPP no trae las tablas de zonas horarias
    # que Django necesita para el filtro __date.
    desde = timezone.make_aware(datetime.combine(semanas[0], time.min))
    for f in Usuario.objects.filter(fecha_registro__gte=desde).values_list('fecha_registro', flat=True):
        indice = (timezone.localtime(f).date() - semanas[0]).days // 7
        if 0 <= indice < len(registros):
            registros[indice]['total'] += 1

    datos = {
        'estudiantes': por_rol.get('ESTUDIANTE', 0),
        'mentores': por_rol.get('MENTOR', 0),
        'mentores_activos': Usuario.objects.filter(rol__nombre='MENTOR', estado='ACTIVO').count(),
        'administradores': por_rol.get('ADMIN', 0),
        'usuarios_inactivos': Usuario.objects.filter(estado='INACTIVO').count(),
        'cursos_activos': Curso.objects.filter(activo=True).count(),
        'registros_ultimas_4_semanas': sum(r['total'] for r in registros[-4:]),
        'registros_semanales': registros,
        'sesiones_disponibles': hay_tabla_sesiones(),
        'sesiones': None,
    }
    if datos['sesiones_disponibles']:
        todas = list(Sesion.objects.all())
        confirmadas = [s for s in todas if s.estado == 'CONFIRMADA']
        datos['sesiones'] = {
            'total': len(todas),
            'confirmadas': len(confirmadas),
            'canceladas': len(todas) - len(confirmadas),
            'horas_confirmadas': round(sum(horas(s) for s in confirmadas), 2),
            'proximas': sum(1 for s in confirmadas if s.fecha >= hoy),
            'estudiantes_atendidos': len({s.estudiante_id for s in confirmadas}),
        }
    return Response(datos)
