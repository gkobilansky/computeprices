import { NextResponse } from 'next/server';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';

export async function GET() {
  try {
    const prices = await fetchGPUPrices();
    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error fetching GPU prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GPU prices' },
      { status: 500 }
    );
  }
}
