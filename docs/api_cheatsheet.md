# Monopoly Companion API - Curl Cheat Sheet

Reliable commands to test the API.
**Base URL**: `http://localhost:3000`

## 1. Authentication & Users

### Register a new User
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "monopoly_king",
    "password": "securePassword123",
    "first_name": "Mr",
    "last_name": "Monopoly"
  }'
```

### Login (Get Token)
*Copy the `token` from the response for subsequent requests.*
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "monopoly_king",
    "password": "securePassword123"
  }'
```

**Export Token (PowerShell)**:
```powershell
$env:TOKEN="<PASTE_YOUR_TOKEN_HERE>"
```
**Export Token (Bash)**:
```bash
export TOKEN="<PASTE_YOUR_TOKEN_HERE>"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $env:TOKEN" \
  -d '{
    "first_name": "Rich",
    "last_name": "Uncle"
  }'
```

### Get Current User Profile
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer $env:TOKEN"
```

### Logout
```bash
curl -X POST http://localhost:3000/users/logout \
  -H "Authorization: Bearer $env:TOKEN"
```

### Delete Account
```bash
curl -X DELETE http://localhost:3000/users/profile \
  -H "Authorization: Bearer $env:TOKEN"
```

---

## 2. Game Management

### Create Game
```bash
curl -X POST http://localhost:3000/games \
  -H "Authorization: Bearer $env:TOKEN"
```
*Response will contain `id` (Game ID).*

**Export Game ID**:
```powershell
$env:GAME_ID="<PASTE_GAME_ID>"
```

### Get Game Details
```bash
curl -X GET http://localhost:3000/games/$env:GAME_ID \
  -H "Authorization: Bearer $env:TOKEN"
```

### Update Game (Name/Status)
```bash
curl -X PUT http://localhost:3000/games/$env:GAME_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $env:TOKEN" \
  -d '{
    "name": "Friday Night Comp",
    "status": "ACTIVE"
  }'
```

### Delete Game
```bash
curl -X DELETE http://localhost:3000/games/$env:GAME_ID \
  -H "Authorization: Bearer $env:TOKEN"
```

---

## 3. Participation

### Join Game
```bash
curl -X POST http://localhost:3000/games/$env:GAME_ID/join \
  -H "Authorization: Bearer $env:TOKEN"
```

### List Participants (Check Balances)
```bash
curl -X GET http://localhost:3000/games/$env:GAME_ID/participants \
  -H "Authorization: Bearer $env:TOKEN"
```

### Leave Game
```bash
curl -X POST http://localhost:3000/games/$env:GAME_ID/leave \
  -H "Authorization: Bearer $env:TOKEN"
```

---

## 4. Transactions (Money)

### Perform Transfer (Pay Rent / Pass Go)
*Need `to_participant_id` (Receiver) or `from_participant_id` (Sender). Use specific UUIDs obtained from "List Participants".*
*To pay Bank: Omit `to_participant_id`.*
*Receive from Bank: Omit `from_participant_id`.*

```bash
# Example: Player A pays Player B (Rent)
curl -X POST http://localhost:3000/games/$env:GAME_ID/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $env:TOKEN" \
  -d '{
    "amount": 200,
    "description": "Rent for Boardwalk",
    "from_participant_id": "<SENDER_PARTICIPANT_UUID>",
    "to_participant_id": "<RECEIVER_PARTICIPANT_UUID>"
  }'
```

### Get Transaction History
```bash
curl -X GET http://localhost:3000/games/$env:GAME_ID/transactions \
  -H "Authorization: Bearer $env:TOKEN"
```

### Delete Transaction
```bash
curl -X DELETE http://localhost:3000/games/$env:GAME_ID/transactions/<TRANSACTION_ID> \
  -H "Authorization: Bearer $env:TOKEN"
```
