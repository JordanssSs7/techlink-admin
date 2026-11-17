from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Estudiante, Mentor, Rol, Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """El administrador solo cambia el rol y el estado de una cuenta.

    Las cuentas se crean en la aplicación de usuario (inicio de sesión con Google),
    por eso el panel no crea ni elimina usuarios.
    """

    rol = serializers.SlugRelatedField(slug_field='nombre', queryset=Rol.objects.all())
    nombre_completo = serializers.SerializerMethodField()
    ciclo = serializers.SerializerMethodField()
    especialidad = serializers.SerializerMethodField()
    bloqueado = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'nombres', 'apellidos', 'nombre_completo', 'correo', 'rol', 'estado',
                  'proveedor', 'fecha_registro', 'ciclo', 'especialidad', 'bloqueado']
        read_only_fields = ['nombres', 'apellidos', 'correo', 'proveedor', 'fecha_registro']

    def get_nombre_completo(self, u):
        return f'{u.nombres} {u.apellidos}'

    def get_ciclo(self, u):
        try:
            return u.estudiante.ciclo
        except Estudiante.DoesNotExist:
            return None

    def get_especialidad(self, u):
        try:
            return u.mentor.especialidad
        except Mentor.DoesNotExist:
            return None

    def get_bloqueado(self, u):
        return bool(u.bloqueado_hasta and u.bloqueado_hasta > timezone.now())

    def validate(self, datos):
        u = self.instance
        rol = datos.get('rol', u.rol)
        estado = datos.get('estado', u.estado)
        # RN: el panel no puede quedarse sin un administrador activo.
        deja_de_ser_admin = rol.nombre != 'ADMIN' or estado != 'ACTIVO'
        if u.rol.nombre == 'ADMIN' and u.estado == 'ACTIVO' and deja_de_ser_admin:
            otros = Usuario.objects.filter(rol__nombre='ADMIN', estado='ACTIVO').exclude(pk=u.pk)
            if not otros.exists():
                raise serializers.ValidationError('Debe quedar al menos un administrador activo.')
        # RN: el administrador entra con correo y contraseña; una cuenta de Google no tiene contraseña.
        if rol.nombre == 'ADMIN' and u.rol.nombre != 'ADMIN' and u.proveedor != 'LOCAL':
            raise serializers.ValidationError(
                {'rol': 'Solo una cuenta con contraseña puede ser administrador; esta cuenta entra con Google.'})
        return datos

    @transaction.atomic
    def update(self, u, datos):
        u = super().update(u, datos)
        # Un estudiante necesita su perfil (ciclo y cursos críticos) en la aplicación de usuario.
        if u.rol.nombre == 'ESTUDIANTE' and not Estudiante.objects.filter(usuario=u).exists():
            Estudiante.objects.create(usuario=u)
        # El perfil de mentor lo crea la aplicación de usuario cuando el mentor guarda sus datos.
        return u
