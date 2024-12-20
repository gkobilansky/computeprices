import { useState, useEffect } from 'react';
import { fetchGPUData } from '@/lib/utils/fetchGPUData';

export default function GPUInfoCard({ selectedGPU }) {
  const [gpuDetails, setGpuDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (selectedGPU) {
        setIsLoading(true);
        setError(null);
        try {
          const gpuData = await fetchGPUData(selectedGPU.id);
          setGpuDetails(gpuData);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedGPU]);

  if (isLoading) {
    return (
      <div className="card bg-base-200 shadow-md"><div className="card-body">Loading...</div></div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-200 shadow-md"><div className="card-body">Error: {error}</div></div>
    );
  }

  if (!gpuDetails) {
    return (
      <div className="card bg-base-200 shadow-md"><div className="card-body">Select a GPU for more info</div></div>
    );
  }

  const { name, architecture, vram, link, manufacturer, use_cases } = gpuDetails;

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h3 className="card-title">{name}</h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-circle btn-sm"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-gradient-2 btn-sm mt-2">Visit Product Page</a>

        {isExpanded && (
          <dl className="space-y-1 text-sm mt-4">
            <div className="flex justify-between">
              <dt>VRAM:</dt>
              <dd>{vram}GB</dd>
            </div>
            <div className="flex justify-between">
              <dt>Architecture:</dt>
              <dd>{architecture}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Manufacturer:</dt>
              <dd>{manufacturer}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
} 