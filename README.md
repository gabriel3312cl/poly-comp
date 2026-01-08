# 🎩 Poly-Comp: Monopoly Strategic Companion

**Poly-Comp** es un asistente digital avanzado (Companion App) diseñado para potenciar partidas de Monopoly físico o digital. Utiliza una arquitectura robusta para gestionar balances, transacciones y eventos, integrando un **Asesor con Inteligencia Artificial** para elevar el nivel estratégico del juego.

---

## 🚀 Características Principales

- 💳 **Gestión Financiera Digital**: Olvídate de los billetes físicos. Realiza transferencias entre jugadores o con el banco de forma instantánea y segura.
- 🎲 **Historial Detallado**: Registro completo de todos los movimientos de dinero y tiradas de dados para auditar cualquier conflicto.
- 🏰 **Sistemas Especiales**:
  - **Bóveda (Store)**: Mercado digital para comprar habilidades únicas y ventajas competitivas.
  - **Tarjetas Digitales**: Gestión automatizada de barajas de Arca Comunal, Fortuna y Bonificaciones.
- 📱 **Interfaz Mobile-First**: Diseñada para usarse cómodamente desde el móvil mientras juegas en el tablero físico.
- 🛠️ **Arquitectura de Misión Crítica**: Transacciones bancarias con integridad ACID para asegurar que no se pierda ni un $1 de balance.

---

## 🧠 Capacidades de Inteligencia Artificial (Poly-Advisor)

El corazón de Poly-Comp es el **Poly-Advisor**, un estratega basado en IA que actúa como tu consultor financiero personal durante la partida.

### ¿Qué puede hacer el Poly-Advisor?
1. **Análisis de Contexto en Tiempo Real**: La IA tiene acceso total al estado actual del juego:
   - Tu balance y posición en el tablero.
   - Estado financiero de tus oponentes.
   - Reservas actuales del banco.
   - Historial reciente de transacciones y tiradas.
2. **Consejos Estratégicos**: Puedes preguntarle cosas como:
   - *"¿Es buen momento para comprar esta propiedad o debería ahorrar para la Bóveda?"*
   - *"Analiza mi situación actual y dame un consejo clave para ganar."*
3. **Predicción y Probabilidades**: Analiza las "hot spots" (puntos calientes) del tablero basándose en el historial de tiradas para avisarte de zonas de alto riesgo.
4. **Interpretación de Reglas**: Resuelve dudas sobre mecánicas especiales o tarjetas de la Bóveda de forma dinámica.

---

## 🏗️ Stack Tecnológico

- **Backend**: [Rust](https://www.rust-lang.org/) (Axum, SQLx, Postgres) - Para una seguridad y velocidad inigualables.
- **Frontend**: [Next.js](https://nextjs.org/) (React, Tailwind CSS, Material UI) - Una interfaz premium y fluida.
- **IA**: Integración con modelos de lenguaje masivos para el análisis estratégico.
- **Base de Datos**: PostgreSQL para persistencia persistente y robusta.

---

## 🛠️ Desarrollo

El proyecto utiliza un sistema de `Makefile` para simplificar las tareas comunes:

```bash
make install    # Instala todas las dependencias
make dev-web    # Lanza el frontend (http://localhost:3000)
make dev-api    # Lanza el backend (http://localhost:8080)
make db-init    # Inicializa la estructura de la base de datos
```

Para más detalles técnicos, consulta la carpeta [`docs/`](./docs/README.md).

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
