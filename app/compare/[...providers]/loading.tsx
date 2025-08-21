// Custom SVG Icons
const CpuChipIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const ArrowsRightLeftIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

export default function ComparisonLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Loading */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          {/* Title Loading */}
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-300 rounded-lg max-w-lg mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded max-w-3xl mx-auto mb-2"></div>
              <div className="h-6 bg-gray-200 rounded max-w-2xl mx-auto"></div>
            </div>
          </div>

          {/* Provider Cards Loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Provider 1 Loading Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-blue-300 rounded mb-2 w-32"></div>
                    <div className="h-4 bg-blue-200 rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-8 bg-blue-300 rounded mb-1 w-12"></div>
                    <div className="h-3 bg-blue-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-blue-200 rounded w-24"></div>
              </div>
            </div>

            {/* Provider 2 Loading Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-green-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-green-300 rounded mb-2 w-32"></div>
                    <div className="h-4 bg-green-200 rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-8 bg-green-300 rounded mb-1 w-12"></div>
                    <div className="h-3 bg-green-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-green-200 rounded w-24"></div>
              </div>
            </div>
          </div>

          {/* Stats Loading */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-4 w-48 mx-auto"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-8 h-8 bg-gray-300 rounded mb-2 mx-auto"></div>
                    <div className="h-8 bg-gray-300 rounded mb-2 w-12 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Loading */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-2 text-sm mb-4">
              <div className="h-4 bg-gray-300 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-2"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-2"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-300 rounded w-24"></div>
                <div className="h-8 bg-blue-200 rounded w-32"></div>
                <div className="h-8 bg-green-200 rounded w-32"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Loading */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <ArrowsRightLeftIcon className="w-8 h-8 text-blue-600 animate-pulse" />
            <span className="text-lg font-medium text-gray-700">Loading comparison data...</span>
            <CpuChipIcon className="w-8 h-8 text-green-600 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loading Cards */}
          {[...Array(6)].map((_, idx) => (
            <div 
              key={idx} 
              className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${
                idx === 0 || idx === 4 || idx === 5 ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-5 h-5 bg-gray-300 rounded mr-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-48"></div>
                </div>
                
                {idx === 0 ? (
                  // Pricing table loading
                  <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    {[...Array(8)].map((_, rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-5 gap-4">
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Regular section loading
                  <div className="space-y-4">
                    {[...Array(4)].map((_, lineIdx) => (
                      <div key={lineIdx} className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-gray-300 rounded-full mt-0.5"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Spinner Overlay */}
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-gray-700 mb-2">Loading Comparison</p>
          <p className="text-sm text-gray-500">Fetching pricing data and provider information...</p>
        </div>
      </div>
    </div>
  );
}