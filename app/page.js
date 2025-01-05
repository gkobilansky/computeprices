'use client';

import { useState } from 'react';
import Link from 'next/link';
import GPUComparisonTable from '@/components/GPUComparisonTable';
import ProviderFilters from '@/components/ProviderFilters';
import GPUInfoCard from '@/components/GPUInfoCard';
import ProviderInfoCard from '@/components/ProviderInfoCard';
import Superlatives from '@/components/Superlatives';

export default function Home() {
  const [selectedGPU, setSelectedGPU] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">
          Find the Best
          <span className="gradient-text-1 block mt-1">Cloud GPU Pricing</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Compare the most cost-effective GPUs for your machine learning workloads.
          <Link href="/gpus" className="text-primary gradient-text-1 hover:underline ml-1">
            Need help choosing?
          </Link>
        </p>
      </section>

      {/* Main Content */}
      <section className="space-y-6">
        <Superlatives />
        
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
    </div>
  );
}
