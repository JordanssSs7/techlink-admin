from rest_framework import serializers

from .models import Consulta, Recurso, Respuesta

LARGO_VISTA = 300


def nombre(usuario):
    return f'{usuario.nombres} {usuario.apellidos}'.replace(' -', '').strip()


def recortar(texto, largo=LARGO_VISTA):
    texto = ' '.join((texto or '').split())
    return texto if len(texto) <= largo else texto[:largo - 1] + '…'


class ConsultaModeradaSerializer(serializers.ModelSerializer):
    """Una consulta del foro tal como la ve el administrador al moderar (HU-54). Solo lectura."""

    curso = serializers.CharField(source='curso.nombre', read_only=True)
    autor = serializers.SerializerMethodField()
    autor_correo = serializers.CharField(source='autor.correo', read_only=True)
    resumen = serializers.SerializerMethodField()
    total_respuestas = serializers.SerializerMethodField()

    class Meta:
        model = Consulta
        fields = ['id', 'titulo', 'contenido', 'resumen', 'curso', 'autor', 'autor_correo', 'fecha_creacion',
                  'total_respuestas', 'oculto', 'fecha_moderacion', 'motivo_moderacion']
        read_only_fields = fields

    def get_autor(self, c):
        return nombre(c.autor)

    def get_resumen(self, c):
        return recortar(c.contenido)

    def get_total_respuestas(self, c):
        # La vista anota n_respuestas para no consultar una vez por fila; si no viene, se cuenta.
        return getattr(c, 'n_respuestas', None) if hasattr(c, 'n_respuestas') else c.respuestas.count()


class RespuestaModeradaSerializer(serializers.ModelSerializer):
    """Una respuesta del foro tal como la ve el administrador al moderar (HU-54). Solo lectura."""

    consulta_id = serializers.IntegerField(read_only=True)
    consulta_titulo = serializers.CharField(source='consulta.titulo', read_only=True)
    consulta_oculta = serializers.BooleanField(source='consulta.oculto', read_only=True)
    curso = serializers.CharField(source='consulta.curso.nombre', read_only=True)
    autor = serializers.SerializerMethodField()
    autor_correo = serializers.CharField(source='autor.correo', read_only=True)
    resumen = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = ['id', 'consulta_id', 'consulta_titulo', 'consulta_oculta', 'curso', 'contenido', 'resumen', 'util',
                  'autor', 'autor_correo', 'fecha_creacion', 'oculto', 'fecha_moderacion', 'motivo_moderacion']
        read_only_fields = fields

    def get_autor(self, r):
        return nombre(r.autor)

    def get_resumen(self, r):
        return recortar(r.contenido)


class RecursoModeradoSerializer(serializers.ModelSerializer):
    """Un recurso compartido tal como lo ve el administrador al moderar (HU-54). Solo lectura."""

    sesion_id = serializers.IntegerField(read_only=True)
    curso = serializers.SerializerMethodField()
    estudiante = serializers.SerializerMethodField()
    autor = serializers.SerializerMethodField()
    autor_correo = serializers.CharField(source='autor.correo', read_only=True)
    vista_codigo = serializers.SerializerMethodField()

    class Meta:
        model = Recurso
        fields = ['id', 'tipo', 'titulo', 'descripcion', 'url', 'lenguaje', 'vista_codigo', 'nombre_archivo',
                  'tipo_contenido', 'tamano_bytes', 'sesion_id', 'curso', 'estudiante', 'autor', 'autor_correo',
                  'fecha_creacion', 'oculto', 'fecha_moderacion', 'motivo_moderacion']
        read_only_fields = fields

    def get_curso(self, r):
        return r.sesion.curso.nombre if r.sesion.curso_id else None

    def get_estudiante(self, r):
        return nombre(r.sesion.estudiante.usuario)

    def get_autor(self, r):
        return nombre(r.autor)

    def get_vista_codigo(self, r):
        """Las primeras líneas del código compartido, para revisarlo sin abrir nada más."""
        return recortar(r.contenido_texto, 400) if r.tipo == 'CODIGO' else None


class OcultarSerializer(serializers.Serializer):
    """HU-54: para ocultar una publicación o un recurso el motivo es obligatorio; es lo que se le avisa al autor."""

    motivo = serializers.CharField(
        min_length=5,
        max_length=300,
        trim_whitespace=True,
        error_messages={
            'required': 'El motivo es obligatorio para ocultar.',
            'blank': 'El motivo es obligatorio para ocultar.',
            'null': 'El motivo es obligatorio para ocultar.',
            'min_length': 'Explica el motivo en al menos 5 caracteres.',
            'max_length': 'El motivo no puede superar los 300 caracteres.',
        },
    )
