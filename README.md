# Newberg Tea Centre

A production-ready full-stack web application for Ceylon tea discovery and transparent pricing — built for Browns Plantations.

> Tea categories, grade guides, live pricing and a full admin catalogue workspace in one polished interface.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-419803?logo=postgresql)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle)

---

## Architecture

```
Browser → Vite React SPA → Express API Server → Drizzle ORM → Neon PostgreSQL
```

- **Frontend**: React 19 + TypeScript + Vite 8 + React Router 7 + Lucide icons + Tailwind CSS v4
- **Backend**: Express 5 + TypeScript + JWT + httpOnly cookie auth
- **Database**: Neon PostgreSQL (serverless) + Drizzle ORM
- **Styling**: Custom CSS design tokens + Tailwind utility classes
- **Validation**: Zod schemas on all API inputs
- **Testing**: Vitest with V8 code coverage

---

## Features

### Public Site

| Feature | Description |
|---------|-------------|
| **Hero** | Full-width landing with animated badge, quick stats, CTA buttons |
| **Tea Price Finder** | Category tabs, group sub-filters, search, sort (price/alpha), expandable taste cards |
| **Tea Journey** | 3-slide image carousel with 7-step production story |
| **Grade Guide** | 4 popular grade cards linking into the price finder |
| **Price Calculator** | Category → grade → auto-fill kg price → type grams → instant result |
| **Why Tea** | 6-benefit grid with icons and descriptions |
| **Responsive** | Sticky nav, mobile hamburger menu, scroll-to-top button |
| **Footer** | 4-column layout with brand, explore links, Ceylon tea resources, quality badge |

### Admin Panel

| Feature | Description |
|---------|-------------|
| **Login** | JWT + httpOnly cookie dual auth, show/hide password toggle |
| **Dashboard** | 4 stat cards (total grades, published, low stock, avg price), quick actions, recent changes, price snapshot |
| **Tea Catalogue** | Full table with search, category/status/availability filters, quick publish/availability toggles, inline actions |
| **Tea Create/Edit** | 14-field form: grade code, name, slug, category, processing method, group, description, taste profile, cup colour, best for, price, effective date, display order, status |
| **Price Management** | Current price list with per-grade editing and preview |
| **Bulk Price Update** | Select multiple grades → apply +1%, −1%, +5%, −5% adjustments with confirmation |
| **Price History** | Full audit trail with grade name, old/new price, % change, timestamp |
| **Availability** | Quick stock status management (Available / Low Stock / Out of Stock) |
| **Categories** | Create and edit category names, descriptions, display order |
| **Images** | URL-based image management for hero and story sections with validation |
| **Activity Log** | Timestamped record of every admin mutation |
| **Settings** | Currency, price basis, public disclaimer configuration |

---

## Project Structure

