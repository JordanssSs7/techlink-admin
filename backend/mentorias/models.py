from django.db import models

from cursos.models import Curso
from usuarios.models import Estudiante, Mentor

# Tabla "sesiones": la crea la migración V6 (HU-07, agendamiento) del backend de usuario y la amplía la V7.
# Si esa migración todavía no se aplicó en la base local, la tabla no existe y la API lo indica.


class Sesion(models.Model):
    # "Completada" no es un estado guardado: es una sesión CONFIRMADA cuya hora de fin ya pasó.
    ESTADOS = [('PENDIENTE', 'Pendiente'), ('CONFIRMADA', 'Confirmada'), ('CANCELADA', 'Cancelada')]

    id = models.AutoField(primary_key=True, db_column='id_sesion')
    # Relaciones 1:N → un estudiante y un mentor pueden tener muchas sesiones.
    estudiante = models.ForeignKey(Estudiante, on_delete=models.PROTECT, db_column='id_estudiante')
    mentor = models.ForeignKey(Mentor, on_delete=models.PROTECT, db_column='id_mentor', related_name='sesiones')
    curso = models.ForeignKey(Curso, null=True, on_delete=models.PROTECT, db_column='id_curso', related_name='+')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    estado = models.CharField(max_length=10, choices=ESTADOS)
    enlace_reunion = models.CharField(max_length=500)

    class Meta:
        managed = False
        db_table = 'sesiones'
        ordering = ['-fecha', '-hora_inicio']


class Calificacion(models.Model):
    """Calificación de 1 a 5 estrellas que el estudiante deja al terminar la sesión (V7, HU-09)."""

    id = models.AutoField(primary_key=True, db_column='id_calificacion')
    sesion = models.OneToOneField(Sesion, on_delete=models.CASCADE, db_column='id_sesion', related_name='calificacion')
    estrellas = models.IntegerField()
    comentario = models.CharField(max_length=500, null=True)
    fecha_creacion = models.DateTimeField()
    # HU-53 (V9): una calificación oculta por el administrador no se muestra ni cuenta para la reputación del mentor.
    oculto = models.BooleanField(default=False)
    fecha_moderacion = models.DateTimeField(null=True)
    motivo_moderacion = models.CharField(max_length=300, null=True)

    class Meta:
        managed = False
        db_table = 'calificaciones'
