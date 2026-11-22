from django.db import models
from django.utils import timezone

from usuarios.models import Usuario

# Tabla "parametros_seguridad": la crea la migración V14 (HU-60) del backend de usuario, que la lee en cada inicio de
# sesión. Siempre hay UNA sola fila (id 1). managed = False: Django la lee y la actualiza, pero no la crea ni la altera.

ID_FILA = 1
MIN_INTENTOS, MAX_INTENTOS = 1, 10
MIN_BLOQUEO, MAX_BLOQUEO = 1, 1440  # un día


class ParametrosSeguridad(models.Model):
    id = models.IntegerField(primary_key=True, db_column='id_parametros', default=ID_FILA)
    # Sin arroba y en minúsculas, por ejemplo "tecsup.edu.pe".
    dominio_permitido = models.CharField(max_length=100)
    max_intentos = models.IntegerField()
    minutos_bloqueo = models.IntegerField()
    # Nulo si la API corría sin JWT_SECRET (no se sabe quién fue) o si se borró la cuenta del administrador.
    admin = models.ForeignKey(Usuario, null=True, on_delete=models.SET_NULL, db_column='id_admin', related_name='+')
    fecha_actualizacion = models.DateTimeField(default=timezone.now)

    class Meta:
        managed = False
        db_table = 'parametros_seguridad'
