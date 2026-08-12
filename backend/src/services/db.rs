use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::time::Duration;
use crate::error::AppError;
use crate::models::game::{DisplayMode, GameDocument, GameMetrics};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Clone)]
pub struct DbService {
    pool: PgPool,
}

impl DbService {
    pub async fn new(database_url: &str) -> Self {
        let pool = loop {
            match PgPoolOptions::new()
                .max_connections(5)
                .acquire_timeout(Duration::from_secs(3))
                .connect(database_url)
                .await
            {
                Ok(p) => {
                    tracing::info!("Connected to PostgreSQL successfully");
                    break p;
                }
                Err(e) => {
                    tracing::warn!("Failed to connect to DB, retrying in 2s... ({})", e);
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        };

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS games (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                original_url TEXT NOT NULL,
                embed_code TEXT,
                thumbnail_url TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                display_mode TEXT NOT NULL,
                tags TEXT[] NOT NULL,
                views BIGINT NOT NULL DEFAULT 0,
                likes BIGINT NOT NULL DEFAULT 0,
                rating REAL NOT NULL DEFAULT 5.0,
                manual_url TEXT,
                website_url TEXT,
                created_at TIMESTAMPTZ NOT NULL
            )
            "#
        )
        .execute(&pool)
        .await
        .expect("Failed to create games table");

        Self { pool }
    }

    fn map_row(row: sqlx::postgres::PgRow) -> GameDocument {
        let display_mode_str: String = row.get("display_mode");
        let display_mode = if display_mode_str == "Popup" {
            DisplayMode::Popup
        } else {
            DisplayMode::Embedded
        };

        let created_at_dt: DateTime<Utc> = row.get("created_at");

        GameDocument {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            original_url: row.get("original_url"),
            embed_code: row.get("embed_code"),
            thumbnail_url: row.get("thumbnail_url"),
            creator_id: row.get("creator_id"),
            display_mode,
            metrics: GameMetrics {
                views: row.get::<i64, _>("views") as u64,
                likes: row.get::<i64, _>("likes") as u64,
                rating: row.get("rating"),
            },
            tags: row.get("tags"),
            created_at: created_at_dt.to_rfc3339(),
            manual_url: row.get("manual_url"),
            website_url: row.get("website_url"),
        }
    }

    pub async fn list_games(&self, tag: Option<String>, search: Option<String>) -> Result<Vec<GameDocument>, AppError> {
        let mut qb = sqlx::QueryBuilder::new("SELECT * FROM games WHERE 1=1");

        if let Some(t) = tag {
            qb.push(" AND '");
            qb.push(t.to_lowercase());
            qb.push("' = ANY(SELECT LOWER(unnest(tags)))"); 
        }

        if let Some(s) = search {
            let search_term = format!("%{}%", s.to_lowercase());
            qb.push(" AND (LOWER(title) LIKE ");
            qb.push_bind(search_term.clone());
            qb.push(" OR LOWER(description) LIKE ");
            qb.push_bind(search_term);
            qb.push(")");
        }

        qb.push(" ORDER BY created_at DESC");

        let rows = qb.build().fetch_all(&self.pool).await.map_err(|e| AppError::DatabaseError(e.to_string()))?;
        
        let games = rows.into_iter().map(Self::map_row).collect();
        Ok(games)
    }

    pub async fn get_game(&self, id: &str) -> Result<GameDocument, AppError> {
        let row = sqlx::query("SELECT * FROM games WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        match row {
            Some(r) => Ok(Self::map_row(r)),
            None => Err(AppError::NotFound(format!("Game with id '{}' not found", id))),
        }
    }

    pub async fn insert_game(
        &self,
        title: String,
        description: String,
        original_url: String,
        embed_code: Option<String>,
        thumbnail_url: String,
        creator_id: String,
        display_mode: DisplayMode,
        tags: Vec<String>,
        manual_url: Option<String>,
        website_url: Option<String>,
    ) -> Result<GameDocument, AppError> {
        let id = Uuid::new_v4().to_string();
        let display_mode_str = match display_mode {
            DisplayMode::Embedded => "Embedded",
            DisplayMode::Popup => "Popup",
        };
        let created_at = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO games (
                id, title, description, original_url, embed_code, thumbnail_url,
                creator_id, display_mode, tags, views, likes, rating, manual_url, website_url, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            "#
        )
        .bind(&id)
        .bind(title)
        .bind(description)
        .bind(original_url)
        .bind(embed_code)
        .bind(thumbnail_url)
        .bind(creator_id)
        .bind(display_mode_str)
        .bind(&tags)
        .bind(0_i64)
        .bind(0_i64)
        .bind(5.0_f32)
        .bind(manual_url)
        .bind(website_url)
        .bind(created_at)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        self.get_game(&id).await
    }

    pub async fn delete_game(&self, id: &str) -> Result<GameDocument, AppError> {
        let game = self.get_game(id).await?;

        sqlx::query("DELETE FROM games WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        let game_dir = std::path::Path::new("public/games").join(id);
        if game_dir.exists() {
            let _ = std::fs::remove_dir_all(game_dir);
        }

        Ok(game)
    }

    pub async fn increment_views(&self, id: &str) -> Result<GameDocument, AppError> {
        sqlx::query("UPDATE games SET views = views + 1 WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        self.get_game(id).await
    }

    pub async fn increment_likes(&self, id: &str) -> Result<GameDocument, AppError> {
        sqlx::query("UPDATE games SET likes = likes + 1 WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        self.get_game(id).await
    }
}
