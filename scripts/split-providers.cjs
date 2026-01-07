#!/usr/bin/env node
/**
 * Split providers.json into individual files in data/providers/
 * Run once to migrate from monolithic file to individual provider files.
 */

const fs = require('fs');
const path = require('path');

const providersJsonPath = path.join(__dirname, '../data/providers.json');
const providersDir = path.join(__dirname, '../data/providers');

// Read existing providers.json
const providers = JSON.parse(fs.readFileSync(providersJsonPath, 'utf8'));

// Create providers directory if it doesn't exist
if (!fs.existsSync(providersDir)) {
  fs.mkdirSync(providersDir, { recursive: true });
  console.log('Created directory:', providersDir);
}

// Write each provider to its own file
for (const provider of providers) {
  const filename = `${provider.slug}.json`;
  const filepath = path.join(providersDir, filename);

  // Write with pretty formatting for readability
  fs.writeFileSync(filepath, JSON.stringify(provider, null, 2) + '\n');
  console.log(`Created: ${filename}`);
}

console.log(`\nSplit ${providers.length} providers into individual files.`);
console.log(`Files created in: ${providersDir}`);
