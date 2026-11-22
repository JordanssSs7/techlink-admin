from django.db import connection, transaction
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from auditoria.registro import registrar
from core.auth import admin_id

from .models import Anuncio
from .serializers import AnuncioSerializer

# Qué roles de la tabla "roles" recibe cada destino. El administrador no recibe anuncios.
ROLES_POR_DESTINO = {
    'ESTUDIANTE': ['ESTUDIANTE'],
    'MENTOR': ['MENTOR'],
    'TODOS': ['ESTUDIANTE', 'MENTOR'],
}

# Usuarios activos de los roles indicados que no desactivaron los anuncios en sus preferencias (HU-24).
# Las tablas "notificaciones" y "preferencias_notificacion" son del backend de usuario (V12).
DESTINATARIOS = """
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.estado = 'ACTIVO'
      AND r.nombre_rol IN ({roles})
      AND NOT EXISTS (
          SELECT 1 FROM preferencias_notificacion p
          WHERE p.id_usuario = u.id_usuario AND p.tipo = 'ANUNCIO' AND p.en_app = 0)
"""


class AnuncioPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def _marcadores(destino):
    roles = ROLES_POR_DESTINO[destino]
    return ', '.join(['%s'] * len(roles)), roles


def contar_destinatarios(destino):
    marcadores, roles = _marcadores(destino)
    with connection.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) ' + DESTINATARIOS.format(roles=marcadores), roles)
        return cursor.fetchone()[0]


def entregar(anuncio):
    """Crea una notificación ANUNCIO por cada destinatario y devuelve cuántas creó."""
    marcadores, roles = _marcadores(anuncio.rol_destino)
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje) "
            "SELECT u.id_usuario, 'ANUNCIO', %s, %s " + DESTINATARIOS.format(roles=marcadores),
            [anuncio.titulo, anuncio.mensaje, *roles])
        return cursor.rowcount


class AnuncioViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Anuncios por rol (HU-57): publicar y consultar los ya publicados. No se editan ni se eliminan.

    Al publicar (POST) se crea una notificación para cada usuario activo del rol elegido (ESTUDIANTE, MENTOR o TODOS);
    quien desactivó los anuncios en sus preferencias no la recibe. La respuesta trae "destinatarios".
    Filtros: ?rol_destino=ESTUDIANTE|MENTOR|TODOS y ?search=texto (título o mensaje). Paginación: ?page=1&page_size=10.
    GET /alcance/ dice a cuántos usuarios llegaría un anuncio para cada destino.
    """

    serializer_class = AnuncioSerializer
    pagination_class = AnuncioPagination
    http_method_names = ['get', 'post', 'head', 'options']
    filterset_fields = ['rol_destino']
    search_fields = ['titulo', 'mensaje']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion', '-id']
    queryset = Anuncio.objects.select_related('admin')

    def create(self, request, *args, **kwargs):
        serializador = self.get_serializer(data=request.data)
        serializador.is_valid(raise_exception=True)
        with transaction.atomic():
            anuncio = serializador.save(admin_id=admin_id(request))
            anuncio.destinatarios = entregar(anuncio)
            anuncio.save(update_fields=['destinatarios'])
            registrar(request, 'ANUNCIO_PUBLICADO', 'anuncio', anuncio.id,
                      f'Publicó el anuncio "{anuncio.titulo}" para {anuncio.get_rol_destino_display().lower()} '
                      f'({anuncio.destinatarios} destinatarios)')
        return Response(self.get_serializer(self.get_queryset().get(pk=anuncio.id)).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def alcance(self, request):
        return Response({destino: contar_destinatarios(destino) for destino in ROLES_POR_DESTINO})
