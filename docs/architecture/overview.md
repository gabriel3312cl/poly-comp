# Monopoly Companion App - Architecture Overview

The Monopoly Companion is a full-stack application designed to manage game state, transactions, and special mechanics (like the "Bóveda" cards) for a physical Monopoly game.

## 🏗️ Project Structure

The project follows a **Monorepo** structure:
- `apps/api`: Rust backend (Axum + SQLx).
- `apps/web`: Next.js frontend (React + Tailwind + Material UI).
- `shared/`: Shared assets and logic.
- `infrastructure/`: Database initialization and deployment scripts.
- `docs/`: Project documentation.

---

## 🧠 Backend Design (Clean Architecture)

The backend is built using **Clean Architecture** principles to separate business logic from external dependencies (DBs, Web Frameworks).

### Layer Breakdown

1. **`domain/` (The Core)**
   - Defines the "Characters" and "Rules" of the app.
   - **Entities**: `User`, `GameSession`, `Participant`, `Card`, `Transaction`.
   - **Repositories (Traits)**: Interfaces for data storage (e.g., "how to save a user").

2. **`application/` (The Manager)**
   - Coordinates business workflows.
   - **Services**: `UserService` (auth), `GameService` (lobby management), `TransactionService` (atomic money moving), `CardService` (decks and market).

3. **`infrastructure/` (The Tools)**
   - Concrete implementation of traits.
   - **Postgres**: Uses **SQLx** for parameterized, safe queries. Handles manual SQL for complex logic.

4. **`web/` (The Counter)**
   - Handles HTTP/WebSocket communication.
   - **Handlers**: Axum controllers that parse JSON and call services.
   - **Extractors/Middlewares**: JWT Authentication and CORS.

---

## 🎨 Frontend Design (Next.js)

The frontend is a modern React application optimized for mobile usage during game sessions.

- **Global State**: Managed via **Zustand** (with persistence for auth).
- **Data Fetching**: Powered by **React Query** for real-time synchronization and caching.
- **UI System**: A blend of **Material UI** (for components) and **Tailwind CSS** (for layout/styling).
- **Real-time**: Leverages WebSockets (fallback to polling) for live balance updates.

---

## 🔒 Security & Data Integrity

- **Auth**: Passwords hashed with **Argon2id**. Stateless **JWT tokens** with a "logout invalidation" check.
- **Transactions**: Money transfers are ACID-compliant, using `REPEATABLE READ` isolation to prevent race conditions during simultaneous trades.
- **Validation**: Strict schema validation on both frontend (Zod) and backend (Validator crate).

---

## 🎲 Key Game Mechanics Managed

This companion handles complex Monopoly variations:
- **Banking**: Automatic "Pass Go" payments and taxes.
- **Digital Decks**: Automated drawing from Arca Comunal and Fortuna.
- **Bóveda Store**: A digital market for purchasing game-breaking power-ups.
- **Dice History**: Audit log of all rolls (including Special Dice) to prevent disputes.
