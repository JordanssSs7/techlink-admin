from rest_framework import serializers

from .models import ConstanciaMentor


class ConstanciaSerializer(serializers.ModelSerializer):
    """Una constancia tal como la ve el administrador (HU-27)."""

    mentor_nombre = serializers.SerializerMethodField()
    mentor_correo = serializers.CharField(source='mentor.usuario.correo', read_only=True)
    especialidad = serializers.CharField(source='mentor.especialidad', read_only=True, default=None)
    emitida_por = serializers.SerializerMethodField()

    class Meta:
        model = ConstanciaMentor
        fields = ['id', 'mentor_nombre', 'mentor_correo', 'especialidad', 'horas_al_cumplir', 'estado', 'fecha_elegible',
                  'fecha_emision', 'emitida_por', 'codigo_verificacion']
        read_only_fields = fields

    def get_mentor_nombre(self, constancia):
        return str(constancia.mentor.usuario)

    def get_emitida_por(self, constancia):
        return str(constancia.admin) if constancia.admin_id else None
