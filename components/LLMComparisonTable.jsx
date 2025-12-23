'use client';

import { useState, useMemo } from 'react';
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

export default function LLMComparisonTable({ prices, models, providers }) {
  const [sortField, setSortField] = useState('price_per_1m_input');
  const [sortDirection, setSortDirection] = useState('asc');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

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

  // Sort and filter prices
  const sortedPrices = useMemo(() => {
    let filtered = [...prices];

    if (creatorFilter) {
      const modelIds = models
        .filter(m => m.creator === creatorFilter)
        .map(m => m.id);
      filtered = filtered.filter(p => modelIds.includes(p.llm_model_id));
    }

    if (providerFilter) {
      filtered = filtered.filter(p => p.provider_name === providerFilter);
    }

    filtered.sort((a, b) => {
      const aVal = parseFloat(a[sortField]) ?? 999999;
      const bVal = parseFloat(b[sortField]) ?? 999999;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [prices, sortField, sortDirection, creatorFilter, providerFilter, models]);

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

        {(creatorFilter || providerFilter) && (
          <button
            onClick={() => {
              setCreatorFilter('');
              setProviderFilter('');
            }}
            className="btn btn-ghost btn-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="mb-2 text-sm text-gray-500">
        Showing {sortedPrices.length} price{sortedPrices.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Model</th>
              <th>Creator</th>
              <th>Provider</th>
              <th>Context</th>
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
                <td>{formatPrice(price.price_per_1m_input)}</td>
                <td>{formatPrice(price.price_per_1m_output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedPrices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No pricing data available.</p>
          {(creatorFilter || providerFilter) && (
            <button
              onClick={() => {
                setCreatorFilter('');
                setProviderFilter('');
              }}
              className="mt-2 link link-primary"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
