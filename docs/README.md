# Documentación de Monopoly Companion

Bienvenido a la documentación técnica y de juego del proyecto Poly-Comp / Monopoly Companion.

## 📂 Estructura de la Documentación

### 🏗️ [Arquitectura](./architecture/overview.md)
Descripción detallada de la estructura del proyecto (Monorepo), patrones de diseño (Clean Architecture) y tecnologías utilizadas.
- [Registros de Decisiones de Arquitectura (ADR)](./architecture/adr/ADR.md)

### 🔌 [API](./api/cheatsheet.md)
Guía rápida para desarrolladores, ejemplos de `curl` y referencia de endpoints.
- [Especificación OpenAPI (Swagger)](./api/openapi.yaml)

### 🎮 [Juego](./game/cards.md)
Reglas y listado completo de tarjetas del juego:
- Arca Comunal
- Fortuna
- Bonificaciones (Ruleta)
- Bóveda (Tienda Especial)

---

## 🚀 Inicio Rápido

1. Consulta el [Overview de Arquitectura](./architecture/overview.md) para entender cómo está construido el backend (Rust) y el frontend (Next.js).
2. Para desplegar localmente la base de datos, utiliza el archivo `infrastructure/db/init.sql`.
3. Revisa el [API Cheatsheet](./api/cheatsheet.md) para probar los endpoints manualmente.
