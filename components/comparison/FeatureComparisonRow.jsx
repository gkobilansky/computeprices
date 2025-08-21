'use client';

import FeatureIndicator from './FeatureIndicator';
import FeatureTooltip, { InfoIcon, HelpIcon } from './FeatureTooltip';

/**
 * FeatureComparisonRow - Individual feature row showing dual-provider comparison
 * Displays feature name, values for both providers, and comparison indicators
 */
export default function FeatureComparisonRow({
  featureName,
  featureKey,
  provider1Data,
  provider2Data,
  provider1Name,
  provider2Name,
  notes = null,
  isHighlighted = false,
  showWinner = true,
  className = ''
}) {
  // Get feature values from provider data
  const getValue = (providerData, key) => {
    if (!providerData || !providerData.features) return null;
    
    // Handle nested feature keys (e.g., 'pricing.flexible')
    const keys = key.split('.');
    let value = providerData.features;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return null;
    }
    
    return value;
  };

  const provider1Value = getValue(provider1Data, featureKey);
  const provider2Value = getValue(provider2Data, featureKey);

  // Determine winner based on feature type and values
  const determineWinner = () => {
    if (!showWinner || provider1Value === null || provider2Value === null) return null;
    
    // Boolean comparisons - true is better
    if (typeof provider1Value === 'boolean' && typeof provider2Value === 'boolean') {
      if (provider1Value && !provider2Value) return 'provider1';
      if (provider2Value && !provider1Value) return 'provider2';
      return null; // Both same
    }
    
    // Numeric comparisons (scores) - higher is better
    if (typeof provider1Value === 'number' && typeof provider2Value === 'number') {
      if (provider1Value > provider2Value) return 'provider1';
      if (provider2Value > provider1Value) return 'provider2';
      return null; // Equal
    }
    
    // String quality comparisons
    if (typeof provider1Value === 'string' && typeof provider2Value === 'string') {
      const qualityOrder = {
        'excellent': 5,
        'good': 4, 
        'fair': 3,
        'basic': 2,
        'poor': 1,
        'limited': 1
      };
      
      const score1 = qualityOrder[provider1Value.toLowerCase()] || 0;
      const score2 = qualityOrder[provider2Value.toLowerCase()] || 0;
      
      if (score1 > score2) return 'provider1';
      if (score2 > score1) return 'provider2';
    }
    
    // Array comparisons - more items is generally better
    if (Array.isArray(provider1Value) && Array.isArray(provider2Value)) {
      if (provider1Value.length > provider2Value.length) return 'provider1';
      if (provider2Value.length > provider1Value.length) return 'provider2';
    }
    
    return null; // No clear winner
  };

  const winner = determineWinner();

  // Winner indicator component
  const WinnerBadge = ({ isWinner }) => {
    if (!isWinner) return null;
    
    return (
      <div className="inline-flex items-center ml-2">
        <span className="text-green-500 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      </div>
    );
  };

  // Feature cell component
  const FeatureCell = ({ value, isWinner, providerName }) => {
    if (value === null || value === undefined) {
      return (
        <div className="text-gray-400 text-sm text-center py-2">
          N/A
        </div>
      );
    }

    const cellClass = isWinner ? 
      'bg-green-50 border border-green-200 rounded-lg p-3' : 
      'bg-gray-50 rounded-lg p-3';

    return (
      <div className={cellClass}>
        <div className="flex items-center justify-between">
          <FeatureIndicator value={value} size="md" />
          <WinnerBadge isWinner={isWinner} />
        </div>
      </div>
    );
  };

  return (
    <div className={`
      py-4 border-b border-gray-200 
      ${isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50'} 
      ${className}
    `}>
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-center">
        {/* Feature Name */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{featureName}</span>
          {notes && (
            <FeatureTooltip
              content={notes}
              title={featureName}
              trigger="both"
              position="auto"
            >
              <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </FeatureTooltip>
          )}
        </div>

        {/* Provider 1 Value */}
        <div>
          <div className="text-xs text-gray-500 mb-1">{provider1Name}</div>
          <FeatureCell 
            value={provider1Value} 
            isWinner={winner === 'provider1'} 
            providerName={provider1Name}
          />
        </div>

        {/* Provider 2 Value */}
        <div>
          <div className="text-xs text-gray-500 mb-1">{provider2Name}</div>
          <FeatureCell 
            value={provider2Value} 
            isWinner={winner === 'provider2'} 
            providerName={provider2Name}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-gray-900">{featureName}</span>
          {notes && (
            <FeatureTooltip
              content={notes}
              title={featureName}
              trigger="both"
              position="auto"
            >
              <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </FeatureTooltip>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Provider 1 Mobile */}
          <div>
            <div className="text-xs text-gray-500 mb-1">{provider1Name}</div>
            <FeatureCell 
              value={provider1Value} 
              isWinner={winner === 'provider1'} 
              providerName={provider1Name}
            />
          </div>

          {/* Provider 2 Mobile */}
          <div>
            <div className="text-xs text-gray-500 mb-1">{provider2Name}</div>
            <FeatureCell 
              value={provider2Value} 
              isWinner={winner === 'provider2'} 
              providerName={provider2Name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FeatureComparisonRowSkeleton - Loading state for feature rows
 */
export function FeatureComparisonRowSkeleton({ className = '' }) {
  return (
    <div className={`py-4 border-b border-gray-200 ${className}`}>
      {/* Desktop Skeleton */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-center">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}