import { useGPUData } from '@/lib/hooks/useGPUData';

const Superlatives = () => {
  const { gpuData, loading, error } = useGPUData({ selectedProvider: null, selectedGPU: null });

  const getCheapestCombo = () => {
    if (!gpuData) return { provider: '...', gpu: '...', price: 0 };
    let cheapest = { price: Infinity };
    
    Object.entries(gpuData).forEach(([provider, gpus]) => {
      Object.entries(gpus).forEach(([gpu, data]) => {
        if (data.price && data.price < cheapest.price) {
          cheapest = {
            provider,
            gpu,
            price: data.price
          };
        }
      });
    });
    
    return cheapest;
  };

  const getMostPopularGPU = () => {
    if (!gpuData) return '...';
    const gpuCounts = {};
    
    Object.values(gpuData).forEach(gpus => {
      Object.keys(gpus).forEach(gpu => {
        gpuCounts[gpu] = (gpuCounts[gpu] || 0) + 1;
      });
    });
    
    return Object.entries(gpuCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '...';
  };

  const cheapest = getCheapestCombo();
  const mostPopular = getMostPopularGPU();
  const topGPU = "NVIDIA H200"; // Hardcoded as requested

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors">
        <div className="text-4xl mb-3">🪙</div>
        <h3 className="font-semibold text-lg mb-1">Cheapest Option</h3>
        <p className="text-gray-600">
          {cheapest.provider} - {cheapest.gpu}
          <span className="block text-sm mt-1">${cheapest.price}/hr</span>
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors">
        <div className="text-4xl mb-3">🦾</div>
        <h3 className="font-semibold text-lg mb-1">Most Popular</h3>
        <p className="text-gray-600">
          {mostPopular}
          <span className="block text-sm mt-1">Available across providers</span>
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors">
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