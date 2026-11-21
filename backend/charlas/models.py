from django.db import models
from django.utils import timezone

from cursos.models import Curso

# Tabla "charlas": la crea la migración V11 (HU-58) del backend de usuario; allí los estudiantes ven las charlas,
# se inscriben (HU-25) y reciben recomendaciones (HU-06). Aquí el administrador las crea y las gestiona.
# managed = False: Django la lee y la escribe, pero no la crea ni la altera.


class Charla(models.Model):
    """Una charla virtual. Está vigente mientras esté activa y su hora de fin no haya pasado."""

    id = models.AutoField(primary_key=True, db_column='id_charla')
    nombre = models.CharField(max_length=150)
    tematica = models.CharField(max_length=60)
    descripcion = models.CharField(max_length=500, null=True)
    # Curso que refuerza la charla (opcional): se recomienda a quien lo marcó como crítico.
    curso = models.ForeignKey(Curso, null=True, on_delete=models.SET_NULL, db_column='id_curso', related_name='+')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    enlace = models.CharField(max_length=500)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        managed = False
        db_table = 'charlas'
        ordering = ['-fecha', '-hora_inicio']

    def __str__(self):
        return self.nombre
