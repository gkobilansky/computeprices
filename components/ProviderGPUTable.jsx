'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

export default function ProviderGPUTable({ prices }) {
  const [sortConfig, setSortConfig] = useState({
    key: 'gpu_model_name',
    direction: 'asc'
  });

  if (!prices || prices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No GPU instances available for this provider at the moment.
      </div>
    );
  }

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPrices = [...prices].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="table w-full" role="grid" aria-label="GPU Instances">
        <thead>
          <tr>
            <th 
              onClick={() => handleSort('gpu_model_name')}
              className="cursor-pointer hover:bg-base-200"
              role="columnheader"
              aria-sort={sortConfig.key === 'gpu_model_name' ? sortConfig.direction : 'none'}
            >
              <div className="flex items-center">
                GPU Model
                {renderSortIcon('gpu_model_name')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('vram')}
              className="cursor-pointer hover:bg-base-200"
              role="columnheader"
              aria-sort={sortConfig.key === 'vram' ? sortConfig.direction : 'none'}
            >
              <div className="flex items-center">
                Memory
                {renderSortIcon('vram')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('price_per_hour')}
              className="cursor-pointer hover:bg-base-200"
              role="columnheader"
              aria-sort={sortConfig.key === 'price_per_hour' ? sortConfig.direction : 'none'}
            >
              <div className="flex items-center">
                Hourly Price
                {renderSortIcon('price_per_hour')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPrices.map((price, index) => (
            <tr key={index} role="row">
              <td role="cell">
                <div className="flex items-center gap-2">
                  {price.gpu_model_name}
                </div>
              </td>
              <td role="cell">{price.gpu_model_vram}GB</td>
              <td role="cell">{formatPrice(price.price_per_hour)}/hr</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pricing Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Table",
            "about": "GPU Instance Pricing",
            "abstract": "Current GPU instance pricing and specifications",
            "mainEntity": sortedPrices.map(price => ({
              "@type": "Product",
              "name": price.gpu_model_name,
              "description": `${price.gpu_model_name} GPU instance with ${price.vram}GB memory`,
              "offers": {
                "@type": "Offer",
                "price": price.price_per_hour,
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            }))
          })
        }}
      />
    </div>
  );
} 