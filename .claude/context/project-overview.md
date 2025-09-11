---
created: 2025-08-25T21:13:39Z
last_updated: 2025-08-25T21:13:39Z
version: 1.0
author: Claude Code PM System
---

# Project Overview

## System Overview
**ComputePrices** is a Next.js-based web application that provides comprehensive GPU cloud pricing comparison across multiple providers. The platform combines automated data collection, detailed technical specifications, and user-friendly comparison tools.

## Core Features

### 1. Automated Price Collection System
**Infrastructure:**
- **Provider Scrapers:** Individual scripts for each cloud provider
- **API Integrations:** Direct API connections where available (Lambda Labs, Shadeform)
- **Web Scraping:** Puppeteer-based automation for providers without APIs
- **Scheduling:** Automated daily updates via cron jobs
- **Data Validation:** Built-in validation and dry-run capabilities

**Supported Providers:**
- AWS EC2 (Capacity Blocks) - Web scraping
- CoreWeave - Web scraping  
- DataCrunch - Web scraping
- FluidStack - Web scraping
- Hyperstack - Web scraping
- Lambda Labs - API integration
- RunPod - Web scraping
- Shadeform - API integration (multi-provider aggregator)

### 2. GPU Database & Specifications
**Comprehensive GPU Data:**
- **Technical specs:** CUDA cores, tensor cores, memory bandwidth
- **Performance metrics:** TFLOPS ratings across different precisions
- **Market data:** MSRP, release dates, performance tiers
- **Use cases:** Optimal applications and workload recommendations
- **Architecture details:** Manufacturing process, power consumption

**Data Management:**
- **Upsert scripts:** Bulk GPU model management with validation
- **Image assets:** Automated GPU image downloading and management
- **Data enrichment:** Scripts for enhancing GPU specifications

### 3. Dynamic Comparison System
**Comparison Pages:**
- **Multi-provider comparison:** `/compare/[...providers]` dynamic routing
- **Provider-specific pages:** `/providers/[slug]` individual provider analysis  
- **GPU detail pages:** `/gpus/[slug]` comprehensive GPU information
- **Feature matrices:** Side-by-side technical comparisons
- **Pricing tables:** Real-time price comparison with GPU count normalization

### 4. SEO & Discovery Features
**Search Optimization:**
- **Dynamic sitemap:** Automated generation for all pages
- **Structured data:** JSON-LD for rich search results
- **Meta optimization:** Dynamic meta tags for each comparison
- **Robots.txt:** SEO-friendly crawler configuration
- **Static generation:** Pre-rendered pages for performance

### 5. User Engagement Platform
**Newsletter System:**
- **Signup API:** `/api/newsletter/signup` endpoint
- **User database:** Supabase user management
- **Email collection:** Newsletter subscriber tracking
- **Source attribution:** Registration source tracking

**Educational Content:**
- **Learning section:** `/learn/` educational resources
- **Documentation:** Comprehensive project documentation
- **Best practices:** GPU computing guidance and recommendations

## Current State & Capabilities

### Active Features
✅ **8+ Provider Integration** - Comprehensive provider coverage  
✅ **Real-time Price Updates** - Daily automated data collection  
✅ **GPU Specifications Database** - 50+ GPU models with detailed specs  
✅ **Dynamic Comparison Tools** - Multi-provider comparison pages  
✅ **SEO Optimization** - Full search engine optimization  
✅ **Newsletter Platform** - User engagement and retention  
✅ **Performance Optimization** - Static generation and caching  

### Development Status
**Recently Completed:**
- Provider comparison system with dynamic routing
- Comprehensive SEO implementation with structured data
- Static generation optimization for comparison pages  
- Feature comparison matrix components
- Provider validation and canonical redirects
- Pricing comparison table components

**Current Focus:**
- Provider comparison improvements (active branch)
- Performance optimization for comparison pages
- Enhanced comparison functionality and user experience

### Technical Integration Points

**Database Layer:**
- **Supabase PostgreSQL** - Primary data storage
- **Row Level Security** - Fine-grained access control
- **Stored procedures** - Complex query optimization
- **Admin/public clients** - Separated access patterns

**External Services:**
- **Vercel Analytics** - Performance and usage tracking
- **Browserless.io** - Production scraping infrastructure (optional)
- **Provider APIs** - Direct integrations where available

**Development Tools:**
- **TypeScript migration** - Progressive type safety adoption
- **ESLint configuration** - Code quality enforcement
- **Multiple test environments** - Development/production separation
- **Automated scripts** - Comprehensive data management utilities

## Scaling & Growth Capabilities

### Current Scalability
- **Serverless deployment** - Auto-scaling with Vercel
- **Static generation** - High-performance page delivery  
- **Concurrent scraping** - Parallel provider data collection
- **Database optimization** - Indexed queries and stored procedures

### Growth Readiness
- **Provider expansion** - Modular scraper architecture supports new providers
- **GPU coverage expansion** - Flexible schema for new GPU models
- **Feature enhancement** - Component-based architecture for new comparison tools
- **API potential** - Foundation for programmatic access to pricing data