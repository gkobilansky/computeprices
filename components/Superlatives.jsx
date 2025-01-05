import { useGPUData } from '@/lib/hooks/useGPUData';

const Superlatives = ({ setSelectedProvider, setSelectedGPU }) => {
  const { gpuData, loading, error } = useGPUData({ selectedProvider: null, selectedGPU: null });

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
    let mostPopularId = null;
    
    gpuData.forEach(item => {
      gpuCounts[item.gpu_model_name] = (gpuCounts[item.gpu_model_name] || 0) + 1;
      if (!mostPopularId || gpuCounts[item.gpu_model_name] > gpuCounts[mostPopularId]) {
        mostPopularId = item.gpu_model_name;
        mostPopularId = item.gpu_model_id;
      }
    });
    
    return { 
      name: Object.entries(gpuCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '...',
      id: mostPopularId
    };
  };

  const handleCheapestClick = () => {
    const cheapest = getCheapestCombo();
    setSelectedProvider({ id: cheapest.provider_id, name: cheapest.provider });
    setSelectedGPU({ id: cheapest.gpu_model_id, name: cheapest.gpu });
  };

  const handleMostPopularClick = () => {
    const popular = getMostPopularGPU();
    setSelectedProvider(null);
    setSelectedGPU({ id: popular.id, name: popular.name });
  };

  const handleTopGPUClick = () => {
    const topGPUModel = gpuData?.find(item => item.gpu_model_name === "H200");
    if (topGPUModel) {
      setSelectedProvider(null);
      setSelectedGPU({ id: topGPUModel.gpu_model_id, name: "NVIDIA H200" });
    }
  };

  const cheapest = getCheapestCombo();
  const mostPopular = getMostPopularGPU();
  const topGPU = "NVIDIA H200"; // Hardcoded as requested

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div 
        onClick={handleCheapestClick}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer hover:bg-gray-50"
      >
        <div className="text-4xl mb-3">🪙</div>
        <h3 className="font-semibold text-lg mb-1">Cheapest Option</h3>
        <p className="text-gray-600">
          {cheapest.provider} - {cheapest.gpu}
          <span className="block text-sm mt-1">${cheapest.price}/hr</span>
        </p>
      </div>

      <div 
        onClick={handleMostPopularClick}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer hover:bg-gray-50"
      >
        <div className="text-4xl mb-3">🦾</div>
        <h3 className="font-semibold text-lg mb-1">Most Popular</h3>
        <p className="text-gray-600">
          {mostPopular.name}
          <span className="block text-sm mt-1">Available across providers</span>
        </p>
      </div>

      <div 
        onClick={handleTopGPUClick}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer hover:bg-gray-50"
      >
        <div className="text-4xl mb-3">🎩</div>
        <h3 className="font-semibold text-lg mb-1">Top of the Line</h3>
        <p className="text-gray-600">
          {topGPU}
          <span className="block text-sm mt-1">Ultimate performance</span>
        </p>
      </div>
    </div>
  );
};

export default Superlatives; 