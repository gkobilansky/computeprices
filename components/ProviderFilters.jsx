'use client';

import { useState, useEffect } from 'react';
import { Combobox, ComboboxOption } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useFilter } from '@/lib/context/FilterContext';
import Image from 'next/image';

export default function ProviderFilters() {
  const { selectedProvider, setSelectedProvider, selectedGPU, setSelectedGPU } = useFilter();
  const [gpuModels, setGPUModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [availableGPUs, setAvailableGPUs] = useState([]);
  const [providerQuery, setProviderQuery] = useState('');
  const [gpuQuery, setGpuQuery] = useState('');
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isGPUOpen, setIsGPUOpen] = useState(false);

  const getProviderLogo = (providerName) => {
    const logoMap = {
      'Amazon AWS': 'aws.png',
      'Microsoft Azure': 'azure.png',
      'Google Cloud': 'google.png',
      'CoreWeave': 'coreweave.png',
      'Datacrunch': 'datacrunch.png',
      'Fluidstack': 'fluidstack.png',
      'Hyperstack': 'hyperstack.png',
      'Lambda Labs': 'lambda.png',
      'RunPod': 'runpod.png',
      'Vast.ai': 'vast.png',
      'Paperspace': 'paperspace.png',
      'Crusoe': 'crusoe.png',
      'Genesis Cloud': 'genesis.png',
      'TensorWave': 'tensorwave.png',
      'Latitude': 'latitude.png',
      'Civo': 'civo.png',
      'Vultr': 'vultr.png',
      'Oracle Cloud': 'oracle.png',
      'IMB Cloud': 'ibm.png',
      'Voltage Park': 'voltage.png',
      'The Cloud Minders': 'cloud-minders.png',
      'Hot Aisle': 'hot-aisle.png',
      'White Fiber': 'white-fiber.png',
      'Scaleway': 'scaleway.png',
      'Nebius': 'nebius.png',
      'Massed Compute': 'massedcompute.png',
      'Deep Infra': 'deep-infra.png',
      'Cudo Compute': 'cudo-compute.png',
      'Build AI': 'buildai.png'
    };
    
    return logoMap[providerName] || null;
  };

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

  const filteredProviders = providerQuery === ''
    ? providers
    : providers.filter((provider) =>
        provider.name
          .toLowerCase()
          .includes(providerQuery.toLowerCase())
      );

  const filteredGPUs = gpuQuery === ''
    ? availableGPUs
    : availableGPUs.filter((gpu) =>
        gpu.name
          .toLowerCase()
          .includes(gpuQuery.toLowerCase())
      );

  function clearFilters() {
    setSelectedProvider(null);
    setSelectedGPU(null);
    setProviderQuery('');
    setGpuQuery('');
  }

  return (
    <div className="mb-6 space-y-4" role="search" aria-label="GPU and Provider Filters">
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px]">
          <Combobox value={selectedProvider} onChange={setSelectedProvider} nullable>
            <div className="relative">
              <div className="relative">
                {selectedProvider && getProviderLogo(selectedProvider.name) && (
                  <Image
                    src={`/logos/${getProviderLogo(selectedProvider.name)}`}
                    alt={`${selectedProvider.name} logo`}
                    width={20}
                    height={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 object-contain z-10"
                  />
                )}
                <Combobox.Input
                  className={`w-full py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    selectedProvider && getProviderLogo(selectedProvider.name) ? 'pl-10 pr-4' : 'px-4'
                  }`}
                  displayValue={(provider) => provider?.name ?? ''}
                  onChange={(event) => setProviderQuery(event.target.value)}
                  onFocus={() => setIsProviderOpen(true)}
                  onBlur={() => setTimeout(() => setIsProviderOpen(false), 100)}
                  placeholder="Search providers..."
                />
              </div>
              {isProviderOpen && (
                <Combobox.Options 
                  className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  static
                >
                  <ComboboxOption
                    key="all-providers"
                    value={null}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    All Providers
                  </ComboboxOption>
                  {filteredProviders.map((provider) => {
                    const logoPath = getProviderLogo(provider.name);
                    return (
                      <ComboboxOption
                        key={provider.id}
                        value={provider}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-4 flex items-center gap-2 ${
                            active ? 'bg-blue-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {logoPath && (
                          <Image
                            src={`/logos/${logoPath}`}
                            alt={`${provider.name} logo`}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        )}
                        {provider.name}
                      </ComboboxOption>
                    );
                  })}
                </Combobox.Options>
              )}
            </div>
          </Combobox>
        </div>

        <div className="min-w-[200px]">
          <Combobox value={selectedGPU} onChange={setSelectedGPU} nullable>
            <div className="relative">
              <Combobox.Input
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                displayValue={(gpu) => gpu?.name ?? ''}
                onChange={(event) => setGpuQuery(event.target.value)}
                onFocus={() => setIsGPUOpen(true)}
                onBlur={() => setTimeout(() => setIsGPUOpen(false), 100)}
                placeholder="Search GPUs..."
              />
              {isGPUOpen && (
                <Combobox.Options 
                  className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  static
                >
                  <ComboboxOption
                    key="all-gpus"
                    value={null}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    All GPU Types
                  </ComboboxOption>
                  {filteredGPUs.map((gpu) => (
                    <ComboboxOption
                      key={gpu.id}
                      value={gpu}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {gpu.name}
                    </ComboboxOption>
                  ))}
                </Combobox.Options>
              )}
            </div>
          </Combobox>
        </div>

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