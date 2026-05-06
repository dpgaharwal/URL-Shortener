<div align="center">
 
# 🔗 Linklytics
 
**Advanced URL Shortener & Analytics Platform**
 
*Shorten links. Track clicks. Understand your audience.*
 
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2.45-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
 
[🎥 Video Demonstration](https://linklytics.online) · [🚀 Live App](https://linklytics.online) · [🐛 Report Bug](https://github.com/dpgaharwal/URL-Shortener/issues)
 
</div>
 
---
 
## Table of Contents
 
- [Project Overview](#project-overview)
- [Why This Project Exists](#why-this-project-exists)
- [What Makes This Project Technically Interesting](#what-makes-this-project-technically-interesting)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [End-to-End Flow](#end-to-end-flow)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Dashboard Walkthrough](#dashboard-walkthrough)
- [API Reference](#api-reference)
- [Folder Structure](#folder-structure)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Security Considerations](#security-considerations)
- [Real-World Constraints and Limitations](#real-world-constraints-and-limitations)
- [Production-Grade Improvements](#production-grade-improvements)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
 
---
 
## Project Overview
 
**Linklytics** is a full-stack URL shortener and click analytics platform that transforms long, unwieldy URLs into concise, trackable short links—while providing rich, real-time analytics on every click. Built as a single-page application on React with Supabase as the backend-as-a-service layer, Linklytics demonstrates how modern serverless architectures can deliver production-quality features without managing infrastructure.
 
Every shortened link becomes a data collection point. When a visitor clicks a short link, Linklytics captures the click event, resolves the visitor's geographic location via IP geolocation, classifies the device type from the User-Agent string, and persists the analytics record to Supabase. The link owner then sees aggregate and per-click breakdowns through Recharts-powered visualizations on a dedicated analytics dashboard.
 
The application is deployed on Netlify with client-side routing handled via a `_redirects` file that maps all paths to `index.html`, enabling React Router to handle URL resolution—including the critical `/:id` redirect route that powers the entire short-link flow.
 
---
 
## Why This Project Exists
 
URL shorteners are a deceptively simple problem domain that surface surprisingly deep engineering challenges:
 
- **Uniqueness at scale**: Generating short identifiers that are collision-resistant without coordination is non-trivial. Linklytics uses a `Math.random().toString(36)` approach for the MVP, but the problem scales into distributed ID generation (Snowflake, ULID, Hashids) at production volume.
 
- **Redirect latency**: Every millisecond of redirect latency is user-visible. The redirect path must be optimized—database lookup → click recording → HTTP 302—within a single React render cycle on the client side, which reveals the architectural tension between SPA routing and server-side redirect performance.
 
- **Analytics at the edge**: Capturing device type and geolocation on every click without adding perceptible delay to the redirect requires careful orchestration of async operations (IP API call, UA parsing, Supabase insert) before the final `window.location.href` redirect.
 
- **Auth-gated CRUD with Row-Level Security**: Supabase's PostgreSQL RLS policies ensure that users can only access their own links and click data, but the client must still enforce route-level guards to prevent UI rendering for unauthenticated users.
 
This project serves as both a functional tool and a reference architecture for building authenticated, analytics-rich SPA applications on serverless backends.
 
---
 
## What Makes This Project Technically Interesting
 
### 1. Client-Side Redirect Pipeline
 
The redirect flow in `RedirectLink.jsx` is a two-phase async pipeline executed entirely on the client:
 
```
Phase 1: Resolve short URL → original URL
Phase 2: Parse UA + fetch geolocation → insert click record → window.location redirect
```
 
This is architecturally unusual—most URL shorteners perform redirects server-side with a 301/302 response. The client-side approach trades redirect latency (extra round-trips for IP geolocation) for deployment simplicity (no server needed), which is a deliberate engineering trade-off worth understanding.
 
### 2. Custom Hook Abstraction for Data Fetching
 
The `useFetch` hook implements a generalized async data-loading pattern with `{ data, loading, error, fn }` state management. Every Supabase query in the application flows through this single hook, providing:
 
- **Consistent loading states** across all async operations
- **Uniform error handling** with try/catch propagation
- **Lazy execution** via the returned `fn` function (fetches don't fire on mount automatically—they're triggered explicitly via `useEffect`)
 
This pattern eliminates the boilerplate of `useState` + `useEffect` + error handling for every API call.
 
### 3. Context-Driven Auth with Route Guards
 
The `UrlProvider` context fetches the current Supabase session on mount and exposes `{ user, isAuthenticated, loading, fetchUser }` to the entire component tree. The `ProtectedRoute` component consumes this context and redirects unauthenticated users before rendering protected content—implementing a declarative auth boundary pattern without higher-order components.
 
### 4. QR Code Generation and Storage Pipeline
 
When a user creates a short link, the QR code is generated client-side using `react-qrcode-logo` (rendered to a `<canvas>` element), then the canvas is converted to a Blob via `canvas.toBlob()`, and the Blob is uploaded to Supabase Storage. The public URL of the stored QR image is then persisted in the `urls` table. This is a fully client-mediated file upload pipeline with no server-side image processing.
 
### 5. Dual Short URL Resolution
 
The `getlongUrl` function resolves short URLs using a disjunctive query:
 
```sql
SELECT id, original_url FROM urls
WHERE short_url = :id OR custom_url = :id
LIMIT 1
```
 
This allows both auto-generated short codes (`abc123`) and user-defined custom slugs (`my-link`) to resolve through the same redirect route (`/:id`), simplifying the routing architecture at the cost of a slightly more complex database query.
 
---
 
## Key Features
 
| Feature | Description |
|---|---|
| **Custom URL Shortening** | Generate concise short links with optional custom slugs (e.g., `linklytics.online/my-campaign`) |
| **QR Code Generation** | Auto-generate and store QR codes for every short link; downloadable as PNG |
| **Click Analytics** | Track total clicks, device distribution (mobile/desktop/tablet), and geographic location (city/country) per link |
| **Device Detection** | Parse User-Agent strings via `ua-parser-js` to classify clicks by device type |
| **IP Geolocation** | Resolve click locations using the `ipapi.co` free geolocation API |
| **Authentication** | Email/password signup + Google OAuth via Supabase Auth |
| **Profile Management** | Profile picture upload to Supabase Storage during signup |
| **Route Protection** | Client-side auth guards prevent unauthenticated access to dashboard and analytics |
| **Search & Filter** | Filter links by title on the dashboard |
| **Pagination** | Client-side pagination with 3 links per page |
| **CRUD Operations** | Create, read, update, and delete short links with real-time UI updates |
| **Responsive Design** | Mobile-first layout with Tailwind CSS; consistent experience across all viewports |
| **Scroll Animations** | AOS (Animate On Scroll) library for landing page transitions |
 
---
 
## System Architecture
 
```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (SPA)                               │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  React    │  │  React   │  │  React    │  │  Recharts        │  │
│  │  Router   │  │  Context │  │  useFetch │  │  Visualizations  │  │
│  │  (Routes) │  │  (Auth)  │  │  (Data)   │  │  (Pie/Line)      │  │
│  └─────┬─────┘  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
│        │              │              │                   │            │
│        └──────────────┴──────┬───────┴───────────────────┘            │
│                              │                                       │
│                    ┌─────────▼──────────┐                            │
│                    │   Supabase JS SDK  │                            │
│                    │   (Client Instance) │                            │
│                    └─────────┬──────────┘                            │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     SUPABASE        │
                    │   (Backend-as-a)    │
                    │     (Service)       │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  PostgreSQL   │  │
                    │  │  (urls,clicks)│  │
                    │  └───────────────┘  │
                    │  ┌───────────────┐  │
                    │  │  Auth Service │  │
                    │  │  (Email/OAuth)│  │
                    │  └───────────────┘  │
                    │  ┌───────────────┐  │
                    │  │  Storage      │  │
                    │  │  (QRs, Pics)  │  │
                    │  └───────────────┘  │
                    │  ┌───────────────┐  │
                    │  │  RLS Policies │  │
                    │  │  (Per-tenant) │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   External APIs     │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  ipapi.co     │  │
                    │  │  (Geolocation)│  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```
 
### Architecture Decisions
 
| Decision | Rationale |
|---|---|
| **SPA over SSR** | Simpler deployment to static hosting (Netlify); no server runtime needed for UI |
| **Supabase over custom backend** | Eliminates API layer boilerplate; provides Auth, DB, and Storage from a single SDK |
| **Client-side redirect** | Avoids server infrastructure; trades redirect speed for deployment simplicity |
| **Context API over Redux** | Minimal global state (just auth); no need for Redux complexity |
| **Yup over Zod** | Lightweight schema validation for form inputs; no TypeScript type inference needed |
| **Recharts over D3** | Declarative React-native charting; lower learning curve for standard chart types |
 
---
 
## End-to-End Flow
 
### Link Creation Flow
 
```
User clicks "Create Short Link"
         │
         ▼
┌─────────────────────┐
│  Dialog opens with  │
│  form fields        │
│  (title, longUrl,   │
│   customUrl)        │
└─────────┬───────────┘
          │ User fills form & submits
          ▼
┌─────────────────────┐
│  Yup validates:     │
│  - title required   │
│  - longUrl is URL   │
│  - customUrl optional│
└─────────┬───────────┘
          │ Validation passes
          ▼
┌─────────────────────┐
│  QR code generated  │
│  on <canvas> via    │
│  react-qrcode-logo  │
└─────────┬───────────┘
          │ canvas.toBlob()
          ▼
┌─────────────────────┐
│  Short code =       │
│  Math.random()      │
│  .toString(36)      │
│  .slice(2,6)        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Upload QR blob to  │
│  Supabase Storage   │
│  bucket: "qrs"      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Insert into "urls" │
│  table:             │
│  - title            │
│  - original_url     │
│  - short_url        │
│  - custom_url       │
│  - qr (public URL)  │
│  - user_id          │
└─────────┬───────────┘
          │
          ▼
    Navigate to /link/:id
    (Analytics view)
```
 
### Click Tracking & Redirect Flow
 
```
Visitor accesses /:short_code
         │
         ▼
┌──────────────────────┐
│  RedirectLink mounts │
│  useParams() → id    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Phase 1: Resolve    │
│  getlongUrl(id)      │
│  → Supabase query:   │
│  WHERE short_url=:id │
│  OR custom_url=:id   │
└──────────┬───────────┘
           │ data = { id, original_url }
           ▼
┌──────────────────────┐
│  Phase 2: Track      │
│  storeClicks()       │
│  ┌────────────────┐  │
│  │ UAParser()     │──┼─► device type (mobile/desktop)
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ fetch(ipapi.co)│──┼─► { city, country_name }
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ supabase       │──┼─► INSERT into "clicks" table
│  │ .from("clicks")│  │   { url_id, city, country, device }
│  │ .insert(...)   │  │
│  └────────────────┘  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  window.location.href│
│  = original_url      │
│  (Browser redirect)  │
└──────────────────────┘
```
 
### Authentication Flow
 
```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Landing Page │────►│  /auth page  │────►│  Supabase Auth   │
│  (Hero)       │     │  (Login/     │     │  - Email/Password│
│               │     │   Signup)    │     │  - Google OAuth   │
└──────────────┘     └──────┬───────┘     └────────┬─────────┘
                            │                       │
                            │  Session established   │
                            │                       │
                            ▼                       ▼
                     ┌──────────────────────────────────┐
                     │  UrlProvider Context              │
                     │  getCurrentUser() → session.user  │
                     │  isAuthenticated = true           │
                     └──────────────┬───────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  ProtectedRoute    │
                          │  allows rendering  │
                          │  of Dashboard/Link │
                          └───────────────────┘
```
 
---
 
## Technology Stack
 
### Frontend
 
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework with functional components and hooks |
| React Router DOM | 6.26 | Client-side routing with nested routes and route guards |
| Vite | 5.4 | Build tool with HMR and path alias support |
| Tailwind CSS | 3.4 | Utility-first CSS framework for responsive styling |
| ShadCN/UI | — | Accessible, composable UI primitives (Dialog, Card, Tabs, etc.) |
| Radix UI | — | Headless UI primitives powering ShadCN components |
| Recharts | 2.13 | Declarative charting (PieChart for devices, LineChart for locations) |
| react-qrcode-logo | 3.0 | QR code generation with logo overlay and dot styling |
| ua-parser-js | 1.0 | User-Agent parsing for device classification |
| Yup | 1.4 | Runtime schema validation for form inputs |
| AOS | 2.3 | Scroll-triggered animations on the landing page |
| Framer Motion | 11.9 | Declarative animations and transitions |
| Lucide React | 0.446 | Icon library (Copy, Download, Edit, Trash, Filter, etc.) |
| react-spinners | 0.14 | Loading indicators (SyncLoader, BeatLoader) |
| react-icons | 5.3 | Additional icon sets (FcGoogle for OAuth button) |
| Font Awesome | 6.6 | Social media icons in footer |
 
### Backend (Supabase)
 
| Service | Purpose |
|---|---|
| **PostgreSQL Database** | Stores `urls` and `clicks` tables with Row-Level Security |
| **Auth Service** | Email/password authentication + Google OAuth provider |
| **Storage** | Two buckets: `qrs` (QR code images) and `profile_pic` (user avatars) |
| **RLS Policies** | Per-tenant data isolation ensuring users access only their own records |
 
### Infrastructure
 
| Component | Purpose |
|---|---|
| **Netlify** | Static site hosting with continuous deployment from Git |
| **`_redirects` file** | Maps `/*` → `/index.html 200` for SPA client-side routing |
| **Environment Variables** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Supabase client initialization |
 
---
 
## Database Schema
 
### `urls` Table
 
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier for each shortened URL |
| `title` | TEXT | User-provided title/label for the link |
| `original_url` | TEXT | The destination long URL |
| `short_url` | TEXT | Auto-generated 4-character short code |
| `custom_url` | TEXT (nullable) | Optional user-defined custom slug |
| `qr` | TEXT | Public URL to the stored QR code image |
| `user_id` | UUID (FK → auth.users) | Owner of the link |
| `created_at` | TIMESTAMPTZ | Auto-set creation timestamp |
 
### `clicks` Table
 
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier for each click event |
| `url_id` | UUID (FK → urls.id) | The shortened URL that was clicked |
| `city` | TEXT | City resolved from visitor's IP address |
| `country` | TEXT | Country resolved from visitor's IP address |
| `device` | TEXT | Device type parsed from User-Agent (mobile/desktop/tablet) |
| `created_at` | TIMESTAMPTZ | Auto-set click timestamp |
 
### Entity Relationship
 
```
┌──────────────────┐          ┌──────────────────┐
│      urls        │          │     clicks       │
├──────────────────┤          ├──────────────────┤
│ id (PK)          │──┐       │ id (PK)          │
│ title            │  │       │ url_id (FK)──────┼──► urls.id
│ original_url     │  └──────►│ city             │
│ short_url        │          │ country          │
│ custom_url       │          │ device           │
│ qr               │          │ created_at       │
│ user_id (FK)     │          └──────────────────┘
│ created_at       │
└──────────────────┘
        │
        │ user_id
        ▼
┌──────────────────┐
│   auth.users     │
├──────────────────┤
│ id (PK)          │
│ email            │
│ encrypted_pass   │
│ raw_user_meta    │
│  → name          │
│  → profile_pic   │
└──────────────────┘
```
 
---
 
## Dashboard Walkthrough
 
### Landing Page (`/`)
 
The Hero page serves as the entry point. It features:
 
- **Gradient headline** with the tagline "Shorten Links, Amplify Insights with LinkLytics"
- **URL input form** — entering a URL and clicking "Try Now!" redirects to `/auth?createNew=<url>`, carrying the long URL as a query parameter so it's pre-filled after authentication
- **Feature slider** — an infinite-scroll animation showcasing four capabilities (Analytics, Instant Shortening, Global Reach, Security)
- **Card section** — hover-effect cards highlighting Easy to Use, Fast Link Creation, Global Access, Always Online
- **FAQ accordion** — expandable questions about analytics, security, global tracking, and speed
 
### Authentication Page (`/auth`)
 
A tabbed interface with Login and Sign Up panels:
 
- **Login**: Email/password fields with Yup validation (email format, password ≥ 6 chars with at least one letter). Google OAuth button triggers `signInWithOAuth({ provider: "google" })`.
- **Sign Up**: Name, email, password, and profile picture (file upload). The profile picture is uploaded to Supabase Storage before the auth record is created, and the public URL is stored in `user_metadata`.
- If the user arrives via `?createNew=<url>`, the heading changes to prompt authentication before link creation, and the URL is forwarded to the dashboard after login.
 
### Dashboard (`/dashboard`) — Protected
 
The authenticated user's central hub:
 
- **Statistics cards**: "Links Created" count and "Total Clicks" count aggregated across all user links
- **Create Short Link button**: Opens a dialog with title, long URL, and custom slug fields. A live QR code preview renders as the URL is typed.
- **Search filter**: Real-time title-based filtering of the URL list
- **URL cards**: Each card displays the QR code thumbnail, title (clickable → navigates to analytics), short link, original URL, and creation date. Action buttons: Copy, Edit, Download QR, Delete.
- **Pagination**: 3 links per page with numbered page buttons
 
### Link Analytics Page (`/link/:id`) — Protected
 
Dedicated analytics view for a single short link:
 
- **Left panel**: Large QR code image (with hover scale animation), link title, short URL, original URL, creation timestamp. Action buttons: Copy to clipboard, Download QR as PNG, Delete link.
- **Right panel**: Three analytics cards:
  - **Total Clicks**: Large numeric display of click count
  - **Location Chart**: Line chart (Recharts `LineChart`) showing top 10 cities by click count, sorted descending
  - **Device Chart**: Pie chart (Recharts `PieChart`) showing device distribution with percentage labels
 
### Redirect Route (`/:id`) — Public
 
The short link resolution endpoint:
 
1. Extracts the `:id` parameter from the URL
2. Queries Supabase for the matching `short_url` or `custom_url`
3. Parses the User-Agent for device type
4. Calls `ipapi.co/json` for city/country geolocation
5. Inserts a click record into the `clicks` table
6. Redirects the browser to the original URL via `window.location.href`
 
A loading indicator is displayed during the async pipeline.
 
---
 
## API Reference
 
All API functions are located in `src/db/` and interact with Supabase via the JS SDK.
 
### Authentication (`src/db/apiAuth.js`)
 
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `login` | `{ email, password }` | `session data` | Authenticates via `signInWithPassword` |
| `signup` | `{ name, email, password, profile_pic }` | `user data` | Uploads profile pic to Storage, then calls `signUp` with metadata |
| `logOut` | — | `void` | Calls `signOut()` to end session |
| `getCurrentUser` | — | `user \| null` | Retrieves session via `getSession()`, returns user or null |
| `googleLogin` | — | `OAuth data` | Initiates Google OAuth flow via `signInWithOAuth` |
 
### URL Operations (`src/db/apiUrls.js`)
 
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `getUrls` | `user_id` | `url[]` | Fetches all URLs for a user, ordered by `created_at` descending |
| `createUrl` | `{ title, longUrl, customUrl, user_id }, qrcode` | `url` | Generates short code, uploads QR to Storage, inserts into `urls` table |
| `getlongUrl` | `id` | `{ id, original_url }` | Resolves short/custom URL to original URL using `OR` clause |
| `getSingleUrl` | `{ id, user_id }` | `url` | Fetches a single URL with ownership verification |
| `updateUrls` | `{ id, title, longUrl, customUrl }` | `url` | Updates URL fields by ID |
| `deleteUrls` | `{ id, short_url }` | `url` | Deletes QR from Storage, then deletes the URL record |
 
### Click Analytics (`src/db/apiClicks.js`)
 
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `getClicks` | `url_id[]` | `click[]` | Fetches clicks for multiple URL IDs using `IN` clause |
| `getClicksForUrl` | `url_id` | `click[]` | Fetches all clicks for a single URL |
| `storeClicks` | `{ id, original_url }` | `void` | Parses UA, fetches geolocation, inserts click record, redirects browser |
 
---
 
## Folder Structure
 
```
URL-Shortener/
├── public/
│   ├── _redirects                  # Netlify SPA routing: /* → /index.html 200
│   └── vite.svg                    # Favicon / QR logo overlay
├── src/
│   ├── main.jsx                    # Entry point: StrictMode + UrlProvider wrapper
│   ├── App.jsx                     # Route definitions (/, /auth, /dashboard, /link/:id, /:id)
│   ├── AppLayout.jsx               # Shell: Header + main content + Footer
│   ├── index.css                   # Tailwind directives + CSS custom properties
│   ├── UserContext.jsx             # React Context for auth state (UrlProvider + urlState hook)
│   │
│   ├── Hooks/
│   │   └── useFetch.jsx            # Generic async data-loading hook: { data, loading, error, fn }
│   │
│   ├── db/
│   │   ├── supabase.js             # Supabase client initialization (env vars)
│   │   ├── apiAuth.js              # Auth API: login, signup, logout, getCurrentUser, googleLogin
│   │   ├── apiUrls.js              # URL CRUD: getUrls, createUrl, getlongUrl, getSingleUrl, updateUrls, deleteUrls
│   │   └── apiClicks.js            # Click analytics: getClicks, getClicksForUrl, storeClicks
│   │
│   ├── lib/
│   │   └── utils.js                # cn() utility (clsx + tailwind-merge)
│   │
│   ├── pages/
│   │   ├── Hero.jsx                # Landing page with URL input, features, FAQ
│   │   ├── Auth.jsx                # Login/Signup tabbed interface
│   │   ├── Dashboard.jsx           # Authenticated link management + stats
│   │   ├── Link.jsx                # Single-link analytics view (charts + details)
│   │   └── RedirectLink.jsx        # Short URL redirect + click tracking pipeline
│   │
│   └── components/
│       ├── Header.jsx              # Navigation bar with auth-aware avatar dropdown
│       ├── Footer.jsx              # Social links + copyright
│       ├── Login.jsx               # Email/password + Google OAuth login form
│       ├── Signup.jsx              # Registration form with profile pic upload
│       ├── CreateUrl.jsx           # Dialog for creating short links with live QR preview
│       ├── EditUrl.jsx             # Dialog for updating link details
│       ├── UrlCard.jsx             # Dashboard card: QR thumbnail, link info, action buttons
│       ├── DeviceChart.jsx         # Pie chart: device distribution (mobile/desktop/tablet)
│       ├── LocationChart.jsx       # Line chart: top 10 cities by click count
│       ├── Pagination.jsx          # Page number buttons for link list
│       ├── ProtectedRoute.jsx     # Auth guard: redirects to /auth if unauthenticated
│       ├── FeatureSetion.jsx       # Infinite-scroll feature showcase on landing page
│       ├── CardSections.jsx        # Hover-effect feature cards
│       ├── Accordion.jsx           # FAQ accordion with expandable items
│       ├── LoadingBar.jsx          # Loading indicator component
│       ├── Error.jsx               # Error message display component
│       └── ui/                     # ShadCN/UI primitives
│           ├── accordion.jsx
│           ├── avatar.jsx
│           ├── button.jsx
│           ├── card.jsx
│           ├── card-hover-effect.jsx
│           ├── dialog.jsx
│           ├── dropdown-menu.jsx
│           ├── input.jsx
│           ├── label.jsx
│           └── tabs.jsx
│
├── components.json                 # ShadCN component configuration
├── eslint.config.js                # ESLint flat config
├── jsconfig.json                   # JS path alias (@/ → src/)
├── tailwind.config.js              # Tailwind + ShadCN theme + custom animations
├── postcss.config.js               # PostCSS with Tailwind + Autoprefixer
├── vite.config.js                  # Vite config with React plugin + @/ alias
├── package.json                    # Dependencies and scripts
├── LICENSE                         # MIT License
└── README.md                       # This file
```
 
---
 
## Running Locally
 
### Prerequisites
 
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or yarn/pnpm)
- A **Supabase** project with the required tables, storage buckets, and RLS policies configured
 
### Step 1: Clone the Repository
 
```bash
git clone https://github.com/dpgaharwal/URL-Shortener.git
cd URL-Shortener
```
 
### Step 2: Install Dependencies
 
```bash
npm install
```
 
### Step 3: Configure Environment Variables
 
Create a `.env` file in the project root:
 
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
 
These values are available in your Supabase project dashboard under **Settings → API**.
 
### Step 4: Set Up Supabase Backend
 
Create the following tables in your Supabase SQL editor:
 
```sql
-- URLs table
CREATE TABLE urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  original_url TEXT NOT NULL,
  short_url TEXT NOT NULL UNIQUE,
  custom_url TEXT,
  qr TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- Clicks table
CREATE TABLE clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
  city TEXT,
  country TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- Enable RLS
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
 
-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view their own URLs"
  ON urls FOR SELECT USING (auth.uid() = user_id);
 
CREATE POLICY "Users can insert their own URLs"
  ON urls FOR INSERT WITH CHECK (auth.uid() = user_id);
 
CREATE POLICY "Users can update their own URLs"
  ON urls FOR UPDATE USING (auth.uid() = user_id);
 
CREATE POLICY "Users can delete their own URLs"
  ON urls FOR DELETE USING (auth.uid() = user_id);
 
CREATE POLICY "Clicks are viewable by URL owner"
  ON clicks FOR SELECT USING (
    url_id IN (SELECT id FROM urls WHERE user_id = auth.uid())
  );
 
CREATE POLICY "Anyone can insert clicks"
  ON clicks FOR INSERT WITH CHECK (true);
```
 
Create two storage buckets:
 
- **`qrs`** — public bucket for QR code images
- **`profile_pic`** — public bucket for user profile pictures
 
Enable **Google OAuth** in Supabase Dashboard → Authentication → Providers → Google (requires Google Cloud OAuth client ID and secret).
 
### Step 5: Start the Development Server
 
```bash
npm run dev
```
 
The app will be available at `http://localhost:5173`.
 
### Step 6: Build for Production
 
```bash
npm run build
npm run preview    # Preview the production build locally
```
 
---
 
## Running Tests
 
The project currently uses ESLint for static analysis:
 
```bash
npm run lint
```
 
For a production-grade setup, the following testing layers are recommended (see [Production-Grade Improvements](#production-grade-improvements)):
 
| Layer | Tool | Scope |
|---|---|---|
| Unit Tests | Vitest + React Testing Library | Component rendering, hook behavior, validation logic |
| Integration Tests | Vitest + MSW (Mock Service Worker) | Supabase API interactions, auth flows |
| E2E Tests | Playwright or Cypress | Full redirect flow, dashboard CRUD, auth guards |
 
---
 
## Security Considerations

### Current Security Posture

| Measure | Implementation |
|---|---|
| **Row-Level Security (RLS)** | Supabase RLS policies enforce per-tenant data isolation at the PostgreSQL level. Even if the client SDK is compromised, users cannot query other users' links or analytics. |
| **Anon Key Exposure** | The `VITE_SUPABASE_ANON_KEY` is embedded in the client bundle and is publicly visible. This is by design—Supabase anon keys are safe to expose as long as RLS policies are correctly configured. The anon key has no admin privileges. |
| **Auth Token Management** | Supabase JS SDK manages JWT tokens automatically, storing them in `localStorage` and refreshing them before expiry. |
| **HTTPS Enforcement** | Supabase endpoints enforce TLS. Netlify serves the SPA over HTTPS by default. |
| **Input Validation** | Yup schemas validate all form inputs client-side before submission (URL format, email format, password strength). |

### Known Security Gaps

| Gap | Risk | Mitigation |
|---|---|---|
| **No rate limiting on link creation** | Abuse: automated mass link creation | Add Supabase Edge Function with rate limiting |
| **No URL validation against malware** | Short links could redirect to phishing/malware sites | Integrate Google Safe Browsing API or VirusTotal check before allowing URL creation |
| **No CAPTCHA on signup** | Bot account creation | Add hCaptcha or Cloudflare Turnstile to the signup flow |
| **Client-side redirect** | Redirect latency exposes the IP geolocation call as a blocking dependency | Move redirect to a Supabase Edge Function for server-side 302 |
| **No click fraud detection** | Click counts can be inflated by bots | Add fingerprinting (canvas, WebGL) and IP deduplication with TTL |
| **Custom URL collision** | Race condition if two users pick the same custom slug simultaneously | Add a UNIQUE constraint on `custom_url` and handle the conflict gracefully in the UI |

---

## Real-World Constraints and Limitations

### 1. Redirect Latency

The client-side redirect pipeline introduces significant latency compared to a server-side 302:

- **Phase 1**: Supabase query to resolve the short URL (~100–300ms)
- **Phase 2**: IP geolocation API call (~200–500ms) + Supabase insert (~100ms)
- **Total**: 400–900ms before the visitor reaches the destination

A server-side redirect (Edge Function or API route) would reduce this to ~50–100ms by performing the lookup and click recording server-side, then returning a 302 response.

### 2. Short Code Entropy

`Math.random().toString(36).slice(2, 6)` produces a 4-character alphanumeric string with ~36⁴ = 1.68M possible values. At scale, collision probability increases rapidly (birthday problem: ~50% collision at ~1,290 links). This is insufficient for production use.

### 3. IP Geolocation Rate Limits

The free `ipapi.co` API is rate-limited to ~1,000 requests/day. At any meaningful click volume, this will throttle or fail silently, resulting in missing location data for clicks.

### 4. Client-Side Click Tracking Reliability

If a visitor's browser has JavaScript disabled, or if the IP API call fails, the click record may be incomplete or lost entirely. The redirect still works (via `window.location.href`), but analytics data is silently dropped.

### 5. No Pagination on the Database Side

The dashboard fetches *all* URLs for a user and performs client-side pagination (3 per page). With hundreds or thousands of links, this becomes an O(n) transfer and render problem. Server-side cursor-based pagination would be required at scale.

### 6. Single-Page Application SEO

As an SPA, Linklytics has no server-rendered HTML. The landing page is not indexable by search engines without SSR or prerendering (e.g., Netlify prerender, Next.js migration).

---

## Production-Grade Improvements

### Target Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                      │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │  CDN     │    │  Edge        │    │  Supabase          │    │
│  │  (Static │    │  Function    │    │  (DB + Auth +      │    │
│  │   SPA)   │    │  (Redirect)  │    │   Storage)         │    │
│  └────┬─────┘    └──────┬───────┘    └────────┬───────────┘    │
│       │                 │                      │                │
│       │    /:short_code │                      │                │
│       │────────────────►│  Lookup URL          │                │
│       │                 │─────────────────────►│                │
│       │                 │  Record click         │                │
│       │                 │─────────────────────►│                │
│       │                 │  302 Redirect         │                │
│       │◄────────────────│  Location: orig_url   │                │
│       │                 │                      │                │
│  ┌────┴─────┐    ┌──────┴───────┐    ┌────────┴───────────┐    │
│  │  Redis   │    │  Click       │    │  Analytics DB       │    │
│  │  (Cache) │    │  Stream      │    │  (ClickHouse/       │    │
│  │          │    │  (Kafka/     │    │   TimescaleDB)       │    │
│  │          │    │   SQS)       │    │                      │    │
│  └──────────┘    └──────────────┘    └────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Concrete Improvements

| # | Improvement | Description |
|---|---|---|
| 1 | **Supabase Edge Function for redirects** | Replace the client-side `RedirectLink` with a Deno Edge Function that performs the URL lookup, click recording, and returns a 302 response. Reduces redirect latency from ~700ms to ~50ms. |
| 2 | **Distributed ID generation** | Replace `Math.random()` with ULID or NanoID for collision-resistant, sort-compatible short codes. Supports billions of unique URLs. |
| 3 | **Redis caching layer** | Cache URL lookups in Redis with TTL. Short URL → original URL is an ideal cache candidate (rarely changes, frequently read). Eliminates the database round-trip on every redirect. |
| 4 | **Async click ingestion** | Decouple click recording from the redirect path. Write click events to a message queue (Kafka/SQS) and process asynchronously. The redirect returns 302 immediately, and analytics are ingested eventually. |
| 5 | **ClickHouse for analytics** | Move click data from PostgreSQL to a columnar analytics database (ClickHouse or TimescaleDB) for sub-second aggregation queries across millions of clicks. |
| 6 | **Server-side pagination** | Implement cursor-based pagination with Supabase's `range()` or keyset pagination. Fetch only the current page's URLs from the database. |
| 7 | **URL safety scanning** | Integrate Google Safe Browsing API or VirusTotal to scan destination URLs at creation time. Reject or flag links that point to known malicious domains. |
| 8 | **Rate limiting** | Add rate limiting at the Edge Function level using Upstash Redis or Cloudflare Rate Limiting to prevent abuse of link creation and click endpoints. |
| 9 | **Click deduplication** | Implement IP-based deduplication with a TTL window (e.g., same IP + same URL within 24h = 1 click) to prevent click inflation from bots or page reloads. |
| 10 | **TypeScript migration** | Convert the codebase from JSX to TSX for compile-time type safety, better IDE support, and reduced runtime errors. Supabase generates TypeScript types from the database schema. |
| 11 | **Error boundary and monitoring** | Add React Error Boundaries at the route level and integrate Sentry for runtime error tracking. Currently, errors are only logged to the console. |
| 12 | **E2E test suite** | Add Playwright tests covering the critical paths: signup → login → create link → view analytics → redirect → delete link. |

---

## Future Enhancements

| Enhancement | Description | Complexity |
|---|---|---|
| **Link Expiration** | Allow users to set TTL on short links; auto-delete expired links via a scheduled Edge Function | Medium |
| **Bulk Link Import** | CSV/JSON upload for creating multiple short links at once | Low |
| **Custom Domains** | Allow users to configure custom domains (e.g., `short.mycompany.com`) instead of `linklytics.online` | High |
| **Link Groups/Tags** | Organize links into folders or tag them for categorical filtering and aggregated analytics | Medium |
| **Time-Series Analytics** | Show click trends over time (hourly, daily, weekly) with area charts instead of just totals | Medium |
| **Referrer Tracking** | Capture the `document.referrer` to show which platforms (Twitter, LinkedIn, email) drive the most traffic | Low |
| **UTM Parameter Builder** | Auto-generate UTM-tagged URLs with a form interface for campaign tracking | Low |
| **Password-Protected Links** | Add an optional password gate before redirecting to the destination URL | Medium |
| **A/B Redirect Testing** | Split traffic between multiple destination URLs and compare click-through rates | High |
| **Webhook Notifications** | Fire a webhook when a link reaches a click threshold or expires | Medium |
| **Dark/Light Theme Toggle** | Persist user theme preference in `localStorage` and toggle Tailwind's `darkMode` class | Low |
| **PWA Support** | Add a service worker and manifest for offline dashboard access and home-screen installation | Medium |
| **Real-Time Click Feed** | Use Supabase Realtime subscriptions to show live click events as they happen on the analytics page | Medium |
| **Export Analytics** | CSV/PDF export of click data for reporting and offline analysis | Low |

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "Add: your feature description"`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request against the `main` branch

### Guidelines

- Follow the existing code style (ESLint config is provided)
- Keep PRs focused—one feature or fix per PR
- Add comments for complex logic
- Test your changes locally before submitting
- Update this README if you add new features or change existing behavior

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for the full text.

```
MIT License

Copyright (c) [2000] [Durga Prasad]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

<div align="center">

**Built with ❤️ by [Durga Prasad](https://www.linkedin.com/in/dpgaharwal)**
[LinkedIn](https://www.linkedin.com/in/dpgaharwal) · [GitHub](https://github.com/dpgaharwal)

</div>
