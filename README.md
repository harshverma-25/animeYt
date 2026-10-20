# AnimeYT — Anime Discovery & Official YouTube Watch MVP

AnimeYT is a high-performance web application designed to help anime enthusiasts discover titles and stream officially licensed, legally published full anime episodes directly via YouTube.

Built with Next.js App Router, TypeScript, Tailwind CSS, and MongoDB (with a resilient in-memory fallback), AnimeYT provides official playback without downloading or re-hosting video assets, preserving publisher copyright and creator monetization.

---

## 🌟 Key Features

### 1. Home Page (`/`)
- **Featured Anime Spotlight**: Refined featured anime strip without oversized hero elements.
- **Top Search & Audio Filter**: Instant search with quick filters for **Hindi**, **English**, and **Japanese** audio dubs.
- **Popular Anime Section**: Ranked by popularity metric (6 cards per row desktop, 2 on mobile).
- **Recently Added Anime**: Displays newest catalogue additions.
- **Graceful Empty State**: Includes quick guide & link to seed initial data.

### 2. Explore Page (`/explore`)
- **Real-Time Search**: Query by anime title, keywords, or synopsis.
- **Multi-Filter System**: Filter by Audio Language, Subtitle Language, and Genre.
- **Sorting**: Sort by Popularity, Recently Added, Title (A-Z), and Release Year.
- **Responsive Poster Grid**: Fluid responsive layout with verified episode count badges and audio track tags.
- **Full State Coverage**: Comprehensive loading spinners, empty states, and error handling.

### 3. Anime Details Page (`/anime/[slug]`)
- **Metadata Header**: Anime backdrop, high-res poster, release year, genres, and catalogue status.
- **Audio Language Switcher**: Switch between verified versions (e.g., Muse Asia Japanese sub vs. Muse India Hindi dub).
- **Episode Directory**: Season tabs, episode numbers, thumbnails, duration, and direct links to watch.

### 4. Watch Page (`/watch/[slug]/[episodeId]`)
- **Official YouTube IFrame Player**: Fullscreen support, native player controls, and publisher monetization intact.
- **Episode Navigation**: Previous & Next episode controls with automated boundary handling.
- **Version Switcher**: Switch audio versions on the fly while retaining the current episode number.
- **Direct YouTube Link**: Instant fallback link for videos affected by geographic licensing restrictions.

### 5. Admin & Verification Workflow (`/admin`)
- **Authentication Gate**: Secured by `ADMIN_SECRET_KEY` via headers and cookies.
- **Verification Workflow**: Imported episodes start as `unverified` and must be approved before appearing in the public catalogue.
- **YouTube API Discovery**: Server-side import tool for playlists and official channels with quota protection and caching.
- **One-Click Seed**: Pre-loads verified official titles (Mob Psycho 100, Spy x Family, One Punch Man, Tokyo Revengers Hindi Dub, Hyouka, etc.).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS v4 with custom dark charcoal theme tokens (`#101015`, `#191920`, `#30303A`, `#FF3D69`)
- **Database**: MongoDB Atlas with Mongoose (with in-memory fallback for offline/development)
- **Video Embeds**: YouTube IFrame Player
- **Discovery**: YouTube Data API v3 (Server-side with caching & quota protection)
- **Testing**: Node Native Test Runner with `tsx` (`npm run test`)

---

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the project directory
cd C:\Users\hvhar\.gemini\antigravity-ide\scratch\animeyt

# Install dependencies
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Default / Required |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string | Optional (falls back to verified in-memory store) |
| `YOUTUBE_API_KEY` | Google YouTube Data API v3 key | Optional (required for live playlist imports) |
| `ADMIN_SECRET_KEY` | Admin authorization key | `animeyt-admin-dev-key` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |

> **Note**: Even if `MONGODB_URI` and `YOUTUBE_API_KEY` are not provided, AnimeYT operates with its verified built-in dataset out-of-the-box!

### 3. Running Locally

```bash
# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Verification Checks

```bash
# Run unit & integration tests
npm run test

# Run strict TypeScript checks
npm run typecheck

# Run ESLint
npm run lint

# Run production build
npm run build
```

---

## 📁 Project Structure

```
animeyt/
├── src/
│   ├── app/
│   │   ├── admin/page.tsx               # Admin portal & verification review
│   │   ├── anime/[slug]/page.tsx        # Anime details page
│   │   ├── api/
│   │   │   ├── admin/                   # Admin seed, verify, anime routes
│   │   │   ├── catalogue/               # Public catalogue & details API
│   │   │   └── youtube/import/          # YouTube import API
│   │   ├── explore/page.tsx             # Explore page with filters & search
│   │   ├── watch/[slug]/                # Watch page (single & episode routes)
│   │   ├── globals.css                  # Theme tokens & scrollbar styling
│   │   ├── layout.tsx                   # Root layout with SEO & Navbar
│   │   └── page.tsx                     # Home page
│   ├── components/
│   │   ├── Details/                     # Details client view
│   │   ├── Home/                        # Home client view
│   │   ├── Player/                      # YouTube player, episode list, language switcher
│   │   ├── Watch/                       # Watch client view
│   │   ├── AnimeCard.tsx                # Responsive poster card
│   │   ├── FeaturedStrip.tsx            # Featured spotlight strip
│   │   ├── Footer.tsx                   # Legal attribution footer
│   │   ├── LanguageFilter.tsx           # Audio filter pills
│   │   └── Navbar.tsx                   # Compact header & search
│   ├── lib/
│   │   ├── auth/adminAuth.ts            # Admin security middleware
│   │   ├── data/seedData.ts             # Verified starter anime catalogue
│   │   ├── db/
│   │   │   ├── models/                  # Mongoose schemas (Anime, Version, Episode, Channel)
│   │   │   └── mongodb.ts               # Connection pool & caching
│   │   └── services/
│   │       ├── catalogueService.ts      # Unified DB & in-memory data provider
│   │       └── youtubeService.ts        # YouTube API v3 client with quota protection
│   └── types/
│       └── anime.ts                     # TypeScript models & query definitions
├── tests/
│   └── catalogue.test.ts                # Test suite for catalogue, filters, and nav
├── .env.example                         # Environment configuration reference
├── next.config.ts                       # Next.js configuration
├── package.json                         # Dependencies and scripts
└── tsconfig.json                        # TypeScript configuration
```

---

## 🛡️ Legal & Compliance

- **Zero Re-hosting**: Videos stream directly from official YouTube servers.
- **Partner Attribution**: Channels (Muse Asia, Muse India, Ani-One Asia) are displayed with direct channel links.
- **Creator Revenue**: Official player controls, ads, and engagement stats are fully preserved.
- **Admin Verification**: Every imported episode undergoes verification before public indexing.
