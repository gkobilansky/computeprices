# ComputePrices Database Documentation

## Database Provider
The application uses **Supabase** as its database provider, which is built on PostgreSQL.

Two database client connections are configured:
- `supabase.js`: Regular client with anonymous key for public operations
- `supabase-admin.js`: Admin client with service role key for privileged operations

## Database Schema

### Tables

#### 1. gpu_models
Primary table storing GPU information:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | GPU model name |
| slug | String | URL-friendly name (unique) |
| manufacturer | Enum | 'NVIDIA', 'AMD', 'Intel' |
| architecture | String | GPU architecture (e.g., 'Hopper', 'Ampere') |
| vram | Integer | GPU memory in GB |
| compute_units | Integer | Number of compute units |
| description | Text | Brief description |
| detailed_description | Text | Extended description |
| image_url | Text | Path to GPU image |
| use_case | Text | Primary use cases |

Technical specifications:
- cuda_cores, tensor_cores, rt_cores: Integer values
- memory_bandwidth_gbps, memory_interface_bit: Integer values
- manufacturing_process_nm: Integer
- tdp_watt, max_power_watt: Integer values
- fp16/fp32/fp64_performance_tflops: Decimal values
- int8_performance_tops: Decimal
- ml_perf scores: Decimal values

Market data:
- msrp_usd: Integer
- server_gpu: Boolean
- cloud_compatible: Boolean
- performance_tier: Enum ('entry', 'mid', 'high', 'ultra') - Required field with check constraint
- generation: Integer
- release_date, end_of_life_date: Date

#### 2. gpu_details
Stores additional technical specifications:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gpu_model_id | UUID | Foreign key to gpu_models.id (unique) |
| cuda_cores | Integer | Number of CUDA cores |
| tensor_cores | Integer | Number of tensor cores |
| base_clock_mhz | Integer | Base clock speed |
| boost_clock_mhz | Integer | Boost clock speed |
| memory_type | String | Memory type (e.g., GDDR6X) |
| memory_bandwidth_gbps | Decimal | Memory bandwidth |
| power_watts | Integer | Power consumption |
| interface | String | Connection interface |
| extra_specs | JSONB | Additional specifications |

#### 3. prices
Stores GPU pricing information from providers:

| Column | Type | Description |
|--------|------|-------------|
| provider_id | UUID | Foreign key to providers table |
| gpu_model_id | UUID | Foreign key to gpu_models.id |
| price_per_hour | Decimal | Hourly price |
| gpu_count | Integer | Number of GPUs in offering |
| created_at | Timestamp | When price was recorded |
| source_name | String | Source name |
| source_url | String | URL where price was found |

#### 4. providers
Contains cloud provider information:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Provider name |

#### 5. users
Stores user information for newsletter subscribers and future user data:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | Text | User email (unique) |
| name | Text | User name (optional) |
| source | Text | Registration source (default: 'newsletter') |
| subscribed_to_newsletter | Boolean | Newsletter subscription status |
| created_at | Timestamp | When user was created |
| updated_at | Timestamp | When user was last updated |

### Relationships

1. **gpu_models** ↔ **gpu_details**: One-to-one relationship via gpu_model_id
2. **gpu_models** ↔ **prices**: One-to-many relationship (one GPU model can have many price entries)
3. **providers** ↔ **prices**: One-to-many relationship (one provider can have many price entries)

### Database Features

1. **Indexes** for performance:
   - gpu_models.name
   - gpu_models.manufacturer
   - gpu_models.slug

2. **Row Level Security (RLS)** on gpu_details:
   - Public read access
   - Authenticated insert access

3. **Stored Procedures**:
   - `get_latest_prices`: Retrieves the most recent price data, optionally filtered by provider and GPU

## Data Flow

### Data Collection
- Automated scrapers collect GPU pricing from various cloud providers
- Each provider has a dedicated scraper in `/app/api/cron/[provider]/route.ts`
- Scrapers run on a schedule and update the prices table
- Newsletter signups are captured in the users table via the `/api/newsletter/signup` endpoint
- GPU model data can be updated via the `scripts/upsert-gpu-models.js` script (supports validation, data type conversion, and performance tier inference)

### Data Retrieval Functions
- `fetchGPUModels()`: Gets GPU information, optionally filtered by ID
- `fetchGPUPrices()`: Gets latest prices using the stored procedure
- `fetchLatestPriceDate()`: Gets most recent price data date
- `getGPUBySlug()`: Retrieves GPU by its URL slug

