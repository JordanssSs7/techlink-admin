import re

from rest_framework import serializers

from .models import MAX_BLOQUEO, MAX_INTENTOS, MIN_BLOQUEO, MIN_INTENTOS, ParametrosSeguridad

# Un dominio: etiquetas de letras, números y guiones separadas por puntos, con al menos un punto ("tecsup.edu.pe").
DOMINIO = re.compile(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$')


def normalizar_dominio(texto):
    """Minúsculas, sin espacios y sin la arroba inicial: '@Tecsup.EDU.pe ' -> 'tecsup.edu.pe'."""
    return (texto or '').strip().lower().lstrip('@')


class ParametrosSerializer(serializers.ModelSerializer):
    """Los parámetros de seguridad tal como los edita y los ve el administrador (HU-60)."""

    dominio_permitido = serializers.CharField(max_length=100)
    max_intentos = serializers.IntegerField(
        min_value=MIN_INTENTOS, max_value=MAX_INTENTOS,
        error_messages={'min_value': f'Debe haber al menos {MIN_INTENTOS} intento.',
                        'max_value': f'Como máximo {MAX_INTENTOS} intentos.',
                        'invalid': 'Escribe un número entero.'})
    minutos_bloqueo = serializers.IntegerField(
        min_value=MIN_BLOQUEO, max_value=MAX_BLOQUEO,
        error_messages={'min_value': f'El bloqueo debe durar al menos {MIN_BLOQUEO} minuto.',
                        'max_value': f'El bloqueo no puede pasar de {MAX_BLOQUEO} minutos (un día).',
                        'invalid': 'Escribe un número entero de minutos.'})
    actualizado_por = serializers.SerializerMethodField()

    class Meta:
        model = ParametrosSeguridad
        fields = ['dominio_permitido', 'max_intentos', 'minutos_bloqueo', 'actualizado_por', 'fecha_actualizacion']
        read_only_fields = ['fecha_actualizacion']

    def get_actualizado_por(self, parametros):
        return str(parametros.admin) if parametros.admin_id else None

    def validate_dominio_permitido(self, valor):
        dominio = normalizar_dominio(valor)
        if not DOMINIO.match(dominio):
            raise serializers.ValidationError('Escribe un dominio válido, por ejemplo tecsup.edu.pe (sin @ ni espacios).')
        return dominio
