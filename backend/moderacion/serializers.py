from rest_framework import serializers

from mentorias.models import Calificacion

from .models import Reporte


def nombre(usuario):
    return f'{usuario.nombres} {usuario.apellidos}'


class ReporteSerializer(serializers.ModelSerializer):
    """Un reporte tal como lo ve el administrador (HU-52). Solo lectura."""

    reportante = serializers.SerializerMethodField()
    reportante_correo = serializers.CharField(source='reportante.correo', read_only=True)
    reportado = serializers.SerializerMethodField()
    reportado_correo = serializers.CharField(source='reportado.correo', read_only=True)
    reportado_rol = serializers.CharField(source='reportado.rol.nombre', read_only=True)
    motivo_texto = serializers.SerializerMethodField()
    sesion = serializers.SerializerMethodField()
    reportes_contra_usuario = serializers.SerializerMethodField()

    class Meta:
        model = Reporte
        fields = ['id', 'tipo', 'motivo', 'motivo_texto', 'descripcion', 'estado', 'reportante', 'reportante_correo',
                  'reportado', 'reportado_correo', 'reportado_rol', 'sesion', 'reportes_contra_usuario',
                  'id_consulta', 'id_respuesta', 'contenido_reportado', 'fecha_creacion', 'fecha_revision', 'nota_revision']
        read_only_fields = fields

    def get_reportante(self, r):
        return nombre(r.reportante)

    def get_reportado(self, r):
        return nombre(r.reportado)

    def get_motivo_texto(self, r):
        return r.get_motivo_display()

    def get_sesion(self, r):
        if not r.sesion_id:
            return None
        s = r.sesion
        return {'id': s.id, 'fecha': s.fecha, 'hora_inicio': s.hora_inicio.strftime('%H:%M'),
                'hora_fin': s.hora_fin.strftime('%H:%M'), 'curso': s.curso.nombre if s.curso_id else None}

    def get_reportes_contra_usuario(self, r):
        """Cuántos reportes tiene en total la persona reportada (ayuda a decidir si es un caso repetido)."""
        return Reporte.objects.filter(reportado_id=r.reportado_id).count()


class NotaSerializer(serializers.Serializer):
    """HU-52: para cerrar un reporte hay que dejar una nota de lo que se decidió."""

    nota = serializers.CharField(
        min_length=5,
        max_length=500,
        trim_whitespace=True,
        error_messages={
            'required': 'Escribe una nota con lo que se decidió.',
            'blank': 'Escribe una nota con lo que se decidió.',
            'null': 'Escribe una nota con lo que se decidió.',
            'min_length': 'La nota debe tener al menos 5 caracteres.',
            'max_length': 'La nota no puede superar los 500 caracteres.',
        },
    )


class CalificacionModeradaSerializer(serializers.ModelSerializer):
    """Una calificación con su comentario tal como la ve el administrador al moderar (HU-53). Solo lectura."""

    sesion_id = serializers.IntegerField(read_only=True)
    mentor = serializers.SerializerMethodField()
    mentor_id = serializers.IntegerField(source='sesion.mentor_id', read_only=True)
    estudiante = serializers.SerializerMethodField()
    curso = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = ['id', 'sesion_id', 'estrellas', 'comentario', 'fecha_creacion', 'mentor', 'mentor_id', 'estudiante',
                  'curso', 'oculto', 'fecha_moderacion', 'motivo_moderacion']
        read_only_fields = fields

    def get_mentor(self, c):
        return nombre(c.sesion.mentor.usuario)

    def get_estudiante(self, c):
        return nombre(c.sesion.estudiante.usuario)

    def get_curso(self, c):
        return c.sesion.curso.nombre if c.sesion.curso_id else None


class OcultarSerializer(serializers.Serializer):
    """HU-53: para ocultar una calificación el motivo es obligatorio."""

    motivo = serializers.CharField(
        min_length=5,
        max_length=300,
        trim_whitespace=True,
        error_messages={
            'required': 'El motivo es obligatorio para ocultar una calificación.',
            'blank': 'El motivo es obligatorio para ocultar una calificación.',
            'null': 'El motivo es obligatorio para ocultar una calificación.',
            'min_length': 'Explica el motivo en al menos 5 caracteres.',
            'max_length': 'El motivo no puede superar los 300 caracteres.',
        },
    )
