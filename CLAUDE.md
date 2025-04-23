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
- performance_tier: Enum ('entry', 'mid', 'high', 'ultra')
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

### Data Retrieval Functions
- `fetchGPUModels()`: Gets GPU information, optionally filtered by ID
- `fetchGPUPrices()`: Gets latest prices using the stored procedure
- `fetchLatestPriceDate()`: Gets most recent price data date
- `getGPUBySlug()`: Retrieves GPU by its URL slug

### Data Display
- GPU detail pages show comprehensive GPU info and pricing
- Provider pages display provider-specific pricing
- Various components present the data in tables for comparison