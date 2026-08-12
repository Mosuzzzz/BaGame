<div align="center">
  <img src="frontend/src/app/icon.jpg" alt="BaGame Logo" width="120" />

  # 🎮 BaGame - CS 67 Web Game Hub
  
  **A universal game platform built to connect and showcase game development projects created by Computer Science students (Generation 67) at RMUTI.**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
  [![Rust](https://img.shields.io/badge/Rust-Axum-orange?logo=rust)](https://www.rust-lang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)](https://www.postgresql.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

<hr />

## ✨ Features

- **🎨 Interactive UI**: A stunning dark-mode interface with a custom, interactive 3D Generative Particle Wave Canvas background that follows your mouse.
- **🕹️ Game Showcase**: Browse through various categories of games (Action, RPG, Puzzle, WebGL, etc.), view details, and play directly from the platform.
- **🔐 Authentication**: Secure Google Single Sign-On (SSO) integration powered by Firebase Authentication (tailored for RMUTI).
- **❤️ Favorites System**: Users can click the heart icon on any game card to add it to their personal favorites list for quick access.
- **🌐 Internationalization (i18n)**: Seamlessly toggle between English (EN) and Thai (TH) languages instantly.
- **🔍 Smart Search**: Find specific games quickly by title, description, or student ID.
- **🛡️ Secure Game Embeds**: Advanced iframe validation with automatic `itch.io` integration and robust sandboxing for uploaded HTML5 games.
- **📱 Responsive Player**: A fullscreen-ready, responsive game player supporting various aspect ratios and responsive design out of the box.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Firebase Auth

### Backend (Server)
- **Framework**: [Rust](https://www.rust-lang.org/) with [Axum](https://github.com/tokio-rs/axum)
- **Runtime**: Tokio (Async)
- **Database**: PostgreSQL (via `sqlx`)
- **Metadata Scraping**: `scraper` crate for extracting metadata and previews from submitted game URLs.
- **Uploads**: Integrated multipart form processing for game manuals and custom thumbnails.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Rust & Cargo (latest stable version)
- PostgreSQL Database running locally or via Docker
- Firebase Project Configuration (for frontend auth)

### 1. Setting up the Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Set up your `.env` file for the PostgreSQL connection:
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/bagame
   ```
3. Run the Rust server:
   ```bash
   cargo run
   ```
   *The backend will typically start on `http://127.0.0.1:8000`.*

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
   
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 🏗️ Architecture

BaGame separates the frontend presentation layer from the robust Rust-powered backend. 
- The **Next.js frontend** handles user sessions, client-side rendering, and interactive UI components.
- The **Rust backend** is responsible for stateless REST APIs, web scraping, validation, database interactions (PostgreSQL), and handling multipart uploads for self-hosted games and assets.

---

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you want to help improve BaGame! Contributions from CS students and open-source enthusiasts are highly welcomed.

---

## 📜 License
© 2026 BaGame - Computer Science CS 67 Game Hub at RMUTI. All Rights Reserved.
