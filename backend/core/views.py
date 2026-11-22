from rest_framework.decorators import api_view
from rest_framework.response import Response

MODULOS = ['cursos', 'usuarios', 'postulaciones', 'mentorias', 'moderacion', 'comunidad', 'charlas', 'anuncios', 'seguridad', 'constancias', 'auditoria']


@api_view(['GET'])
def estado(request):
    """GET /api/estado/: comprueba que la API del panel está en línea y lista sus módulos."""
    return Response({'servicio': 'techlink-admin', 'estado': 'ok', 'modulos': MODULOS})
