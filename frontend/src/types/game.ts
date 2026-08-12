export type DisplayMode = 'EMBEDDED' | 'POPUP';

export interface GameMetrics {
  views: number;
  likes: number;
  rating: number;
}

export interface GameDocument {
  id: string;
  title: string;
  description: string;
  original_url: string;
  embed_code?: string;
  thumbnail_url: string;
  creator_id: string;
  display_mode: DisplayMode;
  metrics: GameMetrics;
  tags: string[];
  created_at: string;
  manual_url?: string;
  website_url?: string;
}

export interface ScrapedMetadata {
  title: string;
  description: string;
  thumbnail_url: string;
  display_mode: DisplayMode;
  tags: string[];
  original_url: string;
  embed_code?: string;
}

export interface SubmitGamePayload {
  url: string;
  embed_code?: string;
  custom_title?: string;
  custom_description?: string;
  custom_thumbnail_url?: string;
  custom_tags?: string[];
  creator_id?: string;
}
