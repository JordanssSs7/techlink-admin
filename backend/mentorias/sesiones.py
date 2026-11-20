from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from auditoria.registro import registrar
from .metricas import ahora_local, estado_sesion, filtro_estado
from .models import Sesion
from .serializers import CancelacionSerializer, SesionSerializer


class SesionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def fecha_o_error(valor, campo):
    if not valor:
        return None
    fecha = parse_date(valor)
    if fecha is None:
        raise serializers.ValidationError({campo: 'Fecha inválida: usa el formato AAAA-MM-DD.'})
    return fecha


def avisar_cancelacion(sesion, motivo):
    """Avisa por correo al estudiante y al mentor. Devuelve cuántos correos se enviaron."""
    curso = sesion.curso.nombre if sesion.curso_id else 'mentoría'
    detalle = f'{curso} el {sesion.fecha:%d/%m/%Y} de {sesion.hora_inicio:%H:%M} a {sesion.hora_fin:%H:%M}'
    enviados = 0
    for persona, otra in ((sesion.estudiante.usuario, sesion.mentor.usuario),
                          (sesion.mentor.usuario, sesion.estudiante.usuario)):
        cuerpo = (f'Hola {persona.nombres},\n\n'
                  f'La administración de TechLink canceló tu sesión de {detalle} con {otra.nombres} {otra.apellidos}.\n'
                  f'Motivo: {motivo}\n\n'
                  'Puedes agendar una nueva sesión desde la aplicación.')
        try:
            enviados += send_mail('Tu sesión de mentoría fue cancelada', cuerpo, None, [persona.correo], fail_silently=False)
        except Exception:  # un correo que falla no debe deshacer la cancelación
            continue
    return enviados


class SesionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Sesiones de mentoría (HU-51).

    Filtros: ?estado=PROGRAMADA|COMPLETADA|CANCELADA, ?desde=AAAA-MM-DD, ?hasta=AAAA-MM-DD, ?mentor=id y
    ?search=texto (nombre del mentor o del estudiante). Paginación: ?page=1&page_size=10.
    Acción: POST /{id}/cancelar/ con {"motivo": "..."}.
    """

    serializer_class = SesionSerializer
    pagination_class = SesionPagination

    def get_queryset(self):
        ahora = ahora_local()
        consulta = Sesion.objects.select_related(
            'mentor__usuario', 'estudiante__usuario', 'curso', 'calificacion').order_by('-fecha', '-hora_inicio', '-id')
        p = self.request.query_params
        estado = p.get('estado')
        if estado in ('PROGRAMADA', 'COMPLETADA', 'CANCELADA'):
            consulta = consulta.filter(filtro_estado(estado, ahora))
        desde, hasta = fecha_o_error(p.get('desde'), 'desde'), fecha_o_error(p.get('hasta'), 'hasta')
        if desde:
            consulta = consulta.filter(fecha__gte=desde)
        if hasta:
            consulta = consulta.filter(fecha__lte=hasta)
        if p.get('mentor', '').isdigit():
            consulta = consulta.filter(mentor_id=int(p['mentor']))
        texto = p.get('search', '').strip()
        if texto:
            consulta = consulta.filter(
                Q(mentor__usuario__nombres__icontains=texto) | Q(mentor__usuario__apellidos__icontains=texto) |
                Q(estudiante__usuario__nombres__icontains=texto) | Q(estudiante__usuario__apellidos__icontains=texto))
        return consulta

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'ahora': ahora_local()}

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela una sesión programada. Exige el motivo y avisa al estudiante y al mentor."""
        entrada = CancelacionSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        motivo = entrada.validated_data['motivo']
        with transaction.atomic():
            sesion = get_object_or_404(Sesion.objects.select_for_update(), pk=pk)
            situacion = estado_sesion(sesion, ahora_local())
            if situacion == 'CANCELADA':
                return Response({'detalle': 'Esta sesión ya fue cancelada.'}, status=status.HTTP_409_CONFLICT)
            if situacion == 'COMPLETADA':
                return Response({'detalle': 'No se puede cancelar una sesión que ya terminó.'}, status=status.HTTP_409_CONFLICT)
            sesion.estado = 'CANCELADA'
            sesion.save(update_fields=['estado'])
            registrar(request, 'SESION_CANCELADA', 'sesion', sesion.id,
                      f'Canceló la sesión #{sesion.id} ({sesion.fecha:%d/%m/%Y} {sesion.hora_inicio:%H:%M}): {motivo}')
        sesion = self.get_queryset().get(pk=pk)
        datos = self.get_serializer(sesion).data
        datos['correos_enviados'] = avisar_cancelacion(sesion, motivo)
        return Response(datos)
