'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { fetchProviders } from '@/lib/utils/fetchGPUData';
import providersData from '@/data/providers.json';
import { getCountryFlag, getCountryName } from '@/lib/utils/countryFlags';

// Tag colors for visual distinction
const tagColors = {
  'Enterprise': 'bg-blue-100 text-blue-700',
  'ML-Focused': 'bg-purple-100 text-purple-700',
  'Budget': 'bg-green-100 text-green-700',
  'Green': 'bg-emerald-100 text-emerald-700',
  'Decentralized': 'bg-orange-100 text-orange-700',
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
          const jsonProvider = providersData.find(jp =>
            jp.id === dbProvider.id ||
            jp.name.toLowerCase() === dbProvider.name.toLowerCase()
          );

          if (jsonProvider) {
            return {
              ...jsonProvider,
              id: dbProvider.id,
              name: dbProvider.name
            };
          } else {
            return {
              ...dbProvider,
              description: "We're still gathering detailed info on this provider.",
              tagline: "GPU cloud provider",
              hqCountry: 'US',
              tags: [],
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
      const nameMatch = provider.name.toLowerCase().includes(query);
      const descMatch = provider.description?.toLowerCase().includes(query);
      const taglineMatch = provider.tagline?.toLowerCase().includes(query);
      const tagMatch = provider.tags?.some(tag => tag.toLowerCase().includes(query));
      const featureMatch = provider.features?.some(
        feature =>
          feature.title.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query)
      );
      const prosMatch = provider.pros?.some(pro =>
        pro.toLowerCase().includes(query)
      );
      const consMatch = provider.cons?.some(con =>
        con.toLowerCase().includes(query)
      );

      return nameMatch || descMatch || taglineMatch || tagMatch || featureMatch || prosMatch || consMatch;
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3">GPU Cloud Providers</h1>
        <p className="text-lg text-gray-600">
          Compare GPU cloud providers for your next project
        </p>
      </section>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            aria-label="Search providers"
            role="combobox"
            aria-expanded={searchQuery.length > 0}
            aria-controls="search-results"
            aria-activedescendant={selectedIndex >= 0 ? `provider-${selectedIndex}` : undefined}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to select
          </p>
        )}
      </div>

      {/* Provider List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div id="search-results" className="space-y-3">
          {filteredProviders.map((provider, index) => (
            <Link
              key={provider.id}
              href={`/providers/${provider.slug || provider.name.toLowerCase().replace(/\s+/g, '-')}`}
              ref={el => (resultsRef.current[index] = el)}
              id={`provider-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`group flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-200 hover:border-gray-300 hover:shadow-sm ${
                index === selectedIndex ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'
              }`}
            >
              {/* Logo */}
              <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                {!provider.isMinimal && provider.slug ? (
                  <Image
                    src={`/logos/${provider.slug}.png`}
                    alt={provider.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-400">
                    {provider.name?.charAt(0) || 'P'}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900 truncate">
                    {provider.name}
                  </h2>
                  <span
                    className="flex-shrink-0 text-lg"
                    title={getCountryName(provider.hqCountry)}
                    aria-label={`Headquartered in ${getCountryName(provider.hqCountry)}`}
                  >
                    {getCountryFlag(provider.hqCountry)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {provider.tagline || provider.description}
                </p>
              </div>

              {/* Tags */}
              {provider.tags && provider.tags.length > 0 && (
                <div className="hidden sm:flex flex-shrink-0 gap-1.5">
                  {provider.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Arrow */}
              <svg
                className="flex-shrink-0 w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}

          {!loading && filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No providers found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <section className="mt-16 space-y-8">
        <h2 className="text-2xl font-semibold text-center">Choosing a Provider</h2>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold mb-2">For Enterprise</h3>
            <p className="text-sm text-gray-600">
              Consider{' '}
              <Link href="/providers/aws" className="text-primary hover:underline">AWS</Link>,{' '}
              <Link href="/providers/google" className="text-primary hover:underline">GCP</Link>, or{' '}
              <Link href="/providers/azure" className="text-primary hover:underline">Azure</Link>{' '}
              for comprehensive services, security compliance, and global infrastructure.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold mb-2">For Startups</h3>
            <p className="text-sm text-gray-600">
              Try{' '}
              <Link href="/providers/runpod" className="text-primary hover:underline">RunPod</Link> or{' '}
              <Link href="/providers/coreweave" className="text-primary hover:underline">CoreWeave</Link>{' '}
              for flexible pricing and lower entry barriers with good documentation.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold mb-2">For Researchers</h3>
            <p className="text-sm text-gray-600">
              Check out{' '}
              <Link href="/providers/lambda" className="text-primary hover:underline">Lambda Labs</Link> or{' '}
              <Link href="/providers/vast" className="text-primary hover:underline">Vast.ai</Link>{' '}
              for ML-focused workflows and competitive GPU pricing.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold mb-2">For Budget</h3>
            <p className="text-sm text-gray-600">
              Explore{' '}
              <Link href="/providers/vast" className="text-primary hover:underline">Vast.ai</Link> or{' '}
              <Link href="/providers/salad" className="text-primary hover:underline">Salad Cloud</Link>{' '}
              for cost-effective options with flexible spot pricing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
