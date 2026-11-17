from django.db import models

from usuarios.models import Estudiante, Mentor

# Tabla "sesiones": la crea la migración V6 (HU-07, agendamiento) del backend de usuario.
# Si esa migración todavía no se aplicó en la base local, la tabla no existe y la API lo indica.


class Sesion(models.Model):
    ESTADOS = [('CONFIRMADA', 'Confirmada'), ('CANCELADA', 'Cancelada')]

    id = models.AutoField(primary_key=True, db_column='id_sesion')
    estudiante = models.ForeignKey(Estudiante, on_delete=models.PROTECT, db_column='id_estudiante')
    mentor = models.ForeignKey(Mentor, on_delete=models.PROTECT, db_column='id_mentor', related_name='sesiones')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    estado = models.CharField(max_length=10, choices=ESTADOS)
    enlace_reunion = models.CharField(max_length=500)

    class Meta:
        managed = False
        db_table = 'sesiones'
        ordering = ['-fecha', '-hora_inicio']
