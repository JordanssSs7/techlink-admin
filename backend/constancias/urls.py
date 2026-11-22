from rest_framework.routers import SimpleRouter

from .views import ConstanciaViewSet

router = SimpleRouter()
router.register('constancias', ConstanciaViewSet, basename='constancia')

urlpatterns = router.urls
