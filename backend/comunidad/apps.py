from django.apps import AppConfig


class ComunidadConfig(AppConfig):
    # HU-54: moderar las consultas y respuestas del foro (HU-17) y los recursos compartidos por los mentores (HU-18).
    name = 'comunidad'
    verbose_name = 'Comunidad'
