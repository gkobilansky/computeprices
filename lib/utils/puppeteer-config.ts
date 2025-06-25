import puppeteerCore, { Browser } from 'puppeteer-core';
import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer';

// Centralized browser types
export type BrowserInstance = Browser | PuppeteerBrowser;

interface BrowserConfig {
  browser: BrowserInstance;
  isRemote: boolean;
}

/**
 * Sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Connect to browserless with retry logic and exponential backoff
 */
async function connectToBrowserless(endpoint: string, maxRetries = 3): Promise<Browser> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting to connect to browserless (attempt ${attempt}/${maxRetries})`);
      
      const browser = await puppeteerCore.connect({
        browserWSEndpoint: endpoint,
      });
      
      console.log('✅ Successfully connected to browserless');
      return browser;
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Browserless connection attempt ${attempt} failed:`, error.message);
      
      // Check if it's a 403 or rate limiting error
      if (error.message?.includes('403') || error.message?.includes('Unexpected server response: 403')) {
        console.log('🚫 Detected 403 error - likely rate limiting or concurrent connection limit');
      }
      
      // If this isn't the last attempt, wait with exponential backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delayMs/1000}s before retry...`);
        await sleep(delayMs);
      }
    }
  }
  
  throw new Error(`Failed to connect to browserless after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Get Puppeteer browser configuration for different environments
 * - Development/Local: Uses local Chromium via @sparticuz/chromium
 * - Production: Uses Browserless.io service with retry logic
 */
export async function getBrowserConfig(): Promise<BrowserConfig> {
  const isProduction = process.env.NODE_ENV === 'production';
  const browserlessKey = process.env.BLESS_KEY;

  if (isProduction && browserlessKey) {
    // Use Browserless.io in production with retry logic
    console.log('🌐 Using Browserless.io for browser automation');
    
    const endpoint = `wss://chrome.browserless.io?token=${browserlessKey}`;
    const browser = await connectToBrowserless(endpoint);
    
    return {
      browser,
      isRemote: true
    };
  } else {
    // Use regular puppeteer for local development
    console.log('🖥️ Using local Puppeteer with bundled Chromium');
    
    return {
      browser: await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }),
      isRemote: false
    };
  }
}

/**
 * Safely close browser connection
 * Handles both local and remote browser instances
 */
export async function closeBrowser(browser: BrowserInstance | null, isRemote = false): Promise<void> {
  if (browser) {
    try {
      if (isRemote) {
        // For remote browsers, disconnect instead of close
        await browser.disconnect();
        console.log('🔌 Disconnected from remote browser');
      } else {
        // For local browsers, close normally
        await browser.close();
        console.log('🔒 Closed local browser');
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}

/**
 * Safely get browser config with fallback handling
 * If browserless fails, falls back to local browser in production
 */
export async function getSafeBrowserConfig(): Promise<BrowserConfig> {
  try {
    return await getBrowserConfig();
  } catch (error: any) {
    console.error('🚨 Failed to get browser config:', error.message);
    
    // If browserless fails in production, fall back to local browser
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Falling back to local browser in production due to browserless failure');
      
      try {
        return {
          browser: await puppeteer.launch({
            headless: true,
            args: [
              '--no-sandbox', 
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu'
            ],
          }),
          isRemote: false
        };
      } catch (fallbackError: any) {
        console.error('💥 Fallback browser also failed:', fallbackError.message);
        throw new Error(`Both browserless and local browser failed. Browserless: ${error.message}, Local: ${fallbackError.message}`);
      }
    }
    
    // Re-throw the original error if not in production
    throw error;
  }
}