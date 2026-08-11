use crate::error::AppError;
use crate::models::game::{DisplayMode, GameDocument, GameMetrics};
use chrono::Utc;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use uuid::Uuid;

#[derive(Clone)]
pub struct DbService {
    store: Arc<RwLock<HashMap<String, GameDocument>>>,
    file_path: PathBuf,
}

impl DbService {
    pub fn new(file_path: PathBuf) -> Self {
        let db = Self {
            store: Arc::new(RwLock::new(HashMap::new())),
            file_path,
        };

        db.load_or_seed();
        db
    }

    fn load_or_seed(&self) {
        if self.file_path.exists() {
            if let Ok(content) = fs::read_to_string(&self.file_path) {
                if let Ok(games) = serde_json::from_str::<Vec<GameDocument>>(&content) {
                    let mut lock = self.store.write().unwrap();
                    for g in games {
                        lock.insert(g.id.clone(), g);
                    }
                    tracing::info!("Loaded {} games from database file", lock.len());
                    return;
                }
            }
        }

        // Default Seed Games
        let seeds = vec![
            GameDocument {
                id: "seed-2048".to_string(),
                title: "2048 Web Edition".to_string(),
                description: "Join the numbers and get to the 2048 tile! Addictive mathematical puzzle game.".to_string(),
                original_url: "https://play2048.co/".to_string(),
                embed_code: Some(r#"<iframe src="https://play2048.co/"></iframe>"#.to_string()),
                thumbnail_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80".to_string(),
                creator_id: "system_admin".to_string(),
                display_mode: DisplayMode::Embedded,
                metrics: GameMetrics { views: 1420, likes: 312, rating: 4.8 },
                tags: vec!["puzzle".to_string(), "math".to_string(), "casual".to_string(), "html5".to_string()],
                created_at: Utc::now().to_rfc3339(),
            },
            GameDocument {
                id: "seed-hextris".to_string(),
                title: "Hextris HTML5".to_string(),
                description: "Fast-paced puzzle game inspired by Tetris played on a rotating hexagon grid.".to_string(),
                original_url: "https://hextris.io/".to_string(),
                embed_code: Some(r#"<iframe src="https://hextris.io/"></iframe>"#.to_string()),
                thumbnail_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80".to_string(),
                creator_id: "system_admin".to_string(),
                display_mode: DisplayMode::Embedded,
                metrics: GameMetrics { views: 2890, likes: 540, rating: 4.9 },
                tags: vec!["arcade".to_string(), "action".to_string(), "webgl".to_string(), "puzzle".to_string()],
                created_at: Utc::now().to_rfc3339(),
            },
            GameDocument {
                id: "seed-itch-demo".to_string(),
                title: "Cyber Samurai Arcade".to_string(),
                description: "Futuristic neon slice-and-dice runner. Demo link showcasing external frame detection.".to_string(),
                original_url: "https://itch.io/".to_string(),
                embed_code: Some(r#"<iframe src="https://itch.io/"></iframe>"#.to_string()),
                thumbnail_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80".to_string(),
                creator_id: "community_user_42".to_string(),
                display_mode: DisplayMode::Popup,
                metrics: GameMetrics { views: 850, likes: 198, rating: 4.5 },
                tags: vec!["cyberpunk".to_string(), "itch-io".to_string(), "action".to_string()],
                created_at: Utc::now().to_rfc3339(),
            },
        ];

        let mut lock = self.store.write().unwrap();
        for g in seeds {
            lock.insert(g.id.clone(), g);
        }
        drop(lock);
        let _ = self.save_to_disk();
    }

    fn save_to_disk(&self) -> Result<(), AppError> {
        let lock = self.store.read().unwrap();
        let games: Vec<GameDocument> = lock.values().cloned().collect();
        let json_data = serde_json::to_string_pretty(&games)
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        fs::write(&self.file_path, json_data)
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        Ok(())
    }

    pub fn list_games(&self, tag: Option<String>, search: Option<String>) -> Vec<GameDocument> {
        let lock = self.store.read().unwrap();
        let mut result: Vec<GameDocument> = lock.values().cloned().collect();

        if let Some(t) = tag {
            let tag_lower = t.to_lowercase();
            result.retain(|g| g.tags.iter().any(|gt| gt.to_lowercase() == tag_lower));
        }

        if let Some(q) = search {
            let q_lower = q.to_lowercase();
            result.retain(|g| {
                g.title.to_lowercase().contains(&q_lower)
                    || g.description.to_lowercase().contains(&q_lower)
            });
        }

        // Sort newest first
        result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        result
    }

    pub fn get_game(&self, id: &str) -> Result<GameDocument, AppError> {
        let lock = self.store.read().unwrap();
        lock.get(id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("Game with id '{}' not found", id)))
    }

    pub fn insert_game(
        &self,
        title: String,
        description: String,
        original_url: String,
        embed_code: Option<String>,
        thumbnail_url: String,
        creator_id: String,
        display_mode: DisplayMode,
        tags: Vec<String>,
    ) -> Result<GameDocument, AppError> {
        let game = GameDocument {
            id: Uuid::new_v4().to_string(),
            title,
            description,
            original_url,
            embed_code,
            thumbnail_url,
            creator_id,
            display_mode,
            metrics: GameMetrics::default(),
            tags,
            created_at: Utc::now().to_rfc3339(),
        };

        {
            let mut lock = self.store.write().unwrap();
            lock.insert(game.id.clone(), game.clone());
        }

        let _ = self.save_to_disk();
        Ok(game)
    }

    pub fn increment_views(&self, id: &str) -> Result<GameDocument, AppError> {
        let mut lock = self.store.write().unwrap();
        if let Some(game) = lock.get_mut(id) {
            game.metrics.views += 1;
            let updated = game.clone();
            drop(lock);
            let _ = self.save_to_disk();
            Ok(updated)
        } else {
            Err(AppError::NotFound(format!("Game '{}' not found", id)))
        }
    }

    pub fn increment_likes(&self, id: &str) -> Result<GameDocument, AppError> {
        let mut lock = self.store.write().unwrap();
        if let Some(game) = lock.get_mut(id) {
            game.metrics.likes += 1;
            let updated = game.clone();
            drop(lock);
            let _ = self.save_to_disk();
            Ok(updated)
        } else {
            Err(AppError::NotFound(format!("Game '{}' not found", id)))
        }
    }
}
