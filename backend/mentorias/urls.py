from django.urls import path

from .views import mentores, resumen

urlpatterns = [
    path('mentores/', mentores),
    path('metricas/resumen/', resumen),
]
