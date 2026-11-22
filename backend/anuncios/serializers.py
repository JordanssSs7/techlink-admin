from rest_framework import serializers

from .models import ROLES_DESTINO, Anuncio


class AnuncioSerializer(serializers.ModelSerializer):
    """Un anuncio tal como lo escribe y lo ve el administrador (HU-57)."""

    rol_destino = serializers.ChoiceField(choices=[valor for valor, _ in ROLES_DESTINO])
    rol_destino_texto = serializers.SerializerMethodField()
    admin_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Anuncio
        fields = ['id', 'titulo', 'mensaje', 'rol_destino', 'rol_destino_texto', 'destinatarios', 'admin_nombre',
                  'fecha_creacion']
        read_only_fields = ['id', 'destinatarios', 'fecha_creacion']

    def get_rol_destino_texto(self, anuncio):
        return anuncio.get_rol_destino_display()

    def get_admin_nombre(self, anuncio):
        return str(anuncio.admin) if anuncio.admin_id else None

    def validate_titulo(self, valor):
        titulo = ' '.join(valor.split())
        if len(titulo) < 3:
            raise serializers.ValidationError('El título debe tener al menos 3 caracteres.')
        return titulo

    def validate_mensaje(self, valor):
        mensaje = valor.strip()
        if len(mensaje) < 5:
            raise serializers.ValidationError('El mensaje debe tener al menos 5 caracteres.')
        return mensaje
