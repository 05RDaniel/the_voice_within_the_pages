# La voz de las páginas — Resumen de funcionalidad

**Qué es:** Gestor narrativo para escritores. Organiza historias, líneas temporales, tramas y notas en un solo espacio.

---

## Funcionalidad actual

- **Cuenta:** Registro, login, logout. Perfil con imagen y cambio de contraseña. Autenticación por sesión (cookie).

- **Historias:** Crear, listar, editar y eliminar. Visibilidad pública, privada o no listada. Editor de capítulos con contenido enriquecido. Personajes asociados a la historia.

- **Scriptorium:** Página de acceso rápido a Historias, Personajes y Líneas temporales (cards de navegación).

- **Líneas temporales (Plots):** Por historia. Crear varias líneas temporales; cada una tiene tramas y notas. Listado con filtro por historia; primera card “+” para crear nueva línea.

- **Vista de línea temporal:** Una vez dentro de una línea:
  - **Tramas:** Rangos por capítulo (inicio–fin), nombre, descripción, color. Añadir/editar/eliminar desde el sidebar (botón + junto a “Tramas”).
  - **Notas:** Puntos en un capítulo concreto. Añadir/editar/eliminar desde el sidebar (botón + junto a “Notas”).
  - Eje de capítulos con controles +/- para cambiar el número de capítulos. Arrastrar tramas para ajustar inicio/fin.

- **Contenido:** Entradas del usuario (título + texto) vía API; sin UI específica de listado/edición en el front actual.

- **Citas:** Por idioma; se muestran en el footer (cita aleatoria).

- **UI:** Tema claro/oscuro, idioma (ES/EN), layout responsive. Header con home, atrás (según página), título y menú. Sin subheaders en Plots ni en vista de línea temporal.

---

## Rutas principales

| Ruta | Página |
|------|--------|
| `/login`, `/register` | Login y registro |
| `/home` | Inicio (después de login) |
| `/scriptorium` | Acceso a Historias, Personajes, Líneas temporales |
| `/profile` | Perfil y cambio de contraseña |
| `/stories` | Lista de historias |
| `/story/:id` | Vista general de una historia |
| `/story/:id/edit` | Editor de la historia (capítulos, etc.) |
| `/story/:id/chapter/:chapterId` | Editor de un capítulo |
| `/plots` | Lista de líneas temporales |
| `/timeline/:id` | Vista de una línea temporal (tramas y notas) |

---

## Stack

- **Frontend:** React (Vite), React Router, CSS. Contextos de tema e idioma.
- **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL. API REST bajo `/api/*`.
- **Auth:** Sesión con cookie respaldada en tabla `sessions`; bcrypt para contraseñas.
