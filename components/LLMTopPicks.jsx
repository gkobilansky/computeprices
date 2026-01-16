'use client';

import { useMemo, useState } from 'react';

function formatPrice(price) {
  if (price === null || price === undefined) return '-';
  const num = parseFloat(price);
  if (num < 0.01) return `$${num.toFixed(4)}`;
  if (num < 1) return `$${num.toFixed(3)}`;
  return `$${num.toFixed(2)}`;
}

export default function LLMTopPicks({ prices }) {
  const [activeFilter, setActiveFilter] = useState(null);

  const picks = useMemo(() => {
    if (!prices || prices.length === 0) {
      return {
        cheapest: null,
        mostPopular: null,
        topPerformance: null
      };
    }

    // Find cheapest (by input price)
    let cheapest = null;
    let cheapestPrice = Infinity;
    prices.forEach(p => {
      const inputPrice = parseFloat(p.price_per_1m_input);
      if (inputPrice < cheapestPrice) {
        cheapestPrice = inputPrice;
        cheapest = p;
      }
    });

    // Find most popular (most providers offer it)
    const modelCounts = {};
    prices.forEach(p => {
      const key = p.model_name;
      modelCounts[key] = (modelCounts[key] || 0) + 1;
    });

    let mostPopularName = null;
    let maxCount = 0;
    Object.entries(modelCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPopularName = name;
      }
    });
    const mostPopular = prices.find(p => p.model_name === mostPopularName);

    // Find top performance model (Claude Opus or GPT-4o as flagship)
    const topModels = ['Claude Opus 4.5', 'Claude 3 Opus', 'GPT-4o', 'GPT-5'];
    let topPerformance = null;
    for (const modelName of topModels) {
      topPerformance = prices.find(p => p.model_name === modelName);
      if (topPerformance) break;
    }
    if (!topPerformance) {
      // Fallback to highest priced model
      topPerformance = prices.reduce((max, p) =>
        parseFloat(p.price_per_1m_input) > parseFloat(max?.price_per_1m_input || 0) ? p : max
      , null);
    }

    return { cheapest, mostPopular, topPerformance };
  }, [prices]);

  const scrollToTable = () => {
    // Scroll to the table section
    const tableElement = document.querySelector('.table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePickClick = (filterType, value) => {
    // Dispatch custom event to communicate with LLMComparisonTable
    window.dispatchEvent(new CustomEvent('llm-filter-change', {
      detail: { filterType, value }
    }));
    setActiveFilter(filterType);
    setTimeout(scrollToTable, 100);
  };

  if (!picks.cheapest && !picks.mostPopular && !picks.topPerformance) {
    return (
      <div className="text-center py-6 text-slate-500">
        Loading top picks...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Cheapest Option */}
      {picks.cheapest && (
        <button
          type="button"
          onClick={() => handlePickClick('model', picks.cheapest.model_name)}
          className={`w-full text-left bg-white rounded-lg p-4 shadow-sm border transition transform hover:-translate-y-0.5 ${
            activeFilter === 'cheapest'
              ? 'border-violet-300 ring-1 ring-violet-200'
              : 'border-slate-200 hover:border-violet-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <h3 className="font-semibold text-sm text-slate-900">Cheapest Option</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              Filter
            </span>
          </div>
          <p className="text-sm text-slate-700 font-medium">
            {picks.cheapest.model_name}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {picks.cheapest.provider_name} · {formatPrice(picks.cheapest.price_per_1m_input)}/1M input
          </p>
        </button>
      )}

      {/* Most Popular */}
      {picks.mostPopular && (
        <button
          type="button"
          onClick={() => handlePickClick('model', picks.mostPopular.model_name)}
          className={`w-full text-left bg-white rounded-lg p-4 shadow-sm border transition transform hover:-translate-y-0.5 ${
            activeFilter === 'popular'
              ? 'border-violet-300 ring-1 ring-violet-200'
              : 'border-slate-200 hover:border-violet-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h3 className="font-semibold text-sm text-slate-900">Most Popular</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              Filter
            </span>
          </div>
          <p className="text-sm text-slate-700 font-medium">
            {picks.mostPopular.model_name}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Available from multiple providers
          </p>
        </button>
      )}

      {/* Top Performance */}
      {picks.topPerformance && (
        <button
          type="button"
          onClick={() => handlePickClick('model', picks.topPerformance.model_name)}
          className={`w-full text-left bg-white rounded-lg p-4 shadow-sm border transition transform hover:-translate-y-0.5 ${
            activeFilter === 'top'
              ? 'border-violet-300 ring-1 ring-violet-200'
              : 'border-slate-200 hover:border-violet-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎩</span>
              <h3 className="font-semibold text-sm text-slate-900">Top Performance</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              Filter
            </span>
          </div>
          <p className="text-sm text-slate-700 font-medium">
            {picks.topPerformance.model_name}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {picks.topPerformance.creator} · Premium capabilities
          </p>
        </button>
      )}
    </div>
  );
}
