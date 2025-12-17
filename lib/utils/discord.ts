/**
 * Discord notification utility for scraping alerts
 */

interface DiscordEmbed {
  title: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

export type AlertType = 'firecrawl_failure' | 'scraper_fallback_failure' | 'scraper_success' | 'info';

interface AlertOptions {
  type: AlertType;
  provider?: string;
  url?: string;
  error?: string;
  details?: Record<string, unknown>;
}

function getEmojiAndColor(type: AlertType): { emoji: string; color: number } {
  switch (type) {
    case 'firecrawl_failure':
      return { emoji: '🔥', color: 0xff6b35 }; // Orange
    case 'scraper_fallback_failure':
      return { emoji: '❌', color: 0xff0000 }; // Red
    case 'scraper_success':
      return { emoji: '✅', color: 0x00ff00 }; // Green
    case 'info':
      return { emoji: 'ℹ️', color: 0x0099ff }; // Blue
    default:
      return { emoji: '📢', color: 0x808080 }; // Gray
  }
}

function formatDiscordMessage(options: AlertOptions): DiscordMessage {
  const { type, provider, url, error, details } = options;
  const { emoji, color } = getEmojiAndColor(type);

  let title: string;
  switch (type) {
    case 'firecrawl_failure':
      title = `${emoji} Firecrawl Scrape Failed`;
      break;
    case 'scraper_fallback_failure':
      title = `${emoji} Fallback Scraper Not Found (404)`;
      break;
    case 'scraper_success':
      title = `${emoji} Scraping Completed`;
      break;
    default:
      title = `${emoji} Scraper Alert`;
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
  if (provider) fields.push({ name: 'Provider', value: provider, inline: true });
  if (url) fields.push({ name: 'URL', value: url, inline: false });
  if (error) fields.push({ name: 'Error', value: error, inline: false });

  if (details) {
    for (const [key, value] of Object.entries(details)) {
      fields.push({ name: key, value: String(value), inline: false });
    }
  }

  const embed: DiscordEmbed = {
    title,
    color,
    footer: {
      text: `Timestamp: ${new Date().toISOString()}`,
    },
  };

  if (fields.length > 0) {
    embed.fields = fields;
  }

  return { embeds: [embed] };
}

export async function sendDiscordAlert(options: AlertOptions): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured, skipping Discord notification');
    return false;
  }

  const message = formatDiscordMessage(options);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    return false;
  }
}

export async function notifyFirecrawlFailure(
  provider: string,
  url: string,
  error: string
): Promise<boolean> {
  return sendDiscordAlert({
    type: 'firecrawl_failure',
    provider,
    url,
    error,
  });
}

export async function notifyScraperFallbackFailure(
  provider: string,
  slug: string
): Promise<boolean> {
  return sendDiscordAlert({
    type: 'scraper_fallback_failure',
    provider,
    error: `No scraper route found at /api/cron/${slug}`,
    details: { slug },
  });
}

export async function notifyScrapingSuccess(
  results: {
    provider: string;
    method: string;
    matched: number;
    unmatched: number;
  }[]
): Promise<boolean> {
  const summary = results
    .map((r) => `• ${r.provider}: ${r.matched} matched, ${r.unmatched} unmatched (${r.method})`)
    .join('\n');

  return sendDiscordAlert({
    type: 'scraper_success',
    details: {
      summary,
      totalProviders: results.length,
      totalMatched: results.reduce((sum, r) => sum + r.matched, 0),
      totalUnmatched: results.reduce((sum, r) => sum + r.unmatched, 0),
    },
  });
}
