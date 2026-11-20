from core.auth import admin_id

from .models import AccionAdmin


def registrar(request, tipo, entidad, id_entidad=None, detalle=None):
    """Anota en el historial una acción del administrador (HU-59).

    Se llama dentro de la misma transacción que hace el cambio, para que no quede una acción sin historial.
    """
    texto = (detalle or '').strip()[:500]
    return AccionAdmin.objects.create(admin_id=admin_id(request), tipo=tipo, entidad=entidad,
                                      id_entidad=id_entidad, detalle=texto or None)
