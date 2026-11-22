from django.apps import AppConfig


class ConstanciasConfig(AppConfig):
    # HU-27: cuando un mentor llega a las horas mínimas de mentoría (50), su constancia queda pendiente; el administrador la
    # emite desde el panel y el mentor ya puede descargarla en la aplicación.
    name = 'constancias'
    verbose_name = 'Constancias de mentoría'
