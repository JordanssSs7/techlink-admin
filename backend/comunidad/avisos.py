import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def avisar_ocultamiento(autor, que, titulo, motivo):
    """Avisa por correo al autor que un administrador ocultó su publicación o su recurso, y por qué (HU-54).

    Devuelve True si el correo salió. Si falla (por ejemplo, el correo sin configurar), no deshace el ocultamiento:
    solo se registra el error y el panel le avisa al administrador que no se pudo notificar.
    """
    cuerpo = (f'Hola {autor.nombres},\n\n'
              f'Un administrador de TechLink ocultó tu {que} «{titulo}».\n'
              f'Motivo: {motivo}\n\n'
              'TechLink es un espacio para resolver dudas académicas y compartir recursos de estudio. '
              'Si crees que fue un error, escríbenos a '
              f'{settings.CORREO_SOPORTE} y lo revisamos.')
    try:
        send_mail(f'TechLink ocultó tu {que}', cuerpo, None, [autor.correo], fail_silently=False)
        return True
    except Exception:  # noqa: BLE001 - un correo que falla no debe deshacer la moderación
        logger.exception('No se pudo avisar al autor %s del ocultamiento de «%s»', autor.id, titulo)
        return False
