from django.apps import AppConfig


class ModeracionConfig(AppConfig):
    # HU-52 (revisar reportes) y HU-53 (moderar calificaciones y comentarios de los mentores).
    name = 'moderacion'
    verbose_name = 'Moderación'
