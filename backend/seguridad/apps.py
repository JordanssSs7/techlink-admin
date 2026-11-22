from django.apps import AppConfig


class SeguridadConfig(AppConfig):
    # HU-60: el administrador configura los parámetros de seguridad del sistema (dominio institucional permitido,
    # intentos máximos de login y minutos de bloqueo). El backend de usuario los lee en cada inicio de sesión.
    name = 'seguridad'
    verbose_name = 'Parámetros de seguridad'
