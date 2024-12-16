'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProviderFilters({setSelectedProvider, selectedProvider, setSelectedGPU, selectedGPU}) {
  const [gpuModels, setGPUModels] = useState([]);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    fetchGPUModels();
    fetchProviders();
  }, []);

  async function fetchGPUModels() {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('id, name')
      .order('name');
    
    if (!error) {
      setGPUModels(data);
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
    console.log(e.target.value);
    const selectedProvider = providers.find(p => p.name === e.target.value);
    setSelectedProvider(selectedProvider);
  }

  function handleGPUChange(e) {
    const selectedGPU = gpuModels.find(g => g.name === e.target.value);
    setSelectedGPU(selectedGPU);
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">        
        <select 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedProvider ? selectedProvider.name : ''}
          onChange={handleProviderChange}
        >
          <option value="">All Providers</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.name}>
              {provider.name}
            </option>
          ))}
        </select>
        <select 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedGPU ? selectedGPU.name : ''}
          onChange={handleGPUChange}
        >
          <option value="">All GPU Types</option>
          {gpuModels.map((gpu) => (
            <option key={gpu.id} value={gpu.name}>
              {gpu.name}
            </option>
          ))}
        </select> 
      </div>
    </div>
  );
} 