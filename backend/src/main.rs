mod error;
mod models;
mod services;

use axum::{
    extract::{Multipart, Path, Query, State, DefaultBodyLimit},
    http::Method,
    routing::{get, post, delete},
    Json, Router,
};
use error::AppError;
use models::game::{DisplayMode, ScrapedMetadataResponse, SubmitGameRequest};
use serde::Deserialize;
use services::db::DbService;
use services::scraper::ScraperService;
use services::upload::UploadService;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use base64::Engine;

pub struct AppState {
    pub db: DbService,
    pub scraper: ScraperService,
    pub upload: UploadService,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();
        
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/bagame".to_string());

    let db = DbService::new(&database_url).await;
    let scraper = ScraperService::new();
    let upload = UploadService::new();

    let state = Arc::new(AppState { db, scraper, upload });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/games", get(list_games))
        .route("/api/games/:id", get(get_game))
        .route("/api/games/scrape", post(scrape_url_preview))
        .route("/api/games/submit", post(submit_game))
        .route("/api/games/upload", post(upload_game))
        .route("/api/games/:id", delete(delete_game))
        .route("/api/games/:id/view", post(increment_view))
        .route("/api/games/:id/like", post(increment_like))
        .nest_service("/public", ServeDir::new("public"))
        .layer(cors)
        .layer(DefaultBodyLimit::max(1024 * 1024 * 100)) // 100 MB body size limit
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    tracing::info!("🎮 Web Game Aggregator Backend running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "service": "Web Game Aggregator Backend",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

#[derive(Deserialize)]
struct ListQuery {
    tag: Option<String>,
    search: Option<String>,
}

async fn list_games(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let games = state.db.list_games(query.tag, query.search).await?;
    Ok(Json(serde_json::json!({
        "count": games.len(),
        "games": games
    })))
}

async fn get_game(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let game = state.db.get_game(&id).await?;
    Ok(Json(serde_json::json!({ "game": game })))
}

async fn scrape_url_preview(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SubmitGameRequest>,
) -> Result<Json<ScrapedMetadataResponse>, AppError> {
    let scraped = state.scraper.scrape(&payload.url).await?;

    Ok(Json(ScrapedMetadataResponse {
        title: scraped.title,
        description: scraped.description,
        thumbnail_url: scraped.thumbnail_url,
        display_mode: scraped.display_mode,
        original_url: payload.url,
        tags: scraped.tags,
    }))
}

async fn submit_game(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SubmitGameRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let url = payload.url.trim();
    if url.is_empty() {
        return Err(AppError::InvalidUrl("URL cannot be empty".to_string()));
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(AppError::InvalidUrl("URL must start with http:// or https://".to_string()));
    }
    if url.contains("itch.io") && !url.contains("itch.io/embed") && !url.contains("itch.io/html") {
        return Err(AppError::InvalidUrl("สำหรับ itch.io โปรดใช้ Embed URL (เช่น https://itch.io/embed-upload/...) หรือโค้ด iframe แทนหน้าเกมปกติ".to_string()));
    }

    if let Some(embed) = &payload.embed_code {
        let embed_trim = embed.trim();
        if embed_trim.starts_with("<iframe") {
            if !embed_trim.contains("src=\"") && !embed_trim.contains("src='") {
                return Err(AppError::InvalidUrl("ไม่สามารถดึง URL จากโค้ด iframe ได้ กรุณาตรวจสอบว่ามี src attribute".to_string()));
            }
        }
    }

    let scraped = state.scraper.scrape(&payload.url).await?;

    let title = payload.custom_title.unwrap_or(scraped.title);
    let description = payload.custom_description.unwrap_or(scraped.description);
    let tags = payload.custom_tags.unwrap_or(scraped.tags);
    let creator_id = payload.creator_id.unwrap_or_else(|| "community_guest".to_string());

    let game = state.db.insert_game(
        title,
        description,
        payload.url,
        payload.embed_code,
        scraped.thumbnail_url,
        creator_id,
        scraped.display_mode,
        tags,
        None,
        None, // website_url
    ).await?;

    Ok(Json(serde_json::json!({
        "message": "Game submitted successfully",
        "game": game
    })))
}

async fn increment_view(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let game = state.db.increment_views(&id).await?;
    Ok(Json(serde_json::json!({ "game": game })))
}

async fn increment_like(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let game = state.db.increment_likes(&id).await?;
    Ok(Json(serde_json::json!({ "game": game })))
}

async fn upload_game(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    let auth = headers.get("Authorization").and_then(|v| v.to_str().ok());
    if auth.is_none() || !auth.unwrap().starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Missing or invalid authorization token".to_string()));
    }
    
    let token = auth.unwrap().trim_start_matches("Bearer ");
    let username = get_username_from_token(token).ok_or_else(|| {
        AppError::Unauthorized("Invalid token payload".to_string())
    })?;

    let mut upload_res = state.upload.process_multipart(multipart).await?;
    // Override creator_id to match the authenticated user
    upload_res.creator_id = username;

    let url = upload_res.original_url.trim();
    if url.is_empty() {
        return Err(AppError::InvalidUrl("URL cannot be empty".to_string()));
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(AppError::InvalidUrl("URL must start with http:// or https://".to_string()));
    }
    if url.contains("itch.io") && !url.contains("itch.io/embed") && !url.contains("itch.io/html") {
        return Err(AppError::InvalidUrl("สำหรับ itch.io โปรดใช้ Embed URL (เช่น https://itch.io/embed-upload/...) หรือโค้ด iframe แทนหน้าเกมปกติ".to_string()));
    }

    if let Some(embed) = &upload_res.embed_code {
        let embed_trim = embed.trim();
        if embed_trim.starts_with("<iframe") {
            if !embed_trim.contains("src=\"") && !embed_trim.contains("src='") {
                return Err(AppError::InvalidUrl("ไม่สามารถดึง URL จากโค้ด iframe ได้ กรุณาตรวจสอบว่ามี src attribute".to_string()));
            }
        }
    }

    let game = state.db.insert_game(
        upload_res.title.unwrap_or_else(|| "Uploaded Game".to_string()),
        upload_res.description.unwrap_or_else(|| "No description provided.".to_string()),
        upload_res.original_url,
        upload_res.embed_code,
        upload_res.thumbnail_url,
        upload_res.creator_id,
        DisplayMode::Embedded,
        upload_res.tags,
        upload_res.manual_url,
        upload_res.website_url,
    ).await?;

    Ok(Json(serde_json::json!({
        "message": "Game uploaded successfully",
        "game": game
    })))
}

async fn delete_game(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let auth = headers.get("Authorization").and_then(|v| v.to_str().ok());
    if auth.is_none() || !auth.unwrap().starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Missing or invalid authorization token".to_string()));
    }
    
    let token = auth.unwrap().trim_start_matches("Bearer ");
    let username = get_username_from_token(token).ok_or_else(|| {
        AppError::Unauthorized("Invalid token payload".to_string())
    })?;

    let game = state.db.get_game(&id).await?;
    if game.creator_id != username && username != "Admin" { // Simple admin check if needed
        return Err(AppError::Unauthorized("You do not have permission to delete this game".to_string()));
    }

    let game = state.db.delete_game(&id).await?;
    Ok(Json(serde_json::json!({
        "message": "Game deleted successfully",
        "game": game
    })))
}

fn get_username_from_token(token: &str) -> Option<String> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    
    let payload = parts[1];
    let decoded = base64::engine::general_purpose::URL_SAFE_NO_PAD.decode(payload.as_bytes()).ok().or_else(|| {
        base64::engine::general_purpose::URL_SAFE.decode(payload.as_bytes()).ok()
    })?;
    
    let json: serde_json::Value = serde_json::from_slice(&decoded).ok()?;
    json.get("name").and_then(|v| v.as_str()).map(|s| s.to_string())
}
