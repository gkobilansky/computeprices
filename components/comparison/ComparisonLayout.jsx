'use client';

import { useState } from 'react';

// Custom SVG Icons
const ArrowsRightLeftIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const Squares2X2Icon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListBulletIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export default function ComparisonLayout({ 
  children, 
  provider1, 
  provider2,
  className = "" 
}) {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side', 'stacked', 'table'
  
  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Layout Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'side-by-side'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowsRightLeftIcon className="w-4 h-4 inline mr-1" />
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('stacked')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'stacked'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4 inline mr-1" />
                  Stacked
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4 inline mr-1" />
                  Table
                </button>
              </div>
            </div>

            {/* Provider Legend (for reference) */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-600">{provider1?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600">{provider2?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8">
        <div 
          className={`
            ${viewMode === 'side-by-side' 
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' 
              : viewMode === 'stacked'
              ? 'space-y-8'
              : 'w-full'
            }
          `}
          data-view-mode={viewMode}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Sub-component for side-by-side sections
export function ComparisonSection({ 
  title, 
  children, 
  provider1Content, 
  provider2Content,
  provider1,
  provider2,
  className = "",
  fullWidth = false 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className} ${fullWidth ? 'lg:col-span-2' : ''}`}>
      {title && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="p-6">
        {/* If provider-specific content is provided, use side-by-side layout */}
        {(provider1Content || provider2Content) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider 1 Content */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
              </div>
              {provider1Content}
            </div>
            
            {/* Provider 2 Content */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
              </div>
              {provider2Content}
            </div>
          </div>
        ) : (
          // General content
          children
        )}
      </div>
    </div>
  );
}

// Sub-component for full-width sections (like pricing tables)
export function ComparisonFullSection({ 
  title, 
  children, 
  className = "" 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden lg:col-span-2 ${className}`}>
      {title && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}