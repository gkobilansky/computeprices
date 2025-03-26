# Project Memory Bank

## Architecture Decisions

### Frontend
- **Framework**: Next.js 15 with App Router
  - Rationale: Latest features, better performance, server components
- **Styling**: Tailwind CSS + DaisyUI
  - Rationale: Rapid development, consistent design, pre-built components
- **State Management**: React Context + Local State
  - Rationale: Appropriate for current scope, can scale to Redux if needed

### Backend
- **Database**: Supabase
  - Rationale: Real-time capabilities, built-in authentication, PostgreSQL
- **API**: Next.js API Routes
  - Rationale: Tight integration with frontend, serverless by default
- **Caching**: Vercel Edge Cache
  - Rationale: Global distribution, automatic cache invalidation
- **Data Collection**: Vercel Cron Jobs
  - Rationale: Serverless, scheduled execution, integrated logging

## Data Models

### Provider
```typescript
interface Provider {
  id: string;
  name: string;
  slug: string;
  website: string;
  logoUrl: string;
  description: string;
  apiEndpoint?: string;
  regions: Region[];
  features: ProviderFeature[];
  sponsorshipTier?: 'none' | 'silver' | 'gold' | 'platinum';
  sponsorshipExpiry?: Date;
  isFeatured: boolean;
  lastUpdated: Date;
}

interface Region {
  id: string;
  name: string;
  code: string;
  location: string;
  continent: string;
  latitude: number;
  longitude: number;
}

interface ProviderFeature {
  id: string;
  name: string;
  description: string;
  icon?: string;
}
```

### GPU Model
```typescript
interface GPUModel {
  id: string;
  manufacturer: 'NVIDIA' | 'AMD' | 'Intel';
  name: string;
  slug: string;
  architecture: string;
  memoryGB: number;
  memoryType: string;
  tensorCores?: number;
  cudaCores?: number;
  streamProcessors?: number;
  releaseDate: Date;
  performanceScore?: number;
  benchmarks?: Benchmark[];
}

interface Benchmark {
  id: string;
  name: string;
  score: number;
  unit: string;
}
```

### GPU Instance
```typescript
interface GPUInstance {
  id: string;
  providerId: string;
  gpuModelId: string;
  name: string;
  slug: string;
  description?: string;
  gpuCount: number;
  vcpuCount: number;
  memoryGB: number;
  storageGB: number;
  storageType: 'SSD' | 'HDD' | 'NVMe';
  networkGbps: number;
  regions: InstanceRegionPrice[];
  spotAvailable: boolean;
  reservedAvailable: boolean;
  onDemandAvailable: boolean;
  features: string[];
  lastUpdated: Date;
}

interface InstanceRegionPrice {
  regionId: string;
  onDemandPricePerHour?: number;
  spotPricePerHour?: number;
  reservedPricePerHour?: number;
  reservedUpfrontCost?: number;
  available: boolean;
}
```

### Price History
```typescript
interface PriceHistory {
  id: string;
  instanceId: string;
  regionId: string;
  pricingModel: 'onDemand' | 'spot' | 'reserved';
  timestamp: Date;
  price: number;
}
```

### Sponsorship
```typescript
interface Sponsorship {
  id: string;
  providerId: string;
  tier: 'silver' | 'gold' | 'platinum';
  startDate: Date;
  endDate: Date;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  benefits: SponsorshipBenefit[];
  contactName: string;
  contactEmail: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SponsorshipBenefit {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  deliveredAt?: Date;
}

interface SponsorshipTier {
  id: string;
  name: 'silver' | 'gold' | 'platinum';
  price: number;
  durationMonths: number;
  benefits: string[];
  maxSponsors: number;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionTier: 'free' | 'basic' | 'premium';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscriptionExpiry?: Date;
  preferences: UserPreferences;
  savedComparisons: SavedComparison[];
  priceAlerts: PriceAlert[];
  createdAt: Date;
  lastLogin: Date;
}

interface UserPreferences {
  defaultRegion?: string;
  defaultProvider?: string;
  defaultCurrency: 'USD' | 'EUR' | 'GBP';
  emailNotifications: boolean;
  darkMode: boolean;
}

interface SavedComparison {
  id: string;
  name: string;
  instances: string[];
  createdAt: Date;
}

interface PriceAlert {
  id: string;
  instanceId: string;
  regionId: string;
  priceThreshold: number;
  thresholdType: 'above' | 'below';
  notified: boolean;
  createdAt: Date;
}
```

## API Endpoints

### GPU Data
- `GET /api/gpus` - List all GPU instances
- `GET /api/gpus/:id` - Get specific GPU instance
- `GET /api/gpu-models` - List all GPU models
- `GET /api/gpu-models/:id` - Get specific GPU model
- `GET /api/providers` - List all providers
- `GET /api/providers/:id` - Get specific provider
- `GET /api/providers/:id/gpus` - List provider's GPUs
- `GET /api/regions` - List all regions
- `GET /api/price-history/:instanceId` - Get price history

### Sponsorship Management
- `GET /api/sponsors` - List all sponsors
- `GET /api/sponsors/:id` - Get specific sponsor details
- `GET /api/sponsorship-tiers` - List sponsorship tiers and benefits
- `POST /api/sponsors` - Create new sponsor
- `PUT /api/sponsors/:id` - Update sponsor details
- `GET /api/sponsors/:id/metrics` - Get sponsor metrics and analytics
- `POST /api/sponsorship-requests` - Submit sponsorship request
- `GET /api/featured-providers` - Get featured (sponsored) providers
- `GET /api/sponsorship-contracts/:id` - Get sponsorship contract details

### User Management
- `POST /api/auth/signup` - Create user account
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/comparisons` - Get saved comparisons
- `POST /api/user/comparisons` - Create saved comparison
- `GET /api/user/alerts` - Get price alerts
- `POST /api/user/alerts` - Create price alert
- `DELETE /api/user/alerts/:id` - Delete price alert

### Subscription
- `GET /api/subscription/plans` - Get subscription plans
- `POST /api/subscription/checkout` - Create checkout session
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/cancel` - Cancel subscription

## Important Dependencies
- `@supabase/supabase-js`: Database client
- `@vercel/analytics`: Usage tracking
- `daisyui`: UI components
- `zod`: Schema validation
- `swr`: Data fetching
- `date-fns`: Date manipulation
- `@stripe/stripe-js`: Payment processing
- `next-seo`: SEO management
- `react-query`: Data fetching and caching
- `pdfkit`: PDF generation for sponsorship agreements

## Performance Considerations
- Server components for static content
- Client components only for interactive elements
- Image optimization via Next.js Image
- Incremental Static Regeneration for pricing data
- Edge caching for API responses
- Database query optimization
- Pagination for large data sets

## Security Measures
- Input validation with Zod
- Rate limiting on API routes
- Secure headers configuration
- Authentication via Supabase Auth
- CORS policy implementation
- Data sanitization
- API key protection

## Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for data-heavy pages
- Accessibility testing for all components

## Monitoring
- Vercel Analytics for usage patterns
- Error tracking via Sentry
- Performance monitoring via Vercel
- Uptime monitoring for API integrations
- Database performance metrics
- User behavior analytics
- Sponsorship impact metrics

## Known Technical Debt
- Legacy scrapers in scripts folder
- Basic error handling
- Basic caching implementation
- Limited test coverage
- Simple data validation
- Basic security measures

## Future Technical Considerations
- GraphQL API implementation
- WebSocket for real-time updates
- Microservices for data collection
- Machine learning for price predictions
- Mobile app considerations
- Sponsor-specific API integrations 