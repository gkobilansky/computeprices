'use client';

import { useGPUData } from '@/lib/hooks/useGPUData';
import { useFilter } from '@/lib/context/FilterContext';

const Superlatives = ({ gpuData: gpuDataProp = null, loading: loadingProp = null, error: errorProp = null, picks = null }) => {
  const { setSelectedProvider, setSelectedGPU } = useFilter();
  const { gpuData: hookGpuData, loading: hookLoading, error: hookError } = useGPUData({
    ignoreContext: true,
    initialData: gpuDataProp ?? null
  });

  const gpuData = gpuDataProp ?? hookGpuData;
  const loading = loadingProp ?? hookLoading;
  const error = errorProp ?? hookError;

  const getCheapestCombo = () => {
    if (!gpuData || !Array.isArray(gpuData)) return { provider: '...', gpu: '...', price: 0, provider_id: null, gpu_model_id: null };
    
    let cheapest = { price: Infinity };
    
    gpuData.forEach((item) => {
      if (item.price_per_hour < cheapest.price) {
        cheapest = {
          provider: item.provider_name,
          gpu: item.gpu_model_name,
          price: item.price_per_hour,
          provider_id: item.provider_id,
          gpu_model_id: item.gpu_model_id
        };
      }
    });
    
    return cheapest;
  };

  const getMostPopularGPU = () => {
    if (!gpuData || !Array.isArray(gpuData)) return { name: '...', id: null };
    const gpuCounts = {};
    let maxCount = 0;
    let mostPopular = { name: null, id: null };
    
    // First count all GPUs
    gpuData.forEach(item => {
      gpuCounts[item.gpu_model_name] = (gpuCounts[item.gpu_model_name] || 0) + 1;
      
      // Update maxCount and mostPopular if we find a higher count
      if (gpuCounts[item.gpu_model_name] > maxCount) {
        maxCount = gpuCounts[item.gpu_model_name];
        mostPopular.name = item.gpu_model_name;
        mostPopular.id = item.gpu_model_id;
      }
    });
    
    return mostPopular;
  };

  const scrollToTable = () => {
    const tableSection = document.getElementById('gpu-table');
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCheapestClick = () => {
    const cheapest = picks?.cheapest ?? getCheapestCombo();
    setSelectedProvider({ id: cheapest.provider_id, name: cheapest.provider });
    setSelectedGPU({ id: cheapest.gpu_model_id, name: cheapest.gpu });
    setTimeout(scrollToTable, 100); // Small delay to ensure filters are applied first
    window.dispatchEvent(new Event('open-filters-panel'));
  };

  const handleMostPopularClick = () => {
    const popular = picks?.mostPopular ?? getMostPopularGPU();
    setSelectedProvider(null);
    setSelectedGPU({ id: popular.id, name: popular.name });
    setTimeout(scrollToTable, 100); // Small delay to ensure filters are applied first
    window.dispatchEvent(new Event('open-filters-panel'));
  };

  const handleTopGPUClick = () => {
    const selectedTopId = picks?.topLine?.id;
    const topGPUModel = selectedTopId
      ? gpuData?.find(item => item.gpu_model_id === selectedTopId)
      : gpuData?.find(item => item.gpu_model_name === "B200");

    if (topGPUModel || picks?.topLine) {
      setSelectedProvider(null);
      setSelectedGPU({ id: topGPUModel?.gpu_model_id ?? picks?.topLine?.id, name: "NVIDIA B200" });
    }
    setTimeout(scrollToTable, 100); // Small delay to ensure filters are applied first
    window.dispatchEvent(new Event('open-filters-panel'));
  };

  const cheapest = picks?.cheapest ?? getCheapestCombo();
  const mostPopular = picks?.mostPopular ?? getMostPopularGPU();
  const topGPU = picks?.topLine?.name ?? "NVIDIA B200"; // Hardcoded as requested

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        type="button"
        onClick={handleCheapestClick}
        className="w-full text-left bg-white rounded-lg p-4 shadow-sm border border-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition transform"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <h3 className="font-semibold text-base">Cheapest Option</h3>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/80 bg-primary/10 px-2 py-1 rounded-full">Sets filters</span>
        </div>
        <p className="text-sm text-gray-600 leading-snug">
          {loading ? 'Loading...' : `${cheapest.provider} - ${cheapest.gpu}`}
          <span className="block text-[13px] mt-1">{loading ? '' : `$${cheapest.price}/hr`}</span>
        </p>
      </button>

      <button
        type="button"
        onClick={handleMostPopularClick}
        className="w-full text-left bg-white rounded-lg p-4 shadow-sm border border-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition transform"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦾</span>
            <h3 className="font-semibold text-base">Most Popular</h3>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/80 bg-primary/10 px-2 py-1 rounded-full">Sets filters</span>
        </div>
        <p className="text-sm text-gray-600 leading-snug">
          {loading ? 'Loading...' : mostPopular.name}
          <span className="block text-[13px] mt-1">Filters for the hottest pick</span>
        </p>
      </button>

      <button
        type="button"
        onClick={handleTopGPUClick}
        className="w-full text-left bg-white rounded-lg p-4 shadow-sm border border-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition transform"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎩</span>
            <h3 className="font-semibold text-base">Top of the Line</h3>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/80 bg-primary/10 px-2 py-1 rounded-full">Sets filters</span>
        </div>
        <p className="text-sm text-gray-600 leading-snug">
          {loading ? 'Loading...' : topGPU}
          <span className="block text-[13px] mt-1">Filters for premium performance</span>
        </p>
      </button>
    </div>
  );
};

export default Superlatives; 
