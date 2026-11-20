from datetime import date, datetime

from django.db.models import Avg, Count, Q
from django.utils import timezone

from .models import Calificacion, Sesion


def horas(sesion):
    """Duración de una sesión en horas (por ejemplo 1.5)."""
    inicio = datetime.combine(date.min, sesion.hora_inicio)
    fin = datetime.combine(date.min, sesion.hora_fin)
    return round((fin - inicio).total_seconds() / 3600, 2)


def ahora_local():
    """Fecha y hora actuales de Lima sin zona: así se comparan con la fecha y la hora que guarda la tabla."""
    return timezone.localtime().replace(tzinfo=None)


def estado_sesion(sesion, ahora):
    """CANCELADA, PROGRAMADA (todavía no termina) o COMPLETADA (confirmada y ya terminó)."""
    if sesion.estado == 'CANCELADA':
        return 'CANCELADA'
    return 'COMPLETADA' if datetime.combine(sesion.fecha, sesion.hora_fin) <= ahora else 'PROGRAMADA'


def filtro_estado(estado, ahora):
    """Condición (Q) equivalente a estado_sesion para filtrar en la base de datos."""
    hoy, hora = ahora.date(), ahora.time()
    programada = Q(estado='CONFIRMADA') & (Q(fecha__gt=hoy) | Q(fecha=hoy, hora_fin__gt=hora))
    if estado == 'PROGRAMADA':
        return programada
    if estado == 'COMPLETADA':
        return Q(estado='CONFIRMADA') & ~programada
    if estado == 'CANCELADA':
        return Q(estado='CANCELADA')
    return Q()


def resumen_sesiones():
    """Indicadores de sesiones y calificaciones para el panel y para el reporte exportado (HU-50)."""
    ahora = ahora_local()
    sesiones = list(Sesion.objects.all())
    por_estado = {'COMPLETADA': [], 'PROGRAMADA': [], 'CANCELADA': []}
    for s in sesiones:
        por_estado[estado_sesion(s, ahora)].append(s)
    confirmadas = por_estado['COMPLETADA'] + por_estado['PROGRAMADA']

    # HU-53: las calificaciones ocultas por moderación no cuentan.
    visibles = Calificacion.objects.filter(oculto=False)
    resumen_cal = visibles.aggregate(promedio=Avg('estrellas'), total=Count('id'))
    por_estrellas = {n: 0 for n in range(1, 6)}
    for fila in visibles.values('estrellas').annotate(total=Count('id')):
        if fila['estrellas'] in por_estrellas:
            por_estrellas[fila['estrellas']] = fila['total']

    return {
        'total': len(sesiones),
        'confirmadas': len(confirmadas),
        'completadas': len(por_estado['COMPLETADA']),
        'canceladas': len(por_estado['CANCELADA']),
        'horas_confirmadas': round(sum(horas(s) for s in confirmadas), 2),
        'horas_impartidas': round(sum(horas(s) for s in por_estado['COMPLETADA']), 2),
        'proximas': len(por_estado['PROGRAMADA']),
        'estudiantes_atendidos': len({s.estudiante_id for s in confirmadas}),
        'calificacion_promedio': round(float(resumen_cal['promedio']), 1) if resumen_cal['promedio'] is not None else None,
        'total_calificaciones': resumen_cal['total'],
        'por_estrellas': por_estrellas,
    }
