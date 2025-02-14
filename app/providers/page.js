'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
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
  const searchInputRef = useRef(null);
  const resultsRef = useRef([]);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return providersData.filter(provider => {
      // Search in name and description
      const nameMatch = provider.name.toLowerCase().includes(query);
      const descMatch = provider.description.toLowerCase().includes(query);
      
      // Search in features
      const featureMatch = provider.features?.some(
        feature => 
          feature.title.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query)
      );
      
      // Search in pros and cons
      const prosMatch = provider.pros?.some(pro => 
        pro.toLowerCase().includes(query)
      );
      const consMatch = provider.cons?.some(con => 
        con.toLowerCase().includes(query)
      );
      
      return nameMatch || descMatch || featureMatch || prosMatch || consMatch;
    });
  }, [searchQuery]);

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
          window.location.href = `/providers/${selectedProvider.slug}`;
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

      <div id="search-results" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProviders.map((provider, index) => (
          <div
            key={provider.slug}
            ref={el => resultsRef.current[index] = el}
            className={`card bg-base-100 shadow-xl transition-colors ${
              index === selectedIndex ? 'ring-2 ring-primary' : ''
            }`}
            id={`provider-${index}`}
            role="option"
            aria-selected={index === selectedIndex}
          >
            <div className="card-body justify-start align-top">
              <h2 className="card-title">
                <Image src={`/logos/${provider.slug}.png`} alt={provider.name} width={20} height={20} className='inline-block' /> 
                <Highlight text={provider.name} query={searchQuery} />
              </h2>
              <span className="text-gray-600 mb-4">
                <Highlight text={provider.description} query={searchQuery} />
              </span>
              
              {/* Show matching features if any */}
              {searchQuery && provider.features?.some(f => 
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
              {searchQuery && provider.pros?.some(pro => 
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
              {searchQuery && provider.cons?.some(con => 
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
              
              <div className="card-actions justify-end mt-auto">
                <Link 
                  href={`/providers/${provider.slug}`} 
                  className="btn btn-primary"
                >
                  Learn More
                </Link>
                <a
                  href={provider.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Visit Site
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information Section */}
      <section className="space-y-6 mt-12">
        <h2 className="text-2xl font-semibold">Choosing a Cloud Provider</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For Enterprise Users</h3>
              <p className="text-gray-600">
                Enterprise users should consider providers like AWS, GCP, or Azure for their comprehensive 
                service offerings, strong security compliance, and global infrastructure. These providers 
                offer enterprise-grade support, robust SLAs, and deep integration with existing business tools.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For AI Researchers</h3>
              <p className="text-gray-600">
                Researchers might prefer specialized providers like Lambda Labs or Vast.ai for their 
                focus on ML workloads, competitive pricing, and access to specific GPU models. These 
                providers often offer simpler interfaces and better price-to-performance ratios.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For Startups</h3>
              <p className="text-gray-600">
                Startups should consider providers like RunPod or CoreWeave for their flexible pricing, 
                pay-as-you-go models, and lower entry barriers. These providers often offer good 
                documentation and community support for quick deployment.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For Cost Optimization</h3>
              <p className="text-gray-600">
                For cost-sensitive workloads, consider using spot instances from major providers or 
                specialized services like Vast.ai and Fluidstack. These options can offer significant 
                savings, though they may require more careful workflow management.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 