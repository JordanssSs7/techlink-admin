from django.db import models
from django.utils import timezone

from mentorias.models import Sesion
from usuarios.models import Usuario

# Tabla "reportes": la crea la migración V9 (HU-29) del backend de usuario; allí los estudiantes y mentores
# envían los reportes y aquí el administrador los revisa (HU-52).
# managed = False: Django la lee y la actualiza, pero no la crea ni la altera.


class Reporte(models.Model):
    TIPOS = [('USUARIO', 'Usuario'), ('SESION', 'Sesión'), ('CONSULTA', 'Consulta del foro'), ('RESPUESTA', 'Respuesta del foro')]
    MOTIVOS = [
        ('CONDUCTA_INADECUADA', 'Conducta inadecuada'),
        ('ACOSO', 'Acoso'),
        ('CONTENIDO_OFENSIVO', 'Contenido ofensivo'),
        ('INCUMPLIMIENTO', 'Incumplimiento'),
        ('SPAM', 'Spam'),
        ('OTRO', 'Otro'),
    ]
    ESTADOS = [('PENDIENTE', 'Pendiente'), ('RESUELTO', 'Resuelto'), ('DESCARTADO', 'Descartado')]

    id = models.AutoField(primary_key=True, db_column='id_reporte')
    reportante = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_reportante', related_name='+')
    tipo = models.CharField(max_length=9, choices=TIPOS)
    reportado = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario_reportado',
                                  related_name='reportes_recibidos')
    sesion = models.ForeignKey(Sesion, null=True, on_delete=models.CASCADE, db_column='id_sesion', related_name='+')
    # Reportes del foro (V19): la consulta o la respuesta reportada y lo que decía al reportarla. Si su autor la edita o la
    # elimina después, el texto guardado en contenido_reportado sigue mostrando qué se reportó.
    id_consulta = models.IntegerField(null=True)
    id_respuesta = models.IntegerField(null=True)
    contenido_reportado = models.CharField(max_length=500, null=True)
    motivo = models.CharField(max_length=20, choices=MOTIVOS)
    descripcion = models.CharField(max_length=500)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='PENDIENTE')
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_revision = models.DateTimeField(null=True)
    # Administrador que lo revisó (nulo si la API corría sin JWT_SECRET).
    id_revisor = models.IntegerField(null=True)
    nota_revision = models.CharField(max_length=500, null=True)

    class Meta:
        managed = False
        db_table = 'reportes'
        ordering = ['-fecha_creacion', '-id']

    def __str__(self):
        return f'Reporte {self.id} ({self.estado})'
