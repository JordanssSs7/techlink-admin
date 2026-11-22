import unicodedata
from datetime import datetime

from django.db import connection

from mentorias.metricas import ahora_local

# HU-24: avisos de tipo CHARLA en el centro de notificaciones de los estudiantes.
#  - Una charla nueva se avisa a los estudiantes a quienes se les recomendaría (HU-06): los que marcaron como crítico el curso
#    que refuerza o tienen un interés que coincide con su temática o su nombre.
#  - Si una charla cambia de horario o de enlace, se desactiva o se vuelve a activar, se avisa a quienes ya se inscribieron.
# Quien desactivó los avisos de charlas en sus preferencias no recibe nada. Las tablas "notificaciones", "usuario_intereses",
# "estudiante_cursos_criticos" y "charla_inscripciones" son del backend de usuario (V5, V8, V11 y V12).

SIN_AVISOS = """NOT EXISTS (SELECT 1 FROM preferencias_notificacion p
                WHERE p.id_usuario = u.id_usuario AND p.tipo = 'CHARLA' AND p.en_app = 0)"""
LARGO_MAXIMO = 500


def normalizar(texto):
    """Sin tildes ni mayúsculas, igual que el cálculo de recomendaciones del backend de usuario."""
    if not texto:
        return ''
    return ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn').lower().strip()


def coincide(texto, interes):
    """El interés coincide si aparece completo en el texto o si alguna de sus palabras de 5 letras o más aparece en él."""
    interes = normalizar(interes)
    if not interes:
        return False
    if interes in texto:
        return True
    return any(len(palabra) >= 5 and palabra in texto for palabra in interes.split())


def _fila(consulta, parametros=()):
    with connection.cursor() as cursor:
        cursor.execute(consulta, list(parametros))
        return cursor.fetchall()


def estudiantes_afines(charla):
    """Ids de usuario de los estudiantes activos a quienes les interesa la charla y no desactivaron sus avisos."""
    ids = set()
    if charla.curso_id:
        ids.update(f[0] for f in _fila(
            f"""SELECT u.id_usuario FROM usuarios u
                JOIN estudiantes e ON e.id_usuario = u.id_usuario
                JOIN estudiante_cursos_criticos ec ON ec.id_estudiante = e.id_estudiante
                WHERE ec.id_curso = %s AND u.estado = 'ACTIVO' AND {SIN_AVISOS}""", [charla.curso_id]))
    texto = normalizar(f'{charla.tematica} {charla.nombre}')
    for id_usuario, interes in _fila(
            f"""SELECT u.id_usuario, ui.interes FROM usuarios u
                JOIN estudiantes e ON e.id_usuario = u.id_usuario
                JOIN usuario_intereses ui ON ui.id_usuario = u.id_usuario
                WHERE u.estado = 'ACTIVO' AND {SIN_AVISOS}"""):
        if id_usuario not in ids and coincide(texto, interes):
            ids.add(id_usuario)
    return sorted(ids)


def inscritos(charla):
    """Ids de usuario de quienes se inscribieron a la charla y no desactivaron sus avisos."""
    return [f[0] for f in _fila(
        f"""SELECT u.id_usuario FROM usuarios u
            JOIN charla_inscripciones ci ON ci.id_usuario = u.id_usuario
            WHERE ci.id_charla = %s AND u.estado = 'ACTIVO' AND {SIN_AVISOS}
            ORDER BY u.id_usuario""", [charla.id])]


def _insertar(ids, titulo, mensaje):
    if not ids:
        return 0
    with connection.cursor() as cursor:
        cursor.executemany(
            "INSERT INTO notificaciones (id_usuario, tipo, titulo, mensaje) VALUES (%s, 'CHARLA', %s, %s)",
            [(i, titulo[:150], mensaje[:LARGO_MAXIMO]) for i in ids])
    return len(ids)


def cuando(charla):
    return f'{charla.fecha:%d/%m/%Y} de {charla.hora_inicio:%H:%M} a {charla.hora_fin:%H:%M}'


def vigente(charla):
    """Una charla vigente está activa y todavía no terminó."""
    return charla.activo and datetime.combine(charla.fecha, charla.hora_fin) > ahora_local()


def avisar_nueva(charla):
    """Avisa de una charla recién publicada a los estudiantes afines. Devuelve a cuántos avisó."""
    if not vigente(charla):
        return 0
    return _insertar(estudiantes_afines(charla), 'Nueva charla para ti',
                     f'"{charla.nombre}" ({charla.tematica}): {cuando(charla)}. Inscríbete desde Charlas.')


def avisar_cambio(charla, antes):
    """Avisa a los inscritos si cambió el horario o el enlace. 'antes' es (fecha, hora_inicio, hora_fin, enlace) de antes del cambio."""
    ahora = (charla.fecha, charla.hora_inicio, charla.hora_fin, charla.enlace)
    if not vigente(charla) or ahora == antes:
        return 0
    if ahora[:3] != antes[:3]:
        texto = f'La charla "{charla.nombre}" cambió de horario: ahora es {cuando(charla)}.'
    else:
        texto = f'La charla "{charla.nombre}" cambió de enlace de acceso. Revisa los datos en Charlas.'
    return _insertar(inscritos(charla), 'Cambió una charla', texto)


def avisar_estado(charla):
    """Avisa a los inscritos que la charla se canceló (desactivada) o que se vuelve a realizar (activada)."""
    if charla.activo:
        if not vigente(charla):
            return 0
        return _insertar(inscritos(charla), 'Charla confirmada de nuevo',
                         f'La charla "{charla.nombre}" vuelve a realizarse: {cuando(charla)}.')
    if datetime.combine(charla.fecha, charla.hora_fin) <= ahora_local():
        return 0
    return _insertar(inscritos(charla), 'Charla cancelada',
                     f'Se canceló la charla "{charla.nombre}" ({cuando(charla)}). Tu inscripción se conserva por si se programa otra vez.')
