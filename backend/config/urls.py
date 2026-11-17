from django.urls import include, path

from core.views import estado

urlpatterns = [
    path('api/estado/', estado),
    path('api/', include('cursos.urls')),
    path('api/', include('usuarios.urls')),
    path('api/', include('mentorias.urls')),
]
