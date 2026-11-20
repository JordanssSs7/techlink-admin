from urllib.parse import quote

from django.db import transaction
from django.db.models import Count
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from auditoria.registro import registrar
from moderacion.views import ModeracionPagination

from .avisos import avisar_ocultamiento
from .models import Consulta, Recurso, RecursoArchivo, Respuesta
from .serializers import (ConsultaModeradaSerializer, OcultarSerializer, RecursoModeradoSerializer,
                          RespuestaModeradaSerializer)

# Spring Boot solo acepta estos tipos al subir un recurso de tipo archivo.
TIPOS_PERMITIDOS = {'application/pdf', 'image/png', 'image/jpeg'}


class OcultarMostrarMixin:
    """Ocultar y mostrar de nuevo una publicación o un recurso (HU-54). Nada se borra: solo cambia "oculto".

    Al ocultar el motivo es obligatorio, se anota en el historial de acciones (HU-59) y se le avisa al autor por correo.
    Las clases que lo usan indican: modelo, entidad (para el historial), codigo (tipo de acción), que (cómo se llama
    la publicación en el correo) y titulo_de(obj).
    """

    modelo = None
    entidad = ''
    codigo = ''
    que = ''

    def titulo_de(self, obj):
        raise NotImplementedError

    def _respuesta(self, pk, **extra):
        datos = dict(self.get_serializer(self.get_queryset().get(pk=pk)).data)
        datos.update(extra)
        return Response(datos)

    @action(detail=True, methods=['post'])
    def ocultar(self, request, pk=None):
        entrada = OcultarSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        motivo = entrada.validated_data['motivo']
        with transaction.atomic():
            obj = get_object_or_404(self.modelo.objects.select_for_update(), pk=pk)
            if obj.oculto:
                return Response({'detalle': 'Ya está oculto.'}, status=status.HTTP_409_CONFLICT)
            obj.oculto = True
            obj.fecha_moderacion = timezone.now()
            obj.motivo_moderacion = motivo
            obj.save(update_fields=['oculto', 'fecha_moderacion', 'motivo_moderacion'])
            titulo = self.titulo_de(obj)
            registrar(request, f'{self.codigo}_OCULTADO', self.entidad, obj.id, f'{self.que.capitalize()} #{obj.id} «{titulo}»: {motivo}')
        # Fuera de la transacción: aunque el correo falle, el ocultamiento ya quedó guardado.
        notificado = avisar_ocultamiento(obj.autor, self.que, titulo, motivo)
        return self._respuesta(pk, autor_notificado=notificado)

    @action(detail=True, methods=['post'])
    def mostrar(self, request, pk=None):
        with transaction.atomic():
            obj = get_object_or_404(self.modelo.objects.select_for_update(), pk=pk)
            if not obj.oculto:
                return Response({'detalle': 'Ya es visible.'}, status=status.HTTP_409_CONFLICT)
            obj.oculto = False
            obj.fecha_moderacion = timezone.now()
            obj.motivo_moderacion = None
            obj.save(update_fields=['oculto', 'fecha_moderacion', 'motivo_moderacion'])
            registrar(request, f'{self.codigo}_MOSTRADO', self.entidad, obj.id,
                      f'{self.que.capitalize()} #{obj.id} «{self.titulo_de(obj)}» vuelve a mostrarse')
        return self._respuesta(pk)

    def filtrar_oculto(self, qs):
        valor = self.request.query_params.get('oculto')
        return qs.filter(oculto=valor == 'true') if valor in ('true', 'false') else qs


