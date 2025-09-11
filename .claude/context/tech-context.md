---
created: 2025-08-25T21:13:39Z
last_updated: 2025-08-25T21:13:39Z
version: 1.0
author: Claude Code PM System
---

# Technical Context

## Core Technology Stack

### Runtime & Framework
- **Node.js** - JavaScript runtime (ESM modules)
- **Next.js 15.1.0** - React framework with App Router
- **React 19.0.0** - UI library (latest stable)
- **React DOM 19.0.0** - React renderer

### Development Environment
- **TypeScript** - Gradual adoption (mixed JS/TS codebase)
- **ESLint** - Code linting with Next.js configuration
- **Turbopack** - Fast bundler for development (`next dev --turbopack`)

### Database & Backend
- **Supabase** - PostgreSQL database and backend services
- **@supabase/supabase-js 2.47.6** - JavaScript client library

### Styling & UI
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **DaisyUI 4.12.22** - Component library for Tailwind
- **PostCSS 8** - CSS post-processing
- **@headlessui/react 2.2.0** - Unstyled accessible UI components

### Web Scraping & Automation
- **Puppeteer 23.11.1** - Browser automation for scraping
- **Puppeteer Core 21.5.0** - Lightweight browser control
- **@sparticuz/chromium 131.0.0** - Chromium for serverless environments

### Analytics & Monitoring
- **@vercel/analytics 1.4.1** - Vercel analytics integration

### Development Dependencies
- **TypeScript tooling:**
  - `@types/react 19.0.2` - React type definitions
  - `ts-node 10.9.2` - TypeScript execution
  - `tsconfig-paths 4.2.0` - Path mapping support

- **Data Processing:**
  - `csv-parser 3.2.0` - CSV data parsing
  - `chalk 5.4.1` - Terminal styling for scripts
  - `dotenv 16.4.7` - Environment variable management

## Architecture Patterns

### Module System
- **ESM only** - `"type": "module"` in package.json
- **Modern imports** - All imports use ES6 module syntax
- **TypeScript config** - Multiple configurations for different contexts

### Deployment & Build
- **Vercel platform** - Optimized for Next.js deployment
- **Static generation** - Performance optimization for comparison pages
- **Serverless functions** - API routes as serverless functions

### Development Workflow
```json
{
  "dev": "next dev --turbopack",     // Fast development with Turbopack
  "build": "next build",             // Production build
  "start": "next start",             // Production server
  "lint": "next lint"                // Code linting
}
```

### Data Management Scripts
Extensive automation for GPU pricing data:
- **Provider scrapers** - Individual scripts for each cloud provider
- **Data validation** - GPU model validation and management
- **Batch operations** - `scrape:all` for comprehensive data collection
- **Dry run support** - Safe testing of data operations

## Environment Configuration
- **Development:** `.env.local` for local environment variables
- **Multiple configs:** Separate TypeScript configurations for scripts vs. app
- **Path resolution:** Custom path mappings for imports

## Browser Support & Performance
- **Modern browsers** - React 19 and Next.js 15 requirements
- **Chromium automation** - Headless browser for data collection
- **Static optimization** - Pre-rendered pages for better performance
- **SEO optimization** - Structured data and meta tag management

## Security & Data Protection
- **Environment isolation** - Separate configs for different environments  
- **API key management** - Secure handling of provider API credentials
- **Database security** - Supabase RLS and secure client configurations