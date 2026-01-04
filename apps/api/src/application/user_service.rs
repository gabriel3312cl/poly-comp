use std::sync::Arc;
use uuid::Uuid;
use crate::domain::{
    entities::User,
    repositories::UserRepository,
};

pub struct UserService {
    user_repo: Arc<dyn UserRepository + Send + Sync>,
}

impl UserService {
    pub fn new(user_repo: Arc<dyn UserRepository + Send + Sync>) -> Self {
        Self { user_repo }
    }

    pub async fn register(&self, username: String, password: String, first_name: String, last_name: String) -> Result<User, anyhow::Error> {
        // Check if user exists
        if let Some(_) = self.user_repo.find_by_username(&username).await? {
            return Err(anyhow::anyhow!("Username already exists"));
        }

        // Hash Logic
        let salt = argon2::password_hash::SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
        let argon2 = argon2::Argon2::default();
        let password_hash = argon2::PasswordHasher::hash_password(&argon2, password.as_bytes(), &salt)
            .map_err(|e| anyhow::anyhow!("Hashing error: {}", e))?
            .to_string();

        let user = User {
            id: Uuid::new_v4(),
            username,
            first_name,
            last_name,
            password_hash,
            created_at: None, // Let DB handle default
            last_logout_at: None,
        };

        self.user_repo.create(user).await
    }

    pub async fn login(&self, username: String, password: String) -> Result<User, anyhow::Error> {
        let user = self.user_repo.find_by_username(&username).await?
            .ok_or_else(|| anyhow::anyhow!("User not found"))?;
        
        let parsed_hash = argon2::PasswordHash::new(&user.password_hash)
            .map_err(|e| anyhow::anyhow!("Invalid hash format: {}", e))?;
        
        argon2::PasswordVerifier::verify_password(&argon2::Argon2::default(), password.as_bytes(), &parsed_hash)
             .map_err(|_| anyhow::anyhow!("Invalid password"))?;

        Ok(user)
    }

    pub async fn logout(&self, user_id: Uuid) -> Result<(), anyhow::Error> {
        let now = time::OffsetDateTime::now_utc();
        self.user_repo.update_last_logout(user_id, now).await
    }

    pub async fn get_user(&self, id: Uuid) -> Result<User, anyhow::Error> {
        self.user_repo.find_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("User not found"))
    }

    pub async fn update_profile(&self, id: Uuid, first_name: String, last_name: String) -> Result<User, anyhow::Error> {
        let mut user = self.get_user(id).await?;
        user.first_name = first_name;
        user.last_name = last_name;
        self.user_repo.update(user).await
    }

    pub async fn delete_account(&self, id: Uuid) -> Result<(), anyhow::Error> {
        self.user_repo.delete(id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::MockUserRepository;
    use mockall::predicate::*;

    #[tokio::test]
    async fn test_register_success() {
        let mut mock_repo = MockUserRepository::new();

        // Expect find_by_username to return None (user doesn't exist)
        mock_repo.expect_find_by_username()
            .with(eq("testuser"))
            .times(1)
            .returning(|_| Ok(None));

        // Expect create to be called
        mock_repo.expect_create()
            .times(1)
            .returning(|u| Ok(u));

        let service = UserService::new(Arc::new(mock_repo));
        let result = service.register("testuser".to_string(), "pass123".to_string(), "Test".to_string(), "User".to_string()).await;

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "testuser");
    }

    #[tokio::test]
    async fn test_logout() {
        let mut mock_repo = MockUserRepository::new();
        mock_repo.expect_update_last_logout()
            .times(1)
            .returning(|_, _| Ok(())); // Expect it to be called

        let service = UserService::new(Arc::new(mock_repo));
        let result = service.logout(Uuid::new_v4()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_update_profile() {
        let mut mock_repo = MockUserRepository::new();
        let uid = Uuid::new_v4();

        // Expect find_by_id for get_user
        mock_repo.expect_find_by_id()
             .with(eq(uid))
             .returning(move |_| Ok(Some(User { 
                 id: uid, 
                 username: "u".to_string(), 
                 first_name: "O".to_string(), 
                 last_name: "O".to_string(), 
                 created_at: None, 
                 last_logout_at: None,
                 password_hash: "hash".to_string() 
            })));

        // Expect update
        mock_repo.expect_update()
            .times(1)
            .returning(|u| Ok(u));

        let service = UserService::new(Arc::new(mock_repo));
        let result = service.update_profile(uid, "New".to_string(), "Name".to_string()).await;
        assert!(result.is_ok());
        let u = result.unwrap();
        assert_eq!(u.first_name, "New");
    }

    #[tokio::test]
    async fn test_register_duplicate_username() {
        let mut mock_repo = MockUserRepository::new();

        // Expect find_by_username to return Some (user exists)
        mock_repo.expect_find_by_username()
            .with(eq("existing"))
            .times(1)
            .returning(|_| Ok(Some(User {
                id: Uuid::new_v4(),
                username: "existing".to_string(),
                first_name: "A".to_string(),
                last_name: "B".to_string(),
                password_hash: "pass".to_string(),
                created_at: None,
                last_logout_at: None,
            })));

        let service = UserService::new(Arc::new(mock_repo));
        let result = service.register("existing".to_string(), "pass".to_string(), "Test".to_string(), "User".to_string()).await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "Username already exists");
    }
}
