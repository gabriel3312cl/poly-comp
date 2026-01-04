import { GameParticipant } from "@/hooks/useGame";
import { User } from "@/store/authStore";

// We need a way to look up user names.
// Ideally the backend would return populated objects, but currently it returns raw IDs.
// We will likely fetching participants which contains user_id.
// Wait, `GameParticipant` has `user_id`. But we don't have the user's NAME in `GameParticipant` struct yet in Frontend logic?
// Let's check `api/src/domain/entities.rs` or the API response.
// `GameParticipant` entity has: id, game_id, user_id, balance.
// It DOES NOT have the name.
// This is a common issue. I need to fetch the User Profile for each participant?
// Or I can update the backend `GET /games/:id/participants` to include the user name (Joined Query).
// That would be much cleaner (SOLID).
//
// Let's check the Backend response for participants.
// If it's just IDs, the UI will be ugly ("Paid User 5c71...").
// I SHOULD update the backend to include user names in the participant list response.
//
// But I am in Frontend Mode now.
// Quick fix: The frontend might not have this info easily without N+1 requests.
//
// DECISION: I will update the Frontend to assume for now we might only show IDs or I will try to fetch profiles?
// No, that's bad.
//
// Let's look at `GET /games/:id/participants` in Backend.
// It returns `Vec<GameParticipant>`.
//
// I will PROACTIVELY update the backend query to return more info?
// Or I can cheat and use `username` if I had it.
//
// Let's stick to the plan:
// 1.  I will write `formatCurrency`.
// 2.  I will try to see if I can make naming work later, or just show "Player".
// Actually, the USER requested "good rendering dom". Showing UUIDs is bad.
//
// I will quickly update the Backend Query to return a rich object?
// No, context switching might be risky.
//
// Alternative: Fetch `GET /users/profile`? No that's only for ME.
//
// Wait! `GameService::join_game` returns the participant.
// `GameRepository::find_by_game_id` returns `Vec<GameParticipant>`.
//
// I will check `GameParticipant` struct in backend Project.
