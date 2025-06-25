import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Opt out of caching

// Manually defined list of cron routes
// Update this list when adding/removing cron jobs
const CRON_ROUTES = [
  'aws',
  'coreweave',
  'datacrunch',
  'fluidstack',
  'hyperstack',
  'lambda',
  'paperspace',
  'runpod',
  'shadeform',
  'vast',
  'whitefiber',
];

// Function to get the base URL
function getBaseUrl(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production' ? 'https' : 'http';

  if (!host) {
    console.warn('Could not determine host, falling back to localhost');
    return 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
}

// Helper function to add delay between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  console.log('🚀 Triggering all cron jobs sequentially...');

  const baseUrl = getBaseUrl(request);
  console.log(`ℹ️ Base URL: ${baseUrl}`);

  const results = [];
  
  // Run jobs sequentially with delays to avoid rate limiting
  for (let i = 0; i < CRON_ROUTES.length; i++) {
    const route = CRON_ROUTES[i];
    const url = `${baseUrl}/api/cron/${route}`;
    console.log(`➡️ Triggering ${route} at ${url}... (${i + 1}/${CRON_ROUTES.length})`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(45000), // Increased timeout to 45 seconds for retry logic
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to trigger ${route}: ${response.status} ${response.statusText}`);
        results.push({ route, status: 'error', error: `Failed: ${response.status} ${response.statusText}` });
      } else {
        console.log(`✅ Successfully triggered ${route}: ${response.status}`);
        results.push({ route, status: 'success', statusCode: response.status });
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        console.error(`⌛ Timeout triggering ${route}`);
        results.push({ route, status: 'error', error: 'Timeout' });
      } else {
        console.error(`❌ Error triggering ${route}:`, error.message);
        results.push({ route, status: 'error', error: error.message });
      }
    }
    
    // Add delay between requests (except after the last one)
    if (i < CRON_ROUTES.length - 1) {
      console.log('⏳ Waiting 10 seconds before next request...');
      await delay(10000); // 10 second delay between requests to reduce browserless load
    }
  }

  console.log('🏁 Finished triggering all cron jobs');

  const hasErrors = results.some(item => item.status === 'error');

  return NextResponse.json(
    { 
      message: 'Cron job trigger process completed', 
      results 
    },
    { status: hasErrors ? 207 : 200 } // 207 Multi-Status if some failed, 200 OK if all succeeded
  );
} 