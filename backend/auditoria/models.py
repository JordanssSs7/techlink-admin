from django.db import models
from django.utils import timezone

from usuarios.models import Usuario

# Tabla "acciones_admin": la crea la migración V9 (HU-59) del backend de usuario.
# managed = False: Django la lee y escribe, pero no la crea ni la altera.

TIPOS = {
    'POSTULACION_APROBADA': 'Postulación aprobada',
    'POSTULACION_RECHAZADA': 'Postulación rechazada',
    'SESION_CANCELADA': 'Sesión cancelada',
    'USUARIO_ACTUALIZADO': 'Usuario actualizado',
    'CURSO_CREADO': 'Curso creado',
    'CURSO_ACTUALIZADO': 'Curso actualizado',
    'CURSO_ELIMINADO': 'Curso eliminado',
    'REPORTE_RESUELTO': 'Reporte resuelto',
    'REPORTE_DESCARTADO': 'Reporte descartado',
    'CALIFICACION_OCULTADA': 'Calificación ocultada',
    'CALIFICACION_MOSTRADA': 'Calificación mostrada',
    'CRITERIOS_IA_ACTUALIZADOS': 'Criterios de IA actualizados',
    'CHARLA_CREADA': 'Charla creada',
    'CHARLA_ACTUALIZADA': 'Charla actualizada',
    'CHARLA_DESACTIVADA': 'Charla desactivada',
    'CHARLA_ACTIVADA': 'Charla activada',
    'CONSULTA_OCULTADO': 'Consulta del foro ocultada',
    'CONSULTA_MOSTRADO': 'Consulta del foro mostrada',
    'RESPUESTA_OCULTADO': 'Respuesta del foro ocultada',
    'RESPUESTA_MOSTRADO': 'Respuesta del foro mostrada',
    'RECURSO_OCULTADO': 'Recurso compartido ocultado',
    'RECURSO_MOSTRADO': 'Recurso compartido mostrado',
    'ANUNCIO_PUBLICADO': 'Anuncio publicado',
    'PARAMETROS_ACTUALIZADOS': 'Parámetros de seguridad actualizados',
}


class AccionAdmin(models.Model):
    """Una acción que hizo un administrador en el panel (auditoría)."""

    id = models.AutoField(primary_key=True, db_column='id_accion')
    # Nulo si la API corría sin JWT_SECRET (no se sabe quién fue) o si se borró la cuenta del administrador.
    admin = models.ForeignKey(Usuario, null=True, on_delete=models.SET_NULL, db_column='id_admin', related_name='+')
    tipo = models.CharField(max_length=40)
    entidad = models.CharField(max_length=30)
    id_entidad = models.IntegerField(null=True)
    detalle = models.CharField(max_length=500, null=True)
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        managed = False
        db_table = 'acciones_admin'
        ordering = ['-fecha', '-id']
