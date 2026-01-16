'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

function formatPrice(price) {
  if (price === null || price === undefined) return '-';
  const num = parseFloat(price);
  if (num < 0.01) return `$${num.toFixed(4)}`;
  if (num < 1) return `$${num.toFixed(3)}`;
  return `$${num.toFixed(2)}`;
}

function formatContext(contextWindow) {
  if (!contextWindow) return '-';
  if (contextWindow >= 1000000) return `${(contextWindow / 1000000).toFixed(1)}M`;
  return `${(contextWindow / 1000).toFixed(0)}K`;
}

function formatKnowledgeCutoff(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Modality icons
const ModalityIcon = ({ modality }) => {
  const icons = {
    text: (
      <span title="Text" className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-medium">
        Aa
      </span>
    ),
    image: (
      <span title="Image" className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-600">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
    ),
    video: (
      <span title="Video" className="inline-flex items-center justify-center w-6 h-6 rounded bg-violet-50 text-violet-600">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </span>
    ),
    audio: (
      <span title="Audio" className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-50 text-emerald-600">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </span>
    ),
  };
  return icons[modality] || null;
};

function ModalityIcons({ modalities }) {
  if (!modalities || modalities.length === 0) {
    return <span className="text-slate-400">-</span>;
  }
  return (
    <div className="flex gap-1">
      {modalities.map((m) => (
        <ModalityIcon key={m} modality={m} />
      ))}
    </div>
  );
}

export default function LLMComparisonTable({ prices, models, providers }) {
  const [sortField, setSortField] = useState('price_per_1m_input');
  const [sortDirection, setSortDirection] = useState('asc');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  // Listen for filter events from LLMTopPicks
  useEffect(() => {
    const handleFilterChange = (event) => {
      const { filterType, value } = event.detail;
      if (filterType === 'model') {
        setModelFilter(value);
        setCreatorFilter('');
        setProviderFilter('');
        setModalityFilter('');
      } else if (filterType === 'creator') {
        setCreatorFilter(value);
      } else if (filterType === 'provider') {
        setProviderFilter(value);
      }
    };

    window.addEventListener('llm-filter-change', handleFilterChange);
    return () => window.removeEventListener('llm-filter-change', handleFilterChange);
  }, []);

  // Get unique creators for filter
  const creators = useMemo(() => {
    const unique = [...new Set(models.map(m => m.creator))];
    return unique.sort();
  }, [models]);

  // Get unique provider names from prices
  const providerNames = useMemo(() => {
    const unique = [...new Set(prices.map(p => p.provider_name))];
    return unique.sort();
  }, [prices]);

  // Get unique modalities across all prices
  const allModalities = useMemo(() => {
    const modalitySet = new Set();
    prices.forEach(p => {
      if (p.modalities && Array.isArray(p.modalities)) {
        p.modalities.forEach(m => modalitySet.add(m));
      }
    });
    return Array.from(modalitySet).sort();
  }, [prices]);

  // Sort and filter prices
  const sortedPrices = useMemo(() => {
    let filtered = [...prices];

    if (modelFilter) {
      filtered = filtered.filter(p => p.model_name === modelFilter);
    }

    if (creatorFilter) {
      const modelIds = models
        .filter(m => m.creator === creatorFilter)
        .map(m => m.id);
      filtered = filtered.filter(p => modelIds.includes(p.llm_model_id));
    }

    if (providerFilter) {
      filtered = filtered.filter(p => p.provider_name === providerFilter);
    }

    if (modalityFilter) {
      filtered = filtered.filter(p =>
        p.modalities && Array.isArray(p.modalities) && p.modalities.includes(modalityFilter)
      );
    }

    filtered.sort((a, b) => {
      const aVal = parseFloat(a[sortField]) ?? 999999;
      const bVal = parseFloat(b[sortField]) ?? 999999;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [prices, sortField, sortDirection, creatorFilter, providerFilter, modalityFilter, modelFilter, models]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const hasFilters = creatorFilter || providerFilter || modalityFilter || modelFilter;

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <select
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">All Model Creators</option>
          {creators.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">All Providers</option>
          {providerNames.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {allModalities.length > 0 && (
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="">All Modalities</option>
            {allModalities.map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => {
              setCreatorFilter('');
              setProviderFilter('');
              setModalityFilter('');
              setModelFilter('');
            }}
            className="btn btn-ghost btn-sm text-slate-600 hover:text-slate-900"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="mb-3 text-sm text-slate-500">
        Showing {sortedPrices.length} price{sortedPrices.length !== 1 ? 's' : ''}
        {modelFilter && <span className="ml-2 px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">{modelFilter}</span>}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Model</th>
              <th>Creator</th>
              <th>Provider</th>
              <th>Context</th>
              <th>Modalities</th>
              <th>Knowledge</th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors"
                onClick={() => handleSort('price_per_1m_input')}
              >
                Input/1M <SortIndicator field="price_per_1m_input" />
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors"
                onClick={() => handleSort('price_per_1m_output')}
              >
                Output/1M <SortIndicator field="price_per_1m_output" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPrices.map((price) => (
              <tr key={price.id}>
                <td className="font-medium">{price.model_name}</td>
                <td className="text-gray-600">{price.creator}</td>
                <td>
                  <Link
                    href={`/providers/${price.provider_slug}`}
                    className="link link-primary"
                  >
                    {price.provider_name}
                  </Link>
                </td>
                <td className="text-gray-600">
                  {formatContext(price.context_window)}
                </td>
                <td>
                  <ModalityIcons modalities={price.modalities} />
                </td>
                <td className="text-gray-600 text-sm">
                  {formatKnowledgeCutoff(price.knowledge_cutoff)}
                </td>
                <td>{formatPrice(price.price_per_1m_input)}</td>
                <td>{formatPrice(price.price_per_1m_output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-2">
        {sortedPrices.map((price) => (
          <div
            key={price.id}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            {/* Header: Model + Price */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{price.model_name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{price.creator}</span>
                  <span className="text-slate-300">•</span>
                  <Link
                    href={`/providers/${price.provider_slug}`}
                    className="text-violet-600 hover:text-violet-700"
                  >
                    {price.provider_name}
                  </Link>
                </div>
              </div>
              <div className="text-right pl-3">
                <div className="font-semibold text-slate-900">{formatPrice(price.price_per_1m_input)}</div>
                <div className="text-xs text-slate-500">per 1M in</div>
              </div>
            </div>

            {/* Footer: Meta info */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span>{formatContext(price.context_window)} ctx</span>
                <span>{formatKnowledgeCutoff(price.knowledge_cutoff)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ModalityIcons modalities={price.modalities} />
                <span className="text-slate-400">|</span>
                <span>{formatPrice(price.price_per_1m_output)} out</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedPrices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No pricing data available.</p>
          {hasFilters && (
            <button
              onClick={() => {
                setCreatorFilter('');
                setProviderFilter('');
                setModalityFilter('');
                setModelFilter('');
              }}
              className="mt-2 text-violet-600 hover:text-violet-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
