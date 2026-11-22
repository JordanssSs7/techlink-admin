from django.db import models
from django.utils import timezone

from usuarios.models import Mentor, Usuario

# Tabla "constancias": la crea la migración V15 (HU-27) del backend de usuario, que registra aquí a cada mentor que llega a las
# horas mínimas. Aquí el administrador la emite. managed = False: Django la lee y la actualiza, pero no la crea ni la altera.


class ConstanciaMentor(models.Model):
    ESTADOS = [('PENDIENTE', 'Pendiente'), ('EMITIDA', 'Emitida')]

    id = models.AutoField(primary_key=True, db_column='id_constancia')
    # Una sola constancia por mentor.
    mentor = models.OneToOneField(Mentor, on_delete=models.CASCADE, db_column='id_mentor', related_name='+')
    # Las horas dictadas en el momento en que llegó al mínimo.
    horas_al_cumplir = models.DecimalField(max_digits=7, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='PENDIENTE')
    fecha_elegible = models.DateTimeField(default=timezone.now)
    fecha_emision = models.DateTimeField(null=True)
    # Nulo si la API corría sin JWT_SECRET (no se sabe quién fue) o si se borró la cuenta del administrador.
    admin = models.ForeignKey(Usuario, null=True, on_delete=models.SET_NULL, db_column='id_admin', related_name='+')
    # Se genera al emitir; va impreso en la constancia y en su código QR (V16).
    codigo_verificacion = models.CharField(max_length=20, null=True, unique=True)

    class Meta:
        managed = False
        db_table = 'constancias'
        ordering = ['-fecha_elegible', '-id']