```
newberg-tea-centre/
├── src/                          # React frontend
│   ├── App.tsx                   # Router definitions (all routes)
│   ├── main.tsx                  # React entry point (StrictMode)
│   ├── index.css                 # Global styles, CSS variables, Tailwind
│   ├── layouts/
│   │   ├── PublicLayout.tsx      # Sticky header + nav + footer + scroll-to-top
│   │   └── AdminLayout.tsx       # Sidebar + top bar + auth guard
│   ├── pages/
│   │   ├── public/               # 6 public pages
│   │   │   ├── HomePage.tsx      # Landing page (single-page layout)
│   │   │   ├── TeaFinderPage.tsx # Standalone /tea price finder
│   │   │   ├── TeaDetailPage.tsx # Grade detail with calculator
│   │   │   ├── GradesPage.tsx    # Grade guide
│   │   │   ├── AboutPage.tsx     # About page
│   │   │   └── NotFoundPage.tsx  # 404
│   │   └── admin/                # 12 admin pages
│   │       ├── AdminLoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── TeaCataloguePage.tsx
│   │       ├── TeaEditPage.tsx
│   │       ├── CategoriesPage.tsx
│   │       ├── PricesPage.tsx
│   │       ├── BulkPricePage.tsx
│   │       ├── PriceHistoryPage.tsx
│   │       ├── AvailabilityPage.tsx
│   │       ├── ImagesPage.tsx
│   │       ├── ActivityPage.tsx
│   │       └── SettingsPage.tsx
│   └── lib/
│       ├── api.ts                # Typed API client (all endpoints)
│       └── utils.ts              # Formatters: rs(), pctChange(), slugify(), etc.
│
├── server/                       # Express backend
│   ├── index.ts                  # Server entry (port 3001, CORS, cookie-parser)
│   ├── middleware/
│   │   └── auth.ts              # JWT verification + role-based access guard
│   └── routes/
│       ├── auth.ts              # POST /login, /logout, GET /me
│       ├── public.ts            # GET /categories, /grades, /grades/:slug, /stats
│       └── admin.ts             # Full CRUD: tea, categories, prices, bulk, history, activity, settings, images
│
├── db/                           # Database layer
│   ├── client.ts                 # Neon + Drizzle connection singleton
│   ├── seed.ts                   # Seed script (3 categories, 12 grades, 12 prices, admin user)
│   └── schema/
│       ├── index.ts              # Barrel export for all 8 tables
│       ├── users.ts              # Admin/editor accounts
│       ├── categories.ts         # Tea category groupings
│       ├── tea-grades.ts         # Individual tea grade records
│       ├── prices.ts             # Current price per grade (one active per grade)
│       ├── price-history.ts      # Immutable price change audit trail
│       ├── activity-logs.ts      # Admin mutation audit trail
│       ├── settings.ts           # Key-value app configuration
│       └── images.ts             # URL-based image management
│
├── scripts/                      # Utility scripts
│   ├── verify-db.ts             # Test Neon connection + list tables
│   ├── verify-data.ts           # Verify seeded data integrity
│   └── seed-admin.ts            # Seed admin user only
│
├── tests/
│   ├── unit/
│   │   ├── utils.test.ts        # 23 tests: rs(), pctChange(), availabilityLabel(), slugify()
│   │   ├── price-calculation.test.ts  # 28 tests: per-gram calc, bulk operations, seed validation
│   │   └── validation.test.ts   # 18 tests: Zod schemas (login, tea, price, bulk, category)
│   └── integration/
│       └── api.test.ts          # Full API integration: health, public, auth, admin CRUD lifecycle
│
├── DemoHtml/                     # Original HTML reference demos
├── drizzle.config.ts             # Drizzle Kit configuration
├── vite.config.ts                # Vite + React + Tailwind + API proxy
├── vitest.config.ts              # Test configuration
├── tsconfig.json                 # TypeScript project references
├── index.html                    # Vite SPA entry HTML
├── package.json
└── .env.example                  # Environment variable template
```

---

## Database Schema

8 tables powered by Neon PostgreSQL:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    users     │    │  categories  │    │   images     │
│──────────────│    │──────────────│    │──────────────│
│ id (UUID PK) │    │ id (UUID PK) │    │ id (UUID PK) │
│ name         │    │ name         │    │ section      │
│ email (UNI)  │    │ slug (UNI)   │    │ image_url    │
│ password_hash│    │ subtitle     │    │ alt          │
│ role         │    │ description  │    │ caption      │
│ is_active    │    │ display_order│    │ display_order│
└──────────────┘    │ is_active    │    │ is_active    │
                    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  tea_grades  │
                    │──────────────│
                    │ id (UUID PK) │◄──────┐
                    │ category_id  │       │
                    │ grade_code   │  ┌────┴────────┐
                    │ name         │  │   prices    │
                    │ slug         │  │─────────────│
                    │ processing_method │ id (UUID PK)│
                    │ group_name   │  │ tea_grade_id│
                    │ description  │  │ price_per_kg│
                    │ taste_profile│  │ currency    │
                    │ cup_colour   │  │ is_current  │
                    │ best_for     │  │ effective_from│
                    │ availability │  └──────┬──────┘
                    │ is_published │         │
                    │ display_order│  ┌──────▼──────┐
                    └──────────────┘  │price_history│
                                      │─────────────│
