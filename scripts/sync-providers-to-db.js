#!/usr/bin/env node

/**
 * Sync Provider Data to Supabase
 *
 * This script reads provider JSON files from data/providers/*.json and syncs them
 * to the Supabase providers table. It updates metadata columns and JSONB fields.
 *
 * Usage:
 * npm run providers:sync [-- --dry-run] [--provider=slug]
 *
 * Options:
 * --dry-run          Don't actually update data, just show what would be done
 * --provider=SLUG    Only sync a specific provider by slug
 * --help             Show this help message
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.find(arg => arg === '--help' || arg === '-h');
const dryRun = args.includes('--dry-run');
const skipConfirm = args.includes('--yes') || args.includes('-y');
const providerArg = args.find(arg => arg.startsWith('--provider='));
const targetProvider = providerArg ? providerArg.split('=')[1] : null;

// Show help if requested
if (helpArg) {
  console.log(`
Sync Provider Data to Supabase

This script reads provider JSON files from data/providers/*.json and syncs them
to the Supabase providers table. It updates metadata columns and JSONB fields.

Usage:
  npm run providers:sync [-- --dry-run] [--provider=slug] [--yes]

Options:
  --dry-run          Don't actually update data, just show what would be done
  --provider=SLUG    Only sync a specific provider by slug
  --yes, -y          Skip confirmation prompt (use with caution)
  --help             Show this help message
  `);
  process.exit(0);
}

// Initialize Supabase client with admin credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const providersDir = path.join(__dirname, '..', 'data', 'providers');

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Detect environment based on Supabase URL
 */
function detectEnvironment() {
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    return 'local';
  }
  if (supabaseUrl.includes('staging')) {
    return 'staging';
  }
  return 'production';
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('count')
      .limit(1);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Validate provider data structure
 */
function validateProviderData(data, filename) {
  const errors = [];

  // Check required fields
  if (!data.id) errors.push('Missing required field: id');
  if (!data.name) errors.push('Missing required field: name');
  if (!data.slug) errors.push('Missing required field: slug');

  // Validate UUID format
  if (data.id && !UUID_REGEX.test(data.id)) {
    errors.push(`Invalid UUID format for id: ${data.id}`);
  }

  // Validate slug format (lowercase, alphanumeric, hyphens only)
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push(`Invalid slug format: ${data.slug} (must be lowercase alphanumeric with hyphens)`);
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed for ${filename}:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

/**
 * Read all provider JSON files from the providers directory
 */
function readProviderFiles() {
  const files = fs.readdirSync(providersDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  return files.map(filename => {
    const filepath = path.join(providersDir, filename);

    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const data = JSON.parse(content);

      // Validate provider data structure
      validateProviderData(data, filename);

      return {
        filename,
        slug: filename.replace('.json', ''),
        data
      };
    } catch (error) {
      console.error(`Failed to process ${filename}:`, error.message);
      process.exit(1);
    }
  });
}

/**
 * Transform provider JSON data into database columns
 */
function transformProviderData(provider) {
  const { data } = provider;

  // Extract top-level fields for dedicated columns
  const dbRecord = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    website: data.link,
    description: data.description || null,
    docs_link: data.docsLink || null,
    category: data.category || null,
    tagline: data.tagline || null,
    hq_country: data.hqCountry || null,
    tags: data.tags || null,
  };

  // Store flexible attributes in metadata JSONB
  // Include arrays only if non-empty, include strings/objects if truthy
  const metadataFields = [
    'features', 'pros', 'cons', 'gettingStarted',
    'computeServices', 'gpuServices', 'pricingOptions', 'uniqueSellingPoints',
    'regions', 'support'
  ];

  const metadata = {};
  for (const field of metadataFields) {
    const value = data[field];
    if (Array.isArray(value) ? value.length > 0 : value) {
      metadata[field] = value;
    }
  }

  dbRecord.metadata = metadata;
  return dbRecord;
}

/**
 * Sync a single provider to the database
 */
async function syncProvider(provider, dryRun) {
  const dbRecord = transformProviderData(provider);

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Syncing: ${dbRecord.name} (${dbRecord.slug})`);

  if (dryRun) {
    const DRY_RUN_OUTPUT_LIMIT = 500;
    console.log('  Would update with:', JSON.stringify(dbRecord, null, 2).substring(0, DRY_RUN_OUTPUT_LIMIT) + '...');
    return { success: true, dryRun: true };
  }

  try {
    // Upsert the provider (update if exists by id, insert if not)
    const { data, error } = await supabase
      .from('providers')
      .upsert(dbRecord, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw error;
    }

    console.log(`  ✓ Synced successfully`);
    return { success: true, data };
  } catch (error) {
    console.error(`  Error syncing ${dbRecord.slug}: ${error.message}`);
    if (error.stack) {
      console.error(`  Stack: ${error.stack}`);
    }
    return { success: false, error: error.message, slug: dbRecord.slug };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Provider Sync to Supabase ===\n');

  // Detect environment
  const environment = detectEnvironment();
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Database: ${supabaseUrl}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Test database connection
  console.log('Testing database connection...');
  const connectionTest = await testConnection();
  if (!connectionTest.success) {
    console.error(`❌ Database connection failed: ${connectionTest.error}`);
    console.error('Please check your Supabase credentials and network connection.');
    process.exit(1);
  }
  console.log('✓ Database connection successful\n');

  // Confirmation prompt for production (unless dry-run or skip-confirm)
  if (!dryRun && environment === 'production' && !skipConfirm) {
    console.log('⚠️  WARNING: You are about to modify PRODUCTION data!');
    const confirmed = await promptConfirmation('Type "yes" to continue: ');
    if (!confirmed) {
      console.log('Aborted.');
      process.exit(0);
    }
    console.log('');
  }

  // Read provider files
  let providers = readProviderFiles();
  console.log(`Found ${providers.length} provider files in ${providersDir}\n`);

  // Filter to specific provider if requested
  if (targetProvider) {
    providers = providers.filter(p => p.slug === targetProvider);
    if (providers.length === 0) {
      console.error(`Error: Provider "${targetProvider}" not found`);
      process.exit(1);
    }
    console.log(`Filtering to provider: ${targetProvider}\n`);
  }

  // Sync each provider
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const provider of providers) {
    const result = await syncProvider(provider, dryRun);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ slug: provider.slug, error: result.error });
    }
  }

  // Summary
  console.log('\n=== Sync Summary ===');
  console.log(`Total providers: ${providers.length}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e.slug}: ${e.error}`));
    process.exit(1);
  }

  console.log('\n✓ Sync complete');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
