from django.urls import path
from rest_framework.routers import SimpleRouter

from .reportes import exportar
from .sesiones import SesionViewSet
from .views import mentores, resumen

router = SimpleRouter()
router.register('sesiones', SesionViewSet, basename='sesion')

urlpatterns = [
    path('mentores/', mentores),
    path('metricas/resumen/', resumen),
    path('metricas/exportar/', exportar),
] + router.urls
