from decimal import ROUND_HALF_UP, Decimal

from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from cursos.models import Curso
from usuarios.models import Mentor

from .metricas import ahora_local, filtro_estado, horas
from .models import Calificacion, Sesion
from .sesiones import fecha_o_error
from .views import hay_tabla_sesiones

ORDENES = {'calificacion', 'horas'}
LIMITE_PREDETERMINADO = 20
LIMITE_MAXIMO = 100


def promedio_de(suma, cantidad):
    """Promedio con dos decimales (o None si no hay calificaciones)."""
    if not cantidad:
        return None
    return float((Decimal(suma) / Decimal(cantidad)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def clave_de_orden(orden):
    """Qué va primero en el ranking. Los mentores sin calificaciones quedan después de los que sí tienen."""

    def por_calificacion(m):
        # Mayor promedio, luego más calificaciones, luego más horas, y por último el nombre.
        return (m['promedio'] is None, -(m['promedio'] or 0), -m['calificaciones'], -m['horas'], m['nombre'])

    def por_horas(m):
        # Más horas, luego mayor promedio, luego más calificaciones, y por último el nombre.
        return (-m['horas'], m['promedio'] is None, -(m['promedio'] or 0), -m['calificaciones'], m['nombre'])

    return por_horas if orden == 'horas' else por_calificacion


@api_view(['GET'])
def ranking_mentores(request):
    """GET /api/mentores/ranking/: ranking de mentores por horas dictadas y calificación (HU-56).

    Solo cuentan las sesiones COMPLETADAS (confirmadas y ya terminadas) y las calificaciones que no se ocultaron (HU-53),
    el mismo cálculo que el ranking que ven los estudiantes. Filtros, todos opcionales y combinables:
      ?curso=ID                  solo las sesiones de ese curso
      ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD   solo las sesiones de ese período (inclusive)
      ?orden=calificacion|horas  cómo se ordena (calificacion por defecto)
      ?limite=N                  cuántos mentores devuelve (20 por defecto, máximo 100)
    Un mentor sin sesiones completadas en ese filtro no aparece. 400 si un filtro es inválido.
    """
    parametros = request.query_params
    errores = {}

    curso_id = None
    if parametros.get('curso'):
        try:
            curso_id = int(parametros['curso'])
        except ValueError:
            errores['curso'] = 'El curso debe ser un número.'
        else:
            if not Curso.objects.filter(id=curso_id).exists():
                errores['curso'] = 'El curso no existe.'
    orden = parametros.get('orden') or 'calificacion'
    if orden not in ORDENES:
        errores['orden'] = 'El orden debe ser calificacion o horas.'
    limite = LIMITE_PREDETERMINADO
    if parametros.get('limite'):
        try:
            limite = max(1, min(int(parametros['limite']), LIMITE_MAXIMO))
        except ValueError:
            errores['limite'] = 'El límite debe ser un número.'
    try:
        desde = fecha_o_error(parametros.get('desde'), 'desde')
        hasta = fecha_o_error(parametros.get('hasta'), 'hasta')
    except serializers.ValidationError as e:
        # El detalle de cada campo puede ser un texto o una lista de textos.
        errores.update({campo: ' '.join(map(str, texto)) if isinstance(texto, list) else str(texto)
                        for campo, texto in e.detail.items()})
        desde = hasta = None
    if desde and hasta and desde > hasta:
        errores['hasta'] = 'La fecha final no puede ser anterior a la inicial.'
    if errores:
        raise serializers.ValidationError(errores)

    filtros = {'curso': curso_id, 'desde': desde, 'hasta': hasta, 'orden': orden}
    if not hay_tabla_sesiones():
        return Response({'sesiones_disponibles': False, 'filtros': filtros, 'total_mentores': 0, 'mentores': []})

    completadas = Sesion.objects.filter(filtro_estado('COMPLETADA', ahora_local()))
    if curso_id:
        completadas = completadas.filter(curso_id=curso_id)
    if desde:
        completadas = completadas.filter(fecha__gte=desde)
    if hasta:
        completadas = completadas.filter(fecha__lte=hasta)

    # Horas, sesiones y estudiantes atendidos por mentor.
    acumulado = {}
    for mentor_id, estudiante_id, inicio, fin in completadas.values_list(
            'mentor_id', 'estudiante_id', 'hora_inicio', 'hora_fin'):
        fila = acumulado.setdefault(mentor_id, {'horas': 0.0, 'sesiones': 0, 'estudiantes': set(), 'suma': 0, 'cantidad': 0})
        fila['horas'] += horas(Sesion(hora_inicio=inicio, hora_fin=fin))
        fila['sesiones'] += 1
        fila['estudiantes'].add(estudiante_id)

    # HU-53: las calificaciones ocultas por moderación no cuentan. Se cuentan las de las sesiones del filtro.
    for mentor_id, estrellas in Calificacion.objects.filter(sesion__in=completadas, oculto=False).values_list(
            'sesion__mentor_id', 'estrellas'):
        if mentor_id in acumulado:
            acumulado[mentor_id]['suma'] += estrellas
            acumulado[mentor_id]['cantidad'] += 1

    mentores = []
    for m in Mentor.objects.select_related('usuario').filter(id__in=acumulado.keys()):
        a = acumulado[m.id]
        mentores.append({
            'id': m.id,
            'nombre': str(m.usuario),
            'correo': m.usuario.correo,
            'estado': m.usuario.estado,
            'especialidad': m.especialidad,
            'horas': round(a['horas'], 2),
            'sesiones': a['sesiones'],
            'estudiantes_atendidos': len(a['estudiantes']),
            'promedio': promedio_de(a['suma'], a['cantidad']),
            'calificaciones': a['cantidad'],
        })
    mentores.sort(key=clave_de_orden(orden))
    total = len(mentores)
    for posicion, mentor in enumerate(mentores[:limite], start=1):
        mentor['posicion'] = posicion
    return Response({'sesiones_disponibles': True, 'filtros': filtros, 'total_mentores': total, 'mentores': mentores[:limite]})
