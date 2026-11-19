from rest_framework import serializers

from .models import Postulacion


class PostulacionSerializer(serializers.ModelSerializer):
    """Una postulación a mentor tal como la ve el administrador (solo lectura)."""

    postulante = serializers.SerializerMethodField()
    correo = serializers.CharField(source='estudiante.usuario.correo', read_only=True)
    ciclo = serializers.IntegerField(source='estudiante.ciclo', read_only=True)

    class Meta:
        model = Postulacion
        fields = ['id', 'postulante', 'correo', 'ciclo', 'estado', 'comentario', 'nombre_archivo',
                  'tipo_contenido', 'tamano_bytes', 'fecha_envio', 'fecha_revision', 'motivo_revision']
        read_only_fields = fields

    def get_postulante(self, p):
        usuario = p.estudiante.usuario
        return f'{usuario.nombres} {usuario.apellidos}'


class RechazoSerializer(serializers.Serializer):
    """RN-01: para rechazar una postulación el motivo es obligatorio."""

    motivo = serializers.CharField(
        max_length=500,
        trim_whitespace=True,
        error_messages={
            'required': 'El motivo es obligatorio para rechazar una postulación.',
            'blank': 'El motivo es obligatorio para rechazar una postulación.',
            'null': 'El motivo es obligatorio para rechazar una postulación.',
            'max_length': 'El motivo no puede superar los 500 caracteres.',
        },
    )
