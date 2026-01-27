# Medidas de Seguridad - La Voz de las Páginas

## 🔐 Seguridad de Contraseñas

### Hash de Contraseñas
- **Algoritmo**: bcrypt con 12 rounds (salt automático)
- **Razón**: 12 rounds proporciona un balance óptimo entre seguridad y rendimiento
- **Implementación**: Todas las contraseñas se hashean antes de guardarse en la base de datos

### Validación de Fortaleza
Las contraseñas deben cumplir:
- ✅ Mínimo 8 caracteres
- ✅ Máximo 128 caracteres
- ✅ Al menos una letra mayúscula
- ✅ Al menos una letra minúscula
- ✅ Al menos un número
- ✅ Al menos un carácter especial (!@#$%^&*...)
- ✅ No puede ser una contraseña común

### Protección contra Enumeración
- Los mensajes de error no revelan si un usuario existe o no
- Mismo mensaje para credenciales inválidas y usuario no encontrado

### Normalización de Datos
- **Emails**: Convertidos a lowercase y trim
- **Usernames**: Trim aplicado
- **Validación**: Formato de email y username validados antes de guardar

## 🛡️ Otras Medidas de Seguridad

### Base de Datos
- Las contraseñas nunca se devuelven en las respuestas API
- Uso de `select` en Prisma para excluir campos sensibles
- Relaciones con cascade delete para mantener integridad

### Sesiones
- Sesiones HTTP-only cookies
- Secure flag en producción
- Expiración de 7 días
- Secret de sesión configurable

### Validación de Entrada
- Validación de formato de email
- Validación de formato de username (3-20 caracteres, alfanumérico + guiones)
- Sanitización de datos de entrada

## 📝 Notas Importantes

1. **Nunca** loguear contraseñas en consola
2. **Nunca** devolver contraseñas en respuestas JSON
3. **Siempre** usar las utilidades de `passwordUtils.ts` para operaciones con contraseñas
4. **Siempre** normalizar emails y usernames antes de guardar

