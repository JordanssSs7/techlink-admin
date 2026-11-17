from django.apps import AppConfig


class CursosConfig(AppConfig):
    # Catálogo de cursos de la carrera (tabla cursos de la base compartida). Ya tiene API (Semana 12).
    name = 'cursos'
    verbose_name = 'Cursos'
