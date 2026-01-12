'use client';

import React, { useState, useEffect } from 'react';
import { getProviderBySlug } from '@/lib/providers';
import { useFilter } from '@/lib/context/FilterContext';
import Image from 'next/image';
import Link from 'next/link';

function ProviderInfoCard() {
  const { selectedProvider } = useFilter();
  const [providerDetails, setProviderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProviderDetails() {
      if (!selectedProvider) {
        setProviderDetails(null);
        return;
      }

      // If selectedProvider already has full details (slug, description, etc.), use it
      if (selectedProvider.slug && selectedProvider.description) {
        setProviderDetails(selectedProvider);
        return;
      }

      // Otherwise fetch from database
      setLoading(true);
      try {
        // Try to get slug from name
        const slug = selectedProvider.slug || selectedProvider.name?.toLowerCase().replace(/\s+/g, '-');
        if (slug) {
          const details = await getProviderBySlug(slug);
          setProviderDetails(details);
        }
      } catch (error) {
        console.error('Error loading provider details:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProviderDetails();
  }, [selectedProvider]);

  if (!selectedProvider) {
    return (
      <div className="card bg-white border shadow-sm rounded-xl overflow-hidden h-full max-h-[500px] pt-6">
        <div className="card-body p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-blue-50 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg">Provider Details</h3>
            <p className="text-gray-500 text-sm">Select a provider from the table to see information about pricing, features, and more.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card bg-white border shadow-sm rounded-xl overflow-hidden h-full max-h-[500px] pt-6">
        <div className="card-body p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 text-sm">Loading provider details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!providerDetails) {
    return (
      <div className="card bg-white border shadow-sm rounded-xl overflow-hidden h-full max-h-[500px] pt-6">
        <div className="card-body p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-amber-50 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg">Limited Information</h3>
            <p className="text-gray-500 text-sm">We don&rsquo;t have enough details about this provider yet. Check back later for updates.</p>
          </div>
        </div>
      </div>
    );
  }

  const { name, description, link, slug } = providerDetails;

  return (
    <div className="card bg-white border shadow-sm rounded-xl overflow-hidden p-6">
      <div className="flex items-center gap-4 mb-4">
        {slug && (
          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src={`/logos/${slug}.png`} alt={name} width={32} height={32} className="object-contain" />
          </div>
        )}
        <h2 className="text-2xl font-semibold text-gray-900">{name}</h2>
      </div>
      <p className="text-gray-600 text-base mb-6">{description}</p>
      <div className="flex items-center gap-4">
        <Link
          href={`/providers/${slug}`}
          className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          Learn More
        </Link>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center gap-1"
          >
            Visit Website
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default ProviderInfoCard; 
