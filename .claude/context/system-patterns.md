---
created: 2025-08-25T21:13:39Z
last_updated: 2025-08-25T21:13:39Z
version: 1.0
author: Claude Code PM System
---

# System Patterns

## Architectural Style
**Pattern:** JAMstack (JavaScript, APIs, Markup)
- **Frontend:** Next.js with static generation and SSR
- **Backend:** Supabase as Backend-as-a-Service
- **Data:** PostgreSQL with automated scrapers for real-time pricing

## Core Design Patterns

### 1. Data Flow Architecture
**Pattern:** Unidirectional data flow with periodic batch updates
```
External APIs → Scrapers → Database → Next.js Pages → Static Generation
```

- **Data Collection:** Automated scrapers collect pricing from multiple providers
- **Data Storage:** Centralized in Supabase PostgreSQL database
- **Data Presentation:** Static pages with dynamic pricing data
- **Data Validation:** Built-in validation and dry-run capabilities

### 2. Route-Based Architecture
**Pattern:** Next.js App Router with dynamic routing
- **Dynamic Routes:** `[slug]` pattern for GPU and provider pages
- **Catch-all Routes:** `[...providers]` for flexible comparison URLs
- **API Routes:** RESTful endpoints in `/api/` directory
- **Middleware:** Request processing and redirects

### 3. Component Composition Pattern
**Pattern:** Feature-based component organization
- **Reusable Components:** Shared UI elements in `/components/`
- **Page Components:** Route-specific components in App Router
- **Layout Components:** Nested layouts with `layout.js` files
- **Specialized Components:** Comparison tables, pricing matrices

### 4. Data Scraping Pattern
**Pattern:** Provider-specific scrapers with unified interface
```javascript
// Consistent scraper pattern across providers
{
  "scrape:provider": "script with dry-run support",
  "scrape:provider:dry": "safe testing mode"
}
```

**Features:**
- **Dry-run capability** - Test without database writes
- **Error handling** - Graceful failure handling
- **Rate limiting** - Respectful scraping practices
- **Data normalization** - Consistent format across providers

### 5. Configuration-Driven Development
**Pattern:** External configuration for scalability
- **Provider configs** - JSON-based provider definitions
- **GPU model data** - Structured data files for GPU specifications
- **Comparison matrices** - Data-driven comparison logic
- **Environment separation** - Clear dev/prod configuration boundaries

## Integration Patterns

### Database Integration
**Pattern:** Supabase client with admin/public separation
- **Public client** - Anonymous access for read operations
- **Admin client** - Privileged operations for data management
- **RLS (Row Level Security)** - Fine-grained access control
- **Stored procedures** - Complex queries and data aggregation

### External API Integration
**Pattern:** Multi-provider aggregation
- **Lambda Labs API** - Direct API integration
- **Shadeform API** - Multi-cloud provider aggregation  
- **Web scraping** - Browser automation for providers without APIs
- **Error resilience** - Graceful handling of provider failures

### SEO & Performance Patterns
**Pattern:** Static-first with dynamic data
- **Static generation** - Pre-built pages for performance
- **Dynamic imports** - Code splitting for optimal loading
- **Structured data** - JSON-LD for search engine optimization
- **Sitemap generation** - Automated sitemap for all routes

## Error Handling Patterns

### Graceful Degradation
- **Provider failures** - Continue with available data
- **Scraping errors** - Log and continue with other providers
- **Database failures** - Fallback to cached data where possible
- **Build failures** - Incremental regeneration capabilities

### Validation Patterns
- **Data validation** - Schema validation for incoming data
- **Type checking** - Progressive TypeScript adoption
- **Dry-run testing** - Safe operation testing
- **Model validation** - GPU model data consistency checks

## Scaling Patterns

### Horizontal Scaling
- **Serverless deployment** - Auto-scaling with Vercel/Next.js
- **Database scaling** - Supabase managed PostgreSQL scaling
- **CDN distribution** - Static asset and page distribution
- **Concurrent scraping** - Parallel provider data collection

### Data Management Scaling
- **Batch operations** - Efficient bulk data operations
- **Incremental updates** - Update only changed data
- **Caching strategies** - Multiple layers of caching
- **Archive patterns** - Historical pricing data management