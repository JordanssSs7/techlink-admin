"""Autenticación del panel: valida el token JWT que entrega el backend de usuario (Spring Boot).

El token se firma con HS256 y la clave JWT_SECRET, que debe ser la MISMA en Spring y en Django (mínimo 32 caracteres).
 - Con JWT_SECRET definida: toda la API exige un token válido y vigente de un usuario con rol ADMIN (401 o 403 si no).
 - Sin JWT_SECRET: la API queda abierta, como antes, y las acciones se registran sin identificar al administrador.
   Es solo para desarrollo; en cualquier otro entorno hay que definir la clave.
"""
import base64
import binascii
import hashlib
import hmac
import json
import time

from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission


class AdminAutenticado:
    """El administrador que hizo la petición, según el token."""

    is_authenticated = True
    is_anonymous = False

    def __init__(self, id, correo, rol):
        self.id = id
        self.correo = correo
        self.rol = rol

    def __str__(self):
        return self.correo or f'admin {self.id}'


def _decodificar(parte):
    return base64.urlsafe_b64decode(parte + '=' * (-len(parte) % 4))


def validar_token(token, secreto, ahora=None):
    """Devuelve los datos (claims) del token si la firma y el vencimiento son válidos; si no, lanza AuthenticationFailed."""
    invalido = AuthenticationFailed('El token no es válido o venció. Inicia sesión de nuevo.')
    try:
        cabecera_b64, datos_b64, firma_b64 = token.split('.')
        cabecera = json.loads(_decodificar(cabecera_b64))
        datos = json.loads(_decodificar(datos_b64))
        firma = _decodificar(firma_b64)
    except (ValueError, binascii.Error, UnicodeDecodeError):
        raise invalido
    if cabecera.get('alg') != 'HS256':
        raise invalido
    esperada = hmac.new(secreto.encode('utf-8'), f'{cabecera_b64}.{datos_b64}'.encode('ascii'), hashlib.sha256).digest()
    if not hmac.compare_digest(esperada, firma):
        raise invalido
    vence = datos.get('exp')
    if not isinstance(vence, (int, float)) or vence <= (time.time() if ahora is None else ahora):
        raise invalido
    return datos


class TokenSpringAuthentication(BaseAuthentication):
    def authenticate(self, request):
        secreto = getattr(settings, 'JWT_SECRET', '')
        if not secreto:
            return None
        cabecera = get_authorization_header(request).split()
        if len(cabecera) != 2 or cabecera[0].lower() != b'bearer':
            return None
        datos = validar_token(cabecera[1].decode('ascii', errors='ignore'), secreto)
        try:
            id_usuario = int(datos.get('sub'))
        except (TypeError, ValueError):
            raise AuthenticationFailed('El token no es válido o venció. Inicia sesión de nuevo.')
        return AdminAutenticado(id_usuario, datos.get('correo'), datos.get('rol')), cabecera[1]

    def authenticate_header(self, request):
        return 'Bearer'


class EsAdministrador(BasePermission):
    """Con JWT_SECRET definida, solo deja pasar a quien tenga un token de ADMIN."""

    message = 'Solo los administradores pueden usar el panel.'

    def has_permission(self, request, view):
        if not getattr(settings, 'JWT_SECRET', ''):
            return True
        usuario = request.user
        return isinstance(usuario, AdminAutenticado) and usuario.rol == 'ADMIN'


def admin_id(request):
    """Id del administrador que hizo la petición, o None si la API corre sin JWT_SECRET."""
    usuario = getattr(request, 'user', None)
    return usuario.id if isinstance(usuario, AdminAutenticado) else None
