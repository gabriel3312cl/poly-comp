use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
// use axum::extract::State;
use crate::state::AppState;
use crate::shared::auth::Auth;

pub struct AuthorizedUser {
    pub user_id: uuid::Uuid,
}

#[async_trait]
impl FromRequestParts<AppState> for AuthorizedUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .ok_or((StatusCode::UNAUTHORIZED, "Missing Authorization header".to_string()))?
            .to_str()
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid Authorization header".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err((StatusCode::UNAUTHORIZED, "Invalid Bearer token".to_string()));
        }

        let token = &auth_header[7..];

        let claims = Auth::verify_token(token, &state.config.jwt_secret)
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

        let user_id = uuid::Uuid::parse_str(&claims.sub)
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid user id in token".to_string()))?;

        // DB Check for Logout
        let user = state.user_service.get_user(user_id).await
            .map_err(|_| (StatusCode::UNAUTHORIZED, "User not found".to_string()))?;

        if let Some(logout_at) = user.last_logout_at {
             if (claims.iat as i64) < logout_at.unix_timestamp() {
                  return Err((StatusCode::UNAUTHORIZED, "Token invalidated by logout".to_string()));
             }
        }

        Ok(AuthorizedUser { user_id })
    }
}
