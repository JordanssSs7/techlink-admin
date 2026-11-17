from rest_framework import serializers

from .models import Curso


class CursoSerializer(serializers.ModelSerializer):
    # Cuántos mentores dominan el curso y cuántos estudiantes lo marcaron como crítico.
    total_mentores = serializers.SerializerMethodField()
    total_estudiantes = serializers.SerializerMethodField()

    class Meta:
        model = Curso
        fields = ['id', 'nombre', 'activo', 'total_mentores', 'total_estudiantes']
        # La unicidad se valida en validate_nombre, sin distinguir mayúsculas.
        extra_kwargs = {'nombre': {'validators': []}}

    def get_total_mentores(self, curso):
        return getattr(curso, 'total_mentores', 0)

    def get_total_estudiantes(self, curso):
        return getattr(curso, 'total_estudiantes', 0)

    def validate_nombre(self, valor):
        nombre = ' '.join(valor.split())
        if len(nombre) < 3:
            raise serializers.ValidationError('El nombre debe tener al menos 3 caracteres.')
        repetidos = Curso.objects.filter(nombre__iexact=nombre)
        if self.instance is not None:
            repetidos = repetidos.exclude(pk=self.instance.pk)
        if repetidos.exists():
            raise serializers.ValidationError('Ya existe un curso con ese nombre.')
        return nombre
