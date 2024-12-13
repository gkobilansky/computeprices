'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProviderFilters() {
  const [gpuModels, setGpuModels] = useState([]);
  const [selectedGpu, setSelectedGpu] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGpuModels();
  }, []);

  async function fetchGpuModels() {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('id, name')
      .order('name');
    
    if (!error) {
      setGpuModels(data);
    }
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        <input 
          type="text"
          placeholder="Search providers..."
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedGpu}
          onChange={(e) => setSelectedGpu(e.target.value)}
        >
          <option value="">All GPU Types</option>
          {gpuModels.map((gpu) => (
            <option key={gpu.id} value={gpu.id}>
              {gpu.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 