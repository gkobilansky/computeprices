'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProviderSelector({ providers }) {
  const [selectedProviders, setSelectedProviders] = useState([]);

  // Shared full-width compare CTA used at top and bottom
  const CompareCTA = ({ selected }) => {
    const canCompare = selected.length === 2;
    const label = canCompare
      ? `Compare ${selected[0].name} vs ${selected[1].name}`
      : 'Select 2 Providers to Compare';
    const href = canCompare
      ? `/compare/${selected[0].slug}/${selected[1].slug}`
      : '#';

    return (
      <div className="max-w-2xl mx-auto mb-8">
        {canCompare ? (
          <Link
            href={href}
            className="group btn btn-primary btn-lg w-full justify-between"
          >
            <span>{label}</span>
            <span className="inline-flex items-center transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        ) : (
          <button className="btn btn-primary btn-lg w-full justify-between btn-disabled" disabled>
            <span>{label}</span>
            <span className="inline-flex items-center opacity-50">→</span>
          </button>
        )}
      </div>
    );
  };

  const handleProviderClick = (provider) => {
    if (selectedProviders.find(p => p.id === provider.id)) {
      // Deselect provider
      setSelectedProviders(prev => prev.filter(p => p.id !== provider.id));
    } else if (selectedProviders.length < 2) {
      // Select provider if less than 2 selected
      setSelectedProviders(prev => [...prev, provider]);
    } else {
      // Replace first selected with new one if 2 already selected
      setSelectedProviders(prev => [prev[1], provider]);
    }
  };

  const isSelected = (providerId) => {
    return selectedProviders.find(p => p.id === providerId);
  };

  return (
    <div>
      {/* Top full-width Compare CTA */}
      <CompareCTA selected={selectedProviders} />

      {/* Provider Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {providers.map((provider) => {
          const selected = isSelected(provider.id);
          return (
            <div 
              key={provider.id}
              className={`card shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
                selected 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : 'border-base-200 bg-base-100 hover:border-primary hover:border-opacity-50'
              }`}
              onClick={() => handleProviderClick(provider)}
            >
              <div className="card-body p-4 text-center">
                {/* Selection Badge */}
                {selected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {selectedProviders.findIndex(p => p.id === provider.id) + 1}
                  </div>
                )}
                
                {/* Provider Logo */}
                {!provider.isMinimal && (
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image 
                      src={`/logos/${provider.slug}.png`} 
                      alt={`${provider.name} logo`}
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                  </div>
                )}
                
                {/* Provider Name */}
                <h3 className={`font-semibold text-sm mb-2 ${selected ? 'text-primary' : ''}`}>
                  {provider.name}
                </h3>
                
                {/* Selection Hint */}
                <div className="text-xs text-gray-500">
                  {selected ? 'Selected' : 'Click to select'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom full-width Compare CTA */}
      <CompareCTA selected={selectedProviders} />

      {/* Simplified: remove selected providers preview to reduce complexity */}

      {/* Quick Actions */}
      <div className="text-center mt-8">
        <p className="text-gray-600 mb-4">
          Or browse individual provider pages for comparison suggestions
        </p>
        <Link
          href="/providers"
          className="btn btn-outline"
        >
          View All Provider Pages
        </Link>
      </div>
    </div>
  );
}