┌──────────────┐                      │ tea_grade_id│
│ settings     │                      │ old_price   │
│──────────────│                      │ new_price   │
│ id (UUID PK) │                      │ percentage  │
│ key (UNI)    │                      │ changed_by  │
│ value        │                      │ reason      │
│ updated_by   │                      └─────────────┘
└──────────────┘
                    ┌──────────────┐
                    │activity_logs │
                    │──────────────│
                    │ id (UUID PK) │
                    │ action       │
                    │ entity_type  │
                    │ entity_id    │
                    │ description  │
                    │ metadata     │
                    └──────────────┘
```

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/images` | Public images (hero, story slides) |
| `GET` | `/api/public/categories` | All active categories |
| `GET` | `/api/public/grades` | Published grades with prices (filterable) |
| `GET` | `/api/public/grades/:slug` | Single grade detail |
| `GET` | `/api/public/stats` | Hero stats (total grades, min/avg price) |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate → JWT token + httpOnly cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Current authenticated user |

### Admin (JWT Required)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/dashboard` | Any | Dashboard stats |
| `GET` | `/api/admin/tea` | Any | List all grades (filterable) |
| `POST` | `/api/admin/tea` | Editor+ | Create grade |
| `GET` | `/api/admin/tea/:id` | Any | Single grade by UUID |
| `PUT` | `/api/admin/tea/:id` | Editor+ | Update grade |
| `DELETE` | `/api/admin/tea/:id` | Admin | Delete grade |
| `PATCH` | `/api/admin/tea/:id/availability` | Editor+ | Update stock status |
| `PATCH` | `/api/admin/tea/:id/publish` | Editor+ | Toggle publish |
| `GET` | `/api/admin/categories` | Any | List categories |
| `POST` | `/api/admin/categories` | Admin | Create category |
| `PUT` | `/api/admin/categories/:id` | Admin | Update category |
| `GET` | `/api/admin/prices` | Any | Current prices |
| `POST` | `/api/admin/prices` | Editor+ | Update price |
| `POST` | `/api/admin/prices/bulk` | Admin | Bulk price adjustment |
| `GET` | `/api/admin/prices/history` | Any | Price change history |
| `GET` | `/api/admin/activity` | Any | Activity log |
| `GET` | `/api/admin/settings` | Any | App settings |
| `PUT` | `/api/admin/settings` | Admin | Update settings |
| `GET` | `/api/admin/images` | Any | List images |
| `POST` | `/api/admin/images` | Editor+ | Add image |
| `PUT` | `/api/admin/images/:id` | Editor+ | Update image |
| `DELETE` | `/api/admin/images/:id` | Admin | Delete image |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **Neon PostgreSQL** account (free tier works)

### 1. Clone & Install

```bash
git clone <repository-url>
cd newberg-tea-centre
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
AUTH_SECRET=your-random-secret-string-here
ADMIN_EMAIL=admin@newbergtea.com
ADMIN_PASSWORD=NewbergAdmin2026!
ADMIN_NAME=Newberg Admin
```

### 3. Push Schema & Seed

```bash
npm run db:push      # Create all 8 tables in Neon
npm run db:seed      # Insert 3 categories, 12 grades, 12 prices, admin user
```

### 4. Start Development

```bash
npm run dev
```

Opens two servers:
- **Vite client**: `http://localhost:5173`
- **Express API**: `http://localhost:3001` (proxied via Vite)

### 5. Verify

```bash
npm run db:verify    # Check database connection + list tables
npm run test         # Run all unit + integration tests
```

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API server + Vite client concurrently |
| `npm run dev:server` | Start Express API server only (with file watching) |
| `npm run dev:client` | Start Vite dev server only |
| `npm run build` | TypeScript check + Vite production build |
| `npm run start` | Start Express server in production mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all files |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with V8 code coverage report |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly to Neon (no migration files) |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run db:seed` | Seed categories, grades, prices, settings, admin |
| `npm run db:verify` | Verify Neon connection and list tables |
| `npm run seed-admin` | Seed admin user only |

---

## Default Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@newbergtea.com` |
| **Password** | `NewbergAdmin2026!` |
| **Role** | `ADMIN` (full access) |

