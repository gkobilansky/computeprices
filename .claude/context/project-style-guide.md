---
created: 2025-08-25T21:13:39Z
last_updated: 2025-08-25T21:13:39Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Standards & Conventions

### Language Standards
**JavaScript/TypeScript:**
- **ES Modules only** - All imports use `import/export` syntax
- **Progressive TypeScript** - Gradual migration from `.js` to `.tsx`/.ts`
- **Modern syntax** - Use async/await, destructuring, template literals
- **Strict mode** - All modules run in strict mode

### File Naming Conventions

#### Pages & Components
- **Pages:** `kebab-case` for route segments (`/providers/[slug]/page.js`)
- **Components:** `PascalCase` for React components
- **API routes:** `kebab-case` with `route.js` suffix
- **Dynamic routes:** Square brackets `[slug]` or `[...providers]` for catch-all

#### Scripts & Utilities  
- **Scripts:** `kebab-case` with descriptive names (`scrape-lambda.js`)
- **Utilities:** `camelCase` for function files
- **Configuration:** `kebab-case` for config files (`next.config.mjs`)

#### File Extensions
- **Pages:** `.js` for most App Router pages, `.tsx` for newer TypeScript pages
- **Components:** `.tsx` for React components with TypeScript
- **Scripts:** `.js` with ESM syntax
- **Configs:** `.mjs` for configuration files (explicit ESM)

### Directory Organization Patterns

#### Feature-Based Structure
```
/app/
  /compare/                    # Feature directory
    /[...providers]/          # Dynamic routing
      page.tsx                # Main page component
      loading.tsx             # Loading state
      not-found.tsx          # Error handling
```

#### Separation of Concerns
- **Pages** - App Router pages in `/app/`
- **Components** - Reusable UI in `/components/`
- **Utilities** - Shared logic in `/lib/`
- **Types** - TypeScript definitions in `/types/`
- **Scripts** - Automation in `/scripts/`
- **Data** - Static configuration in `/data/`

### Naming Conventions

#### Variables & Functions
- **camelCase** for variables and functions
- **PascalCase** for React components and classes
- **SCREAMING_SNAKE_CASE** for constants and environment variables
- **Descriptive names** - `fetchGPUPrices()` not `getData()`

#### Database & API Patterns
- **snake_case** for database columns (`gpu_model_id`)
- **camelCase** for JavaScript object properties
- **kebab-case** for URL slugs and API endpoints

#### Component Patterns
```javascript
// Component naming
const GPUComparisonTable = () => { ... }    // PascalCase
const useGPUPricing = () => { ... }          // camelCase for hooks

// Event handler patterns  
const handleProviderSelect = () => { ... }   // handle + Action pattern
const onPriceUpdate = () => { ... }          // on + Event pattern
```

### Code Structure Patterns

#### Import Organization
```javascript
// 1. Node modules
import React from 'react'
import { NextRequest } from 'next/server'

// 2. Internal utilities
import { supabase } from '@/lib/supabase'

// 3. Components
import GPUCard from '@/components/GPUCard'

// 4. Types
import type { GPUModel } from '@/types'
```

#### Function Structure
```javascript
// Async functions with error handling
export async function fetchGPUModels() {
  try {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('*')
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to fetch GPU models:', error)
    return []
  }
}
```

#### Component Structure
```javascript
// Component with TypeScript and proper exports
import type { GPUModel } from '@/types'

interface Props {
  gpuModel: GPUModel
  showPricing?: boolean
}

export default function GPUCard({ gpuModel, showPricing = false }: Props) {
  // Component logic
}
```

## Development Standards

### Environment Configuration
- **Multiple configs** - Separate TypeScript configs for different contexts
- **Environment variables** - `.env.local` for local development  
- **Path mapping** - Use `@/` for absolute imports from project root

### Error Handling Patterns
```javascript
// Graceful degradation in scrapers
try {
  const prices = await scrapeProvider()
  await saveToDatabase(prices)
} catch (error) {
  console.error(`Scraper failed for ${provider}:`, error)
  // Continue with other providers
}
```

### Testing & Validation
- **Dry-run support** - All data operations support `--dry-run` flag
- **Data validation** - Schema validation before database operations
- **Error logging** - Comprehensive error reporting in scraping operations

### Performance Standards
- **Static generation** - Pre-render pages where possible
- **Code splitting** - Dynamic imports for large components
- **Image optimization** - Proper Next.js image handling
- **Bundle optimization** - Tree shaking and minimal bundle size

## Documentation Standards

### Code Comments
- **JSDoc for functions** - Document parameters and return types
- **Inline comments** - Explain complex business logic
- **README updates** - Keep documentation current with changes
- **Type documentation** - Document complex TypeScript interfaces

### Git Commit Standards  
**Pattern:** `Issue #XX: Brief description of change`
- **Descriptive commits** - Clear explanation of what changed
- **Issue references** - Link commits to tracked issues
- **Atomic commits** - One logical change per commit

### API Documentation
- **Route documentation** - Document API endpoints and parameters
- **Error responses** - Document possible error conditions
- **Example usage** - Provide example requests and responses