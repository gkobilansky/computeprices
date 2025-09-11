'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { fetchProviders } from '@/lib/utils/fetchGPUData';
import providersData from '@/data/providers.json';

// Helper function to highlight matching text
const Highlight = ({ text, query }) => {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ?
          <mark key={i} className="bg-primary/20 rounded px-0.5">{part}</mark> : part
      )}
    </span>
  );
};

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef(null);
  const resultsRef = useRef([]);

  useEffect(() => {
    async function loadProviders() {
      try {
        const dbProviders = await fetchProviders();

        // Merge DB providers with JSON data
        const mergedProviders = dbProviders.map(dbProvider => {
          // Try to find matching provider in JSON by ID first, then by name
          const jsonProvider = providersData.find(jp =>
            jp.id === dbProvider.id ||
            jp.name.toLowerCase() === dbProvider.name.toLowerCase()
          );

          if (jsonProvider) {
            // Merge DB data with JSON data, prioritizing JSON for rich content
            return {
              ...jsonProvider,
              id: dbProvider.id, // Use DB ID as authoritative
              name: dbProvider.name // Use DB name as authoritative
            };
          } else {
            // Return DB provider with minimal info and placeholder message
            return {
              ...dbProvider,
              description: "We're still gathering detailed info on this provider.",
              features: [],
              pros: [],
              cons: [],
              isMinimal: true
            };
          }
        });

        setProviders(mergedProviders);
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProviders();
  }, []);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return providers.filter(provider => {
      // Search in name and description
      const nameMatch = provider.name.toLowerCase().includes(query);
      const descMatch = provider.description?.toLowerCase().includes(query);

      // Search in features for providers with full data
      const featureMatch = provider.features?.some(
        feature =>
          feature.title.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query)
      );

      // Search in pros and cons for providers with full data
      const prosMatch = provider.pros?.some(pro =>
        pro.toLowerCase().includes(query)
      );
      const consMatch = provider.cons?.some(con =>
        con.toLowerCase().includes(query)
      );

      return nameMatch || descMatch || featureMatch || prosMatch || consMatch;
    });
  }, [searchQuery, providers]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (filteredProviders.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredProviders.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          const selectedProvider = filteredProviders[selectedIndex];
          window.location.href = `/providers/${selectedProvider.slug || selectedProvider.name.toLowerCase().replace(/\s+/g, '-')}`;
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.blur();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
      resultsRef.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">GPU Cloud Providers</h1>
        <p className="text-xl text-gray-600 mb-8">
          Compare different GPU cloud providers to find the best fit for your needs.
        </p>

        {/* Search Input */}
        <div className="form-control w-full max-w-md mb-8">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search providers, features, pros & cons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input input-bordered w-full pr-20"
              aria-label="Search providers"
              role="combobox"
              aria-expanded={searchQuery.length > 0}
              aria-controls="search-results"
              aria-activedescendant={selectedIndex >= 0 ? `provider-${selectedIndex}` : undefined}
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-10 flex items-center px-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {searchQuery && (
            <div className="text-sm text-gray-500 mt-2">
              Use ↑↓ to navigate, Enter to select, Esc to clear
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div id="search-results" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider, index) => (
            <Link
              key={provider.id}
              href={`/providers/${provider.slug || provider.name.toLowerCase().replace(/\s+/g, '-')}`}
              ref={el => (resultsRef.current[index] = el)}
              id={`provider-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`group block card h-full bg-base-100 shadow-md border border-base-200 transition-all duration-200 hover:shadow-lg hover:border-base-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary ${index === selectedIndex ? 'ring-2 ring-primary' : ''
                }`}
            >
              <div className="card-body flex flex-col justify-start align-top h-full">
                <h2 className="card-title">
                  {!provider.isMinimal && provider.slug && (
                    <Image src={`/logos/${provider.slug}.png`} alt={provider.name} width={20} height={20} className='inline-block' />
                  )}
                  <Highlight text={provider.name} query={searchQuery} />
                </h2>

                {provider.isMinimal ? (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-600" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        <Highlight text={provider.description} query={searchQuery} />
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-2" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <Highlight text={provider.description} query={searchQuery} />
                  </p>
                )}

                {/* Show matching features if any */}
                {!provider.isMinimal && searchQuery && provider.features?.some(f =>
                  f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.description.toLowerCase().includes(searchQuery.toLowerCase())
                ) && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Matching Features:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {provider.features
                          .filter(f =>
                            f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.description.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((f, i) => (
                            <li key={i} className="text-sm">
                              <strong><Highlight text={f.title} query={searchQuery} /></strong>: {' '}
                              <Highlight text={f.description} query={searchQuery} />
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  )}

                {/* Show matching pros if any */}
                {!provider.isMinimal && searchQuery && provider.pros?.some(pro =>
                  pro.toLowerCase().includes(searchQuery.toLowerCase())
                ) && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Matching Pros:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {provider.pros
                          .filter(pro => pro.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((pro, i) => (
                            <li key={i} className="text-sm">
                              <Highlight text={pro} query={searchQuery} />
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  )}

                {/* Show matching cons if any */}
                {!provider.isMinimal && searchQuery && provider.cons?.some(con =>
                  con.toLowerCase().includes(searchQuery.toLowerCase())
                ) && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Matching Cons:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {provider.cons
                          .filter(con => con.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((con, i) => (
                            <li key={i} className="text-sm">
                              <Highlight text={con} query={searchQuery} />
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  )}

                <div className="mt-auto pt-2 flex items-center justify-end gap-2 text-sm">
                  <span className="text-base-content/70 transition-all duration-200 group-hover:text-base-content">Learn more</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-6 w-6 text-primary transition-transform duration-200 transform group-hover:translate-x-1"
                  >
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.19l-3.22-3.22a.75.75 0 111.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.22-3.22H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
          {!loading && filteredProviders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No providers found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Additional Information Section */}
      <section className="space-y-8 mt-12">
        <h2 className="text-2xl font-semibold">Choosing a Cloud Provider</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">For Enterprise Users</h3>
              <p className="text-gray-600">
                Enterprise users should consider providers like{' '}
                <Link href="/providers/aws" className="text-blue-600 hover:text-blue-800 underline">AWS</Link>,{' '}
                <Link href="/providers/google" className="text-blue-600 hover:text-blue-800 underline">GCP</Link>, or{' '}
                <Link href="/providers/azure" className="text-blue-600 hover:text-blue-800 underline">Azure</Link>{' '}
                for their comprehensive service offerings, strong security compliance, and global infrastructure. These providers
                offer enterprise-grade support, robust SLAs, and deep integration with existing business tools.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">For Startups</h3>
              <p className="text-gray-600">
                Startups should consider providers like{' '}
                <Link href="/providers/runpod" className="text-blue-600 hover:text-blue-800 underline">RunPod</Link> or{' '}
                <Link href="/providers/coreweave" className="text-blue-600 hover:text-blue-800 underline">CoreWeave</Link>{' '}
                for their flexible pricing, pay-as-you-go models, and lower entry barriers. These providers often offer good
                documentation and community support for quick deployment.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">For AI Researchers</h3>
              <p className="text-gray-600">
                Researchers might prefer specialized providers like{' '}
                <Link href="/providers/lambda" className="text-blue-600 hover:text-blue-800 underline">Lambda Labs</Link> or{' '}
                <Link href="/providers/vast" className="text-blue-600 hover:text-blue-800 underline">Vast.ai</Link>{' '}
                for their focus on ML workloads, competitive pricing, and access to specific GPU models. These
                providers often offer simpler interfaces and better price-to-performance ratios.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">For Cost Optimization</h3>
              <p className="text-gray-600">
                For cost-sensitive workloads, consider using spot instances from major providers or
                specialized services like{' '}
                <Link href="/providers/vast" className="text-blue-600 hover:text-blue-800 underline">Vast.ai</Link> and{' '}
                <Link href="/providers/fluidstack" className="text-blue-600 hover:text-blue-800 underline">Fluidstack</Link>.
                These options can offer significant savings, though they may require more careful workflow management.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 