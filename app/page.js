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
          <a href="#guide" className="text-primary hover:underline ml-1">
            Need help choosing?
          </a>
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
          <div className="flex-1 order-2 lg:order-1">
            <GPUComparisonTable 
              setSelectedGPU={setSelectedGPU} 
              setSelectedProvider={setSelectedProvider} 
              selectedProvider={selectedProvider}
              selectedGPU={selectedGPU} 
            />
          </div>
          <div className="lg:w-80 space-y-6 order-1 lg:order-2">
           <ProviderInfoCard selectedProvider={selectedProvider} />
            <GPUInfoCard selectedGPU={selectedGPU} />
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide" className="py-8">
        <GPUGuide />
      </section>

    </div>
  );
}
