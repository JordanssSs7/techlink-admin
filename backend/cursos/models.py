from django.db import models


class Curso(models.Model):
    """Catálogo de cursos de la carrera.

    La tabla "cursos" ya existe en la base compartida: la creó el backend de usuario
    (Spring Boot + Flyway). Por eso managed = False: Django no la crea ni la modifica.
    """

    id = models.AutoField(primary_key=True, db_column='id_curso')
    nombre = models.CharField(max_length=120, unique=True)
    activo = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'cursos'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
