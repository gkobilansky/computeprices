import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CompareProviders({ suggestions, currentProvider }) {
  // Don't render if no suggestions or current provider
  if (!suggestions || suggestions.length === 0 || !currentProvider) {
    return null;
  }

  return (
    <section className="mb-16" aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="text-2xl font-bold mb-6 text-center">
        Compare Providers
      </h2>
      <p className="text-gray-600 text-center mb-8">
        Find the best prices for the same GPUs from other providers
      </p>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-200"
          >
            <div className="card-body p-6 text-center">
              {/* Provider Logo */}
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden">
                <Image 
                  src={`/logos/${suggestion.slug}.png`} 
                  alt={`${suggestion.name} logo`}
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
              </div>
              
              {/* Provider Name */}
              <h3 className="card-title text-lg justify-center mb-2">
                {suggestion.name}
              </h3>
              
              {/* Shared GPUs Info */}
              <p className="text-gray-600 text-sm mb-4">
                {suggestion.sharedGPUs} shared GPU{suggestion.sharedGPUs !== 1 ? 's' : ''} with {currentProvider.name}
              </p>
              
              {/* Compare Button */}
              <div className="card-actions justify-center">
                <Link
                  href={`/compare/${currentProvider.slug}/${suggestion.slug}`}
                  className="btn btn-primary btn-sm"
                >
                  Compare Prices
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional CTA if we have fewer than 3 suggestions */}
      {suggestions.length < 3 && (
        <div className="text-center mt-8">
          <Link
            href="/providers"
            className="btn btn-outline btn-sm"
          >
            View All Providers
          </Link>
        </div>
      )}
    </section>
  );
}