from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from auditoria.registro import registrar
from core.auth import admin_id
from usuarios.models import Usuario

from .models import ID_FILA, MAX_BLOQUEO, MAX_INTENTOS, MIN_BLOQUEO, MIN_INTENTOS, ParametrosSeguridad
from .serializers import ParametrosSerializer, normalizar_dominio

# Los valores con los que ya funcionaba el login (HU-02): se usan si todavía no existe la fila.
PREDETERMINADOS = {'dominio_permitido': 'tecsup.edu.pe', 'max_intentos': 3, 'minutos_bloqueo': 15}


def fila_actual():
    """La fila única de parámetros; si no existe (migración sin aplicar o fila borrada) se crea con los predeterminados."""
    fila, _ = ParametrosSeguridad.objects.select_related('admin').get_or_create(id=ID_FILA, defaults=PREDETERMINADOS)
    return fila


def usuarios_fuera_del_dominio(dominio):
    """Estudiantes y mentores activos cuyo correo no es de ese dominio: no podrían iniciar sesión con Google."""
    return (Usuario.objects.filter(estado='ACTIVO', rol__nombre__in=['ESTUDIANTE', 'MENTOR'])
            .exclude(correo__iendswith='@' + dominio).count())


def respuesta(fila, serializador=None):
    datos = (serializador or ParametrosSerializer(fila)).data
    return {
        **datos,
        'usuarios_fuera_del_dominio': usuarios_fuera_del_dominio(fila.dominio_permitido),
        'limites': {'intentos': [MIN_INTENTOS, MAX_INTENTOS], 'minutos_bloqueo': [MIN_BLOQUEO, MAX_BLOQUEO]},
    }


@api_view(['GET', 'PUT', 'PATCH'])
def parametros(request):
    """Parámetros de seguridad del sistema (HU-60).

    GET: los valores vigentes, quién los cambió por última vez y cuántos estudiantes y mentores activos quedarían fuera
    del dominio actual. PUT o PATCH: cambia el dominio institucional permitido (dominio_permitido), los intentos máximos
    antes de bloquear (max_intentos, de 1 a 10) y los minutos de bloqueo (minutos_bloqueo, de 1 a 1440). Los cambios
    rigen en los siguientes inicios de sesión: el backend de usuario los lee en cada intento. 400 si algún valor es inválido.
    """
    with transaction.atomic():
        fila = ParametrosSeguridad.objects.select_for_update().filter(id=ID_FILA).first() or fila_actual()
        if request.method == 'GET':
            return Response(respuesta(fila))

        antes = {c: getattr(fila, c) for c in PREDETERMINADOS}
        serializador = ParametrosSerializer(fila, data=request.data, partial=request.method == 'PATCH')
        serializador.is_valid(raise_exception=True)
        cambios = {c: v for c, v in serializador.validated_data.items() if antes.get(c) != v}
        if not cambios:
            return Response({**respuesta(fila), 'sin_cambios': True})

        fila = serializador.save(admin_id=admin_id(request), fecha_actualizacion=timezone.now())
        partes = []
        if 'dominio_permitido' in cambios:
            partes.append(f'dominio {antes["dominio_permitido"]} → {fila.dominio_permitido}')
        if 'max_intentos' in cambios:
            partes.append(f'intentos máximos {antes["max_intentos"]} → {fila.max_intentos}')
        if 'minutos_bloqueo' in cambios:
            partes.append(f'bloqueo {antes["minutos_bloqueo"]} → {fila.minutos_bloqueo} min')
        registrar(request, 'PARAMETROS_ACTUALIZADOS', 'parametros', ID_FILA, 'Cambió los parámetros de seguridad: ' + '; '.join(partes))
        return Response({**respuesta(fila), 'sin_cambios': False})


@api_view(['GET'])
def impacto(request):
    """GET /api/parametros-seguridad/impacto/?dominio=x: a cuántos estudiantes y mentores activos dejaría sin acceso ese dominio.

    Sirve para avisar al administrador antes de guardar un dominio que no coincide con los correos actuales.
    """
    dominio = normalizar_dominio(request.query_params.get('dominio'))
    total = Usuario.objects.filter(estado='ACTIVO', rol__nombre__in=['ESTUDIANTE', 'MENTOR']).count()
    return Response({'dominio': dominio, 'usuarios_afectados': usuarios_fuera_del_dominio(dominio), 'total_usuarios': total})
