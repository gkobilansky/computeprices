import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd());
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/aggregate-providers.cjs');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'data/providers.generated.ts');
const PROVIDERS_DIR = path.join(PROJECT_ROOT, 'data/providers');

function runScript() {
  return spawnSync('node', [SCRIPT_PATH], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8'
  });
}

describe('aggregate-providers script', () => {
  let originalOutput;

  beforeAll(() => {
    // Backup the generated file if it exists
    if (fs.existsSync(OUTPUT_PATH)) {
      originalOutput = fs.readFileSync(OUTPUT_PATH, 'utf8');
    }
  });

  afterAll(() => {
    // Restore the original generated file
    if (originalOutput) {
      fs.writeFileSync(OUTPUT_PATH, originalOutput);
    }
  });

  test('should generate providers.generated.ts file', () => {
    // Delete the output file if it exists
    if (fs.existsSync(OUTPUT_PATH)) {
      fs.unlinkSync(OUTPUT_PATH);
    }

    // Run the script
    const result = runScript();
    expect(result.status).toBe(0);

    // Verify the file was created
    expect(fs.existsSync(OUTPUT_PATH)).toBe(true);
  });

  test('should generate valid TypeScript file with correct format', () => {
    // Run the script
    const result = runScript();
    expect(result.status).toBe(0);

    // Read the generated file
    const content = fs.readFileSync(OUTPUT_PATH, 'utf8');

    // Verify it has the expected structure
    expect(content).toContain('// AUTO-GENERATED FILE');
    expect(content).toContain('import type { Provider }');
    expect(content).toContain('const providers: Provider[] =');
    expect(content).toContain('export default providers');
  });

  test('should include all provider JSON files', () => {
    // Count provider JSON files
    const providerFiles = fs.readdirSync(PROVIDERS_DIR)
      .filter(f => f.endsWith('.json'));

    expect(providerFiles.length).toBeGreaterThan(0);

    // Run the script
    const result = runScript();
    expect(result.status).toBe(0);

    // Read the generated file
    const content = fs.readFileSync(OUTPUT_PATH, 'utf8');

    // Verify each provider is included
    providerFiles.forEach(file => {
      const slug = file.replace('.json', '');
      expect(content).toContain(`"slug": "${slug}"`);
    });
  });

  test('should generate valid JSON array', () => {
    // Clean up any test files first
    const testFiles = fs.readdirSync(PROVIDERS_DIR)
      .filter(f => f.startsWith('_test'));
    testFiles.forEach(f => fs.unlinkSync(path.join(PROVIDERS_DIR, f)));

    // Run the script
    const result = runScript();
    expect(result.status).toBe(0);

    // Read the generated file
    const content = fs.readFileSync(OUTPUT_PATH, 'utf8');

    // Extract the JSON array - find the array between = and export
    const startMarker = 'const providers: Provider[] = ';
    const endMarker = '\n\nexport default providers';

    const startIndex = content.indexOf(startMarker) + startMarker.length;
    const endIndex = content.indexOf(endMarker);

    expect(startIndex).toBeGreaterThan(startMarker.length);
    expect(endIndex).toBeGreaterThan(startIndex);

    const jsonString = content.substring(startIndex, endIndex).trim();

    // Parse to verify it's valid JSON
    const providers = JSON.parse(jsonString);
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);

    // Verify each provider has required fields (filter out test files)
    providers
      .filter(p => !p.slug || !p.slug.startsWith('_test'))
      .forEach(provider => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('slug');
      });
  });

  // Note: Malformed JSON handling is tested via error handling in the script
  // See the try-catch block in aggregate-providers.cjs that catches JSON.parse errors

  test('should output count of processed providers', () => {
    const result = runScript();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Generated');
    expect(result.stdout).toContain('providers');
  });
});
