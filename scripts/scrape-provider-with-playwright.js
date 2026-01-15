#!/usr/bin/env node

/**
 * Scrape provider information using Playwright
 *
 * This script scrapes a provider's website to gather current information for verification.
 * It scrapes: home page, pricing page, docs page, and attempts to find a features page.
 *
 * Usage: node scripts/scrape-provider-with-playwright.js <provider-slug>
 * Output: scraped-data.json
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const providerSlug = process.argv[2];

if (!providerSlug) {
  console.error('❌ Error: Provider slug is required');
  console.error('Usage: node scripts/scrape-provider-with-playwright.js <provider-slug>');
  process.exit(1);
}

// Load provider data
const providerPath = path.join(__dirname, '..', 'data', 'providers', `${providerSlug}.json`);

if (!fs.existsSync(providerPath)) {
  console.error(`❌ Error: Provider file not found: ${providerPath}`);
  process.exit(1);
}

const providerData = JSON.parse(fs.readFileSync(providerPath, 'utf8'));

console.log(`🔍 Scraping provider: ${providerData.name} (${providerSlug})`);

/**
 * Extract useful content from a page
 */
async function scrapePage(page, url, pageName) {
  console.log(`  📄 Scraping ${pageName}: ${url}`);

  try {
    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);

    // Extract structured content
    const content = await page.evaluate(() => {
      // Helper to clean text
      const cleanText = (text) => text?.trim().replace(/\s+/g, ' ') || '';

      // Get page title
      const title = document.title;

      // Get all headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .map(h => ({
          level: h.tagName.toLowerCase(),
          text: cleanText(h.textContent)
        }))
        .filter(h => h.text.length > 0);

      // Get main content text (try common container selectors)
      const mainSelectors = [
        'main',
        '[role="main"]',
        'article',
        '.content',
        '#content',
        '.main',
        '#main'
      ];

      let mainText = '';
      for (const selector of mainSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          mainText = cleanText(el.innerText);
          break;
        }
      }

      // Fallback to body if no main content found
      if (!mainText) {
        mainText = cleanText(document.body.innerText);
      }

      // Extract all links (for finding features/docs pages)
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({
          text: cleanText(a.textContent),
          href: a.href
        }))
        .filter(link => link.text.length > 0 && link.text.length < 100);

      // Look for feature-related content
      const featureSelectors = [
        '[class*="feature"]',
        '[id*="feature"]',
        '[class*="benefit"]',
        '[id*="benefit"]',
        '[class*="capability"]',
        '.card',
        '[class*="highlight"]'
      ];

      const features = [];
      for (const selector of featureSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = cleanText(el.innerText);
          if (text.length > 20 && text.length < 500) {
            features.push(text);
          }
        });
        if (features.length > 0) break;
      }

      // Look for GPU mentions
      const gpuKeywords = ['H100', 'H200', 'A100', 'A6000', 'L40', 'V100', 'RTX', 'GPU', 'NVIDIA', 'AMD'];
      const gpuMentions = [];
      const bodyText = document.body.innerText;

      gpuKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}[^\\s.]{0,20}`, 'gi');
        const matches = bodyText.match(regex);
        if (matches) {
          gpuMentions.push(...matches.slice(0, 5)); // Limit to 5 per keyword
        }
      });

      // Look for pricing-related text
      const pricingSelectors = [
        '[class*="price"]',
        '[class*="pricing"]',
        '[class*="cost"]',
        'table'
      ];

      const pricingInfo = [];
      for (const selector of pricingSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = cleanText(el.innerText);
          if (text.match(/\$[\d,]+\.?\d*/)) { // Contains dollar amounts
            pricingInfo.push(text);
          }
        });
      }

      return {
        title,
        headings,
        mainText: mainText.slice(0, 5000), // Limit to 5000 chars
        links: links.slice(0, 50), // Limit to 50 links
        features: [...new Set(features)].slice(0, 10), // Dedupe and limit
        gpuMentions: [...new Set(gpuMentions)].slice(0, 20), // Dedupe and limit
        pricingInfo: [...new Set(pricingInfo)].slice(0, 10) // Dedupe and limit
      };
    });

    console.log(`    ✓ Scraped ${content.headings.length} headings, ${content.features.length} features`);

    return {
      url,
      success: true,
      scrapedAt: new Date().toISOString(),
      content
    };

  } catch (error) {
    console.error(`    ✗ Failed to scrape ${pageName}: ${error.message}`);
    return {
      url,
      success: false,
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  }
}

/**
 * Try to find and scrape a features page
 */
async function findAndScrapeFeaturesPage(page, homePageLinks, baseUrl) {
  console.log(`  🔎 Looking for features page...`);

  // Keywords that might indicate a features page
  const featureKeywords = [
    'features',
    'capabilities',
    'benefits',
    'why',
    'about',
    'platform'
  ];

  // Look for links containing feature keywords
  const featureLinks = homePageLinks.filter(link => {
    const text = link.text.toLowerCase();
    const href = link.href.toLowerCase();
    return featureKeywords.some(keyword =>
      text.includes(keyword) || href.includes(keyword)
    );
  });

  if (featureLinks.length === 0) {
    console.log(`    - No features page found in navigation`);
    return null;
  }

  // Try the first matching link
  const featureLink = featureLinks[0];
  console.log(`    → Found potential features page: ${featureLink.text}`);

  return await scrapePage(page, featureLink.href, 'Features Page');
}

/**
 * Main scraping function
 */
async function scrapeProvider() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  // Set viewport and user agent
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  const results = {
    provider: {
      slug: providerSlug,
      name: providerData.name,
      currentData: {
        link: providerData.link,
        docsLink: providerData.docsLink,
        pricing_page: providerData.pricing_page,
        description: providerData.description,
        tagline: providerData.tagline,
        category: providerData.category,
        hqCountry: providerData.hqCountry
      }
    },
    scrapedAt: new Date().toISOString(),
    pages: {}
  };

  try {
    // 1. Scrape home page (required)
    if (providerData.link) {
      results.pages.home = await scrapePage(page, providerData.link, 'Home Page');

      // Try to find features page from home page links
      if (results.pages.home.success && results.pages.home.content.links) {
        const featuresPage = await findAndScrapeFeaturesPage(
          page,
          results.pages.home.content.links,
          providerData.link
        );
        if (featuresPage) {
          results.pages.features = featuresPage;
        }
      }
    }

    // 2. Scrape pricing page (if available)
    if (providerData.pricing_page) {
      results.pages.pricing = await scrapePage(page, providerData.pricing_page, 'Pricing Page');
    } else if (providerData.link) {
      // Try common pricing URLs
      const commonPricingPaths = ['/pricing', '/plans', '/pricing-plans'];
      for (const pricingPath of commonPricingPaths) {
        try {
          const url = new URL(pricingPath, providerData.link).toString();
          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
          if (response.ok()) {
            console.log(`    → Found pricing page at ${pricingPath}`);
            await page.goBack();
            results.pages.pricing = await scrapePage(page, url, 'Pricing Page (discovered)');
            break;
          }
        } catch (error) {
          // Pricing page doesn't exist at this path, continue
        }
      }
    }

    // 3. Scrape docs page (if available)
    if (providerData.docsLink) {
      results.pages.docs = await scrapePage(page, providerData.docsLink, 'Documentation Page');
    } else if (providerData.link) {
      // Try common docs URLs
      const commonDocsPaths = ['/docs', '/documentation', '/developer', '/api'];
      for (const docsPath of commonDocsPaths) {
        try {
          const url = new URL(docsPath, providerData.link).toString();
          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
          if (response.ok()) {
            console.log(`    → Found docs page at ${docsPath}`);
            await page.goBack();
            results.pages.docs = await scrapePage(page, url, 'Docs Page (discovered)');
            break;
          }
        } catch (error) {
          // Docs page doesn't exist at this path, continue
        }
      }
    }

  } finally {
    await browser.close();
  }

  return results;
}

// Run the scraper
(async () => {
  try {
    console.log('🚀 Starting Playwright scraper...\n');

    const results = await scrapeProvider();

    // Save results to file
    const outputPath = path.join(process.cwd(), 'scraped-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log('\n✅ Scraping complete!');
    console.log(`📁 Results saved to: ${outputPath}`);

    // Print summary
    const pagesScraped = Object.keys(results.pages).length;
    const successfulPages = Object.values(results.pages).filter(p => p.success).length;
    console.log(`\n📊 Summary:`);
    console.log(`   Pages scraped: ${successfulPages}/${pagesScraped}`);

    Object.entries(results.pages).forEach(([pageName, data]) => {
      const status = data.success ? '✓' : '✗';
      console.log(`   ${status} ${pageName}: ${data.url}`);
    });

  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
