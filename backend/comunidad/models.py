from django.db import models
from django.utils import timezone

from cursos.models import Curso
from mentorias.models import Sesion
from usuarios.models import Usuario

# Tablas "consultas", "respuestas", "recursos" y "recurso_archivos": las crea la migración V10 (HU-17 y HU-18) del backend
# de usuario; allí los estudiantes y mentores publican y aquí el administrador las modera (HU-54).
# managed = False: Django las lee y actualiza (oculto, motivo y fecha), pero no las crea ni las altera.
# Ocultar no borra nada: el backend de usuario simplemente deja de mostrar lo que tiene oculto = true.


class Consulta(models.Model):
    """Una duda publicada en el foro, asociada a un curso (HU-17)."""

    id = models.AutoField(primary_key=True, db_column='id_consulta')
    autor = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_autor', related_name='+')
    curso = models.ForeignKey(Curso, on_delete=models.PROTECT, db_column='id_curso', related_name='+')
    titulo = models.CharField(max_length=150)
    contenido = models.CharField(max_length=2000)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    oculto = models.BooleanField(default=False)
    fecha_moderacion = models.DateTimeField(null=True)
    motivo_moderacion = models.CharField(max_length=300, null=True)

    class Meta:
        managed = False
        db_table = 'consultas'
        ordering = ['-fecha_creacion', '-id']


class Respuesta(models.Model):
    """La respuesta de un usuario a una consulta del foro (HU-17). "util" la marca quien hizo la consulta."""

    id = models.AutoField(primary_key=True, db_column='id_respuesta')
    consulta = models.ForeignKey(Consulta, on_delete=models.CASCADE, db_column='id_consulta', related_name='respuestas')
    autor = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_autor', related_name='+')
    contenido = models.CharField(max_length=2000)
    util = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    oculto = models.BooleanField(default=False)
    fecha_moderacion = models.DateTimeField(null=True)
    motivo_moderacion = models.CharField(max_length=300, null=True)

    class Meta:
        managed = False
        db_table = 'respuestas'
        ordering = ['-fecha_creacion', '-id']


class Recurso(models.Model):
    """Un recurso que el mentor comparte en una sesión: archivo (PDF o imagen), enlace o código (HU-18)."""

    TIPOS = [('ARCHIVO', 'Archivo'), ('ENLACE', 'Enlace'), ('CODIGO', 'Código')]

    id = models.AutoField(primary_key=True, db_column='id_recurso')
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, db_column='id_sesion', related_name='+')
    autor = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_autor', related_name='+')
    tipo = models.CharField(max_length=7, choices=TIPOS)
    titulo = models.CharField(max_length=150)
    descripcion = models.CharField(max_length=300, null=True)
    url = models.CharField(max_length=500, null=True)
    contenido_texto = models.TextField(null=True)
    lenguaje = models.CharField(max_length=30, null=True)
    nombre_archivo = models.CharField(max_length=150, null=True)
    tipo_contenido = models.CharField(max_length=30, null=True)
    tamano_bytes = models.IntegerField(null=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    oculto = models.BooleanField(default=False)
    fecha_moderacion = models.DateTimeField(null=True)
    motivo_moderacion = models.CharField(max_length=300, null=True)

    class Meta:
        managed = False
        db_table = 'recursos'
        ordering = ['-fecha_creacion', '-id']


class RecursoArchivo(models.Model):
    """El contenido de un recurso de tipo archivo va en su propia tabla para no cargarlo al listar."""

    recurso = models.OneToOneField(Recurso, primary_key=True, on_delete=models.CASCADE, db_column='id_recurso',
                                   related_name='archivo')
    contenido = models.BinaryField()

    class Meta:
        managed = False
        db_table = 'recurso_archivos'
