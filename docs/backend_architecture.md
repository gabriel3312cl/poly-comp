# Monopoly Companion App - Backend Walkthrough

## 🏗️ Project Structure
We organized the code using **Clean Architecture**. Think of it like a house with different separate rooms, where each room has a specific purpose. This makes the code easier to maintain and test.

### 📂 `apps/api/src/`
This is where all the source code lives.

-   **`main.rs`**: This is the front door. It starts the server, connects to the database, and wires everything together.
-   **`config.rs`**: The instruction manual. It reads settings from the `.env` file (like database password).
-   **`state.rs`**: The backpack. It holds shared tools (database connections, services) that every request might need.

### 🧠 `domain/` (The Rules)
This folder defines *what* our app is about, without worrying about databases or web servers.
-   **`entities.rs`**: The characters. Defines what a **User**, **Game**, or **Transaction** looks like (e.g., a User has a username and ID).
-   **`repositories.rs`**: The contracts. It says "We need a way to save a user", but doesn't say *how* (SQL? File?). It's just an interface.

### 🏗️ `infrastructure/` (The Tools)
This folder implements the "how".
-   **`postgres/`**: The implementation. It contains the actual code to talk to the PostgreSQL database using SQL commands. It fulfills the contracts from `domain`.

### ⚙️ `application/` (The Manager)
This layer coordinates the work. It contains the **Services** (Business Logic).
-   **`user_service.rs`**: Handles user logic (e.g., "Register a user"). It checks if the username exists, then asks the repository to save it.
-   **`game_service.rs`**: Handles game logic (e.g., "Create game", "Join game").
-   **`transaction_service.rs`**: Handles money transfers.

### 🌐 `web/` (The counter)
This handles the HTTP requests from the outside world (Frontend).
-   **`handlers/`**: The receptionists. They receive a request (JSON), call the appropriate **Service**, and return a response (JSON).
-   **`extractors.rs`**: The security guards. They check connection tokens (JWT) to make sure the user is allowed to enter.

---

## 🔌 API Endpoints
Here is how the Frontend will talk to the Backend.

### 1. Register User
Create a new user account.
-   **URL**: `POST /users/register`
-   **Request Body**:
    ```json
    {
      "username": "monopoly_king",
      "first_name": "Mr.",
      "last_name": "Monopoly"
    }
    ```
-   **Response** (201 Created): User Object

### 2. Login
Log in to get an access token.
-   **URL**: `POST /users/login`
-   **Request Body**: `{"username": "..."}`
-   **Response** (200 OK): `{"token": "..."}`

### 3. Logout
Invalidate all tokens issued before now.
-   **URL**: `POST /users/logout`
-   **Headers**: `Authorization: Bearer <token>`
-   **Response** (200 OK)

### 4. User Profile
Update or Delete your account.
-   **Update URL**: `PUT /users/profile`
    -   **Body**: `{"first_name": "New", "last_name": "Name"}`
-   **Delete URL**: `DELETE /users/profile`
-   **Headers**: `Authorization: Bearer <token>`

### 5. Create Game
Start a new game session.
-   **URL**: `POST /games`
-   **Headers**: `Authorization: Bearer <token>`
-   **Response** (201 Created): Game Object (Status: WAITING)

### 6. Manage Game
Update or Delete a game (Host only).
-   **Update URL**: `PUT /games/:id`
    -   **Body**: `{"name": "New Name", "status": "ACTIVE"}`
-   **Delete URL**: `DELETE /games/:id`
-   **Headers**: `Authorization: Bearer <token>`

### 7. Join/Leave Game
-   **Join URL**: `POST /games/:id/join`
-   **Leave URL**: `POST /games/:id/leave`
-   **Headers**: `Authorization: Bearer <token>`

### 8. Transactions
Record or Delete financial movements.
-   **Create URL**: `POST /games/:id/transactions`
    -   **Body**: `{"amount": 100, "from_participant_id": "...", "to_participant_id": "..."}`
-   **Delete URL**: `DELETE /games/:id/transactions/:tx_id`
-   **Headers**: `Authorization: Bearer <token>`
