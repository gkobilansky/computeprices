#!/usr/bin/env node

/**
 * GPU Models Upsert Script
 * 
 * This script reads GPU data from a CSV file and upserts it to the gpu_models table in Supabase.
 * It handles data type conversion, field validation, and can infer missing values like performance_tier.
 * 
 * Usage:
 * npm run upsert:gpu-models [-- --file=path/to/file.csv] [--dry-run] [--validate-only]
 * 
 * Options:
 * --file=PATH        Path to the CSV file (default: data/gpu_models_updated.csv)
 * --dry-run          Don't actually upsert data, just validate and display what would be done
 * --validate-only    Only validate the CSV data without upserting
 * --help             Show this help message
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import chalk from 'chalk';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.find(arg => arg === '--help' || arg === '-h');
const dryRun = args.includes('--dry-run');
const validateOnly = args.includes('--validate-only');
const fileArg = args.find(arg => arg.startsWith('--file='));
const csvFilePath = fileArg 
  ? fileArg.split('=')[1] 
  : path.join(__dirname, '..', 'data', 'gpu_models_updated.csv');

// Show help if requested
if (helpArg) {
  console.log(`
GPU Models Upsert Script

This script reads GPU data from a CSV file and upserts it to the gpu_models table in Supabase.
It handles data type conversion, field validation, and can infer missing values like performance_tier.

Usage:
  npm run upsert:gpu-models [-- --file=path/to/file.csv] [--dry-run] [--validate-only]

Options:
  --file=PATH        Path to the CSV file (default: data/gpu_models_updated.csv)
  --dry-run          Don't actually upsert data, just validate and display what would be done
  --validate-only    Only validate the CSV data without upserting
  --help             Show this help message
  `);
  process.exit(0);
}

// Initialize Supabase client with admin credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define field types and validation
const fieldDefinitions = {
  // Required fields
  id: { required: true, type: 'string', validate: val => val && val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) },
  name: { required: true, type: 'string', validate: val => val && val.trim().length > 0 },
  slug: { required: true, type: 'string', transform: val => val || '' },
  manufacturer: { required: true, type: 'string', validate: val => ['NVIDIA', 'AMD', 'Intel'].includes(val) },
  
  // Integer fields
  vram: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  compute_units: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  cuda_cores: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  tensor_cores: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  rt_cores: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  memory_interface_bit: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  manufacturing_process_nm: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  tdp_watt: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  max_power_watt: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  msrp_usd: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  generation: { type: 'integer', transform: val => val ? parseInt(val, 10) : null },
  
  // Decimal fields
  memory_bandwidth_gbps: { type: 'integer', transform: val => val ? Math.round(parseFloat(val)) : null },
  fp16_performance_tflops: { type: 'decimal', transform: val => val ? parseFloat(val) : null },
  fp32_performance_tflops: { type: 'decimal', transform: val => val ? parseFloat(val) : null },
  fp64_performance_tflops: { type: 'decimal', transform: val => val ? parseFloat(val) : null },
  int8_performance_tops: { type: 'decimal', transform: val => val ? parseFloat(val) : null },
  ml_perf_inference_score: { type: 'decimal', transform: val => val ? parseFloat(val) : null },
  ml_perf_training_score: { type: 'decimal', transform: val => val ? parseFloat(val) : null },
  
  // Boolean fields
  server_gpu: { type: 'boolean', transform: val => val === 'True' ? true : val === 'False' ? false : null },
  cloud_compatible: { type: 'boolean', transform: val => val === 'True' ? true : val === 'False' ? false : null },
  
  // JSON fields
  pros: { type: 'json', transform: parseJsonField },
  cons: { type: 'json', transform: parseJsonField },
  features: { type: 'json', transform: parseJsonField },
  benchmark_links: { type: 'json', transform: parseJsonField },
  affiliate_links: { type: 'json', transform: parseJsonField },
  
  // Date fields
  release_date: { type: 'date', transform: parseDateField },
  end_of_life_date: { type: 'date', transform: parseDateField },
  
  // Enum fields with validation
  performance_tier: { 
    type: 'enum', 
    validate: val => !val || ['entry', 'mid', 'high', 'ultra'].includes(val),
    transform: val => val || '' // Will be inferred later if empty
  },
  
  // String fields
  architecture: { type: 'string' },
  use_cases: { type: 'string' },
  description: { type: 'string' },
  detailed_description: { type: 'string' },
  image_url: { type: 'string' },
  link: { type: 'string' },
  created_at: { type: 'string' } // Keep as-is
};

// Helper function to parse JSON fields
function parseJsonField(value) {
  if (!value || value === '') return null;
  
  try {
    if (value.startsWith('[')) {
      // Handle array
      return JSON.parse(value.replace(/'/g, '"'));
    } else if (value.startsWith('{')) {
      // Handle object - convert keys to quoted strings first
      const cleanedStr = value
        .replace(/'/g, '"')
        .replace(/([{,]\s*)([^"}\s]+)(\s*:)/g, '$1"$2"$3');
      return JSON.parse(cleanedStr);
    }
  } catch (error) {
    console.warn(chalk.yellow(`Could not parse JSON: ${value.substring(0, 30)}...`));
  }
  
  return null;
}

// Helper function to parse date fields
function parseDateField(value) {
  if (!value || value === 'null' || value.trim() === '') return null;
  
  try {
    // Handle various date formats
    if (value.includes(',')) {
      // Format like "Oct 12th, 2022"
      // Remove ordinal indicators before parsing
      const cleanDateStr = value.replace(/(\d+)(st|nd|rd|th)/, '$1');
      const date = new Date(cleanDateStr);
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
    } else if (!isNaN(parseInt(value.substring(0, 4)))) {
      // Format like "2022" or "2022-10-12"
      return value.length === 4 ? `${value}-01-01` : value;
    }
  } catch (error) {
    console.warn(chalk.yellow(`Could not parse date: ${value}`));
  }
  
  return null;
}

// Determine performance tier based on GPU characteristics
function inferPerformanceTier(record) {
  const name = record.name;
  const vram = record.vram;

  // Ultra tier: High-end data center GPUs
  // - NVIDIA Blackwell: GB200, B200, B100
  // - NVIDIA Hopper: H100, H200, GH200 (all variants)
  // - NVIDIA Ampere: A100 (all variants)
  // - AMD MI300 series: MI300X, MI300A, MI325X, MI355X
  // - AMD MI200 series: MI250, MI250X
  // - Intel: Gaudi 3, Max 1550
  if (name.includes('GB200') || name.includes('B200') || name.includes('B100') ||
      name.includes('H100') || name.includes('H200') || name === 'GH200' ||
      name.includes('A100') ||
      name.includes('MI300') || name.includes('MI325') || name.includes('MI355') ||
      name.includes('MI250') ||
      name.includes('Gaudi 3') || name.includes('Max 1550') ||
      (vram && vram >= 80)) {
    return 'ultra';
  }

  // High tier: Professional and high-end desktop GPUs
  // - NVIDIA Data Center: A40, A10, A30, L40, L40S
  // - NVIDIA GeForce: RTX 4090, RTX 3090 Ti, RTX 3080 Ti
  // - NVIDIA Professional: RTX 6000 Ada, RTX A6000, RTX 5000 Ada
  // - NVIDIA Consumer: RTX 4070 Ti (all variants)
  // - AMD: MI210, MI100
  // - Intel: Gaudi 2, Max 1100
  if (name.includes('A40') || name.includes('A10') || name.includes('A30') ||
      name.includes('L40') ||
      name.includes('4090') || name.includes('3090 Ti') || name.includes('3080 Ti') ||
      name.includes('6000') || name.includes('A6000') || name.includes('5000 Ada') ||
      name.includes('4070 Ti') || name.includes('4080 SUPER') ||
      name.includes('MI210') || name.includes('MI100') ||
      name.includes('Gaudi 2') || name.includes('Max 1100') ||
      (vram && vram >= 40 && vram < 80)) {
    return 'high';
  }

  // Mid tier: Mid-range GPUs
  // - NVIDIA GeForce: RTX 4080, RTX 4070 (non-Ti), RTX 3090, RTX 3080, RTX 3070
  // - NVIDIA Professional: RTX A5000, RTX A4000, RTX 4500 Ada, RTX 4000 Ada
  // - NVIDIA Data Center: A16
  if (name.includes('4080') ||
      (name.includes('4070') && !name.includes('Ti')) ||
      name.includes('3090') || name.includes('3080') || name.includes('3070') ||
      name.includes('A5000') || name.includes('A4000') ||
      name.includes('4500 Ada') || name.includes('4000 Ada') ||
      name.includes('A16') ||
      (vram && vram >= 16 && vram < 40)) {
    return 'mid';
  }

  // Entry tier: Everything else
  // - NVIDIA: L4, A2, Tesla T4, Tesla V100, RTX 4060 series
  return 'entry';
}

// Parse CSV data
async function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`CSV file not found: ${filePath}`));
    process.exit(1);
  }
  
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Validate and transform the data
function transformData(data) {
  console.log(chalk.blue(`\nValidating and transforming ${data.length} records...`));
  
  const validationIssues = [];
  const transformedData = data.map((record, index) => {
    const transformedRecord = {};
    const recordIssues = [];
    
    // Process each field according to its definition
    for (const [field, definition] of Object.entries(fieldDefinitions)) {
      const value = record[field];
      
      // Check required fields
      if (definition.required && (value === undefined || value === null || value === '')) {
        recordIssues.push(`Missing required field: ${field}`);
      }
      
      // Transform the value if needed
      if (definition.transform && (value !== undefined && value !== null)) {
        transformedRecord[field] = definition.transform(value);
      } else {
        transformedRecord[field] = value;
      }
      
      // Validate the value if needed
      if (definition.validate && value !== undefined && value !== null && value !== '') {
        if (!definition.validate(value)) {
          recordIssues.push(`Invalid value for ${field}: ${value}`);
        }
      }
    }
    
    // Infer performance tier if not provided
    if (!transformedRecord.performance_tier || transformedRecord.performance_tier.trim() === '') {
      transformedRecord.performance_tier = inferPerformanceTier(transformedRecord);
    }
    
    // Add validation issues if any
    if (recordIssues.length > 0) {
      validationIssues.push({
        record: index + 1,
        name: transformedRecord.name || `Record ${index + 1}`,
        issues: recordIssues
      });
    }
    
    return transformedRecord;
  });
  
  // Log validation issues
  if (validationIssues.length > 0) {
    console.log(chalk.yellow(`\nFound ${validationIssues.length} records with validation issues:`));
    validationIssues.forEach(({ record, name, issues }) => {
      console.log(chalk.yellow(`\nRecord ${record} (${name}):`));
      issues.forEach(issue => console.log(chalk.yellow(`  - ${issue}`)));
    });
    
    if (validationIssues.some(({ issues }) => issues.some(issue => issue.startsWith('Missing required')))) {
      console.log(chalk.red('\nFatal validation errors found. Fix required fields before proceeding.'));
      process.exit(1);
    }
    
    console.log(chalk.yellow('\nNon-fatal validation issues found. Data will be processed but may be incomplete.'));
  } else {
    console.log(chalk.green('\nAll records passed validation.'));
  }
  
  return transformedData;
}

// Upsert data to Supabase
async function upsertData(data) {
  if (dryRun || validateOnly) {
    console.log(chalk.blue(`\n${validateOnly ? 'Validation complete' : 'Dry run'} - no data will be upserted to the database.`));
    return { success: 0, failed: 0, errors: [] };
  }
  
  console.log(chalk.blue(`\nUpserting ${data.length} records to database...`));
  
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    updatedRecords: []
  };

  // Process records one by one for better error handling
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    console.log(chalk.blue(`Processing ${i + 1}/${data.length}: ${record.name}...`));
    
    try {
      const { data: insertedData, error } = await supabase
        .from('gpu_models')
        .upsert([record], { 
          onConflict: 'id',
          returning: 'minimal' 
        });
      
      if (error) {
        console.error(chalk.red(`Error upserting record ${i + 1} (${record.name}):`, error.message));
        results.failed++;
        results.errors.push({ 
          record: i + 1, 
          name: record.name,
          error: error.message,
          details: error.details
        });
      } else {
        results.success++;
        results.updatedRecords.push(record.name);
        console.log(chalk.green(`Successfully upserted record ${i + 1}: ${record.name}`));
      }
    } catch (error) {
      console.error(chalk.red(`Unexpected error during upsert of record ${i + 1} (${record.name}):`, error.message));
      results.failed++;
      results.errors.push({ 
        record: i + 1,
        name: record.name,
        error: error.message
      });
    }
    
    // Add a small delay between records to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Main execution function
async function main() {
  try {
    console.log(chalk.green('Starting GPU models data upsert...'));
    console.log(chalk.blue(`Using CSV file: ${csvFilePath}`));
    console.log(chalk.blue(`Mode: ${validateOnly ? 'Validate Only' : dryRun ? 'Dry Run' : 'Upsert'}`));
    
    // Parse CSV data
    console.log(chalk.blue('\nParsing CSV data...'));
    const csvData = await parseCSV(csvFilePath);
    console.log(chalk.green(`Parsed ${csvData.length} records from CSV`));
    
    // Transform data
    const transformedData = transformData(csvData);
    
    if (validateOnly) {
      console.log(chalk.green('\nValidation complete. No data was upserted.'));
      return;
    }
    
    // Upsert data to Supabase
    const results = await upsertData(transformedData);
    
    // Output results
    console.log(chalk.green('\nUpsert completed:'));
    console.log(chalk.green(`- Successfully upserted: ${results.success} records`));
    console.log(chalk.red(`- Failed to upsert: ${results.failed} records`));
    
    if (results.updatedRecords && results.updatedRecords.length > 0) {
      console.log(chalk.green('\nUpdated GPU models:'));
      results.updatedRecords.forEach(name => console.log(chalk.green(`- ${name}`)));
    }
    
    if (results.errors.length > 0) {
      console.log(chalk.yellow('\nErrors encountered:'));
      results.errors.forEach((error, index) => {
        console.log(chalk.yellow(`Error ${index + 1}: Record ${error.record} (${error.name}) - ${error.error}`));
        if (error.details) console.log(chalk.yellow(`  Details: ${error.details}`));
      });
    }
    
  } catch (error) {
    console.error(chalk.red('\nError in main execution:', error.message));
    console.error(error);
    process.exit(1);
  }
}

// Execute main function
main();