'use client';

import { useState } from 'react';
import GPUComparisonTable from '@/components/GPUComparisonTable';
import ProviderFilters from '@/components/ProviderFilters';
import GPUInfoCard from '@/components/GPUInfoCard';
import ProviderInfoCard from '@/components/ProviderInfoCard';

export default function Home() {
  const [selectedGPU, setSelectedGPU] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  return (
    <div>
      <main className="min-h-screen p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:justify-between mb-8">
          <header className="mb-4 md:mb-0 md:w-full">
            <h1 className="text-3xl font-bold">Cloud GPU Price Comparison</h1>
            <p className="text-gray-600 mt-2">Find the most cost-effective GPU for your ML workload</p>
          </header>
        </div>
        <ProviderFilters setSelectedProvider={setSelectedProvider} />
        <GPUComparisonTable setSelectedGPU={setSelectedGPU} setSelectedProvider={setSelectedProvider} />
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p>Built with 🦾 by <a href="https://lansky.tech" target="_blank" rel="noopener noreferrer">Lansky Tech</a></p>
        <p>Data updated every 24 hours</p>
      </footer>
    </div>
  );
}
