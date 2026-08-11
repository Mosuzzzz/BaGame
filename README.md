# BaGame - CS 67 Web Game Hub

BaGame is a universal game platform built to connect and showcase game development projects created by Computer Science students (Generation 67). It allows users to discover, frame, and play user-submitted web games, HTML5, and WebGL titles.

## ✨ Features

- **Interactive UI**: A stunning dark-mode interface with a custom, interactive 3D Generative Particle Wave Canvas background that follows your mouse.
- **Game Showcase**: Browse through various categories of games (Action, RPG, Puzzle, WebGL, etc.), view details, and play directly from the platform.
- **Authentication**: Secure Google Single Sign-On (SSO) integration powered by Firebase Authentication (tailored for RMUTI).
- **Favorites System**: Users can click the heart icon on any game card to add it to their personal favorites list for quick access.
- **Internationalization**: Seamlessly toggle between English (EN) and Thai (TH) languages instantly.
- **Smart Search**: Find specific games quickly by title, description, or student ID.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Firebase Auth
- **Language**: TypeScript

### Backend
- **Framework**: Rust with [Axum](https://github.com/tokio-rs/axum)
- **Runtime**: Tokio (Async)
- **Scraping**: `scraper` crate for extracting metadata from submitted game URLs.
- **Database**: File-based lightweight storage (`games_data.json`).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Rust & Cargo (latest stable version)
- Firebase Project Configuration (for frontend auth)

### 1. Setting up the Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Run the Rust server:
   ```bash
   cargo run
   ```
   *The backend will typically start on `http://127.0.0.1:3001`.*

### 2. Setting up the Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend` directory and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you want to help improve BaGame!

## 📜 License
© 2026 One 4 All - Computer Science CS 67 Game Hub. All Rights Reserved.