### Data Display
- GPU detail pages show comprehensive GPU info and pricing
- Provider pages display provider-specific pricing
- Various components present the data in tables for comparison

## Cron Job API Routes

The application includes automated data collection through cron job endpoints in `/app/api/cron/`. These routes scrape GPU pricing data from various cloud providers and update the database.

### Available Cron Routes

#### `/api/cron/all`
Master endpoint that triggers all individual provider scrapers concurrently:
- Calls all provider endpoints in parallel with 9-second timeout per request
- Returns 200 OK if all succeed, 207 Multi-Status if some fail
- Provides comprehensive results showing success/failure for each provider

#### Provider-Specific Routes

**1. `/api/cron/aws`**
- **Method**: Web scraping with Puppeteer
- **Source**: https://aws.amazon.com/ec2/capacityblocks/pricing/
- **Data**: Scrapes AWS EC2 capacity blocks pricing table
- **Provider ID**: `3bb5a379-472f-4c84-9ba4-3337f3922582`
- **Features**: Extracts instance type, region, price per GPU, GPU count, and VRAM

**2. `/api/cron/coreweave`**
- **Method**: Web scraping with Puppeteer  
- **Source**: https://www.coreweave.com/pricing
- **Data**: Scrapes Kubernetes GPU pricing table
- **Provider ID**: `1d434a66-bf40-40a8-8e80-d5ab48b6d27f`
- **Features**: Extracts GPU model names and hourly prices

**3. `/api/cron/datacrunch`**
- **Method**: Web scraping with Puppeteer
- **Source**: https://datacrunch.io/products
- **Data**: Scrapes multiple GPU configuration tables
- **Provider ID**: `fd8bfdf8-162d-4a95-954d-ca4279edc46f`
- **Features**: Extracts instance names, GPU models, counts, VRAM, and prices per GPU

**4. `/api/cron/fluidstack`**
- **Method**: Web scraping with Puppeteer
- **Source**: https://www.fluidstack.io/pricing
- **Data**: Scrapes on-demand pricing table
- **Provider ID**: `a4c4b4ea-4de7-4e04-8d40-d4c4fc1d8182`
- **Features**: Extracts GPU names and on-demand hourly prices (skips n/a entries)

**5. `/api/cron/hyperstack`**
- **Method**: Web scraping with Puppeteer
- **Source**: https://www.hyperstack.cloud/gpu-pricing
- **Data**: Scrapes GPU pricing table
- **Provider ID**: `54cc0c05-b0e6-49b3-95fb-831b36dd7efd`
- **Features**: Extracts GPU names, VRAM, and hourly prices

**6. `/api/cron/lambda`**
- **Method**: API integration
- **Source**: Lambda Labs API (https://cloud.lambdalabs.com/api/v1/instances)
- **Data**: Fetches instance types via REST API
- **Provider ID**: `825cef3b-54f5-426e-aa29-c05fe3070833`
- **Auth**: Requires `LAMBDA_LABS_API_KEY` environment variable
- **Features**: Processes API response for GPU descriptions, pricing, and GPU counts

**7. `/api/cron/runpod`**
- **Method**: Web scraping with Puppeteer
- **Source**: https://www.runpod.io/pricing
- **Data**: Scrapes GPU pricing cards
- **Provider ID**: `30a69dae-5939-499a-a4f5-5114797dcdb3`
- **Features**: Extracts GPU names, VRAM, and lowest price between Secure/Community Cloud

**8. `/api/cron/shadeform`**
- **Method**: API integration
- **Source**: Shadeform API (https://api.shadeform.ai/v1/instances/types)
- **Data**: Fetches instance types across multiple cloud providers
- **Auth**: Requires `SHADEFORM_API_KEY` environment variable
- **Features**: Groups instances by cloud provider, maps to provider IDs via `shadeformProviders.json`

### Common Scraper Features

All scrapers share these common patterns:

1. **GPU Model Matching**: Use `findMatchingGPUModel()` utility to match scraped GPU names with database records
2. **Database Updates**: Insert pricing data into the `prices` table with provider ID, GPU model ID, and pricing information
3. **Error Handling**: Comprehensive error handling with browser cleanup for Puppeteer-based scrapers
4. **Response Format**: Standardized JSON response showing matched/unmatched GPUs and database insertion results
5. **Logging**: Detailed console logging for debugging and monitoring

### Environment Variables Required

- `LAMBDA_LABS_API_KEY`: API key for Lambda Labs integration  
- `SHADEFORM_API_KEY`: API key for Shadeform integration