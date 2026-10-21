# AnimeYT — Verified Anime Discovery & Official YouTube Watch Pipeline

AnimeYT is a high-performance, database-backed anime discovery and streaming web application. It connects fans with officially licensed, legally published full anime episodes streamed exclusively via official YouTube embeds.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB**, AnimeYT implements a **Hybrid Catalogue Strategy**:
1. Broad anime metadata imported directly from the **AniList GraphQL API**.
2. Potential YouTube episodes discovered via the **YouTube Data API v3** from verified distributor channels (Muse Asia, Muse India, Ani-One Asia).
3. Human-verified publishing workflow: candidate videos are never automatically published. Only verified episodes appear as watchable.
4. Anime with no verified episodes still appear in discovery, but never display fake availability or artificial episode counts.

---

## 🌟 Key Architecture & Features

### 1. Hybrid Catalogue
- **Persisted in MongoDB**: All anime metadata, audio language versions, verified seasons/episodes, YouTube candidate videos, and import job logs are stored in MongoDB.
- **AniList GraphQL Integration**: Paginated catalogue import with rate-limit backoff, duplicate prevention (upsert on stable `anilistId`), and metadata refresh that never overwrites verified episode mappings.
- **YouTube Candidate Pipeline**: Discovers candidates by channel, playlist, or targeted queries. Discovered candidates are saved with status `discovered` and are **never** auto-published.
- **Verification Workflow**: Reviewers confirm audio language (e.g. Hindi dub vs. Japanese sub), season/episode numbering, source channel licensing, and playback availability.
- **Availability Monitoring**: Automated checks via YouTube oEmbed verify embedding permission. Unavailable or removed videos transition to `unavailable` and are immediately excluded from public playback.

### 2. User Interface
- **Glassmorphic Aesthetic**: Deep charcoal palette (`#0E0A1A`, `#160B24`), vibrant accent tags (`#D81B60`, `#FF8FB4`), and fluid responsive layouts.
- **Home (`/`)**: Real featured anime hero, popular ranking by score, and recently added anime based on genuine MongoDB timestamps. Renders a clean initial onboarding state if the database has zero records.
- **Explore (`/explore`)**: Server-backed pagination, genre filtering, language filtering (Hindi, English, Japanese), and sorting (Popularity, Release Year, Title A-Z).
- **Anime Details (`/anime/[slug]`)**: Displays authentic synopsis, genres, release year, language dub tags, verified episode count, official license partner attribution, and episode lists. Shows "Episodes not available yet" for unverified titles.
- **Watch (`/watch/[slug]/[episode]`)**: Secure YouTube player embed with boundary-checked Next/Previous episode navigation, language version switcher, and direct link to YouTube.
- **Admin Portal (`/admin`)**: Protected review interface for AniList catalogue imports, YouTube candidate discovery, candidate approval/rejection, and embed availability checks.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript 5 (Strict mode)
- **Database**: MongoDB with Mongoose ODM
- **External APIs**:
  - [AniList GraphQL API](https://docs.anilist.co/) (Broad anime catalogue)
  - [YouTube Data API v3](https://developers.google.com/youtube/v3) (Candidate video discovery)
- **Styling**: Tailwind CSS v4 & custom glassmorphism utilities
- **Testing**: Node Native Test Runner with tsx (`npm run test`)

---

## 🚀 Quick Start & Environment Configuration

### 1. Environment Variables

Create `.env` (or `.env.local`):

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/animeyt` |
| `YOUTUBE_API_KEY` | Google YouTube Data API v3 key | `AIzaSy...` |
| `ADMIN_SECRET_KEY` | Admin authorization secret key | `animeyt-admin-dev-key` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |

---

## 📖 Operational Guide

### 1. Initial Channel Setup
Before discovering candidates, initialize the verified official channels (Muse Asia, Muse India, Ani-One Asia):
- Via Admin UI: Navigate to `/admin`, log in with `ADMIN_SECRET_KEY`, and click **Seed Channels**.
- Via API: `POST /api/admin/seed` with header `x-admin-secret: <ADMIN_SECRET_KEY>`.

### 2. Importing AniList Anime Metadata
To import anime metadata into MongoDB:
- **Via CLI Script**:
  ```bash
  # Import first 2 pages (50 anime titles)
  npm run import:anilist
  
  # Or with custom parameters:
  IMPORT_PAGES=5 IMPORT_PER_PAGE=25 npm run import:anilist
  ```
- **Via Admin Portal**: Navigate to `/admin` > **AniList Import** tab, choose page count or search term, and click **Start Import**.
- **Via API**: `POST /api/admin/import/anilist` with `{ "page": 1, "maxPages": 2, "perPage": 25 }`.

### 3. Discovering Candidate YouTube Videos
To search official distributor channels or playlists for candidate videos:
- **Via CLI Script**:
  ```bash
  # Discover candidates for Demon Slayer
  DISCOVER_QUERY="Demon Slayer Episode 1" DISCOVER_SLUG="demon-slayer" npm run discover:youtube
  ```
- **Via Admin Portal**: Go to `/admin` > **YouTube Discovery** tab, enter anime slug and search term, and run discovery.
- Discovered videos enter the review queue with status `discovered`. **They are not published automatically.**

### 4. Reviewing & Publishing Candidates
To verify and publish an episode:
- Go to `/admin` > **Review Candidates** tab.
- Filter candidates by status (`discovered`, `pending_review`).
- Verify video title, episode number, audio language (e.g. Hindi or Japanese), and channel.
- Click **Verify & Publish**.
  - Creates/updates the corresponding `AnimeVersion`.
  - Publishes the `Episode` with `isPublished: true` and `verificationStatus: 'verified'`.
  - Increments `verifiedEpisodeCount` on the `Anime` document.
- Or click **Reject** to mark invalid candidates as `rejected`.

### 5. Checking Embed Availability
To periodically audit published episodes:
- Navigate to `/admin` > **Availability** tab and click **Run Availability Check**.
- Episodes that have been deleted, marked private, or disabled for embedding by the channel owner are flagged as `unavailable` and removed from public playback.

---

## 🧪 Testing & Build Verification

Run strict type checks:
```bash
npm run typecheck
```

Run integration and data pipeline test suite:
```bash
npm run test
```

Test coverage includes:
- Deduplication when re-importing AniList records.
- Metadata refresh preserving verified episode counts and version mappings.
- Discovered YouTube candidates never auto-publishing.
- Unverified, rejected, and unavailable episodes excluded from public APIs.
- Sequential episode ordering.
- Proper audio language tagging.
- Discovery entries with 0 verified episodes discoverable without fake availability.
- Protected admin authorization checks.
- Empty search/filter queries returning zero records cleanly without falling back to mock data.

Run the production build:
```bash
npm run build
```

---

## 🛡️ Legal & Monetization Compliance

- **Zero Asset Re-Hosting**: Playback occurs exclusively through official YouTube IFrame embeds.
- **Creator Revenue Preserved**: Official distributor advertisements, view counters, and engagement metrics remain intact.
- **Attribution Displayed**: Channel partner names and direct links to YouTube channels are prominently displayed on details, watch, and footer components.
