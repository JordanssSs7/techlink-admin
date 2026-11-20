from django.db.models.expressions import RawSQL
from rest_framework import status, viewsets
from rest_framework.response import Response

from auditoria.registro import registrar

from .models import Curso
from .serializers import CursoSerializer

# Las tablas intermedias son del backend de usuario; aquí solo se cuentan sus filas.
MENTORES = '(SELECT COUNT(*) FROM mentor_cursos mc WHERE mc.id_curso = cursos.id_curso)'
ESTUDIANTES = '(SELECT COUNT(*) FROM estudiante_cursos_criticos ec WHERE ec.id_curso = cursos.id_curso)'


class CursoViewSet(viewsets.ModelViewSet):
    """CRUD de cursos para el panel de administración.

    Filtros: ?search=texto (por nombre), ?activo=true|false y ?ordering=nombre|-nombre|id|-id.
    """

    serializer_class = CursoSerializer
    filterset_fields = ['activo']
    search_fields = ['nombre']
    ordering_fields = ['nombre', 'id']
    ordering = ['nombre']

    def get_queryset(self):
        return Curso.objects.annotate(
            total_mentores=RawSQL(MENTORES, []),
            total_estudiantes=RawSQL(ESTUDIANTES, []),
        )

    def perform_create(self, serializer):
        curso = serializer.save()
        registrar(self.request, 'CURSO_CREADO', 'curso', curso.id, f'Creó el curso {curso.nombre}')

    def perform_update(self, serializer):
        curso = serializer.save()
        estado = 'activo' if curso.activo else 'inactivo'
        registrar(self.request, 'CURSO_ACTUALIZADO', 'curso', curso.id, f'Actualizó el curso {curso.nombre} (queda {estado})')

    def destroy(self, request, *args, **kwargs):
        curso = self.get_object()
        if curso.total_mentores or curso.total_estudiantes:
            return Response(
                {'detail': 'El curso tiene mentores o estudiantes asociados: solo se puede inactivar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        curso.delete()
        registrar(request, 'CURSO_ELIMINADO', 'curso', curso.id, f'Eliminó el curso {curso.nombre}')
        return Response(status=status.HTTP_204_NO_CONTENT)
