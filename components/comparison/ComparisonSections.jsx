'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Define inline SVG icons to avoid heroicons dependency
const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const InformationCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const CpuChipIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CurrencyDollarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const GlobeAltIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const ShieldCheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);
import FeatureComparisonMatrix from './FeatureComparisonMatrix';
import ProviderProsConsCards from './ProviderProsConsCards';

// Features Comparison Section - Enhanced with FeatureComparisonMatrix
export function FeaturesComparisonSection({ provider1, provider2 }) {
  const [providerComparisonData, setProviderComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load provider comparison data
  useEffect(() => {
    const loadProviderData = async () => {
      try {
        // Import the provider-comparisons.json data
        const response = await fetch('/data/provider-comparisons.json');
        if (!response.ok) throw new Error('Failed to fetch comparison data');
        
        const data = await response.json();
        
        // Find the provider data by slug
        const provider1Data = Object.values(data.providers).find(p => 
          p.slug === provider1.slug || p.name === provider1.name
        );
        const provider2Data = Object.values(data.providers).find(p => 
          p.slug === provider2.slug || p.name === provider2.name
        );

        setProviderComparisonData({
          provider1: provider1Data,
          provider2: provider2Data
        });
      } catch (error) {
        console.error('Error loading provider comparison data:', error);
        // Fallback to basic comparison if detailed data unavailable
        setProviderComparisonData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProviderData();
  }, [provider1.slug, provider2.slug, provider1.name, provider2.name]);

  // If we have detailed comparison data, use the enhanced matrix
  if (providerComparisonData?.provider1 && providerComparisonData?.provider2) {
    return (
      <FeatureComparisonMatrix
        provider1Data={providerComparisonData.provider1}
        provider2Data={providerComparisonData.provider2}
        provider1Name={provider1.name}
        provider2Name={provider2.name}
        loading={loading}
      />
    );
  }

  // Fallback to basic features comparison
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-gray-600" />
          Features Comparison
        </h3>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading feature comparison...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider 1 Features */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
              </div>
              <ul className="space-y-3">
                {provider1?.features?.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900">{feature.title}</strong>
                      <p className="text-gray-600 text-sm mt-1">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Provider 2 Features */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
              </div>
              <ul className="space-y-3">
                {provider2?.features?.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900">{feature.title}</strong>
                      <p className="text-gray-600 text-sm mt-1">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Pros and Cons Section - Enhanced with ProviderProsConsCards
export function ProsConsSection({ provider1, provider2 }) {
  const [providerComparisonData, setProviderComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load provider comparison data
  useEffect(() => {
    const loadProviderData = async () => {
      try {
        // Import the provider-comparisons.json data
        const response = await fetch('/data/provider-comparisons.json');
        if (!response.ok) throw new Error('Failed to fetch comparison data');
        
        const data = await response.json();
        
        // Find the provider data by slug
        const provider1Data = Object.values(data.providers).find(p => 
          p.slug === provider1.slug || p.name === provider1.name
        );
        const provider2Data = Object.values(data.providers).find(p => 
          p.slug === provider2.slug || p.name === provider2.name
        );

        setProviderComparisonData({
          provider1: provider1Data,
          provider2: provider2Data
        });
      } catch (error) {
        console.error('Error loading provider comparison data:', error);
        // Fallback to basic comparison if detailed data unavailable
        setProviderComparisonData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProviderData();
  }, [provider1.slug, provider2.slug, provider1.name, provider2.name]);

  // If we have detailed comparison data, use the enhanced cards
  if (providerComparisonData?.provider1 && providerComparisonData?.provider2) {
    return (
      <ProviderProsConsCards
        provider1Data={providerComparisonData.provider1}
        provider2Data={providerComparisonData.provider2}
        provider1Name={provider1.name}
        provider2Name={provider2.name}
      />
    );
  }

  // Fallback to basic pros/cons comparison
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <InformationCircleIcon className="w-5 h-5 mr-2 text-gray-600" />
          Pros & Cons
        </h3>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading provider comparison...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Provider 1 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
              </div>
              
              {provider1?.pros && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-green-800 mb-2">Advantages</h5>
                  <ul className="space-y-2">
                    {provider1.pros.slice(0, 4).map((pro, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {provider1?.cons && (
                <div>
                  <h5 className="text-sm font-medium text-red-800 mb-2">Considerations</h5>
                  <ul className="space-y-2">
                    {provider1.cons.slice(0, 3).map((con, idx) => (
                      <li key={idx} className="flex items-start">
                        <XCircleIcon className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Provider 2 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
              </div>
              
              {provider2?.pros && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-green-800 mb-2">Advantages</h5>
                  <ul className="space-y-2">
                    {provider2.pros.slice(0, 4).map((pro, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {provider2?.cons && (
                <div>
                  <h5 className="text-sm font-medium text-red-800 mb-2">Considerations</h5>
                  <ul className="space-y-2">
                    {provider2.cons.slice(0, 3).map((con, idx) => (
                      <li key={idx} className="flex items-start">
                        <XCircleIcon className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compute Services Section
export function ComputeServicesSection({ provider1, provider2 }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CpuChipIcon className="w-5 h-5 mr-2 text-gray-600" />
          Compute Services
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider 1 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
            </div>
            
            <div className="space-y-4">
              {provider1?.computeServices?.slice(0, 3).map((service, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{service.name}</h5>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  {service.features && (
                    <ul className="space-y-1">
                      {service.features.slice(0, 2).map((feature, fidx) => (
                        <li key={fidx} className="text-xs text-gray-500 flex items-start">
                          <span className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {typeof feature === 'string' ? feature : feature.name || feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Provider 2 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
            </div>
            
            <div className="space-y-4">
              {provider2?.computeServices?.slice(0, 3).map((service, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{service.name}</h5>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  {service.features && (
                    <ul className="space-y-1">
                      {service.features.slice(0, 2).map((feature, fidx) => (
                        <li key={fidx} className="text-xs text-gray-500 flex items-start">
                          <span className="w-1 h-1 bg-green-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {typeof feature === 'string' ? feature : feature.name || feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pricing Options Section
export function PricingOptionsSection({ provider1, provider2 }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-600" />
          Pricing Options
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider 1 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
            </div>
            
            <div className="space-y-3">
              {provider1?.pricingOptions?.map((option, idx) => (
                <div key={idx} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <h5 className="font-medium text-blue-900 text-sm mb-1">{option.name}</h5>
                  <p className="text-xs text-blue-700">{option.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Provider 2 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
            </div>
            
            <div className="space-y-3">
              {provider2?.pricingOptions?.map((option, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50">
                  <h5 className="font-medium text-green-900 text-sm mb-1">{option.name}</h5>
                  <p className="text-xs text-green-700">{option.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Getting Started Section
export function GettingStartedSection({ provider1, provider2 }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 lg:col-span-2">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-gray-600" />
          Getting Started
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider 1 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
              </div>
              {provider1?.link && (
                <Link
                  href={provider1.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Get Started
                  <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
            
            <ol className="space-y-3">
              {provider1?.gettingStarted?.map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center mr-3 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          
          {/* Provider 2 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
              </div>
              {provider2?.link && (
                <Link
                  href={provider2.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Get Started
                  <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
            
            <ol className="space-y-3">
              {provider2?.gettingStarted?.map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white text-xs font-medium rounded-full flex items-center justify-center mr-3 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Support and Regions Section
export function SupportRegionsSection({ provider1, provider2 }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 lg:col-span-2">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <GlobeAltIcon className="w-5 h-5 mr-2 text-gray-600" />
          Support & Global Availability
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider 1 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <h4 className="font-medium text-gray-900">{provider1?.name}</h4>
            </div>
            
            <div className="space-y-4">
              {provider1?.regions && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <GlobeAltIcon className="w-4 h-4 mr-1 text-blue-600" />
                    Global Regions
                  </h5>
                  <p className="text-sm text-gray-600">{provider1.regions}</p>
                </div>
              )}
              
              {provider1?.support && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <ShieldCheckIcon className="w-4 h-4 mr-1 text-blue-600" />
                    Support
                  </h5>
                  <p className="text-sm text-gray-600">{provider1.support}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Provider 2 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              <h4 className="font-medium text-gray-900">{provider2?.name}</h4>
            </div>
            
            <div className="space-y-4">
              {provider2?.regions && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <GlobeAltIcon className="w-4 h-4 mr-1 text-green-600" />
                    Global Regions
                  </h5>
                  <p className="text-sm text-gray-600">{provider2.regions}</p>
                </div>
              )}
              
              {provider2?.support && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <ShieldCheckIcon className="w-4 h-4 mr-1 text-green-600" />
                    Support
                  </h5>
                  <p className="text-sm text-gray-600">{provider2.support}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}