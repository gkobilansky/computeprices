import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Get Puppeteer browser configuration for different environments
 * - Development/Local: Uses local Chromium via @sparticuz/chromium
 * - Production: Uses Browserless.io service
 */
export async function getBrowserConfig() {
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
    // Use local Chromium for development or fallback
    console.log('🖥️ Using local Chromium for browser automation');
    
    return {
      browser: await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
      }),
      isRemote: false
    };
  }
}

/**
 * Safely close browser connection
 * Handles both local and remote browser instances
 */
export async function closeBrowser(browser, isRemote = false) {
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