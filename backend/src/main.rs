mod error;
mod models;
mod services;

use axum::{
    extract::{Path, Query, State},
    http::Method,
    routing::{get, post},
    Json, Router,
};
use error::AppError;
use models::game::{ScrapedMetadataResponse, SubmitGameRequest};
use serde::Deserialize;
use services::db::DbService;
use services::scraper::ScraperService;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub struct AppState {
    pub db: DbService,
    pub scraper: ScraperService,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db = DbService::new(PathBuf::from("games_data.json"));
    let scraper = ScraperService::new();

    let state = Arc::new(AppState { db, scraper });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/games", get(list_games))
        .route("/api/games/:id", get(get_game))
        .route("/api/games/scrape", post(scrape_url_preview))
        .route("/api/games/submit", post(submit_game))
        .route("/api/games/:id/view", post(increment_view))
        .route("/api/games/:id/like", post(increment_like))
        .layer(cors)
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
) -> Json<serde_json::Value> {
    let games = state.db.list_games(query.tag, query.search);
    Json(serde_json::json!({
        "count": games.len(),
        "games": games
    }))
}

async fn get_game(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let game = state.db.get_game(&id)?;
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
    )?;

    Ok(Json(serde_json::json!({
        "message": "Game submitted successfully",
        "game": game
    })))
}

async fn increment_view(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let game = state.db.increment_views(&id)?;
    Ok(Json(serde_json::json!({ "game": game })))
}

async fn increment_like(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let game = state.db.increment_likes(&id)?;
    Ok(Json(serde_json::json!({ "game": game })))
}
