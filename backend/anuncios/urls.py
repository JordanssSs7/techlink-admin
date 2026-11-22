from rest_framework.routers import SimpleRouter

from .views import AnuncioViewSet

router = SimpleRouter()
router.register('anuncios', AnuncioViewSet, basename='anuncio')

urlpatterns = router.urls
