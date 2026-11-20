from rest_framework.routers import SimpleRouter

from .views import ConsultaViewSet, RecursoViewSet, RespuestaViewSet

router = SimpleRouter()
router.register('foro/consultas', ConsultaViewSet, basename='foro-consulta')
router.register('foro/respuestas', RespuestaViewSet, basename='foro-respuesta')
router.register('recursos', RecursoViewSet, basename='recurso')

urlpatterns = router.urls
