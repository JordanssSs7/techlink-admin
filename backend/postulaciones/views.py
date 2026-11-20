from urllib.parse import quote

from django.db import transaction
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from auditoria.registro import registrar
from core.auth import admin_id
from usuarios.models import Mentor, Rol

from .models import Postulacion, PostulacionArchivo
from .serializers import PostulacionSerializer, RechazoSerializer

# Spring Boot solo acepta estos tipos al subir el comprobante.
TIPOS_PERMITIDOS = {'application/pdf', 'image/png', 'image/jpeg'}


class PostulacionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Postulaciones a mentor (HU-48).

    Filtros: ?estado=EN_REVISION|APROBADA|RECHAZADA y ?search=texto (nombre o correo del postulante).
    Acciones: POST /{id}/aprobar/, POST /{id}/rechazar/ (con "motivo") y GET /{id}/comprobante/.
    """

    serializer_class = PostulacionSerializer
    filterset_fields = ['estado']
    search_fields = ['estudiante__usuario__nombres', 'estudiante__usuario__apellidos',
                     'estudiante__usuario__correo']
    ordering_fields = ['fecha_envio']
    ordering = ['fecha_envio', 'id']

    def get_queryset(self):
        return Postulacion.objects.select_related('estudiante__usuario')

    def _bloquear_en_revision(self, pk):
        """Lee la postulación con bloqueo y verifica RN-02: solo una en revisión se evalúa, y una sola vez."""
        postulacion = get_object_or_404(
            Postulacion.objects.select_for_update().select_related('estudiante__usuario__rol'), pk=pk)
        if postulacion.estado != 'EN_REVISION':
            return postulacion, Response({'detalle': 'Esta postulación ya fue evaluada.'}, status=status.HTTP_409_CONFLICT)
        return postulacion, None

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """RN-03: al aprobar, el usuario pasa a MENTOR y se crea su perfil de mentor en la misma transacción."""
        with transaction.atomic():
            postulacion, conflicto = self._bloquear_en_revision(pk)
            if conflicto:
                return conflicto
            usuario = postulacion.estudiante.usuario
            if usuario.rol.nombre == 'ADMIN':
                return Response({'detalle': 'Una cuenta de administrador no puede pasar a mentor.'},
                                status=status.HTTP_400_BAD_REQUEST)
            usuario.rol = Rol.objects.get(nombre='MENTOR')
            usuario.save(update_fields=['rol'])
            Mentor.objects.get_or_create(usuario=usuario)
            postulacion.estado = 'APROBADA'
            postulacion.fecha_revision = timezone.now()
            postulacion.motivo_revision = None
            postulacion.id_revisor = admin_id(request)
            postulacion.save(update_fields=['estado', 'fecha_revision', 'motivo_revision', 'id_revisor'])
            registrar(request, 'POSTULACION_APROBADA', 'postulacion', postulacion.id,
                      f'Aprobó la postulación de {usuario.nombres} {usuario.apellidos} ({usuario.correo}); ahora es mentor')
        return Response(self.get_serializer(postulacion).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """RN-01: el motivo es obligatorio."""
        entrada = RechazoSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        with transaction.atomic():
            postulacion, conflicto = self._bloquear_en_revision(pk)
            if conflicto:
                return conflicto
            postulacion.estado = 'RECHAZADA'
            postulacion.fecha_revision = timezone.now()
            postulacion.motivo_revision = entrada.validated_data['motivo']
            postulacion.id_revisor = admin_id(request)
            postulacion.save(update_fields=['estado', 'fecha_revision', 'motivo_revision', 'id_revisor'])
            usuario = postulacion.estudiante.usuario
            registrar(request, 'POSTULACION_RECHAZADA', 'postulacion', postulacion.id,
                      f'Rechazó la postulación de {usuario.nombres} {usuario.apellidos}: {postulacion.motivo_revision}')
        return Response(self.get_serializer(postulacion).data)

    @action(detail=True, methods=['get'])
    def comprobante(self, request, pk=None):
        """Devuelve el PDF o la imagen del comprobante para verlo o descargarlo."""
        postulacion = self.get_object()
        try:
            contenido = bytes(PostulacionArchivo.objects.get(pk=postulacion.pk).contenido)
        except PostulacionArchivo.DoesNotExist:
            raise Http404('La postulación no tiene comprobante.')
        tipo = postulacion.tipo_contenido if postulacion.tipo_contenido in TIPOS_PERMITIDOS else 'application/octet-stream'
        respuesta = HttpResponse(contenido, content_type=tipo)
        respuesta['Content-Disposition'] = f"inline; filename*=UTF-8''{quote(postulacion.nombre_archivo)}"
        respuesta['X-Content-Type-Options'] = 'nosniff'
        return respuesta
