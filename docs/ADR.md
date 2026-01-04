# Architecture Decision Record (ADR)

## 1. Clean Architecture (Hexagonal)
**Decision**: The application is structured into `domain`, `application`, `infrastructure`, and `web` layers.
**Rationale**: 
- **Decoupling**: Business logic (Domain/App) is independent of frameworks (Axum) and databases (Postgres).
- **Testability**: Services can be unit-tested using checks/mocks of repositories.
- **Maintainability**: Clear separation of concerns makes it easier to navigate and update implementation details.

## 2. Axum Web Framework
**Decision**: Use `axum` as the HTTP web framework.
**Rationale**:
- **Ecosystem**: Built on top of `tokio` (standard async runtime) and `hyper` (fast HTTP).
- **Ergonomics**: Extractors (`State`, `Json`, `Path`) provide a type-safe and declarative way to handle requests.
- **Performance**: High performance and low overhead.

## 3. PostgreSQL & SQLx
**Decision**: Use PostgreSQL with `sqlx` (async, compile-time checked queries).
**Rationale**:
- **Compile-time Safety**: `sqlx` checks SQL syntax and types against the live database at compile time.
- **Async**: Native async support fits perfectly with Tokio/Axum.
- **Reliability**: Postgres is the industry standard for relational data.

## 4. Authentication (JWT + Argon2)
**Decision**: Use Argon2 for password hashing and JWT (JSON Web Tokens) for sessionless authentication.
**Rationale**:
- **Security**: Argon2 is the winner of the Password Hashing Competition (PHC) and resistant to GPU cracking.
- **Statelessness**: JWT allows scalability; the server doesn't need to store session state (though we track `last_logout_at` for invalidation).
- **Interoperability**: Standard protocol easily consumed by any frontend (Next.js/React).

## 5. Clean / "Undoable" Transactions
**Decision**: Transactions are immutable logs of money movement. Deletion is implemented as a "Reversal".
**Rationale**:
- **Auditability**: Instead of simply vanishing, we ensure the financial state is consistent.
- **UX**: Users expect "Undo" to restore their money, not just delete the history entry.

## 6. Short Game Codes
**Decision**: Use 4-character alphanumeric codes (e.g., "AB12") for joining.
**Rationale**:
- **UX**: UUIDs are too long to share verbally or type manually.
- **Implementation**: Generated via `rand` at creation, validated for uniqueness (via DB constraint).
