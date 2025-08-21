'use client';

import { useState } from 'react';
import FeatureComparisonRow, { FeatureComparisonRowSkeleton } from './FeatureComparisonRow';
import FeatureTooltip, { HelpIcon } from './FeatureTooltip';

/**
 * FeatureCategorySection - Grouped feature sections with collapsible areas
 * Organizes related features into expandable/collapsible sections
 */
export default function FeatureCategorySection({
  categoryName,
  categoryKey,
  features,
  provider1Data,
  provider2Data,
  provider1Name,
  provider2Name,
  description = null,
  icon = null,
  isExpanded = true,
  onToggle = null,
  showWinner = true,
  className = ''
}) {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  
  // Use external toggle handler or internal state
  const expanded = onToggle ? isExpanded : internalExpanded;
  const toggleExpanded = onToggle || (() => setInternalExpanded(!internalExpanded));

  // Category icons mapping
  const categoryIcons = {
    gpuSelection: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
      </svg>
    ),
    pricing: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    ),
    performance: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    scalability: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
    support: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-1.106-1.106A6.003 6.003 0 004 10c0 .639.1 1.255.283 1.831l1.362-1.362zM10 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
      </svg>
    ),
    developerExperience: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    security: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    geographicCoverage: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
      </svg>
    )
  };

  const displayIcon = icon || categoryIcons[categoryKey] || (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );

  // Calculate feature scores for the category
  const getCategoryScore = (providerData) => {
    if (!providerData?.features || !features) return 0;
    
    let totalScore = 0;
    let validFeatures = 0;
    
    features.forEach(feature => {
      const value = providerData.features[feature.key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'number' && value >= 1 && value <= 10) {
          totalScore += value;
          validFeatures++;
        } else if (typeof value === 'boolean') {
          totalScore += value ? 8 : 3; // Arbitrary scoring for booleans
          validFeatures++;
        }
      }
    });
    
    return validFeatures > 0 ? Math.round(totalScore / validFeatures) : 0;
  };

  const provider1Score = getCategoryScore(provider1Data);
  const provider2Score = getCategoryScore(provider2Data);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Category Header */}
      <div 
        className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              {displayIcon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {categoryName}
                {description && (
                  <FeatureTooltip
                    content={description}
                    title={categoryName}
                    trigger="both"
                    position="auto"
                  >
                    <HelpIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </FeatureTooltip>
                )}
              </h3>
              {features && (
                <p className="text-sm text-gray-600">
                  {features.length} feature{features.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Category Scores */}
            {(provider1Score > 0 || provider2Score > 0) && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xs text-gray-500">{provider1Name}</div>
                  <div className={`font-semibold ${
                    provider1Score > provider2Score ? 'text-green-600' : 
                    provider1Score < provider2Score ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {provider1Score}/10
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">{provider2Name}</div>
                  <div className={`font-semibold ${
                    provider2Score > provider1Score ? 'text-green-600' : 
                    provider2Score < provider1Score ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {provider2Score}/10
                  </div>
                </div>
              </div>
            )}
            
            {/* Expand/Collapse Arrow */}
            <div className={`transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Content */}
      {expanded && (
        <div className="divide-y divide-gray-200">
          {features ? (
            features.map((feature, index) => (
              <FeatureComparisonRow
                key={feature.key || index}
                featureName={feature.name}
                featureKey={feature.key}
                provider1Data={provider1Data}
                provider2Data={provider2Data}
                provider1Name={provider1Name}
                provider2Name={provider2Name}
                notes={feature.notes}
                showWinner={showWinner}
                className="px-4"
              />
            ))
          ) : (
            // Loading skeleton
            [...Array(3)].map((_, index) => (
              <FeatureComparisonRowSkeleton 
                key={index} 
                className="px-4" 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FeatureCategorySectionSkeleton - Loading state for category sections
 */
export function FeatureCategorySectionSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header Skeleton */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="divide-y divide-gray-200">
        {[...Array(3)].map((_, index) => (
          <FeatureComparisonRowSkeleton 
            key={index} 
            className="px-4" 
          />
        ))}
      </div>
    </div>
  );
}