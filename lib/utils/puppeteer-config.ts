import puppeteerCore, { Browser } from 'puppeteer-core';
import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer';

// Centralized browser types
export type BrowserInstance = Browser | PuppeteerBrowser;

interface BrowserConfig {
  browser: BrowserInstance;
  isRemote: boolean;
}

/**
 * Get Puppeteer browser configuration for different environments
 * - Development/Local: Uses local Chromium via @sparticuz/chromium
 * - Production: Uses Browserless.io service
 */
export async function getBrowserConfig(): Promise<BrowserConfig> {
  const isProduction = process.env.NODE_ENV === 'production';
  const browserlessKey = process.env.BLESS_KEY;

  if (isProduction && browserlessKey) {
    // Use Browserless.io in production
    console.log('🌐 Using Browserless.io for browser automation');
    
    return {
      browser: await puppeteerCore.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessKey}`,
      }),
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