'use client';

import { useGPUData } from '@/lib/hooks/useGPUData';
import { useFilter } from '@/lib/context/FilterContext';

const Superlatives = () => {
  const { setSelectedProvider, setSelectedGPU } = useFilter();
  const { gpuData, loading, error } = useGPUData({ ignoreContext: true });

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
    const cheapest = getCheapestCombo();
    setSelectedProvider({ id: cheapest.provider_id, name: cheapest.provider });
    setSelectedGPU({ id: cheapest.gpu_model_id, name: cheapest.gpu });
    setTimeout(scrollToTable, 100); // Small delay to ensure filters are applied first
  };

  const handleMostPopularClick = () => {
    const popular = getMostPopularGPU();
    setSelectedProvider(null);
    setSelectedGPU({ id: popular.id, name: popular.name });
    setTimeout(scrollToTable, 100); // Small delay to ensure filters are applied first
  };

  const handleTopGPUClick = () => {
    const topGPUModel = gpuData?.find(item => item.gpu_model_name === "B200");
    if (topGPUModel) {
      setSelectedProvider(null);
      setSelectedGPU({ id: topGPUModel.gpu_model_id, name: "NVIDIA B200" });
    }
    setTimeout(scrollToTable, 100); // Small delay to ensure filters are applied first
  };

  const cheapest = getCheapestCombo();
  const mostPopular = getMostPopularGPU();
  const topGPU = "NVIDIA B200"; // Hardcoded as requested

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div 
        onClick={handleCheapestClick}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer hover:bg-gray-50"
        role="button"
        tabIndex={0}
      >
        <div className="text-4xl mb-3">🪙</div>
        <h3 className="font-semibold text-lg mb-1">Cheapest Option</h3>
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${cheapest.provider} - ${cheapest.gpu}`}
          <span className="block text-sm mt-1">{loading ? '' : `$${cheapest.price}/hr`}</span>
        </p>
      </div>

      <div 
        onClick={handleMostPopularClick}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer hover:bg-gray-50"
        role="button"
        tabIndex={0}
      >
        <div className="text-4xl mb-3">🦾</div>
        <h3 className="font-semibold text-lg mb-1">Most Popular</h3>
        <p className="text-gray-600">
          {loading ? 'Loading...' : mostPopular.name}
          <span className="block text-sm mt-1">Available across providers</span>
        </p>
      </div>

      <div 
        onClick={handleTopGPUClick}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer hover:bg-gray-50"
        role="button"
        tabIndex={0}
      >
        <div className="text-4xl mb-3">🎩</div>
        <h3 className="font-semibold text-lg mb-1">Top of the Line</h3>
        <p className="text-gray-600">
          {loading ? 'Loading...' : topGPU}
          <span className="block text-sm mt-1">Ultimate performance</span>
        </p>
      </div>
    </div>
  );
};

export default Superlatives; 