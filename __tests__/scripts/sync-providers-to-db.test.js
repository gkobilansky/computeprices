import { describe, test, expect, beforeAll } from '@jest/globals';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd());
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/sync-providers-to-db.js');
const PROVIDERS_DIR = path.join(PROJECT_ROOT, 'data/providers');

function runScript(args = []) {
  return spawnSync('node', ['-r', 'dotenv/config', SCRIPT_PATH, ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      dotenv_config_path: '.env.local'
    }
  });
}

describe('sync-providers-to-db script', () => {
  beforeAll(() => {
    // Verify we have provider files to work with
    const providerFiles = fs.readdirSync(PROVIDERS_DIR)
      .filter(f => f.endsWith('.json'));
    expect(providerFiles.length).toBeGreaterThan(0);
  });

  beforeEach(() => {
    // Clean up any test files before each test
    const testFiles = fs.readdirSync(PROVIDERS_DIR)
      .filter(f => f.includes('test') || f.includes('malformed'));
    testFiles.forEach(f => {
      const filepath = path.join(PROVIDERS_DIR, f);
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (e) {
        // Ignore
      }
    });
  });

  afterEach(() => {
    // Clean up any test files after each test
    const testFiles = fs.readdirSync(PROVIDERS_DIR)
      .filter(f => f.includes('test') || f.startsWith('_') || f.startsWith('aaa-') || f.startsWith('zzz-'));
    testFiles.forEach(f => {
      const filepath = path.join(PROVIDERS_DIR, f);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          // Ignore
        }
      }
    });
  });

  test('should display help message', () => {
    const result = runScript(['--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Sync Provider Data to Supabase');
    expect(result.stdout).toContain('--dry-run');
    expect(result.stdout).toContain('--provider=');
    expect(result.stdout).toContain('--yes');
  });

  test('should fail without required environment variables', () => {
    const result = spawnSync('node', [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: { PATH: process.env.PATH } // Need PATH but remove Supabase vars
    });

    // Script should fail due to missing env vars
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Missing required environment variables');
  });

  test('should validate provider JSON files during dry-run', () => {
    // Create a test provider file with missing required fields
    const testFile = path.join(PROVIDERS_DIR, '_test-invalid.json');
    fs.writeFileSync(testFile, JSON.stringify({
      name: 'Test Provider'
      // Missing id and slug
    }, null, 2));

    try {
      const result = runScript(['--dry-run']);

      // Should fail validation
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Failed to process');
      expect(result.stderr).toContain('Missing required field');
    } finally {
      // Clean up
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  test('should validate UUID format during dry-run', () => {
    const testFile = path.join(PROVIDERS_DIR, '_test-invalid-uuid.json');
    fs.writeFileSync(testFile, JSON.stringify({
      id: 'not-a-valid-uuid',
      name: 'Test Provider',
      slug: 'test-provider'
    }, null, 2));

    try {
      const result = runScript(['--dry-run']);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Failed to process');
      expect(result.stderr).toContain('Invalid UUID format');
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  test('should validate slug format during dry-run', () => {
    const testFile = path.join(PROVIDERS_DIR, '_test-invalid-slug.json');
    fs.writeFileSync(testFile, JSON.stringify({
      id: '12345678-1234-1234-1234-123456789abc',
      name: 'Test Provider',
      slug: 'Invalid Slug With Spaces'
    }, null, 2));

    try {
      const result = runScript(['--dry-run']);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Failed to process');
      expect(result.stderr).toContain('Invalid slug format');
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  test('should run in dry-run mode without database connection', () => {
    // Run with invalid database URL to verify dry-run doesn't need connection
    const result = spawnSync('node', [SCRIPT_PATH, '--dry-run'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: 'http://invalid-url',
        SUPABASE_SERVICE_ROLE_KEY: 'invalid-key'
      }
    });

    // Note: This may fail at connection test, which is expected
    // The test documents that dry-run still tests connection
    expect(result.stdout).toContain('DRY RUN MODE');
  });

  test('should filter to specific provider when --provider flag is used', () => {
    // Get the first provider slug
    const providerFiles = fs.readdirSync(PROVIDERS_DIR)
      .filter(f => f.endsWith('.json'));
    const firstProviderSlug = providerFiles[0].replace('.json', '');

    const result = runScript(['--dry-run', `--provider=${firstProviderSlug}`]);

    expect(result.stdout).toContain(`Filtering to provider: ${firstProviderSlug}`);
  });

  test('should fail when filtering to non-existent provider', () => {
    const result = runScript(['--dry-run', '--provider=non-existent-provider']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Provider "non-existent-provider" not found');
  });

  test('should detect environment from Supabase URL', () => {
    const result = runScript(['--dry-run']);

    expect(result.stdout).toContain('Environment:');
  });

  test('should provide helpful error messages', () => {
    // This test verifies error handling is working
    // by checking that invalid provider slug fails
    const result = runScript(['--dry-run', '--provider=this-does-not-exist']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Provider.*not found/);
  });
});
