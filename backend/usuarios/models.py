from django.db import models

# Tablas de la base compartida creadas por el backend de usuario (Spring Boot + Flyway).
# managed = False: Django las lee y escribe, pero no las crea ni las altera.


class Rol(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_rol')
    nombre = models.CharField(max_length=50, unique=True, db_column='nombre_rol')

    class Meta:
        managed = False
        db_table = 'roles'

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    ESTADOS = [('ACTIVO', 'Activo'), ('INACTIVO', 'Inactivo')]

    id = models.AutoField(primary_key=True, db_column='id_usuario')
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    correo = models.CharField(max_length=150, unique=True, db_column='correo_institucional')
    # contrasena_hash no se declara a propósito: nunca sale de la base de datos.
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, db_column='id_rol', related_name='usuarios')
    estado = models.CharField(max_length=8, choices=ESTADOS, default='ACTIVO')
    fecha_registro = models.DateTimeField()
    proveedor = models.CharField(max_length=6)
    bloqueado_hasta = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'usuarios'
        ordering = ['nombres', 'apellidos']

    def __str__(self):
        return f'{self.nombres} {self.apellidos}'


class Estudiante(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_estudiante')
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, db_column='id_usuario', related_name='estudiante')
    codigo = models.CharField(max_length=20, null=True, db_column='codigo_estudiante')
    ciclo = models.IntegerField(null=True)

    class Meta:
        managed = False
        db_table = 'estudiantes'


class Mentor(models.Model):
    id = models.AutoField(primary_key=True, db_column='id_mentor')
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, db_column='id_usuario', related_name='mentor')
    especialidad = models.CharField(max_length=150, null=True)
    biografia = models.TextField(null=True)
    # Reputación ya calculada por el backend de usuario (V7): promedio de estrellas y cantidad de calificaciones.
    reputacion = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_calificaciones = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = 'mentores'
