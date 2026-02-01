# Agent Context & Technical Overview

## Project Overview

This project is a **B2B Parking PWA (Progressive Web App)** designed for commercial drivers. It allows users to find parking zones, view rates, and manage parking sessions. The system relies on real-time data from the RDW (Netherlands Vehicle Authority) and uses AI for data enrichment.

## Architecture

The system follows a hybrid architecture:

- **Frontend**: A static PWA built with Vanilla JavaScript, served via Firebase Hosting.
- **Backend**: Python scripts for data ingestion and processing, running independently (likely local or scheduled cron).
- **Database**: Firebase Firestore (NoSQL) as the central data store.
- **Auth**: Firebase Authentication (Email/Password).
- **AI Integration**: Google Gemini integration for translating and formatting Dutch tariff descriptions.

## Frontend (PWA)

The frontend is a lightweight, "Vanilla JS" application with no complex build step.

### Key Technologies

- **Core**: HTML5, CSS3 (Variables-based design system), JavaScript (ES6+).
- **Frameworks**: None (Custom state/service implementation).
- **Maps**: Google Maps JavaScript API (loaded dynamically).
- **Firebase SDK**: Compat libraries for App, Auth, and Firestore.

### Structure (`/`)

- `index.html`: Single Page Application (SPA) entry point. Handles script loading and view containers.
- `app.js`: Main entry point. Initializes event listeners and handles high-level navigation logic.
- `services.js`: Business logic layer. Manages Firebase interactions, state mutations, and data fetching.
- `state.js`: Simple global state management store.
- `ui.js`: DOM manipulation and rendering logic.
- `design-system.css`: Centralized stylesheet using modern CSS variables for theming.

### Key Features

- **Install Gate**: Custom iOS-style PWA installation instructions.
- **Zone Search**: Zone number or address search.
- **Parking Sessions**: Start/Stop parking logic with cost tracking.
- **License Plate Management**: Add/Remove/Select vehicles.

## Backend / Data Pipeline

The backend consists of Python scripts focused on fetching, cleaning, and enriching RDW open data.

### Key Scripts (`/`)

- `fetch_rdw_data.py`: The core data pipeline script.
  - **Step 1**: Fetches JSON data from multiple RDW endpoints (Areas, Regulations, Timeframes, Tariffs).
  - **Step 2**: Processes and normalizes the data structure.
  - **Step 3 (AI)**: Uses **Google Gemini** (via `google.generativeai`) to translate complex Dutch tariff rules into structured English descriptions.
  - **Step 4**: Filters out restricted zones (e.g., residents only) and free zones (optional).
  - **Step 5**: Uploads processed `zones` to Firestore.
- `.env`: Stores environment variables like `GEMINI_API_KEY`.
- `service-account.json`: Firebase Admin SDK credentials (used by Python scripts).

## Database Schema (Firestore)

- **`zones` Collection**:
  - `id`: Unique Zone ID (e.g., "1100").
  - `lat`, `lng`: Geolocation.
  - `price`: Hourly rate (or max rate).
  - `rates`: Array of complex rate objects (Time, Price, Detail).
  - `max_duration_mins`: Maximum allowed parking time.
- **`users` (Implied)**: Handled by Firebase Auth.

## Deployment

- **Hosting**: Firebase Hosting (configured in `firebase.json`).
- **Web Root**: `public` folder is specified as the public root, though source files currently reside in the project root.
- **Command**: `firebase deploy` (likely from a GitHub Action or local terminal).

## Developer Notes

- **No Package Manager**: The project does not currently use a root `package.json` for frontend dependencies. Libraries are loaded via CDN in `index.html`.
- **Python Env**: Requires `firebase-admin`, `google-generativeai`, `python-dotenv`.
