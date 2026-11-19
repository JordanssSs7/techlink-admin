from django.db import models

from usuarios.models import Estudiante

# Tablas "postulaciones" y "postulacion_archivos": las crea la migración V8 (HU-03) del backend de usuario.
# managed = False: Django las lee y las actualiza, pero no las crea ni las altera.


class Postulacion(models.Model):
    ESTADOS = [('EN_REVISION', 'En revisión'), ('APROBADA', 'Aprobada'), ('RECHAZADA', 'Rechazada')]

    id = models.AutoField(primary_key=True, db_column='id_postulacion')
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, db_column='id_estudiante',
                                   related_name='postulaciones')
    estado = models.CharField(max_length=11, choices=ESTADOS, default='EN_REVISION')
    nombre_archivo = models.CharField(max_length=150)
    tipo_contenido = models.CharField(max_length=30)
    tamano_bytes = models.IntegerField()
    comentario = models.CharField(max_length=500, null=True)
    fecha_envio = models.DateTimeField()
    fecha_revision = models.DateTimeField(null=True)
    # Quién la evaluó: el panel todavía no tiene login, por eso por ahora queda vacío.
    id_revisor = models.IntegerField(null=True)
    motivo_revision = models.CharField(max_length=500, null=True)

    class Meta:
        managed = False
        db_table = 'postulaciones'
        ordering = ['fecha_envio', 'id']

    def __str__(self):
        return f'Postulación {self.id} ({self.estado})'


class PostulacionArchivo(models.Model):
    """El comprobante (PDF o imagen, máx. 5 MB) va en su propia tabla para no cargarlo al listar."""

    postulacion = models.OneToOneField(Postulacion, primary_key=True, on_delete=models.CASCADE,
                                       db_column='id_postulacion', related_name='archivo')
    contenido = models.BinaryField()

    class Meta:
        managed = False
        db_table = 'postulacion_archivos'
