import { TrendPoint } from '@/lib/utils/fetchPriceTrends';

export interface MovingAveragePoint {
  day: string;
  movingAverage: number;
  providerCount: number;
}

export function computeMovingAverage(points: TrendPoint[], windowSize: number): MovingAveragePoint[] {
  if (!Array.isArray(points) || points.length === 0) return [];

  const size = Math.max(1, windowSize);

  return points.map((point, index) => {
    const start = Math.max(0, index - size + 1);
    const window = points.slice(start, index + 1);
    const total = window.reduce((sum, item) => sum + item.avgPricePerHour, 0);
    const avg = total / window.length;

    return {
      day: point.day,
      movingAverage: Number(avg.toFixed(4)),
      providerCount: point.providerCount
    };
  });
}
