from datetime import datetime, time, timedelta

from django.utils import timezone
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from mentorias.sesiones import fecha_o_error

from .models import TIPOS, AccionAdmin
from .serializers import AccionAdminSerializer


class HistorialPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


class HistorialViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Historial de acciones del administrador (HU-59). Solo lectura, de la más reciente a la más antigua.

    Filtros: ?tipo=SESION_CANCELADA, ?entidad=sesion, ?admin=<id del usuario>, ?desde=AAAA-MM-DD, ?hasta=AAAA-MM-DD
    y ?search=texto (en el detalle). Paginación: ?page=1&page_size=15.
    GET /api/historial/tipos/ devuelve los tipos de acción con su nombre, para armar el filtro.
    """

    serializer_class = AccionAdminSerializer
    pagination_class = HistorialPagination
    filterset_fields = ['tipo', 'entidad']
    search_fields = ['detalle']

    def get_queryset(self):
        qs = AccionAdmin.objects.select_related('admin')
        parametros = self.request.query_params
        admin = parametros.get('admin')
        if admin:
            if not admin.isdigit():
                raise serializers.ValidationError({'admin': 'Indica el id numérico del administrador.'})
            qs = qs.filter(admin_id=int(admin))
        desde = fecha_o_error(parametros.get('desde'), 'desde')
        hasta = fecha_o_error(parametros.get('hasta'), 'hasta')
        # Se compara con la hora local (Lima) del inicio de cada día; el filtro __date de Django exige tener cargadas
        # las zonas horarias en MySQL, y en XAMPP no vienen.
        if desde:
            qs = qs.filter(fecha__gte=timezone.make_aware(datetime.combine(desde, time.min)))
        if hasta:
            qs = qs.filter(fecha__lt=timezone.make_aware(datetime.combine(hasta + timedelta(days=1), time.min)))
        return qs

    @action(detail=False, methods=['get'])
    def tipos(self, request):
        return Response([{'tipo': tipo, 'texto': texto} for tipo, texto in TIPOS.items()])
