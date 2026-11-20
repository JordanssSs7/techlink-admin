from rest_framework.routers import SimpleRouter

from .views import CalificacionModeracionViewSet, ReporteViewSet

router = SimpleRouter()
router.register('reportes', ReporteViewSet, basename='reporte')
router.register('calificaciones', CalificacionModeracionViewSet, basename='calificacion')

urlpatterns = router.urls
