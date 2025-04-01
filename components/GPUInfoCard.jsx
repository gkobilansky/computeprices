'use client';

import { useState, useEffect } from 'react';
import { fetchGPUModels } from '@/lib/utils/fetchGPUData';
import { useFilter } from '@/lib/context/FilterContext';
import Link from 'next/link';

export default function GPUInfoCard() {
  const { selectedGPU } = useFilter();
  const [gpuDetails, setGpuDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (selectedGPU) {
        setIsLoading(true);
        setError(null);
        try {
          const gpuData = await fetchGPUModels(selectedGPU.id);
          setGpuDetails(gpuData);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedGPU]);

  if (isLoading) {
    return (
      <div className="card bg-white border shadow-sm rounded-xl overflow-hidden h-full max-h-[500px]">
        <div className="card-body p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-white border shadow-sm rounded-xl overflow-hidden h-full max-h-[500px]">
        <div className="card-body p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-50 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg">Error Loading GPU Data</h3>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gpuDetails) {
    return (
      <div className="card bg-white border shadow-sm rounded-xl overflow-hidden h-full max-h-[500px]">
        <div className="card-body p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg">GPU Specifications</h3>
            <p className="text-gray-500 text-sm">Pick a GPU from the table to check out its specs and see how it performs.</p>
          </div>
        </div>
      </div>
    );
  }

  const { name, architecture, vram, link, manufacturer, slug } = gpuDetails;

  return (
    <div className="card bg-white border shadow-sm rounded-xl overflow-hidden p-6">
      <div className="flex items-start gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">{name}</h2>
          <div className="flex items-center gap-1 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{manufacturer}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xl font-semibold text-blue-600">{vram}GB</div>
          <div className="text-xs text-gray-600">VRAM</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-sm font-semibold text-purple-600">{architecture || "Unknown"}</div>
          <div className="text-xs text-gray-600">Architecture</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href={`/gpus/${slug}`}
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
            View Details
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