from datetime import datetime

from django.core.validators import URLValidator
from rest_framework import serializers

from cursos.models import Curso
from mentorias.metricas import ahora_local

from .models import Charla

VALIDAR_ENLACE = URLValidator(schemes=['http', 'https'])


def estado_charla(charla, ahora):
    """INACTIVA si el administrador la desactivó; si no, PASADA (ya terminó) o VIGENTE."""
    if not charla.activo:
        return 'INACTIVA'
    return 'VIGENTE' if datetime.combine(charla.fecha, charla.hora_fin) > ahora else 'PASADA'


class CharlaSerializer(serializers.ModelSerializer):
    """Una charla virtual tal como la crea y la ve el administrador (HU-58)."""

    curso = serializers.PrimaryKeyRelatedField(queryset=Curso.objects.all(), allow_null=True, required=False)
    curso_nombre = serializers.CharField(source='curso.nombre', read_only=True, default=None)
    descripcion = serializers.CharField(max_length=500, allow_blank=True, allow_null=True, required=False)
    hora_inicio = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    hora_fin = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    inscritos = serializers.SerializerMethodField()
    estado = serializers.SerializerMethodField()

    class Meta:
        model = Charla
        fields = ['id', 'nombre', 'tematica', 'descripcion', 'curso', 'curso_nombre', 'fecha', 'hora_inicio',
                  'hora_fin', 'enlace', 'activo', 'inscritos', 'estado', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']

    def get_inscritos(self, charla):
        return getattr(charla, 'inscritos', 0)

    def get_estado(self, charla):
        return estado_charla(charla, self.context.get('ahora') or ahora_local())

    def validate_nombre(self, valor):
        nombre = ' '.join(valor.split())
        if len(nombre) < 3:
            raise serializers.ValidationError('El nombre debe tener al menos 3 caracteres.')
        return nombre

    def validate_tematica(self, valor):
        tematica = ' '.join(valor.split())
        if len(tematica) < 3:
            raise serializers.ValidationError('La temática debe tener al menos 3 caracteres.')
        return tematica

    def validate_descripcion(self, valor):
        texto = (valor or '').strip()
        return texto or None

    def validate_enlace(self, valor):
        enlace = valor.strip()
        try:
            VALIDAR_ENLACE(enlace)
        except Exception:
            raise serializers.ValidationError('Escribe un enlace válido que empiece con http:// o https://.')
        return enlace

    def validate(self, attrs):
        ahora = self.context.get('ahora') or ahora_local()
        instancia = self.instance
        fecha = attrs.get('fecha', instancia.fecha if instancia else None)
        inicio = attrs.get('hora_inicio', instancia.hora_inicio if instancia else None)
        fin = attrs.get('hora_fin', instancia.hora_fin if instancia else None)

        if inicio is not None and fin is not None and fin <= inicio:
            raise serializers.ValidationError({'hora_fin': 'La hora de fin debe ser posterior a la de inicio.'})

        # No se programan charlas en el pasado. Al editar solo se vuelve a exigir si se cambia la fecha o la hora,
        # así se puede corregir una charla que ya pasó sin moverla.
        cambia_horario = instancia is None or any(
            campo in attrs and attrs[campo] != getattr(instancia, campo) for campo in ('fecha', 'hora_inicio', 'hora_fin'))
        if cambia_horario and fecha is not None and fin is not None:
            if fecha < ahora.date():
                raise serializers.ValidationError({'fecha': 'No se puede programar una charla en una fecha pasada.'})
            if datetime.combine(fecha, fin) <= ahora:
                raise serializers.ValidationError({'hora_fin': 'Esa charla ya terminó: elige una hora que todavía no pase.'})
        return attrs
