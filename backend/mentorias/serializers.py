from rest_framework import serializers

from .metricas import estado_sesion, horas
from .models import Sesion


class SesionSerializer(serializers.ModelSerializer):
    """Una sesión de mentoría tal como la ve el administrador (HU-51). Solo lectura."""

    mentor = serializers.SerializerMethodField()
    mentor_correo = serializers.CharField(source='mentor.usuario.correo', read_only=True)
    estudiante = serializers.SerializerMethodField()
    estudiante_correo = serializers.CharField(source='estudiante.usuario.correo', read_only=True)
    curso = serializers.SerializerMethodField()
    hora_inicio = serializers.TimeField(format='%H:%M', read_only=True)
    hora_fin = serializers.TimeField(format='%H:%M', read_only=True)
    horas = serializers.SerializerMethodField()
    estado_sesion = serializers.SerializerMethodField()
    calificacion = serializers.SerializerMethodField()

    class Meta:
        model = Sesion
        fields = ['id', 'mentor', 'mentor_correo', 'estudiante', 'estudiante_correo', 'curso', 'fecha', 'hora_inicio',
                  'hora_fin', 'horas', 'estado', 'estado_sesion', 'calificacion', 'enlace_reunion']
        read_only_fields = fields

    def get_mentor(self, s):
        return f'{s.mentor.usuario.nombres} {s.mentor.usuario.apellidos}'

    def get_estudiante(self, s):
        return f'{s.estudiante.usuario.nombres} {s.estudiante.usuario.apellidos}'

    def get_curso(self, s):
        return s.curso.nombre if s.curso_id else None

    def get_horas(self, s):
        return horas(s)

    def get_estado_sesion(self, s):
        return estado_sesion(s, self.context['ahora'])

    def get_calificacion(self, s):
        # La relación inversa lanza una excepción si la sesión todavía no tiene calificación.
        try:
            return s.calificacion.estrellas
        except Sesion.calificacion.RelatedObjectDoesNotExist:
            return None


class CancelacionSerializer(serializers.Serializer):
    """HU-51: para cancelar una sesión el motivo es obligatorio."""

    motivo = serializers.CharField(
        min_length=5,
        max_length=300,
        trim_whitespace=True,
        error_messages={
            'required': 'El motivo es obligatorio para cancelar una sesión.',
            'blank': 'El motivo es obligatorio para cancelar una sesión.',
            'null': 'El motivo es obligatorio para cancelar una sesión.',
            'min_length': 'Explica el motivo en al menos 5 caracteres.',
            'max_length': 'El motivo no puede superar los 300 caracteres.',
        },
    )
