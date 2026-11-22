from django.apps import AppConfig


class AnunciosConfig(AppConfig):
    # HU-57: el administrador publica anuncios dirigidos a estudiantes, mentores o a todos; llegan al centro de
    # notificaciones (HU-22) de cada usuario del rol.
    name = 'anuncios'
    verbose_name = 'Anuncios'
