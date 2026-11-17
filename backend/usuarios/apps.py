from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    # Gestión de usuarios, roles y estado de las cuentas (tablas usuarios, roles, estudiantes y mentores de la base compartida).
    name = 'usuarios'
    verbose_name = 'Usuarios y roles'
