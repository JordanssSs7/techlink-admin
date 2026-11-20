from rest_framework import serializers

from .models import TIPOS, AccionAdmin


class AccionAdminSerializer(serializers.ModelSerializer):
    """Una acción del historial. Solo lectura."""

    admin = serializers.SerializerMethodField()
    admin_correo = serializers.CharField(source='admin.correo', read_only=True, default=None)
    tipo_texto = serializers.SerializerMethodField()

    class Meta:
        model = AccionAdmin
        fields = ['id', 'admin', 'admin_correo', 'tipo', 'tipo_texto', 'entidad', 'id_entidad', 'detalle', 'fecha']
        read_only_fields = fields

    def get_admin(self, a):
        return f'{a.admin.nombres} {a.admin.apellidos}' if a.admin_id else None

    def get_tipo_texto(self, a):
        return TIPOS.get(a.tipo, a.tipo)
