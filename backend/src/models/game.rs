use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DisplayMode {
    Embedded,
    Popup,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMetrics {
    pub views: u64,
    pub likes: u64,
    pub rating: f32,
}

impl Default for GameMetrics {
    fn default() -> Self {
        Self {
            views: 0,
            likes: 0,
            rating: 5.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameDocument {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(default, alias = "url")]
    pub original_url: String,
    #[serde(default)]
    pub embed_code: Option<String>,
    pub thumbnail_url: String,
    pub creator_id: String,
    pub display_mode: DisplayMode,
    pub metrics: GameMetrics,
    pub tags: Vec<String>,
    pub created_at: String,
    #[serde(default)]
    pub manual_url: Option<String>,
    #[serde(default)]
    pub website_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SubmitGameRequest {
    pub url: String,
    pub embed_code: Option<String>,
    pub creator_id: Option<String>,
    pub custom_title: Option<String>,
    pub custom_description: Option<String>,
    pub custom_tags: Option<Vec<String>>,
    pub custom_thumbnail_url: Option<String>,
    pub manual_url: Option<String>,
    pub website_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EditGameRequest {
    pub custom_title: Option<String>,
    pub custom_description: Option<String>,
    pub url: Option<String>,
    pub embed_code: Option<String>,
    pub custom_tags: Option<Vec<String>>,
    pub custom_thumbnail_url: Option<String>,
    pub manual_url: Option<String>,
    pub website_url: Option<String>,
}
#[derive(Debug, Serialize)]
pub struct ScrapedMetadataResponse {
    pub title: String,
    pub description: String,
    pub thumbnail_url: String,
    pub display_mode: DisplayMode,
    pub original_url: String,
    pub tags: Vec<String>,
}
