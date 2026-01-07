# Supabase Migration Workflow

This document outlines the safe workflow for database migrations across different environments.

## Environment Overview

| Environment | Database URL | Purpose |
|-------------|--------------|---------|
| Local | `http://127.0.0.1:54321` | Development and testing |
| Production | `https://<project-id>.supabase.co` | Live application |

## Migration Files Location

All migration files are stored in `supabase/migrations/` with the naming convention:
```
YYYYMMDDHHMMSS_description.sql
```

Example: `20251203133000_align_with_prod_schema.sql`

## Local Development Workflow

### 1. Start Local Supabase

```bash
# Start local Supabase (requires Docker)
supabase start

# Check status
supabase status
```

### 2. Create a New Migration

```bash
# Generate a new migration file
supabase migration new <description>

# Example
supabase migration new add_user_preferences_table
```

This creates a new file like `supabase/migrations/20260107120000_add_user_preferences_table.sql`

### 3. Write Your Migration SQL

Edit the generated file with your SQL changes:

```sql
-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. Apply Migration Locally

```bash
# Apply all pending migrations to local database
supabase db push

# Or reset local database completely (DESTRUCTIVE)
supabase db reset
```

### 5. Test Your Changes

- Run the application locally
- Execute relevant tests
- Verify data integrity

## Production Migration Workflow

### Option A: GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically applies migrations when changes to `supabase/migrations/` are merged to `main`.

**Setup required secrets in GitHub:**
1. Go to Repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `SUPABASE_PROJECT_REF` - Your project ID (found in Dashboard URL or Settings)
   - `SUPABASE_ACCESS_TOKEN` - Personal access token from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
   - `SUPABASE_DB_PASSWORD` - Database password from Dashboard > Settings > Database

**How it works:**
1. Create a PR with migration files in `supabase/migrations/`
2. PR is reviewed and merged to `main`
3. GitHub Actions automatically runs `supabase db push`
4. Check Actions tab for migration logs and status

**Manual trigger:**
You can also manually trigger the workflow from the Actions tab using "workflow_dispatch".

### Option B: Supabase GitHub Integration

1. **Enable Supabase GitHub Integration**
   - Go to Supabase Dashboard > Settings > Integrations
   - Connect your GitHub repository
   - Configure to auto-apply migrations on merge to `main`

2. **Create a Pull Request**
   - Create a branch with your migration files
   - Push to GitHub
   - Create PR for review

3. **Review and Merge**
   - Review migration SQL carefully
   - Ensure migration is reversible if possible
   - Merge to `main`
   - Supabase automatically applies the migration

### Option C: Manual via Supabase Dashboard

1. **Prepare Your Migration**
   - Test thoroughly on local database
   - Review SQL for any destructive operations

2. **Apply via SQL Editor**
   - Go to Supabase Dashboard > SQL Editor
   - Copy your migration SQL
   - Review one more time
   - Execute

3. **Verify**
   - Check Table Editor for expected changes
   - Test application functionality

### Option D: Supabase CLI (Use with Caution)

```bash
# Link to production project (one-time setup)
supabase link --project-ref <your-project-id>

# DANGER: This pushes ALL local migrations to production
# Only use if you're certain about what you're doing
supabase db push
```

**WARNING**: This approach pushes ALL pending migrations. Use only if:
- You've thoroughly tested all migrations locally
- You understand exactly what changes will be applied
- You have a database backup

## Safety Checklist

Before applying any production migration:

- [ ] Migration tested locally with `supabase db push`
- [ ] Application tested with the new schema
- [ ] Relevant tests passing
- [ ] Migration SQL reviewed for:
  - [ ] No accidental data deletion
  - [ ] Proper foreign key constraints
  - [ ] Appropriate RLS policies
  - [ ] Index creation for performance
- [ ] Backup of production data (if making destructive changes)
- [ ] Rollback plan documented (if applicable)

## Rollback Strategy

### For Additive Changes (New tables, columns)
Create a new migration that reverses the changes:

```sql
-- Rollback: remove user_preferences table
DROP TABLE IF EXISTS user_preferences;
```

### For Destructive Changes
1. Restore from backup
2. Or create migration to recreate dropped items

### Best Practices
- Prefer additive migrations over destructive ones
- Keep migrations small and focused
- Document the purpose of each migration
- Test rollback procedures locally

## Troubleshooting

### Migration Fails Locally

```bash
# Check migration status
supabase migration list

# View migration SQL
cat supabase/migrations/<migration_file>.sql

# Reset and retry
supabase db reset
```

### Production Migration Issues

1. **Check Supabase Dashboard Logs**
   - Go to Dashboard > Database > Logs
   - Look for error messages

2. **Check Migration History**
   - Dashboard > Database > Migrations
   - Verify which migrations have been applied

3. **Manual Fix**
   - Use SQL Editor to fix issues
   - Create a new migration to document the fix

## Environment Variables

Ensure these are set correctly for each environment:

```bash
# Local development (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key>

# Production (set in deployment platform)
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>
```

## Related Documentation

- [Database Safety Rules](../CLAUDE.md#database-safety-rules) - Safety guidelines for Claude Code
- [.env.example](../.env.example) - Environment variable documentation
- [lib/db-safety.js](../lib/db-safety.js) - Database safety utilities
