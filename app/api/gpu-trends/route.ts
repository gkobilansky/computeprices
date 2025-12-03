import { NextResponse } from 'next/server';
import { fetchPriceTrends } from '@/lib/utils/fetchPriceTrends';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gpuId = searchParams.get('gpuId');
  const daysParam = searchParams.get('days');

  if (!gpuId) {
    return NextResponse.json({ error: 'gpuId is required' }, { status: 400 });
  }

  const parsedDays = daysParam ? parseInt(daysParam, 10) : 30;
  const days = Number.isNaN(parsedDays) ? 30 : parsedDays;

  try {
    const data = await fetchPriceTrends({ gpuId, days });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching GPU trends', error);
    return NextResponse.json({ error: 'Failed to fetch GPU trends' }, { status: 500 });
  }
}
