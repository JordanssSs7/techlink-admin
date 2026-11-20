from django.apps import AppConfig


class AuditoriaConfig(AppConfig):
    # HU-59: historial de las acciones que hace el administrador en el panel.
    name = 'auditoria'
    verbose_name = 'Historial de acciones'
