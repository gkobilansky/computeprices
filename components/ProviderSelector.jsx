'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProviderSelector({ providers }) {
  const [selectedProviders, setSelectedProviders] = useState([]);

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

  const canCompare = selectedProviders.length === 2;

  return (
    <div>
      {/* Selection Status */}
      <div className="mb-8 text-center">
        <div className="alert alert-info max-w-2xl mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div className="text-sm">
              {selectedProviders.length === 0 && "Select 2 providers to compare"}
              {selectedProviders.length === 1 && `Selected: ${selectedProviders[0].name}. Select 1 more provider.`}
              {selectedProviders.length === 2 && `Comparing: ${selectedProviders[0].name} vs ${selectedProviders[1].name}`}
            </div>
          </div>
        </div>
      </div>

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

      {/* Compare Button */}
      <div className="text-center mb-8">
        {canCompare ? (
          <Link
            href={`/compare/${selectedProviders[0].slug}/${selectedProviders[1].slug}`}
            className="btn btn-primary btn-lg"
          >
            Compare {selectedProviders[0].name} vs {selectedProviders[1].name}
          </Link>
        ) : (
          <button
            className="btn btn-primary btn-lg btn-disabled"
            disabled
          >
            Select 2 Providers to Compare
          </button>
        )}
      </div>

      {/* Selected Providers Preview */}
      {selectedProviders.length > 0 && (
        <div className="bg-base-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Selected Providers</h3>
          <div className="flex justify-center items-center gap-8">
            {selectedProviders.map((provider, index) => (
              <div key={provider.id} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                  {!provider.isMinimal ? (
                    <Image 
                      src={`/logos/${provider.slug}.png`} 
                      alt={`${provider.name} logo`}
                      width={40} 
                      height={40} 
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  )}
                </div>
                <div className="font-medium text-sm">{provider.name}</div>
                <button
                  onClick={() => handleProviderClick(provider)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Remove
                </button>
              </div>
            ))}
            
            {selectedProviders.length === 2 && (
              <div className="text-2xl font-bold text-gray-400">VS</div>
            )}
          </div>
        </div>
      )}

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