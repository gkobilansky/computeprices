#!/usr/bin/env node

/**
 * Sync Provider Data to Supabase
 *
 * This script reads provider JSON files from data/providers/*.json and syncs them
 * to the Supabase providers table. It updates metadata columns and JSONB fields.
 *
 * Usage:
 * npm run sync:providers [-- --dry-run] [--provider=slug]
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

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.find(arg => arg === '--help' || arg === '-h');
const dryRun = args.includes('--dry-run');
const providerArg = args.find(arg => arg.startsWith('--provider='));
const targetProvider = providerArg ? providerArg.split('=')[1] : null;

// Show help if requested
if (helpArg) {
  console.log(`
Sync Provider Data to Supabase

This script reads provider JSON files from data/providers/*.json and syncs them
to the Supabase providers table. It updates metadata columns and JSONB fields.

Usage:
  npm run sync:providers [-- --dry-run] [--provider=slug]

Options:
  --dry-run          Don't actually update data, just show what would be done
  --provider=SLUG    Only sync a specific provider by slug
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

/**
 * Read all provider JSON files from the providers directory
 */
function readProviderFiles() {
  const files = fs.readdirSync(providersDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  return files.map(filename => {
    const filepath = path.join(providersDir, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    return {
      filename,
      slug: filename.replace('.json', ''),
      data: JSON.parse(content)
    };
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
  const metadata = {};

  if (data.features && data.features.length > 0) {
    metadata.features = data.features;
  }
  if (data.pros && data.pros.length > 0) {
    metadata.pros = data.pros;
  }
  if (data.cons && data.cons.length > 0) {
    metadata.cons = data.cons;
  }
  if (data.gettingStarted && data.gettingStarted.length > 0) {
    metadata.gettingStarted = data.gettingStarted;
  }
  if (data.computeServices && data.computeServices.length > 0) {
    metadata.computeServices = data.computeServices;
  }
  if (data.gpuServices && data.gpuServices.length > 0) {
    metadata.gpuServices = data.gpuServices;
  }
  if (data.pricingOptions && data.pricingOptions.length > 0) {
    metadata.pricingOptions = data.pricingOptions;
  }
  if (data.regions) {
    metadata.regions = data.regions;
  }
  if (data.support) {
    metadata.support = data.support;
  }
  if (data.uniqueSellingPoints && data.uniqueSellingPoints.length > 0) {
    metadata.uniqueSellingPoints = data.uniqueSellingPoints;
  }

  dbRecord.metadata = Object.keys(metadata).length > 0 ? metadata : {};

  return dbRecord;
}

/**
 * Sync a single provider to the database
 */
async function syncProvider(provider, dryRun) {
  const dbRecord = transformProviderData(provider);

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Syncing: ${dbRecord.name} (${dbRecord.slug})`);

  if (dryRun) {
    console.log('  Would update with:', JSON.stringify(dbRecord, null, 2).substring(0, 500) + '...');
    return { success: true, dryRun: true };
  }

  // Upsert the provider (update if exists by id, insert if not)
  const { data, error } = await supabase
    .from('providers')
    .upsert(dbRecord, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error(`  Error: ${error.message}`);
    return { success: false, error: error.message };
  }

  console.log(`  ✓ Synced successfully`);
  return { success: true, data };
}

/**
 * Main function
 */
async function main() {
  console.log('=== Provider Sync to Supabase ===\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
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
