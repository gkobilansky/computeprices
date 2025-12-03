import { computeMovingAverage } from '@/lib/utils/trendMath';

describe('computeMovingAverage', () => {
  const sample = [
    { day: '2025-01-01', avgPricePerHour: 1, providerCount: 2 },
    { day: '2025-01-02', avgPricePerHour: 3, providerCount: 3 },
    { day: '2025-01-03', avgPricePerHour: 5, providerCount: 4 },
    { day: '2025-01-04', avgPricePerHour: 7, providerCount: 4 }
  ];

  it('calculates moving averages for the provided window', () => {
    const result = computeMovingAverage(sample, 2);
    expect(result.map(point => point.movingAverage)).toEqual([
      1, // 1
      2, // (1+3)/2
      4, // (3+5)/2
      6  // (5+7)/2
    ]);
  });

  it('handles windows larger than the dataset by averaging available data', () => {
    const result = computeMovingAverage(sample.slice(0, 2), 5);
    expect(result.map(point => point.movingAverage)).toEqual([1, 2]); // (1), then (1+3)/2
  });

  it('returns an empty array when no data is provided', () => {
    expect(computeMovingAverage([], 3)).toEqual([]);
    expect(computeMovingAverage(undefined as any, 3)).toEqual([]);
  });
});
