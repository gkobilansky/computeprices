/**
 * Slack notification utility for scraping alerts
 */

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text: string;
  }>;
}

export type AlertType = 'firecrawl_failure' | 'scraper_fallback_failure' | 'scraper_success' | 'info';

interface AlertOptions {
  type: AlertType;
  provider?: string;
  url?: string;
  error?: string;
  details?: Record<string, unknown>;
}

function getEmoji(type: AlertType): string {
  switch (type) {
    case 'firecrawl_failure':
      return '🔥';
    case 'scraper_fallback_failure':
      return '❌';
    case 'scraper_success':
      return '✅';
    case 'info':
      return 'ℹ️';
    default:
      return '📢';
  }
}

function formatSlackMessage(options: AlertOptions): SlackMessage {
  const { type, provider, url, error, details } = options;
  const emoji = getEmoji(type);

  let headerText: string;
  switch (type) {
    case 'firecrawl_failure':
      headerText = `${emoji} Firecrawl Scrape Failed`;
      break;
    case 'scraper_fallback_failure':
      headerText = `${emoji} Fallback Scraper Not Found (404)`;
      break;
    case 'scraper_success':
      headerText = `${emoji} Scraping Completed`;
      break;
    default:
      headerText = `${emoji} Scraper Alert`;
  }

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: headerText,
        emoji: true,
      },
    },
  ];

  const fields: string[] = [];
  if (provider) fields.push(`*Provider:* ${provider}`);
  if (url) fields.push(`*URL:* ${url}`);
  if (error) fields.push(`*Error:* ${error}`);

  if (details) {
    for (const [key, value] of Object.entries(details)) {
      fields.push(`*${key}:* ${JSON.stringify(value)}`);
    }
  }

  if (fields.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: fields.join('\n'),
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Timestamp: ${new Date().toISOString()}`,
      },
    ],
  });

  return {
    text: `${headerText}${provider ? ` - ${provider}` : ''}`,
    blocks,
  };
}

export async function sendSlackAlert(options: AlertOptions): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return false;
  }

  const message = formatSlackMessage(options);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Slack webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

export async function notifyFirecrawlFailure(
  provider: string,
  url: string,
  error: string
): Promise<boolean> {
  return sendSlackAlert({
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
  return sendSlackAlert({
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

  return sendSlackAlert({
    type: 'scraper_success',
    details: {
      summary,
      totalProviders: results.length,
      totalMatched: results.reduce((sum, r) => sum + r.matched, 0),
      totalUnmatched: results.reduce((sum, r) => sum + r.unmatched, 0),
    },
  });
}
