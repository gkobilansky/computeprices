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
      <div className="font-semibold text-gray-800">{formatDate(label)}</div>
      <div className="text-gray-700">
        ${point.movingAverage.toFixed(2)} / hr
      </div>
      <div className="text-xs text-gray-500">
        Providers: {point.providerCount}
      </div>
    </div>
  );
};

export default function TopPickTrends({ picks, loading }) {
  const [windowSize, setWindowSize] = useState(7);
  const [series, setSeries] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const targets = useMemo(() => ([
    {
      key: 'cheapest',
      title: 'Cheapest Option',
      gpuId: picks?.cheapest?.gpu_model_id,
      gpuName: picks?.cheapest?.gpu || 'Cheapest'
    },
    {
      key: 'mostPopular',
      title: 'Most Popular',
      gpuId: picks?.mostPopular?.id,
      gpuName: picks?.mostPopular?.name || 'Most Popular'
    },
    {
      key: 'topLine',
      title: 'Top of the Line',
      gpuId: picks?.topLine?.id,
      gpuName: picks?.topLine?.name || 'NVIDIA B200'
    }
  ]), [picks?.cheapest?.gpu, picks?.cheapest?.gpu_model_id, picks?.mostPopular?.id, picks?.mostPopular?.name, picks?.topLine?.id, picks?.topLine?.name]);

  useEffect(() => {
    if (loading) return;

    const validTargets = targets.filter(target => target.gpuId);
    if (validTargets.length === 0) return;

    let cancelled = false;

    const load = async () => {
      setIsFetching(true);
      try {
        const results = await Promise.all(validTargets.map(async (target) => {
          const response = await fetch(`/api/gpu-trends?gpuId=${encodeURIComponent(target.gpuId)}&days=${MAX_FETCH_WINDOW}`, {
            cache: 'no-store'
          });

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
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch trend data', err);
        setError('Unable to load price trends right now.');
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [targets, loading]);

  const renderChart = (target) => {
    if (!target.gpuId) {
      return (
        <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">
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
        <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">
          {isFetching ? 'Loading trend...' : 'Not enough data yet.'}
        </div>
      );
    }

    const tickGap = windowSize >= 90 ? 30 : windowSize >= 60 ? 24 : 18;

    return (
      <div className="h-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            {latest ? `Last: $${latest.movingAverage.toFixed(2)} / hr` : '—'}
          </div>
          <div className="text-xs text-gray-500">
            Providers: {latest?.providerCount ?? '—'}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visible}
            margin={{ top: 10, right: 12, left: 0, bottom: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDate}
              stroke="#9ca3af"
              tickMargin={8}
              minTickGap={tickGap}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke="#9ca3af"
              width={70}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Price Trends</h3>
          <p className="text-sm text-gray-600">Moving average across providers (latest price per provider per day)</p>
        </div>
        <div className="flex items-center gap-2">
          {WINDOWS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setWindowSize(value)}
              className={`btn btn-xs ${windowSize === value ? 'btn-primary' : 'btn-ghost text-gray-700'}`}
            >
              {value}d MA
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {targets.map((target) => (
          <div key={target.key} className="rounded-lg border bg-gray-50 p-3 shadow-sm">
            <div className="mb-2">
              <div className="text-xs uppercase tracking-wide text-gray-500">{target.title}</div>
              <div className="font-semibold text-gray-900">{target.gpuName || 'Loading...'}</div>
            </div>
            {renderChart(target)}
          </div>
        ))}
      </div>
    </div>
  );
}
