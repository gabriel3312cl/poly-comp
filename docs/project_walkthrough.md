# Monopoly Companion App - Backend Walkthrough

## 🏗️ Project Structure
We organized the code using **Clean Architecture**. This keeps our business logic separate from external tools like databases and web frameworks.

### 📂 `apps/api/src/`
-   **`main.rs`**: The entry point. Connects to Postgres, initializes Services, and defines Routes.
-   **`config.rs`**: Loads environment variables (DB URL, JWT Secret).
-   **`state.rs`**: Holds shared application state (Services, Config).

### 🧠 `domain/` (The Rules)
-   **`entities.rs`**: Defines core data structures like `User`, `GameSession`, `Transaction`.
-   **`repositories.rs`**: Defines abstract interfaces for data access (Traits).

### 🏗️ `infrastructure/` (The Tools)
-   **`postgres/`**: Concrete implementations of Repositories using **SQLx**. Code here talks directly to the database.

### ⚙️ `application/` (The Logic)
-   **`user_service.rs`**: Handles Registration (hashing), Login (verification), Logout.
-   **`game_service.rs`**: Manages Game lifecycle (Create, Join, Leave).
-   **`transaction_service.rs`**: Handles atomic money transfers using **ACID** transactions.

### 🌐 `web/` (The API)
-   **`handlers/`**: REST Controllers that handle JSON requests and responses.
-   **`extractors.rs`**: Auth Guard. Verifies JWT tokens and checks for logout invalidation.

---

## 🔌 API Endpoints Reference

### 1. Authentication
*   `POST /users/register`: Register with `username`, `password`, `first_name`, `last_name`.
*   `POST /users/login`: Login with `username`, `password`. Returns JWT `token`.
*   `POST /users/logout`: Invalidates the current token.
*   `GET /users/profile`: Get current user info.
*   `PUT /users/profile`: Update user details.
*   `DELETE /users/profile`: Delete account.

### 2. Game Sessions
*   `POST /games`: Create a new game (Auto-generates 4-char unique `code`).
*   `GET /games/:id`: Get game status.
*   `PUT /games/:id`: Update game (Host only).
*   `DELETE /games/:id`: Delete game (Host only).
*   `POST /games/join`: Join a game using 4-char `code`.
*   `POST /games/:id/join`: Join a game using UUID (creates Participant).
*   `POST /games/:id/leave`: Leave a game.
*   `GET /games/:id/participants`: List all players and their balances.

### 3. Transactions (Money)
*   `POST /games/:id/transactions`: Transfer money.
    *   **Bank ➡️ Player**: Omit `from_participant_id`.
    *   **Player ➡️ Bank**: Omit `to_participant_id`.
    *   **Player ➡️ Player**: Provide both IDs.
*   `GET /games/:id/transactions`: View transaction history.
*   `DELETE /games/:id/transactions/:tx_id`: Undo a transaction (Reverses balances and deletes record).

## 🔒 Security Features
-   **Password Hashing**: Uses **Argon2** for state-of-the-art security.
-   **JWT Auth**: Stateless tokens with validation.
-   **Logout Invalidation**: Server tracks `last_logout_at` to reject old tokens.
-   **SQL Injection Protection**: Uses parameterized queries via SQLx.

## 🛡️ Data Integrity
-   **Atomic Transfers**: Money moves using `REPEATABLE READ` isolation to prevent race conditions.
-   **Consistent Balances**: Database constraints ensure data validity.

## 🎨 Frontend Architecture (Next.js)

### 🚀 App Structure `apps/web/`
- **`app/providers.tsx`**: React Query, MUI Theme, and Cache Providers.
- **`store/authStore.ts`**: Global Auth State (Zustand) with Persistence.
- **`hooks/`**: Custom hooks for API integration (`useGame`, `useTransactions`).

### 📱 Key Pages
- **Login/Register**: Secure auth with error feedback.
- **Game Dashboard**: Create or Join (via Code) games.
- **Game Session (`/game/[id]`)**: The core companion interface.
    - **Live Balances**: Real-time view of all players.
    - **Smart Actions**: Contextual buttons (Pay/Charge).
    - **Bank Actions**: Dedicated interface for "Pass Go" or Taxes.
    - **History**: Transaction feed with Undo capability.

### 🛠️ Technical Highlights
- **Responsive Design**: Mobile-first UI with Material Design (Dark Mode).
- **Real-time Data**: Polling via React Query.
- **Secure Handling**: Auto-logout on 401.
- **Connectivity**: Configured for Local LAN access (CORS + Host binding).
