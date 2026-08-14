use crate::error::AppError;
use crate::models::game::DisplayMode;
use reqwest::header::HeaderMap;
use reqwest::Client;
use scraper::{Html, Selector};
use std::time::Duration;
use url::Url;
use std::net::{IpAddr, SocketAddr};
use tokio::net::lookup_host;

pub struct ScraperService {}

#[derive(Debug)]
pub struct ScrapedInfo {
    pub title: String,
    pub description: String,
    pub thumbnail_url: String,
    pub display_mode: DisplayMode,
    pub tags: Vec<String>,
}

const BLOCKED_KEYWORDS: &[&str] = &[
    "casino", "slot", "baccarat", "pgslot", "pg-slot", "bet", "gambling", "poker", "hilo",
    "ufabet", "777", "888", "vipbet", "bk8", "w88", "fun88", "m88", "sa gaming",
    "porn", "xxx", "adult", "hentai", "nsfw", "sex", "erotic", "xvideos", "pornhub", "xnxx",
];

impl ScraperService {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn validate_url(&self, raw_url: &str) -> Result<(Url, SocketAddr), AppError> {
        let parsed = Url::parse(raw_url)
            .map_err(|e| AppError::InvalidUrl(format!("รูปแบบ URL ไม่ถูกต้อง: {}", e)))?;

        if parsed.scheme() != "http" && parsed.scheme() != "https" {
            return Err(AppError::InvalidUrl(
                "รองรับเฉพาะโปรโตคอล HTTP และ HTTPS เท่านั้น".to_string(),
            ));
        }

        let lower_url = raw_url.to_lowercase();
        for kw in BLOCKED_KEYWORDS {
            if lower_url.contains(kw) {
                return Err(AppError::InvalidUrl(format!(
                    "⚠️ ระบบปฏิเสธ URL นี้: ตรวจพบคำต้องห้าม '{}' (ไม่อนุญาตเว็บพนันหรือสื่อไม่เหมาะสม)",
                    kw
                )));
            }
        }

        let host = parsed.host_str().ok_or_else(|| AppError::InvalidUrl("Missing host".to_string()))?;
        let port = parsed.port_or_known_default().unwrap_or(if parsed.scheme() == "https" { 443 } else { 80 });

        let addr_str = format!("{}:{}", host, port);
        let mut addrs = lookup_host(&addr_str).await.map_err(|_| AppError::InvalidUrl("DNS resolution failed".to_string()))?;

        let mut valid_addr: Option<SocketAddr> = None;
        while let Some(addr) = addrs.next() {
            let ip = addr.ip();
            if ip.is_loopback() || ip.is_unspecified() || ip.is_multicast() {
                continue;
            }
            match ip {
                IpAddr::V4(ipv4) => {
                    if ipv4.is_private() || ipv4.is_link_local() || ipv4.is_broadcast() || ipv4.is_documentation() {
                        continue;
                    }
                }
                IpAddr::V6(ipv6) => {
                    // Reject all IPv6 for simplicity in SSRF protection, or add complex checks
                    continue; 
                }
            }
            valid_addr = Some(addr);
            break;
        }

        let safe_addr = valid_addr.ok_or_else(|| AppError::InvalidUrl("Host resolves to restricted or invalid IP".to_string()))?;

        Ok((parsed, safe_addr))
    }

    pub fn check_embeddability(&self, headers: &HeaderMap) -> DisplayMode {
        if let Some(x_frame) = headers.get("x-frame-options") {
            if let Ok(val) = x_frame.to_str() {
                let upper = val.to_uppercase();
                if upper.contains("DENY") || upper.contains("SAMEORIGIN") {
                    return DisplayMode::Popup;
                }
            }
        }

        if let Some(csp) = headers.get("content-security-policy") {
            if let Ok(val) = csp.to_str() {
                let lower = val.to_lowercase();
                if lower.contains("frame-ancestors 'none'")
                    || lower.contains("frame-ancestors 'self'")
                {
                    return DisplayMode::Popup;
                }
            }
        }

        DisplayMode::Embedded
    }

