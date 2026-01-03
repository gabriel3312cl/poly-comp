use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use time::OffsetDateTime;
use crate::config::Config;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub exp: usize,
    pub iat: usize,
}

pub struct Auth;

impl Auth {
    pub fn generate_token(user_id: Uuid, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
        let now = OffsetDateTime::now_utc();
        let expiration = now + time::Duration::hours(24);
        let claims = Claims {
            sub: user_id.to_string(),
            exp: expiration.unix_timestamp() as usize,
            iat: now.unix_timestamp() as usize,
        };

        encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
    }

    pub fn verify_token(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        )?;
        Ok(token_data.claims)
    }
}
