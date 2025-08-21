import Link from 'next/link';
// Custom SVG Icons
const ExclamationTriangleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const HomeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ScaleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const MagnifyingGlassIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

export default function ComparisonNotFound() {
  // Popular comparison suggestions for when a specific comparison isn't found
  const popularComparisons = [
    { href: '/compare/aws-vs-coreweave', label: 'AWS vs CoreWeave', description: 'Enterprise vs specialized GPU cloud' },
    { href: '/compare/aws-vs-runpod', label: 'AWS vs RunPod', description: 'Traditional cloud vs developer-focused' },
    { href: '/compare/coreweave-vs-lambda', label: 'CoreWeave vs Lambda', description: 'Kubernetes vs AI-optimized platform' },
    { href: '/compare/google-vs-azure', label: 'Google vs Azure', description: 'Major cloud provider comparison' },
    { href: '/compare/hyperstack-vs-fluidstack', label: 'Hyperstack vs FluidStack', description: 'European vs global GPU providers' },
    { href: '/compare/vast-vs-runpod', label: 'Vast.ai vs RunPod', description: 'Marketplace vs managed GPU cloud' }
  ];

  const allProviders = [
    'AWS', 'Google Cloud', 'Microsoft Azure', 'CoreWeave', 'RunPod', 'Lambda Labs',
    'Vast.ai', 'FluidStack', 'Hyperstack', 'Genesis Cloud', 'DataCrunch', 'Paperspace'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Error Icon and Header */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comparison Not Found
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The provider comparison you're looking for doesn't exist or the URL format is incorrect. 
            Let's help you find the right comparison.
          </p>

          {/* URL Format Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Supported URL Formats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    /compare/aws-vs-coreweave
                  </code>
                </div>
                <div className="flex items-center">
                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    /compare/aws/vs/coreweave
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    /compare/aws,coreweave
                  </code>
                </div>
                <div className="flex items-center">
                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    /compare/aws/coreweave
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Comparisons */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Popular Comparisons
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularComparisons.map((comparison, idx) => (
                <Link
                  key={idx}
                  href={comparison.href}
                  className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                      {comparison.label}
                    </h3>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-600">{comparison.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Available Providers */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Providers
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {allProviders.map((provider, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200"
                >
                  {provider}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Create comparisons by combining any two providers using the formats above.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/providers"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ScaleIcon className="w-5 h-5 mr-2" />
              Browse All Providers
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Need help?</strong> Provider comparisons follow the format{' '}
              <code className="bg-white px-1 py-0.5 rounded text-xs">/compare/provider1-vs-provider2</code>.
              Use lowercase provider slugs (e.g., "aws", "coreweave", "runpod").
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}