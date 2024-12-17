'use client';

import { useState } from 'react';
import GPUComparisonTable from '@/components/GPUComparisonTable';
import ProviderFilters from '@/components/ProviderFilters';
import GPUInfoCard from '@/components/GPUInfoCard';
import ProviderInfoCard from '@/components/ProviderInfoCard';
import GPUGuide from '@/components/GPUGuide';

export default function Home() {
  const [selectedGPU, setSelectedGPU] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  return (
    <div className="space-y-12">
      {/* Hero Section - Now more compact and left-aligned */}
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-3">
          Cloud GPU
          <span className="gradient-text-1"> Price Comparison</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Find and compare the most cost-effective GPUs for your machine learning workloads.
        </p>
      </section>

      {/* Main Content */}
      <section className="space-y-6">
        <ProviderFilters 
          setSelectedProvider={setSelectedProvider} 
          selectedProvider={selectedProvider} 
          setSelectedGPU={setSelectedGPU} 
          selectedGPU={selectedGPU} 
        />
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <GPUComparisonTable 
              setSelectedGPU={setSelectedGPU} 
              setSelectedProvider={setSelectedProvider} 
              selectedProvider={selectedProvider}
              selectedGPU={selectedGPU} 
            />
          </div>
          <div className="lg:w-80 space-y-6">
            <GPUInfoCard selectedGPU={selectedGPU} />
            <ProviderInfoCard selectedProvider={selectedProvider} />
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide" className="py-8">
        <GPUGuide />
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-600">
        <div className="space-y-3">
          <p>Built with 🦾 by <a href="https://lansky.tech" className="text-primary hover:underline">Lansky Tech</a></p>
          <p>Data updated every 24 hours</p>
        </div>
      </footer>
    </div>
  );
}
