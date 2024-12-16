import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { scrapeAWS, scrapeCoreweave, scrapeLambda, scrapeVast } from '@/lib/scrapers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const dryRun = searchParams.get('dryRun') === 'true';

  try {
    let result;
    switch (provider) {
      case 'aws':
        result = await scrapeAWS(supabase, dryRun);
        break;
      case 'coreweave':
        result = await scrapeCoreweave(supabase, dryRun);
        break;
      case 'lambda':
        result = await scrapeLambda(supabase, dryRun);
        break;
      case 'vast':
        result = await scrapeVast(supabase, dryRun);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid provider' }, 
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error scraping ${provider}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 