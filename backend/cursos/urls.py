from django.urls import path
from rest_framework.routers import DefaultRouter

from .demanda import demanda, exportar_demanda
from .views import CursoViewSet

router = DefaultRouter()
router.register('cursos', CursoViewSet, basename='curso')

# Las rutas de la demanda (HU-55) van antes del router: si no, "demanda" se tomaría por el id de un curso.
urlpatterns = [
    path('cursos/demanda/', demanda),
    path('cursos/demanda/exportar/', exportar_demanda),
] + router.urls
