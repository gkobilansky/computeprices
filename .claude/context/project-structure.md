---
created: 2025-08-25T21:13:39Z
last_updated: 2025-08-25T21:13:39Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Root Directory Structure
```
computeprices/
├── .claude/                    # Claude Code configuration and context
├── .cursor/                    # Cursor IDE configuration
├── .git/                       # Git repository data
├── .next/                      # Next.js build output
├── .vscode/                    # VS Code configuration
├── app/                        # Next.js App Router pages and API routes
├── components/                 # Reusable React components
├── data/                       # Static data and configuration files
├── docs/                       # Project documentation
├── lib/                        # Shared utilities and configurations
├── node_modules/               # NPM dependencies
├── public/                     # Static assets (images, icons, etc.)
├── scripts/                    # Build and automation scripts
├── supabase/                   # Database schema and migrations
├── types/                      # TypeScript type definitions
└── Configuration files         # Package.json, configs, etc.
```

## Key Directory Details

### `/app/` - Next.js App Router
**Structure:** Next.js 13+ App Router architecture
- `layout.js` - Root layout component
- `page.js` - Homepage
- `sitemap.js` - Dynamic sitemap generation
- `robots.js` - SEO robots configuration
- `metadata.js` - Meta tag management
- `not-found.js` - 404 error page

**Route Structure:**
- `/providers/` - Provider listing and detail pages
  - `[slug]/page.js` - Dynamic provider pages
- `/gpus/` - GPU listing and detail pages  
  - `[slug]/page.js` - Dynamic GPU pages
  - `metadata.js` - GPU-specific metadata
- `/compare/` - Comparison functionality
  - `[...providers]/` - Multi-provider comparison
    - `page.tsx` - Comparison page (TypeScript)
    - `loading.tsx` - Loading state
    - `not-found.tsx` - Not found handling
- `/learn/` - Educational content
  - `page.tsx` - Learning resources
- `/api/` - API routes
  - `newsletter/signup/route.js` - Newsletter subscription

### `/components/` - React Components
**Organization:** Feature-based component structure
- Reusable UI components for the application
- Likely contains comparison tables, provider cards, GPU listings

### `/lib/` - Shared Libraries
**Purpose:** Utilities, configurations, and shared logic
- Database connections (Supabase)
- Utility functions
- Shared configurations

### `/scripts/` - Automation Scripts
**Functionality:** Data management and scraping
- Multiple scraper scripts for different providers
- GPU model management scripts
- Data enrichment utilities

**Key Scripts (from package.json):**
- `scrape:*` - Provider-specific scrapers (Lambda, AWS, CoreWeave, etc.)
- `upsert:gpu-models` - GPU model data management
- `seed` - Database seeding
- `download-images` - Image asset management

### `/data/` - Static Data
**Purpose:** Configuration data and static datasets
- Provider configurations
- GPU model definitions
- Comparison matrices

### `/types/` - TypeScript Definitions
**Files:**
- `index.ts` - Core type definitions
- `comparison.ts` - Comparison-specific types
- `learn.ts` - Learning content types

## File Naming Patterns

### Pages
- **JavaScript:** `.js` extension for most App Router pages
- **TypeScript:** `.tsx` for newer comparison and learning pages
- **Dynamic Routes:** `[slug]` for single parameters, `[...providers]` for catch-all

### Configuration
- **Module format:** `.mjs` extensions (ESM)
- **TypeScript configs:** Multiple tsconfig files for different contexts

## Module Organization
- **ESM modules** throughout (package.json `"type": "module"`)
- **App Router** pattern with colocation of page components
- **Feature-based** organization for complex functionality like comparisons
- **Hybrid JS/TS** approach with gradual TypeScript adoption