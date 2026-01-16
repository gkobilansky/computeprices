'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { computeMovingAverage } from '@/lib/utils/trendMath';

const MAX_FETCH_WINDOW = 60;
const WINDOWS = [7, 30, 60];

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm text-sm">
      <div className="font-semibold text-slate-800">{formatDate(label)}</div>
      <div className="text-slate-700">
        ${point.movingAverage.toFixed(2)} / hr
      </div>
      <div className="text-xs text-slate-500">
        Providers: {point.providerCount}
      </div>
    </div>
  );
};

export default function LandingPriceTrends() {
  const [windowSize, setWindowSize] = useState(7);
  const [series, setSeries] = useState({});
  const [picks, setPicks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch GPU data to derive picks
  useEffect(() => {
    const fetchGPUData = async () => {
      try {
        const response = await fetch('/api/gpu-prices');
        if (!response.ok) throw new Error('Failed to fetch GPU data');
        const data = await response.json();

        // Derive picks from GPU data
        const gpuData = data.prices || data || [];

        // Find cheapest
        let cheapest = { price: Infinity };
        gpuData.forEach((item) => {
          if (item.price_per_hour < cheapest.price) {
            cheapest = {
              gpu: item.gpu_model_name,
              gpu_model_id: item.gpu_model_id,
              price: item.price_per_hour
            };
          }
        });

        // Find most popular
        const gpuCounts = {};
        let mostPopular = { name: null, id: null };
        let maxCount = 0;
        gpuData.forEach(item => {
          gpuCounts[item.gpu_model_name] = (gpuCounts[item.gpu_model_name] || 0) + 1;
          if (gpuCounts[item.gpu_model_name] > maxCount) {
            maxCount = gpuCounts[item.gpu_model_name];
            mostPopular = { name: item.gpu_model_name, id: item.gpu_model_id };
          }
        });

        // Find B200 for top of the line
        const b200Entry = gpuData.find(item =>
          item.gpu_model_name?.toUpperCase().includes('B200')
        );

        setPicks({
          cheapest: cheapest.price < Infinity ? cheapest : null,
          mostPopular: mostPopular.name ? mostPopular : null,
          topLine: { name: 'NVIDIA B200', id: b200Entry?.gpu_model_id || null }
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch GPU data:', err);
        setError('Unable to load price data');
        setLoading(false);
      }
    };

    fetchGPUData();
  }, []);

  const targets = useMemo(() => {
    if (!picks) return [];
    return [
      {
        key: 'cheapest',
        title: 'Cheapest Option',
        gpuId: picks.cheapest?.gpu_model_id,
        gpuName: picks.cheapest?.gpu || 'Loading...'
      },
      {
        key: 'mostPopular',
        title: 'Most Popular',
        gpuId: picks.mostPopular?.id,
        gpuName: picks.mostPopular?.name || 'Loading...'
      },
      {
        key: 'topLine',
        title: 'Top of the Line',
        gpuId: picks.topLine?.id,
        gpuName: picks.topLine?.name || 'NVIDIA B200'
      }
    ];
  }, [picks]);

  // Fetch trend data for each target
  useEffect(() => {
    if (loading || !picks) return;

    const validTargets = targets.filter(target => target.gpuId);
    if (validTargets.length === 0) return;

    let cancelled = false;

    const loadTrends = async () => {
      try {
        const results = await Promise.all(validTargets.map(async (target) => {
          const response = await fetch(
            `/api/gpu-trends?gpuId=${encodeURIComponent(target.gpuId)}&days=${MAX_FETCH_WINDOW}`,
            { cache: 'no-store' }
          );

          const json = await response.json();
          if (!response.ok) {
            throw new Error(json.error || 'Failed to load trend data');
          }

          return [target.key, json.data || []];
        }));

        if (cancelled) return;

        setSeries((prev) => {
          const next = { ...prev };
          results.forEach(([key, data]) => {
            next[key] = data;
          });
          return next;
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch trend data', err);
      }
    };

    loadTrends();

    return () => {
      cancelled = true;
    };
  }, [targets, loading, picks]);

  const renderChart = (target) => {
    if (!target.gpuId) {
      return (
        <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
          Waiting for data...
        </div>
      );
    }

    const data = series[target.key] || [];
    const movingAverage = computeMovingAverage(data, windowSize);
    const visible = movingAverage.slice(-Math.max(windowSize, 1));
    const latest = visible.length > 0 ? visible[visible.length - 1] : null;

    if (!visible.length) {
      return (
        <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
          {loading ? 'Loading...' : 'Not enough data yet.'}
        </div>
      );
    }

    return (
      <div className="h-[220px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-600">
            {latest ? `Last: $${latest.movingAverage.toFixed(2)} / hr` : '—'}
          </div>
          <div className="text-xs text-slate-500">
            Providers: {latest?.providerCount ?? '—'}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visible}
            margin={{ top: 10, right: 12, left: 0, bottom: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDate}
              stroke="#94a3b8"
              tickMargin={8}
              minTickGap={18}
              padding={{ left: 10, right: 10 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke="#94a3b8"
              width={60}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (error) {
    return null; // Don't show section if there's an error
  }

  return (
    <section className="py-8 lg:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">GPU Price Trends</h2>
              <p className="text-sm text-slate-600">Moving average across providers (latest price per provider per day)</p>
            </div>
            <div className="flex items-center gap-1.5">
              {WINDOWS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWindowSize(value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    windowSize === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {value}d MA
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {targets.map((target) => (
              <div key={target.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{target.title}</div>
                  <div className="font-semibold text-slate-900">{target.gpuName}</div>
                </div>
                {renderChart(target)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
