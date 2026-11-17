from django.apps import AppConfig


class CoreConfig(AppConfig):
    # Base común del panel: endpoint de estado y, más adelante, piezas compartidas (paginación, permisos del administrador).
    name = 'core'
    verbose_name = 'Core'
