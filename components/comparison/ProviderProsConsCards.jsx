'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * ProviderProsConsCards - Side-by-side pros/cons cards with visual design
 * Displays strengths, weaknesses, and use case recommendations for providers
 */
export default function ProviderProsConsCards({
  provider1Data,
  provider2Data,
  provider1Name,
  provider2Name,
  className = ''
}) {
  const [selectedProvider, setSelectedProvider] = useState(null);

  if (!provider1Data || !provider2Data) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-8 text-center ${className}`}>
        <div className="text-gray-600">
          No provider comparison data available.
        </div>
      </div>
    );
  }

  // Provider card component
  const ProviderCard = ({ 
    providerData, 
    providerName, 
    isSelected, 
    onSelect,
    cardColor = 'blue' 
  }) => {
    const colorConfig = {
      blue: {
        border: 'border-blue-200',
        selectedBorder: 'border-blue-500',
        bg: 'bg-blue-50',
        selectedBg: 'bg-blue-100',
        accent: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800',
        pros: 'text-green-700',
        cons: 'text-red-700'
      },
      green: {
        border: 'border-green-200',
        selectedBorder: 'border-green-500',
        bg: 'bg-green-50',
        selectedBg: 'bg-green-100',
        accent: 'text-green-600',
        badge: 'bg-green-100 text-green-800',
        pros: 'text-green-700',
        cons: 'text-red-700'
      }
    };

    const colors = colorConfig[cardColor] || colorConfig.blue;
    const cardClass = `
      border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 
      ${isSelected 
        ? `${colors.selectedBorder} ${colors.selectedBg} shadow-lg` 
        : `${colors.border} bg-white hover:${colors.bg} hover:shadow-md`
      }
    `;

    return (
      <div className={cardClass} onClick={() => onSelect?.()}>
        {/* Provider Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0">
            <Image
              src={`/logos/${providerData.slug}.png`}
              alt={providerName}
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${colors.accent}`}>
              {providerName}
            </h3>
            <p className="text-sm text-gray-600">
              {providerData.pricing?.model || 'Cloud Provider'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {(providerData.pricing || providerData.features) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {providerData.pricing?.averageCostRange && (
              <div className="text-center">
                <div className="text-sm text-gray-500">Price Range</div>
                <div className="font-semibold text-gray-900">
                  {providerData.pricing.averageCostRange}
                </div>
              </div>
            )}
            {providerData.features?.geographicCoverage?.regions && (
              <div className="text-center">
                <div className="text-sm text-gray-500">Regions</div>
                <div className="font-semibold text-gray-900">
                  {providerData.features.geographicCoverage.regions}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pros Section */}
        {providerData.pros && providerData.pros.length > 0 && (
          <div className="mb-6">
            <h4 className={`text-lg font-semibold ${colors.pros} mb-3 flex items-center gap-2`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Strengths
            </h4>
            <ul className="space-y-2">
              {providerData.pros.slice(0, isSelected ? undefined : 4).map((pro, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">{pro}</span>
                </li>
              ))}
              {!isSelected && providerData.pros.length > 4 && (
                <li className="text-sm text-gray-500 italic">
                  +{providerData.pros.length - 4} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Cons Section */}
        {providerData.cons && providerData.cons.length > 0 && (
          <div className="mb-6">
            <h4 className={`text-lg font-semibold ${colors.cons} mb-3 flex items-center gap-2`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Considerations
            </h4>
            <ul className="space-y-2">
              {providerData.cons.slice(0, isSelected ? undefined : 3).map((con, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">⚠</span>
                  <span className="text-gray-700">{con}</span>
                </li>
              ))}
              {!isSelected && providerData.cons.length > 3 && (
                <li className="text-sm text-gray-500 italic">
                  +{providerData.cons.length - 3} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Best For Section */}
        {providerData.bestFor && providerData.bestFor.length > 0 && (
          <div className="mb-4">
            <h4 className={`text-lg font-semibold ${colors.accent} mb-3 flex items-center gap-2`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Best For
            </h4>
            <div className="flex flex-wrap gap-2">
              {providerData.bestFor.slice(0, isSelected ? undefined : 3).map((useCase, index) => (
                <span 
                  key={index}
                  className={`${colors.badge} px-2 py-1 rounded-full text-xs`}
                >
                  {useCase}
                </span>
              ))}
              {!isSelected && providerData.bestFor.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                  +{providerData.bestFor.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Unique Features */}
        {providerData.uniqueFeatures && providerData.uniqueFeatures.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">
              Unique Features
            </h4>
            <ul className="space-y-1">
              {providerData.uniqueFeatures.slice(0, 2).map((feature, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className={`w-2 h-2 ${colors.bg} rounded-full flex-shrink-0`}></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Click to expand hint */}
        {!isSelected && (
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500">Click to see more details</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Provider Comparison
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Compare the strengths, weaknesses, and ideal use cases for each provider to make an informed decision.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProviderCard
          providerData={provider1Data}
          providerName={provider1Name}
          isSelected={selectedProvider === 'provider1'}
          onSelect={() => setSelectedProvider(
            selectedProvider === 'provider1' ? null : 'provider1'
          )}
          cardColor="blue"
        />
        
        <ProviderCard
          providerData={provider2Data}
          providerName={provider2Name}
          isSelected={selectedProvider === 'provider2'}
          onSelect={() => setSelectedProvider(
            selectedProvider === 'provider2' ? null : 'provider2'
          )}
          cardColor="green"
        />
      </div>

      {/* Decision Helper */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Decision Guide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Choose {provider1Name} if:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {provider1Data.bestFor?.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Choose {provider2Name} if:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              {provider2Data.bestFor?.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProviderProsConsCardsSkeleton - Loading state for pros/cons cards
 */
export function ProviderProsConsCardsSkeleton({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Skeleton */}
      <div className="text-center">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mx-auto"></div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="border-2 border-gray-200 rounded-lg p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}