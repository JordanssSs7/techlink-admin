from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from auditoria.registro import registrar
from core.auth import admin_id
from mentorias.models import Calificacion
from usuarios.models import Mentor

from .models import Reporte
from .serializers import CalificacionModeradaSerializer, NotaSerializer, OcultarSerializer, ReporteSerializer


class ModeracionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def recalcular_reputacion(mentor_id):
    """Deja la reputación del mentor como el promedio de sus calificaciones visibles (igual que hace el backend de usuario)."""
    r = Calificacion.objects.filter(sesion__mentor_id=mentor_id, oculto=False).aggregate(
        promedio=Avg('estrellas'), total=Count('id'))
    promedio = Decimal(str(r['promedio'] or 0)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    Mentor.objects.filter(pk=mentor_id).update(reputacion=promedio, total_calificaciones=r['total'])


class ReporteViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Reportes de usuarios y sesiones (HU-52). Los envían estudiantes y mentores (HU-29).

    Filtros: ?estado=PENDIENTE|RESUELTO|DESCARTADO, ?tipo=USUARIO|SESION, ?motivo=ACOSO... y ?search=texto
    (nombre o correo de quien reporta o de quien es reportado). Paginación: ?page=1&page_size=10.
    Acciones: POST /{id}/resolver/ y POST /{id}/descartar/ (las dos con "nota"). GET /resumen/ cuenta por estado.
    """

    serializer_class = ReporteSerializer
    pagination_class = ModeracionPagination
    filterset_fields = ['estado', 'tipo', 'motivo']
    search_fields = ['reportante__nombres', 'reportante__apellidos', 'reportante__correo',
                     'reportado__nombres', 'reportado__apellidos', 'reportado__correo']
    ordering_fields = ['fecha_creacion']
    # Primero los pendientes, y dentro de cada estado los más recientes.
    ordering = ['-fecha_creacion', '-id']

    def get_queryset(self):
        return Reporte.objects.select_related('reportante', 'reportado__rol', 'sesion__curso')

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        total = dict(Reporte.objects.values_list('estado').annotate(total=Count('id')))
        return Response({estado: total.get(estado, 0) for estado, _ in Reporte.ESTADOS})

    def _cerrar(self, request, pk, estado, tipo_accion):
        entrada = NotaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        nota = entrada.validated_data['nota']
        with transaction.atomic():
            reporte = get_object_or_404(Reporte.objects.select_for_update(), pk=pk)
            if reporte.estado != 'PENDIENTE':
                return Response({'detalle': 'Este reporte ya fue revisado.'}, status=status.HTTP_409_CONFLICT)
            reporte.estado = estado
            reporte.fecha_revision = timezone.now()
            reporte.id_revisor = admin_id(request)
            reporte.nota_revision = nota
            reporte.save(update_fields=['estado', 'fecha_revision', 'id_revisor', 'nota_revision'])
            registrar(request, tipo_accion, 'reporte', reporte.id, f'Reporte #{reporte.id}: {nota}')
        return Response(self.get_serializer(self.get_queryset().get(pk=pk)).data)

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        """El reporte era válido y ya se tomó una acción. La nota dice cuál."""
        return self._cerrar(request, pk, 'RESUELTO', 'REPORTE_RESUELTO')

    @action(detail=True, methods=['post'])
    def descartar(self, request, pk=None):
        """El reporte no procede. La nota dice por qué."""
        return self._cerrar(request, pk, 'DESCARTADO', 'REPORTE_DESCARTADO')


class CalificacionModeracionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Calificaciones y comentarios de los mentores para moderarlos (HU-53).

    Filtros: ?oculto=true|false, ?estrellas=1..5, ?con_comentario=true y ?search=texto (comentario, mentor o estudiante).
    Acciones: POST /{id}/ocultar/ (con "motivo") y POST /{id}/mostrar/. Una calificación oculta no se muestra en el
    perfil del mentor ni cuenta para su reputación: al cambiarla, esa reputación se recalcula.
    """

    serializer_class = CalificacionModeradaSerializer
    pagination_class = ModeracionPagination
    filterset_fields = ['estrellas']
    search_fields = ['comentario', 'sesion__mentor__usuario__nombres', 'sesion__mentor__usuario__apellidos',
                     'sesion__estudiante__usuario__nombres', 'sesion__estudiante__usuario__apellidos']
    ordering = ['-fecha_creacion', '-id']

    def get_queryset(self):
        qs = Calificacion.objects.select_related('sesion__mentor__usuario', 'sesion__estudiante__usuario',
                                                 'sesion__curso')
        parametros = self.request.query_params
        if parametros.get('oculto') in ('true', 'false'):
            qs = qs.filter(oculto=parametros['oculto'] == 'true')
        if parametros.get('con_comentario') == 'true':
            qs = qs.exclude(comentario__isnull=True).exclude(comentario='')
        return qs

    @action(detail=True, methods=['post'])
    def ocultar(self, request, pk=None):
        entrada = OcultarSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        motivo = entrada.validated_data['motivo']
        with transaction.atomic():
            calificacion = get_object_or_404(Calificacion.objects.select_for_update().select_related('sesion'), pk=pk)
            if calificacion.oculto:
                return Response({'detalle': 'Esta calificación ya está oculta.'}, status=status.HTTP_409_CONFLICT)
            calificacion.oculto = True
            calificacion.fecha_moderacion = timezone.now()
            calificacion.motivo_moderacion = motivo
            calificacion.save(update_fields=['oculto', 'fecha_moderacion', 'motivo_moderacion'])
            recalcular_reputacion(calificacion.sesion.mentor_id)
            registrar(request, 'CALIFICACION_OCULTADA', 'calificacion', calificacion.id,
                      f'Calificación #{calificacion.id} ({calificacion.estrellas}★): {motivo}')
        return Response(self.get_serializer(self.get_queryset().get(pk=pk)).data)

    @action(detail=True, methods=['post'])
    def mostrar(self, request, pk=None):
        with transaction.atomic():
            calificacion = get_object_or_404(Calificacion.objects.select_for_update().select_related('sesion'), pk=pk)
            if not calificacion.oculto:
                return Response({'detalle': 'Esta calificación ya es visible.'}, status=status.HTTP_409_CONFLICT)
            calificacion.oculto = False
            calificacion.fecha_moderacion = timezone.now()
            calificacion.motivo_moderacion = None
            calificacion.save(update_fields=['oculto', 'fecha_moderacion', 'motivo_moderacion'])
            recalcular_reputacion(calificacion.sesion.mentor_id)
            registrar(request, 'CALIFICACION_MOSTRADA', 'calificacion', calificacion.id,
                      f'Calificación #{calificacion.id} ({calificacion.estrellas}★) vuelve a mostrarse')
        return Response(self.get_serializer(self.get_queryset().get(pk=pk)).data)