    pub async fn scrape(&self, target_url: &str) -> Result<ScrapedInfo, AppError> {
        let (parsed_url, safe_addr) = self.validate_url(target_url).await?;
        let host = parsed_url.host_str().unwrap_or_default();

        let client = Client::builder()
            .timeout(Duration::from_secs(8))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebGameAggregator/1.0")
            .resolve(host, safe_addr)
            .build()
            .map_err(|e| AppError::NetworkError(format!("Failed to build client: {}", e)))?;

        let mut response = client
            .get(parsed_url.as_str())
            .send()
            .await
            .map_err(|e| AppError::NetworkError(format!("ไม่สามารถเชื่อมต่อ URL ได้: {}", e)))?;

        let display_mode = self.check_embeddability(response.headers());

        let final_url = response.url().clone();
        
        let content_length = response.content_length().unwrap_or(0);
        if content_length > 10 * 1024 * 1024 {
            return Err(AppError::ScrapeError("Response is too large".to_string()));
        }

        let body_bytes = response
            .bytes()
            .await
            .map_err(|e| AppError::ScrapeError(format!("ไม่สามารถอ่านเนื้อหาเว็บได้: {}", e)))?;
            
        if body_bytes.len() > 10 * 1024 * 1024 {
            return Err(AppError::ScrapeError("Response is too large".to_string()));
        }
        
        let body_text = String::from_utf8_lossy(&body_bytes).to_string();

        // Content safety check on HTML body
        let lower_body = body_text.to_lowercase();
        for kw in BLOCKED_KEYWORDS {
            if lower_body.contains(&format!(" {} ", kw)) || lower_body.contains(&format!("\"{}\"", kw)) {
                return Err(AppError::ScrapeError(format!(
                    "⚠️ ตรวจพบเนื้อหาเว็บพนันหรือสื่อไม่เหมาะสมในเว็บไซต์ ('{}')",
                    kw
                )));
            }
        }

        let document = Html::parse_document(&body_text);

        // 1. Title Extraction
        let title = self.extract_og_meta(&document, "og:title")
            .or_else(|| self.extract_tag_text(&document, "title"))
            .unwrap_or_else(|| {
                final_url
                    .path_segments()
                    .and_then(|mut segs| segs.next_back())
                    .filter(|s| !s.is_empty())
                    .map(|s| s.replace(['-', '_'], " "))
                    .unwrap_or_else(|| "ผลงานเกม CS67".to_string())
            });

        // 2. Description Extraction
        let description = self.extract_og_meta(&document, "og:description")
            .or_else(|| self.extract_meta_name(&document, "description"))
            .unwrap_or_else(|| {
                "เล่นผลงานเกมนี้ผ่านแพลตฟอร์ม BaGame (CS 67)".to_string()
            });

        // 3. Thumbnail URL Extraction
        let thumbnail_url = self.extract_og_meta(&document, "og:image")
            .or_else(|| self.extract_meta_name(&document, "twitter:image"))
            .map(|thumb| self.resolve_relative_url(&final_url, &thumb))
            .unwrap_or_else(|| {
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80".to_string()
            });

        // 4. Extract or Generate Tags
        let mut tags = Vec::new();
        tags.push("cs67".to_string());
        let host = final_url.host_str().unwrap_or_default();

        if host.contains("itch.io") {
            tags.push("itch-io".to_string());
        } else if host.contains("gamejolt.com") {
            tags.push("game-jolt".to_string());
        } else if host.contains("github.io") {
            tags.push("open-source".to_string());
        }

        if lower_body.contains("webgl") {
            tags.push("webgl".to_string());
        }
        if lower_body.contains("canvas") || lower_body.contains("html5") {
            tags.push("html5".to_string());
        }
        tags.push("arcade".to_string());

        tags.dedup();

        Ok(ScrapedInfo {
            title,
            description,
            thumbnail_url,
            display_mode,
            tags,
        })
    }

    fn extract_og_meta(&self, doc: &Html, property: &str) -> Option<String> {
        let selector = Selector::parse(&format!("meta[property='{}']", property)).ok()?;
        doc.select(&selector)
            .next()?
            .value()
            .attr("content")
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }

    fn extract_meta_name(&self, doc: &Html, name: &str) -> Option<String> {
        let selector = Selector::parse(&format!("meta[name='{}']", name)).ok()?;
        doc.select(&selector)
            .next()?
            .value()
            .attr("content")
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }

    fn extract_tag_text(&self, doc: &Html, tag: &str) -> Option<String> {
        let selector = Selector::parse(tag).ok()?;
        let text = doc.select(&selector).next()?.text().collect::<String>();
        let trimmed = text.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    }

    fn resolve_relative_url(&self, base: &Url, relative: &str) -> String {
        if relative.starts_with("http://") || relative.starts_with("https://") {
            return relative.to_string();
        }
        base.join(relative)
            .map(|resolved: Url| resolved.to_string())
            .unwrap_or_else(|_| relative.to_string())
    }
}