class ConsultaViewSet(OcultarMostrarMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Consultas del foro para moderarlas (HU-54).

    Filtros: ?oculto=true|false, ?curso=id y ?search=texto (título, contenido, curso o autor). Paginación: ?page=1&page_size=10.
    Acciones: POST /{id}/ocultar/ (con "motivo") y POST /{id}/mostrar/. Una consulta oculta no aparece en el foro.
    """

    serializer_class = ConsultaModeradaSerializer
    pagination_class = ModeracionPagination
    filterset_fields = ['curso']
    search_fields = ['titulo', 'contenido', 'curso__nombre', 'autor__nombres', 'autor__apellidos', 'autor__correo']
    ordering = ['-fecha_creacion', '-id']
    modelo = Consulta
    entidad = 'consulta'
    codigo = 'CONSULTA'
    que = 'consulta del foro'

    def titulo_de(self, obj):
        return obj.titulo

    def get_queryset(self):
        qs = Consulta.objects.select_related('autor', 'curso').annotate(n_respuestas=Count('respuestas'))
        return self.filtrar_oculto(qs)


class RespuestaViewSet(OcultarMostrarMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Respuestas del foro para moderarlas (HU-54).

    Filtros: ?oculto=true|false y ?search=texto (respuesta, consulta o autor). Paginación: ?page=1&page_size=10.
    Acciones: POST /{id}/ocultar/ (con "motivo") y POST /{id}/mostrar/. Una respuesta oculta no aparece en la consulta.
    """

    serializer_class = RespuestaModeradaSerializer
    pagination_class = ModeracionPagination
    search_fields = ['contenido', 'consulta__titulo', 'autor__nombres', 'autor__apellidos', 'autor__correo']
    ordering = ['-fecha_creacion', '-id']
    modelo = Respuesta
    entidad = 'respuesta'
    codigo = 'RESPUESTA'
    que = 'respuesta en el foro'

    def titulo_de(self, obj):
        return ' '.join(obj.contenido.split())[:60] + ('…' if len(obj.contenido) > 60 else '')

    def get_queryset(self):
        return self.filtrar_oculto(Respuesta.objects.select_related('autor', 'consulta__curso'))


class RecursoViewSet(OcultarMostrarMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Recursos que los mentores comparten en sus sesiones, para moderarlos (HU-54).

    Filtros: ?oculto=true|false, ?tipo=ARCHIVO|ENLACE|CODIGO y ?search=texto (título, descripción, curso o mentor).
    Acciones: POST /{id}/ocultar/ (con "motivo"), POST /{id}/mostrar/ y GET /{id}/archivo/ (descarga el archivo).
    Un recurso oculto no lo ve el estudiante de la sesión, pero el mentor sí (marcado como oculto).
    """

    serializer_class = RecursoModeradoSerializer
    pagination_class = ModeracionPagination
    filterset_fields = ['tipo']
    search_fields = ['titulo', 'descripcion', 'sesion__curso__nombre', 'autor__nombres', 'autor__apellidos', 'autor__correo']
    ordering = ['-fecha_creacion', '-id']
    modelo = Recurso
    entidad = 'recurso'
    codigo = 'RECURSO'
    que = 'recurso compartido'

    def titulo_de(self, obj):
        return obj.titulo

    def get_queryset(self):
        return self.filtrar_oculto(Recurso.objects.select_related('autor', 'sesion__curso', 'sesion__estudiante__usuario'))

    @action(detail=True, methods=['get'])
    def archivo(self, request, pk=None):
        """Devuelve el PDF o la imagen del recurso para revisarlo."""
        recurso = self.get_object()
        if recurso.tipo != 'ARCHIVO':
            raise Http404('Este recurso no es un archivo.')
        try:
            contenido = bytes(RecursoArchivo.objects.get(pk=recurso.pk).contenido)
        except RecursoArchivo.DoesNotExist:
            raise Http404('El recurso no tiene archivo.')
        tipo = recurso.tipo_contenido if recurso.tipo_contenido in TIPOS_PERMITIDOS else 'application/octet-stream'
        respuesta = HttpResponse(contenido, content_type=tipo)
        respuesta['Content-Disposition'] = f"inline; filename*=UTF-8''{quote(recurso.nombre_archivo or 'recurso')}"
        respuesta['X-Content-Type-Options'] = 'nosniff'
        return respuesta
