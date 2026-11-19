from rest_framework.routers import SimpleRouter

from .views import PostulacionViewSet

router = SimpleRouter()
router.register('postulaciones', PostulacionViewSet, basename='postulacion')

urlpatterns = router.urls
