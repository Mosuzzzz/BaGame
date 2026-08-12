use crate::error::AppError;
use axum::extract::multipart::Multipart;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub struct UploadResult {
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub creator_id: String,
    pub original_url: String, 
    pub embed_code: Option<String>,
    pub thumbnail_url: String, 
    pub manual_url: Option<String>, 
    pub website_url: Option<String>,
}

pub struct UploadService {
    base_dir: PathBuf,
}

impl UploadService {
    pub fn new() -> Self {
        let base_dir = PathBuf::from("public");
        fs::create_dir_all(base_dir.join("games")).unwrap();
        fs::create_dir_all(base_dir.join("covers")).unwrap();
        fs::create_dir_all(base_dir.join("manuals")).unwrap();

        Self { base_dir }
    }

    pub async fn process_multipart(
        &self,
        mut multipart: Multipart,
    ) -> Result<UploadResult, AppError> {
        let game_id = Uuid::new_v4().to_string();

        let mut title = None;
        let mut description = None;
        let mut tags_str = String::new();
        let mut creator_id = "community_guest".to_string();
        
        let mut original_url = String::new();
        let mut embed_code = None;
        let mut thumbnail_url = String::new();
        let mut manual_url = None;
        let mut website_url = None;

        while let Some(field) = multipart.next_field().await.unwrap() {
            let name = field.name().unwrap_or("").to_string();
            
            if name == "title" {
                title = Some(field.text().await.unwrap());
            } else if name == "description" {
                description = Some(field.text().await.unwrap());
            } else if name == "tags" {
                tags_str = field.text().await.unwrap();
            } else if name == "creator_id" {
                creator_id = field.text().await.unwrap();
            } else if name == "url" {
                original_url = field.text().await.unwrap();
            } else if name == "embed_code" {
                embed_code = Some(field.text().await.unwrap());
            } else if name == "website_url" {
                website_url = Some(field.text().await.unwrap());
            } else if name == "cover_image" {
                let file_name = field.file_name().unwrap_or("cover.png").to_string();
                let data = field.bytes().await.unwrap();
                let ext = Path::new(&file_name).extension().unwrap_or_default().to_str().unwrap_or("png");
                
                let cover_path = self.base_dir.join("covers").join(format!("{}.{}", game_id, ext));
                fs::write(&cover_path, &data).unwrap();
                thumbnail_url = format!("http://localhost:8000/public/covers/{}.{}", game_id, ext);
            } else if name == "manual_pdf" {
                let _file_name = field.file_name().unwrap_or("manual.pdf").to_string();
                let data = field.bytes().await.unwrap();
                
                let manual_path = self.base_dir.join("manuals").join(format!("{}.pdf", game_id));
                fs::write(&manual_path, &data).unwrap();
                manual_url = Some(format!("http://localhost:8000/public/manuals/{}.pdf", game_id));
            }
        }

        let tags: Vec<String> = tags_str.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();

        Ok(UploadResult {
            title,
            description,
            tags,
            creator_id,
            original_url,
            embed_code,
            thumbnail_url,
            manual_url,
            website_url,
        })
    }
}
