import secrets

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.db.models.expressions import RawSQL
from django.shortcuts import get_object_or_404
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from auditoria.registro import registrar
from mentorias.metricas import ahora_local
from mentorias.sesiones import fecha_o_error

from . import avisos
from .models import Charla
from .serializers import CharlaSerializer

# La tabla de inscripciones es del backend de usuario; aquí solo se cuentan sus filas.
INSCRITOS = '(SELECT COUNT(*) FROM charla_inscripciones ci WHERE ci.id_charla = charlas.id_charla)'


class CharlaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def vigente(ahora):
    """Condición (Q): charla activa que todavía no terminó."""
    return Q(activo=True) & (Q(fecha__gt=ahora.date()) | Q(fecha=ahora.date(), hora_fin__gt=ahora.time()))


def pasada(ahora):
    """Condición (Q): charla activa cuya hora de fin ya pasó."""
    return Q(activo=True) & ~vigente(ahora)


class CharlaViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """Charlas virtuales (HU-58): crear, listar, editar y desactivar. No se eliminan: se desactivan.

    Filtros: ?estado=VIGENTE|PASADA|INACTIVA, ?desde=AAAA-MM-DD, ?hasta=AAAA-MM-DD y ?search=texto (nombre o temática).
    Paginación: ?page=1&page_size=10. Acciones: POST /{id}/desactivar/ y POST /{id}/activar/. GET /resumen/ cuenta por estado.
    Al crear no se aceptan fechas pasadas.
    """

    serializer_class = CharlaSerializer
    pagination_class = CharlaPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    filterset_fields = ['activo']
    search_fields = ['nombre', 'tematica']
    ordering_fields = ['fecha', 'nombre']
    ordering = ['-fecha', '-hora_inicio']

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'ahora': ahora_local()}

    def get_queryset(self):
        qs = Charla.objects.select_related('curso').annotate(inscritos=RawSQL(INSCRITOS, []))
        parametros = self.request.query_params
        estado = parametros.get('estado')
        if estado:
            ahora = ahora_local()
            filtros = {'VIGENTE': vigente(ahora), 'PASADA': pasada(ahora), 'INACTIVA': Q(activo=False)}
            if estado not in filtros:
                raise serializers.ValidationError({'estado': 'El estado debe ser VIGENTE, PASADA o INACTIVA.'})
            qs = qs.filter(filtros[estado])
        desde = fecha_o_error(parametros.get('desde'), 'desde')
        hasta = fecha_o_error(parametros.get('hasta'), 'hasta')
        if desde:
            qs = qs.filter(fecha__gte=desde)
        if hasta:
            qs = qs.filter(fecha__lte=hasta)
        return qs

    def _responder(self, pk):
        return Response(self.get_serializer(self.get_queryset().get(pk=pk)).data)

    def create(self, request, *args, **kwargs):
        serializador = self.get_serializer(data=request.data)
        serializador.is_valid(raise_exception=True)
        with transaction.atomic():
            charla = serializador.save(token_invitado=secrets.token_urlsafe(24))
            # La charla se hace en la sala de TechLink: el enlace se arma con su id.
            charla.enlace = f'{settings.URL_PUBLICA}/sala/charla/{charla.id}'
            charla.save(update_fields=['enlace'])
            avisados = avisos.avisar_nueva(charla)
            registrar(request, 'CHARLA_CREADA', 'charla', charla.id,
                      f'Creó la charla "{charla.nombre}" ({charla.fecha:%d/%m/%Y} {charla.hora_inicio:%H:%M}); '
                      f'avisó a {avisados} estudiantes')
        datos = self.get_serializer(self.get_queryset().get(pk=charla.id)).data
        # Cuántos estudiantes recibieron el aviso de charla nueva en su centro de notificaciones.
        datos['avisados'] = avisados
        return Response(datos, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        viejo = serializer.instance
        activo_antes = viejo.activo
        datos_antes = (viejo.fecha, viejo.hora_inicio, viejo.hora_fin, viejo.enlace)
        with transaction.atomic():
            charla = serializer.save()
            if charla.activo != activo_antes:
                tipo, texto = ('CHARLA_ACTIVADA', 'Activó') if charla.activo else ('CHARLA_DESACTIVADA', 'Desactivó')
                avisados = avisos.avisar_estado(charla)
            else:
                tipo, texto = 'CHARLA_ACTUALIZADA', 'Actualizó'
                avisados = avisos.avisar_cambio(charla, datos_antes)
            detalle = f'{texto} la charla "{charla.nombre}"' + (f'; avisó a {avisados} inscritos' if avisados else '')
            registrar(self.request, tipo, 'charla', charla.id, detalle)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        ahora = ahora_local()
        return Response({
            'vigentes': Charla.objects.filter(vigente(ahora)).count(),
            'pasadas': Charla.objects.filter(pasada(ahora)).count(),
            'inactivas': Charla.objects.filter(activo=False).count(),
        })

    def _cambiar_activo(self, request, pk, activo):
        with transaction.atomic():
            charla = get_object_or_404(Charla.objects.select_for_update(), pk=pk)
            if charla.activo == activo:
                texto = 'ya está activa' if activo else 'ya está desactivada'
                return Response({'detalle': f'Esta charla {texto}.'}, status=status.HTTP_409_CONFLICT)
            charla.activo = activo
            charla.save(update_fields=['activo'])
            avisados = avisos.avisar_estado(charla)
            registrar(request, 'CHARLA_ACTIVADA' if activo else 'CHARLA_DESACTIVADA', 'charla', charla.id,
                      f'{"Activó" if activo else "Desactivó"} la charla "{charla.nombre}"'
                      + (f'; avisó a {avisados} inscritos' if avisados else ''))
        return self._responder(pk)

    @action(detail=True, methods=['post'])
    def desactivar(self, request, pk=None):
        """La charla deja de recomendarse y de aparecer en los calendarios; las inscripciones se conservan."""
        return self._cambiar_activo(request, pk, False)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        return self._cambiar_activo(request, pk, True)
