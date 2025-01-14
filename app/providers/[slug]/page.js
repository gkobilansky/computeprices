'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import providersData from '@/data/providers.json';
import { useGPUData } from '@/lib/hooks/useGPUData';
import { useTableSort } from '@/lib/hooks/useTableSort';
import { formatPrice } from '@/lib/utils';

export default function ProviderPage() {
  const params = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const providerData = providersData.find(p => p.slug === params.slug);
    setProvider(providerData || null);
    setLoading(false);
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="loading loading-spinner loading-lg"></div>
    </div>;
  }

  if (!provider) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Provider not found</h2>
        <Link href="/providers" className="btn btn-primary">
          View All Providers
        </Link>
      </div>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <nav className="mb-8">
        <Link href="/providers" className="text-primary hover:underline mb-4 block">
          ← Back to Providers
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4">
          {provider.name}
          <span className="gradient-text-1"> GPU Cloud</span>
        </h1>
        <p className="text-gray-600 text-xl mb-8">
          {provider.description}
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href={provider.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Visit {provider.name}
          </a>
          {provider.docsLink && (
            <a
              href={provider.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Documentation
            </a>
          )}
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {provider.features?.map((feature, index) => (
            <div key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pros & Cons */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-green-600">Advantages</h2>
              <ul className="list-disc list-inside space-y-3">
                {provider.pros.map((pro, index) => (
                  <li key={index} className="text-gray-600">{pro}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-red-600">Limitations</h2>
              <ul className="list-disc list-inside space-y-3">
                {provider.cons.map((con, index) => (
                  <li key={index} className="text-gray-600">{con}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GPU Pricing */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Available GPUs</h2>
        <ProviderGPUList providerId={provider.id} />
      </section>

      {/* Compute Services */}
      {provider.computeServices && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Compute Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {provider.computeServices.map((service, index) => (
              <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  {service.features && (
                    <div>
                      <h4 className="font-semibold mb-2">Features:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="text-gray-600">{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing Options */}
      {provider.pricingOptions && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Pricing Options</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {provider.pricingOptions.map((option, index) => (
              <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-lg">{option.name}</h3>
                  <p className="text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Getting Started */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="space-y-4">
              {provider.gettingStarted?.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
              {!provider.gettingStarted && (
                <p className="text-gray-600">Getting started guide coming soon...</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProviderGPUList({ providerId }) {
  const { gpuData, loading, error } = useGPUData({ selectedProvider: providerId });
  const { sortConfig, handleSort, getSortedData } = useTableSort('gpu_model_name', 'asc');

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error loading GPU data. Please try again later.
      </div>
    );
  }

  const sortedData = getSortedData(gpuData);

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th 
              onClick={() => handleSort(gpuData, 'gpu_model_name')}
              className="cursor-pointer hover:bg-base-200"
            >
              GPU Model {sortConfig.key === 'gpu_model_name' && (
                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              onClick={() => handleSort(gpuData, 'gpu_model_vram')}
              className="cursor-pointer hover:bg-base-200"
            >
              vRAM {sortConfig.key === 'gpu_model_vram' && (
                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              onClick={() => handleSort(gpuData, 'price_per_hour')}
              className="cursor-pointer hover:bg-base-200"
            >
              Hourly Price {sortConfig.key === 'price_per_hour' && (
                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((gpu, index) => (
              <tr key={index}>
                <td>{gpu.gpu_model_name}</td>
                <td>{gpu.gpu_model_vram}GB</td>
                <td>${gpu.price_per_hour}/hr</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-gray-600 py-8">
                No GPU data available for this provider.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 