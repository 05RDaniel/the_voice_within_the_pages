# Medidas de Seguridad - La voz de las páginas

## 🔐 Seguridad de Contraseñas

### Hash de Contraseñas
- **Algoritmo**: bcrypt con 12 rounds (salt automático)
- **Razón**: 12 rounds proporciona un balance óptimo entre seguridad y rendimiento
- **Implementación**: Todas las contraseñas se hashean (`app/core/security.py`) antes de guardarse en la base de datos

### Validación de Fortaleza
Actualmente solo se exige que la contraseña no esté vacía (`validate_password_strength` en `app/core/security.py`). No hay reglas adicionales de longitud mínima o complejidad.

### Protección contra Enumeración
- Los mensajes de error no revelan si un usuario existe o no
- Mismo mensaje ("Credenciales inválidas") para credenciales inválidas y usuario no encontrado en login

### Normalización de Datos
- **Emails**: Convertidos a lowercase y trim
- **Usernames**: Trim aplicado
- **Validación**: Formato de email (regex) y username (3-20 caracteres, alfanumérico + guiones) validados antes de guardar

## 🛡️ Otras Medidas de Seguridad

### Base de Datos
- Las contraseñas nunca se devuelven en las respuestas API (los serializers en `app/serializers.py` y los endpoints construyen la respuesta explícitamente, sin incluir el campo `password`)
- Relaciones con cascade delete (`ondelete="CASCADE"`) para mantener integridad referencial

### Sesiones
- Sesión por cookie (`session_id`) respaldada en la tabla `sessions` de Postgres — no JWT
- Cookie HTTP-only
- `Secure` + `SameSite=None` en producción, `SameSite=Lax` en desarrollo
- Expiración de 7 días; el logout borra la fila de sesión en la base de datos
- `SESSION_SECRET` reservado para futuros usos (firma de cookies adicional), configurable por entorno

### Validación de Entrada
- Validación de formato de email
- Validación de formato de username (3-20 caracteres, alfanumérico + guiones/guiones bajos)
- Cuerpos de petición tipados con Pydantic; validación de negocio explícita en cada router

## 📝 Notas Importantes

1. **Nunca** loguear contraseñas en consola
2. **Nunca** devolver contraseñas en respuestas JSON
3. **Siempre** usar las utilidades de `app/core/security.py` para operaciones con contraseñas
4. **Siempre** normalizar emails y usernames antes de guardar
