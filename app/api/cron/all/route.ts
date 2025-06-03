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
  'runpod',
  'shadeform',
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

export async function GET(request: Request) {
  console.log('🚀 Triggering all cron jobs...');

  const baseUrl = getBaseUrl(request);
  console.log(`ℹ️ Base URL: ${baseUrl}`);

  const results = await Promise.allSettled(
    CRON_ROUTES.map(async (route) => {
      const url = `${baseUrl}/api/cron/${route}`;
      console.log(`➡️ Triggering ${route} at ${url}...`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(9000), // 9 second timeout
          cache: 'no-store',
        });
        
        if (!response.ok) {
          console.error(`❌ Failed to trigger ${route}: ${response.status} ${response.statusText}`);
          throw new Error(`Failed: ${response.status} ${response.statusText}`);
        }

        console.log(`✅ Successfully triggered ${route}: ${response.status}`);
        return { route, status: 'success', statusCode: response.status };
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          console.error(`⌛ Timeout triggering ${route}`);
          return { route, status: 'error', error: 'Timeout' };
        } else {
          console.error(`❌ Error triggering ${route}:`, error.message);
          return { route, status: 'error', error: error.message };
        }
      }
    })
  );

  console.log('🏁 Finished triggering all cron jobs');

  const summary = results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error('Unexpected Promise rejection:', result.reason);
      return { 
        route: result.reason?.route || 'unknown', 
        status: 'error', 
        error: 'Unexpected rejection: ' + result.reason?.message 
      };
    }
  });

  const hasErrors = summary.some(item => item.status === 'error');

  return NextResponse.json(
    { 
      message: 'Cron job trigger process completed', 
      results: summary 
    },
    { status: hasErrors ? 207 : 200 } // 207 Multi-Status if some failed, 200 OK if all succeeded
  );
} 