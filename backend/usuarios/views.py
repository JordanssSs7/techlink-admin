from rest_framework import mixins, viewsets

from .models import Usuario
from .serializers import UsuarioSerializer


class UsuarioViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                     mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """Usuarios de TechLink: listar, ver y cambiar el rol o el estado con PATCH.

    Filtros: ?search=texto (nombres, apellidos o correo), ?rol=ESTUDIANTE|MENTOR|ADMIN y ?estado=ACTIVO|INACTIVO.
    """

    serializer_class = UsuarioSerializer
    http_method_names = ['get', 'patch', 'head', 'options']
    filterset_fields = ['estado']
    search_fields = ['nombres', 'apellidos', 'correo']
    ordering_fields = ['nombres', 'fecha_registro']
    ordering = ['nombres', 'apellidos']

    def get_queryset(self):
        qs = Usuario.objects.select_related('rol', 'estudiante', 'mentor')
        rol = self.request.query_params.get('rol')
        if rol:
            qs = qs.filter(rol__nombre=rol)
        return qs
