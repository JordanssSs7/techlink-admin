from rest_framework.routers import SimpleRouter

from .views import HistorialViewSet

router = SimpleRouter()
router.register('historial', HistorialViewSet, basename='historial')

urlpatterns = router.urls
