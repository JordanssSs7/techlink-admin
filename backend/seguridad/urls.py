from django.urls import path

from .views import impacto, parametros

urlpatterns = [
    path('parametros-seguridad/', parametros),
    path('parametros-seguridad/impacto/', impacto),
]
