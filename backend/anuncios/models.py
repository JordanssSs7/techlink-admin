from django.db import models
from django.utils import timezone

from usuarios.models import Usuario

# Tabla "anuncios": la crea la migración V12 (HU-57) del backend de usuario; allí cada usuario ve el anuncio como una
# notificación de tipo ANUNCIO en su centro de notificaciones (HU-22). Aquí el administrador los publica.
# managed = False: Django la lee y la escribe, pero no la crea ni la altera.

ROLES_DESTINO = [('ESTUDIANTE', 'Estudiantes'), ('MENTOR', 'Mentores'), ('TODOS', 'Estudiantes y mentores')]


class Anuncio(models.Model):
    """Un anuncio publicado para un rol. No se edita ni se borra: ya se entregó a las notificaciones de cada usuario."""

    id = models.AutoField(primary_key=True, db_column='id_anuncio')
    titulo = models.CharField(max_length=150)
    mensaje = models.CharField(max_length=500)
    rol_destino = models.CharField(max_length=12, choices=ROLES_DESTINO)
    # Nulo si la API corría sin JWT_SECRET (no se sabe quién fue) o si se borró la cuenta del administrador.
    admin = models.ForeignKey(Usuario, null=True, on_delete=models.SET_NULL, db_column='id_admin', related_name='+')
    # A cuántos usuarios les llegó (quien desactivó los anuncios en sus preferencias no cuenta).
    destinatarios = models.IntegerField(default=0)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        managed = False
        db_table = 'anuncios'
        ordering = ['-fecha_creacion', '-id']

    def __str__(self):
        return self.titulo
