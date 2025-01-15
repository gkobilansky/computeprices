'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilter } from '@/lib/context/FilterContext';

export default function ProviderFilters() {
  const { selectedProvider, setSelectedProvider, selectedGPU, setSelectedGPU } = useFilter();
  const [gpuModels, setGPUModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [availableGPUs, setAvailableGPUs] = useState([]);

  useEffect(() => {
    fetchGPUModels();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchAvailableGPUs(selectedProvider.id);
    } else {
      setAvailableGPUs(gpuModels);
    }
  }, [selectedProvider, gpuModels]);

  async function fetchAvailableGPUs(providerId) {
    const { data, error } = await supabase
      .from('prices')
      .select(`
        gpu_model_id,
        gpu_models:gpu_model_id (
          id,
          name,
          vram,
          architecture,
          link,
          manufacturer,
          use_cases
        )
      `)
      .eq('provider_id', providerId);

    if (!error && data) {
      const uniqueGPUs = [...new Map(
        data
          .filter(item => item.gpu_models)
          .map(item => [item.gpu_models.id, item.gpu_models])
      ).values()];
      setAvailableGPUs(uniqueGPUs);

      if (selectedGPU && !uniqueGPUs.find(gpu => gpu.id === selectedGPU.id)) {
        setSelectedGPU(null);
      }
    } else {
      console.error('Error fetching available GPUs:', error);
    }
  }

  async function fetchGPUModels() {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('id, name, vram')
      .order('name');

    if (!error) {
      setGPUModels(data);
      setAvailableGPUs(data);
    }
  }

  async function fetchProviders() {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name')
      .order('name');

    if (!error) {
      setProviders(data);
    }
  }

  function handleProviderChange(e) {
    const providerName = e.target.value;
    if (providerName === '') {
      setSelectedProvider(null);
    } else {
      const provider = providers.find(p => p.name === providerName);
      setSelectedProvider(provider);
    }
  }

  function handleGPUChange(e) {
    const gpuId = e.target.value;
    if (gpuId === '') {
      setSelectedGPU(null);
    } else {
      const selectedGPU = availableGPUs.find(g => g.id === gpuId);
      setSelectedGPU(selectedGPU);
    }
  }

  function clearFilters() {
    setSelectedProvider(null);
    setSelectedGPU(null);
  }

  return (
    <div className="mb-6 space-y-4" role="search" aria-label="GPU and Provider Filters">
      <div className="flex flex-wrap gap-4">
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          value={selectedProvider ? selectedProvider.name : ''}
          onChange={handleProviderChange}
          aria-label="Select Provider"
        >
          <option value="">All Providers</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.name}>
              {provider.name}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          value={selectedGPU ? selectedGPU.id : ''}
          onChange={handleGPUChange}
          aria-label="Select GPU Type"
        >
          <option value="">All GPU Types</option>
          {availableGPUs.map((gpu) => (
            <option key={gpu.id} value={gpu.id}>
              {gpu.name}
            </option>
          ))}
        </select>
        <button 
          className="btn bg-amber-100 focus:ring-2 focus:ring-amber-200 hover:bg-amber-400" 
          onClick={clearFilters}
          aria-label="Clear all filters"
        >
          🧼 Scrub Filters
        </button>
      </div>
    </div>
  );
} 