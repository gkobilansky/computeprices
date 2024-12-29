'use client';

import Link from 'next/link';
import providersData from '@/data/providers.json';

export default function ProvidersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">GPU Cloud Providers</h1>
        <p className="text-xl text-gray-600">
          Compare different GPU cloud providers to find the best fit for your needs.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providersData.map((provider) => (
          <div key={provider.slug} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{provider.name}</h2>
              <p className="text-gray-600 mb-4">{provider.description}</p>
              
              <div className="card-actions justify-end mt-auto">
                <Link 
                  href={`/providers/${provider.slug}`} 
                  className="btn btn-primary"
                >
                  Learn More
                </Link>
                <a
                  href={provider.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Visit Site
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