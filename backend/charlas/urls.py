from rest_framework.routers import SimpleRouter

from .views import CharlaViewSet

router = SimpleRouter()
router.register('charlas', CharlaViewSet, basename='charla')

urlpatterns = router.urls
