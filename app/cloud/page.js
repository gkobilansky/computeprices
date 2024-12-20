'use client';

import { useState } from 'react';
import providers from '@/data/providers.json';

export default function CloudProviders() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Group providers into categories
  const categories = {
    major: ['Amazon AWS', 'Google Cloud Platform (GCP)', 'Microsoft Azure'],
    enterprise: ['IBM Cloud', 'Oracle Cloud'],
    specialized: ['CoreWeave', 'RunPod', 'Lambda Labs', 'Vast.ai', 'Fluidstack', 'Genesis Cloud', 'Hyperstack']
  };

  const filterProviders = () => {
    if (selectedCategory === 'all') return providers;
    return providers.filter(provider => 
      selectedCategory === 'major' ? categories.major.includes(provider.name) :
      selectedCategory === 'enterprise' ? categories.enterprise.includes(provider.name) :
      categories.specialized.includes(provider.name)
    );
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-3">
          Cloud GPU
          <span className="gradient-text-1"> Providers</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Compare different cloud providers and find the perfect match for your GPU computing needs.
        </p>
      </section>

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed inline-flex">
        <button 
          className={`tab ${selectedCategory === 'all' ? 'tab-active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Providers
        </button>
        <button 
          className={`tab ${selectedCategory === 'major' ? 'tab-active' : ''}`}
          onClick={() => setSelectedCategory('major')}
        >
          Major Clouds
        </button>
        <button 
          className={`tab ${selectedCategory === 'enterprise' ? 'tab-active' : ''}`}
          onClick={() => setSelectedCategory('enterprise')}
        >
          Enterprise
        </button>
        <button 
          className={`tab ${selectedCategory === 'specialized' ? 'tab-active' : ''}`}
          onClick={() => setSelectedCategory('specialized')}
        >
          GPU Specialized
        </button>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filterProviders().map((provider) => (
          <div key={provider.name} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{provider.name}</h2>
              <p className="text-gray-600">{provider.description}</p>
              
              <div className="mt-4">
                <h3 className="font-semibold text-green-600">Advantages</h3>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {provider.pros.map((pro, index) => (
                    <li key={index} className="text-sm text-gray-600">{pro}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-red-600">Limitations</h3>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {provider.cons.map((con, index) => (
                    <li key={index} className="text-sm text-gray-600">{con}</li>
                  ))}
                </ul>
              </div>

              <div className="card-actions justify-end mt-4">
                <a 
                  href={provider.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information Section */}
      <section className="space-y-6 mt-12">
        <h2 className="text-2xl font-semibold">Choosing a Cloud Provider</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For Enterprise Users</h3>
              <p className="text-gray-600">
                Enterprise users should consider providers like AWS, GCP, or Azure for their comprehensive 
                service offerings, strong security compliance, and global infrastructure. These providers 
                offer enterprise-grade support, robust SLAs, and deep integration with existing business tools.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For AI Researchers</h3>
              <p className="text-gray-600">
                Researchers might prefer specialized providers like Lambda Labs or Vast.ai for their 
                focus on ML workloads, competitive pricing, and access to specific GPU models. These 
                providers often offer simpler interfaces and better price-to-performance ratios.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For Startups</h3>
              <p className="text-gray-600">
                Startups should consider providers like RunPod or CoreWeave for their flexible pricing, 
                pay-as-you-go models, and lower entry barriers. These providers often offer good 
                documentation and community support for quick deployment.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">For Cost Optimization</h3>
              <p className="text-gray-600">
                For cost-sensitive workloads, consider using spot instances from major providers or 
                specialized services like Vast.ai and Fluidstack. These options can offer significant 
                savings, though they may require more careful workflow management.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 