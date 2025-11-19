'use client';

import { useState, useEffect, useCallback } from 'react';
import { Combobox, ComboboxOption } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useFilter } from '@/lib/context/FilterContext';
import Image from 'next/image';

export default function IntegratedFilters() {
    const {
        selectedProvider,
        setSelectedProvider,
        selectedGPU,
        setSelectedGPU,
        useCase,
        setUseCase,
        budget,
        setBudget,
        providerQuery,
        setProviderQuery,
        gpuQuery,
        setGpuQuery,
        showBestPriceOnly,
        setShowBestPriceOnly,
        clearAllFilters,
        applyQuickSearch,
    } = useFilter();

    const [gpuModels, setGPUModels] = useState([]);
    const [providers, setProviders] = useState([]);
    const [availableGPUs, setAvailableGPUs] = useState([]);
    const [isProviderOpen, setIsProviderOpen] = useState(false);
    const [isGPUOpen, setIsGPUOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // GPU use case mappings
    const useCaseOptions = [
        { value: '', label: 'Any Use Case' },
        { value: 'fine-tuning', label: 'Fine-tuning (A100/H100)', gpuSuggestions: ['H100', 'A100', 'A40'] },
        { value: 'inference', label: 'Inference (RTX 4090/L40S)', gpuSuggestions: ['RTX 4090', 'L40S', 'RTX 4080'] },
        { value: 'training', label: 'Training (Multi-GPU setup)', gpuSuggestions: ['H100', 'A100', 'V100'] },
        { value: 'development', label: 'Development (Budget GPUs)', gpuSuggestions: ['RTX 3090', 'RTX A4000', 'T4'] },
    ];

    const budgetOptions = [
        { value: '', label: 'Any Budget' },
        { value: 'under-1', label: 'Under $1/hr', max: 1 },
        { value: '1-5', label: '$1-5/hr', min: 1, max: 5 },
        { value: '5-20', label: '$5-20/hr', min: 5, max: 20 },
        { value: '20-plus', label: '$20+/hr', min: 20 },
    ];

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

    const fetchAvailableGPUs = useCallback(async (providerId) => {
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
    }, [selectedGPU, setSelectedGPU]);

    const fetchGPUModels = useCallback(async () => {
        const { data, error } = await supabase
            .from('gpu_models')
            .select('id, name, vram')
            .order('name');

        if (!error) {
            setGPUModels(data);
            setAvailableGPUs(data);
        }
    }, []);

    const fetchProviders = useCallback(async () => {
        const { data, error } = await supabase
            .from('providers')
            .select('id, name')
            .order('name');

        if (!error) {
            setProviders(data);
        }
    }, []);

    useEffect(() => {
        fetchGPUModels();
        fetchProviders();
    }, [fetchGPUModels, fetchProviders]);

    useEffect(() => {
        if (selectedProvider) {
            fetchAvailableGPUs(selectedProvider.id);
        } else {
            setAvailableGPUs(gpuModels);
        }
    }, [selectedProvider, gpuModels, fetchAvailableGPUs]);

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

    const hasActiveFilters = selectedProvider || selectedGPU || useCase || budget || providerQuery || gpuQuery || showBestPriceOnly;

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            {/* Header with title, toggle, and clear button */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                    aria-expanded={isExpanded}
                    aria-controls="filter-content"
                >
                    <span className="text-2xl">🚀</span>
                    <h3 className="text-lg font-semibold">Find Your Perfect GPU</h3>
                    <svg
                        className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <button
                    className={`btn btn-sm ${hasActiveFilters
                        ? 'btn-outline btn-warning'
                        : 'btn-disabled'
                        }`}
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                >
                    🧼 Clear All
                </button>
            </div>

            {/* Collapsible Content */}
            <div
                id="filter-content"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {/* Quick Search Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">I need a GPU for:</label>
                    <select
                        className="select select-bordered w-full h-12 focus:border-primary"
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value)}
                    >
                        {useCaseOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Budget per hour:</label>
                    <select
                        className="select select-bordered w-full h-12 focus:border-primary"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                    >
                        {budgetOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Provider and GPU Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Provider Search */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Filter by Provider:</label>
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
                                    className={`w-full h-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${selectedProvider && getProviderLogo(selectedProvider.name) ? 'pl-10 pr-4' : 'px-4'
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
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
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
                                                    `relative cursor-default select-none py-2 pl-3 pr-4 flex items-center gap-2 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
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

                {/* GPU Search */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Filter by GPU Model:</label>
                    <Combobox value={selectedGPU} onChange={setSelectedGPU} nullable>
                        <div className="relative">
                            <Combobox.Input
                                className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
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
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
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
            </div>

            {/* Best Prices Toggle */}
            <div className="mb-6">
                <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Best Prices Only</span>
                    <input
                        type="checkbox"
                        className="toggle toggle-sm toggle-primary"
                        checked={showBestPriceOnly}
                        onChange={(e) => setShowBestPriceOnly(e.target.checked)}
                    />
                </label>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-blue-800">Active filters:</span>
                        {selectedProvider && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border">
                                Provider: {selectedProvider.name}
                                <button
                                    onClick={() => setSelectedProvider(null)}
                                    className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {selectedGPU && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border">
                                GPU: {selectedGPU.name}
                                <button
                                    onClick={() => setSelectedGPU(null)}
                                    className="ml-1 text-green-600 hover:text-green-800 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {useCase && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 border">
                                Use case: {useCaseOptions.find(opt => opt.value === useCase)?.label}
                                <button
                                    onClick={() => setUseCase('')}
                                    className="ml-1 text-purple-600 hover:text-purple-800 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {budget && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 border">
                                Budget: {budgetOptions.find(opt => opt.value === budget)?.label}
                                <button
                                    onClick={() => setBudget('')}
                                    className="ml-1 text-orange-600 hover:text-orange-800 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {showBestPriceOnly && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border">
                                Best prices only
                                <button
                                    onClick={() => setShowBestPriceOnly(false)}
                                    className="ml-1 text-yellow-600 hover:text-yellow-800 font-bold"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
} 