Login at: `http://localhost:5173/admin/login`

---

## Seed Data

### Categories (3)

| Name | Slug | Order |
|------|------|-------|
| Black Tea | black-tea | 1 |
| Green Tea | green-tea | 2 |
| Specialty Tea | specialty-tea | 3 |

### Tea Grades (12)

| Grade | Category | Method | Price (LKR/kg) | Stock |
|-------|----------|--------|-----------------|-------|
| BOP | Black Tea | Orthodox | Rs. 1,280 | Available |
| BOPF | Black Tea | Orthodox | Rs. 1,210 | Available |
| FBOP | Black Tea | Orthodox | Rs. 1,460 | Low Stock |
| OP | Black Tea | Orthodox | Rs. 1,390 | Available |
| BP1 | Black Tea | CTC | Rs. 1,150 | Available |
| PF1 | Black Tea | CTC | Rs. 1,090 | Out of Stock |
| GP | Green Tea | Green | Rs. 1,720 | Available |
| GP1 | Green Tea | Green | Rs. 1,810 | Available |
| CH | Green Tea | Green | Rs. 1,640 | Available |
| GT-OP | Green Tea | Green | Rs. 1,880 | Low Stock |
| SILVER-TIPS | Specialty Tea | White Tea | Rs. 6,200 | Available |
| GOLDEN-TIPS | Specialty Tea | White Tea | Rs. 7,800 | Available |

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#173226` | Deep tea green — primary text, dark backgrounds |
| `--cream` | `#f6f1e7` | Warm off-white — page background |
| `--paper` | `#fffdf8` | Clean white — cards, panels |
| `--gold` | `#c69a52` | Tea gold — accents, buttons, badges |
| `--gold2` | `#e2c78e` | Light gold — secondary accents |
| `--leaf` | `#718a61` | Leaf green — availability badges |
| `--muted` | `#69736c` | Grey-green — secondary text |
| `--line` | `#e6dfd2` | Warm grey — borders, dividers |
| `--danger` | `#a35f4c` | Red-brown — destructive actions |

**Fonts**: Playfair Display (serif headings), Inter (sans body)

---

## Testing

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Test Suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `utils.test.ts` | 23 | Currency formatting, percentage change, availability labels, slugify |
| `price-calculation.test.ts` | 28 | Per-gram calculations, bulk operations, seed data validation |
| `validation.test.ts` | 18 | Zod schemas (login, tea, price, bulk, category) |
| `api.test.ts` | ~30 | Full API integration: health, public, auth, admin CRUD lifecycle |
| **Total** | **~99** | |

---

## Deployment

### Vercel

1. **Frontend**: Build to `dist/` and deploy as a static site
2. **Backend**: Convert Express routes to Vercel serverless functions under `/api/`
3. Add rewrite rule in `vercel.json` for SPA routing:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Strong random secret for JWT signing |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Set to `production` for secure cookies |

---

## Tech Stack Details

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2 |
| Language | TypeScript | 6.0 |
| Build Tool | Vite | 8.2 |
| Routing | React Router | 7.18 |
| CSS | Tailwind CSS | 4.3 |
| Icons | Lucide React | 1.43 |
| Server | Express | 5.2 |
| Database | Neon PostgreSQL | Serverless |
| ORM | Drizzle ORM | 0.45 |
| Validation | Zod | 4.5 |
| Auth | JWT + bcryptjs | 9.0 / 3.0 |
| Testing | Vitest | 5.0 |
| Coverage | V8 Coverage | 5.0 |
| Linting | ESLint | 10.9 |

---

## License

Proprietary — Browns Plantations / Newberg Tea Centre.

---

## Acknowledgements

- Sri Lanka Tea Board for Ceylon tea reference data
- Original HTML demo designs in `DemoHtml/`
