import secrets

from django.db import connection, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from auditoria.registro import registrar
from core.auth import admin_id

from .models import ConstanciaMentor
from .serializers import ConstanciaSerializer


class ConstanciaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def avisar_al_mentor(constancia):
    """Deja una notificación en el centro de notificaciones del mentor (tabla del backend de usuario, V12)."""
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje) VALUES (%s, 'ANUNCIO', %s, %s)",
            [constancia.mentor.usuario_id, 'Tu constancia de mentoría está lista',
             'Un administrador emitió tu constancia. Ya puedes verla y descargarla en Estadísticas.'])


class ConstanciaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Constancias de mentoría (HU-27): las de los mentores que llegaron a las horas mínimas, para emitirlas.

    Filtros: ?estado=PENDIENTE|EMITIDA y ?search=texto (nombre o correo del mentor). Paginación: ?page=1&page_size=10.
    GET /resumen/ cuenta las pendientes y las emitidas. POST /{id}/emitir/ la emite: el mentor recibe un aviso y ya puede
    descargarla (409 si ya estaba emitida).
    """

    serializer_class = ConstanciaSerializer
    pagination_class = ConstanciaPagination
    filterset_fields = ['estado']
    search_fields = ['mentor__usuario__nombres', 'mentor__usuario__apellidos', 'mentor__usuario__correo']
    ordering_fields = ['fecha_elegible', 'fecha_emision', 'horas_al_cumplir']
    queryset = ConstanciaMentor.objects.select_related('mentor__usuario', 'admin')

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        return Response({
            'pendientes': ConstanciaMentor.objects.filter(estado='PENDIENTE').count(),
            'emitidas': ConstanciaMentor.objects.filter(estado='EMITIDA').count(),
        })

    @action(detail=True, methods=['post'])
    def emitir(self, request, pk=None):
        with transaction.atomic():
            constancia = get_object_or_404(ConstanciaMentor.objects.select_for_update(), pk=pk)
            if constancia.estado == 'EMITIDA':
                return Response({'detalle': 'Esta constancia ya fue emitida.'}, status=status.HTTP_409_CONFLICT)
            constancia.estado = 'EMITIDA'
            constancia.fecha_emision = timezone.now()
            constancia.admin_id = admin_id(request)
            # 10 caracteres hexadecimales en mayúsculas: no se pueden adivinar. Si ya tenía uno (lo da el backend de usuario al
            # consultarla), se conserva para no invalidar un QR ya impreso.
            if not constancia.codigo_verificacion:
                constancia.codigo_verificacion = secrets.token_hex(5).upper()
            constancia.save(update_fields=['estado', 'fecha_emision', 'admin', 'codigo_verificacion'])
            constancia = ConstanciaMentor.objects.select_related('mentor__usuario', 'admin').get(pk=constancia.pk)
            avisar_al_mentor(constancia)
            registrar(request, 'CONSTANCIA_EMITIDA', 'constancia', constancia.id,
                      f'Emitió la constancia de mentoría de {constancia.mentor.usuario}')
        return Response(self.get_serializer(constancia).data)
