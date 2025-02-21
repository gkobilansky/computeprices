'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import GPUGuide from '@/components/GPUGuide';
import { fetchGPUModels } from '@/lib/utils/fetchGPUData';
import { TrainIcon, ArtIcon, AnalyticsIcon, ResearchIcon } from '@/components/GPUUsageIcons';

export default function WhyGPUs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [gpus, setGpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadGPUs() {
      try {
        setLoading(true);
        const data = await fetchGPUModels();
        setGpus(data || []);
      } catch (err) {
        console.error('Error loading GPUs:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadGPUs();
  }, []);

  const filteredGPUs = useMemo(() => {
    console.log(gpus);
    const query = searchQuery.toLowerCase();
    return gpus.filter(gpu => {
      const nameMatch = gpu.name.toLowerCase().includes(query);
      const archMatch = gpu.architecture?.toLowerCase().includes(query);
      const useCaseMatch = gpu.use_cases?.toLowerCase().includes(query);
      
      return nameMatch || archMatch || useCaseMatch;
    });
  }, [gpus, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-3">
          GPU Hardware and Usecase Details
        </h1>
        <p className="text-gray-600 text-lg">
          Read up on differnt types of GPUs and discover how cloud GPUs can power your next project - from model training, to multi-modal generation and increasing inference compute.
        </p>
      </section>
      <GPUGuide />
      
      {/* GPU Table Section */}
      <section className="space-y-4 mb-12">
        <div className="form-control w-full max-w-md">
          <input
            type="text"
            placeholder="Search GPUs by name, architecture, or use case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full"
            aria-label="Search GPUs"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-2 text-gray-600">Loading GPUs...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error loading GPU data. Please try again later.</span>
          </div>
        ) : filteredGPUs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No GPUs found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Manufacturer</th>
                  <th>GPU Model</th>
                  <th>VRAM</th>
                  <th>Architecture</th>
                  <th>Best For</th>
                  <th>More Info</th>
                </tr>
              </thead>
              <tbody>
                {filteredGPUs.map((gpu) => (
                  <tr key={gpu.id}>
                    <td>
                      <Image 
                        src={`/logos/${gpu.manufacturer.toLowerCase()}.png`}
                        alt={`${gpu.manufacturer} logo`}
                        width={20} 
                        height={20}
                        className="inline-block mr-2"
                      />
                      {gpu.manufacturer}
                    </td>
                    <td>{gpu.name}</td>
                    <td>{gpu.vram}GB</td>
                    <td>{gpu.architecture}</td>
                    <td>{gpu.use_cases}</td>
                    <td>
                      <Link 
                        href={`/gpus/${gpu.slug}`}
                        className="btn btn-primary btn-sm"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">What can you do with a GPU?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <TrainIcon />
              <h3 className="text-xl font-medium mb-2">Train AI Models</h3>
              <p className="text-gray-600">
                Build your own AI assistants, image generators, or language models. 
                Train models like Stable Diffusion or fine-tune LLMs on your custom data.
              </p>
              <Link href="/learn#phase-2-1" className="link link-primary text-sm mt-2 block">
                Learn model training →
              </Link>
            </div>
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <ArtIcon />
              <h3 className="text-xl font-medium mb-2">Generate AI Art</h3>
              <p className="text-gray-600">
                Create stunning AI artwork with models like Stable Diffusion. 
                Generate and iterate on images much faster than on CPU.
              </p>
              <Link href="/learn#phase-3-2" className="link link-primary text-sm mt-2 block">
                Learn generative AI →
              </Link>
            </div>
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <AnalyticsIcon />
              <h3 className="text-xl font-medium mb-2">Business Analytics</h3>
              <p className="text-gray-600">
                Accelerate predictive analytics and machine learning for business insights. Perfect for 
                demand forecasting, customer behavior analysis, and automated decision-making.
              </p>
              <Link href="/learn#phase-1-2" className="link link-primary text-sm mt-2 block">
                Learn data science →
              </Link>
            </div>
            <div className="p-6 rounded-lg border hover:border-primary transition-colors">
              <ResearchIcon />
              <h3 className="text-xl font-medium mb-2">Research & Learning</h3>
              <p className="text-gray-600">
                Experiment with machine learning papers, train models from scratch, 
                and learn AI development hands-on.
              </p>
              <Link href="/learn#phase-3-3" className="link link-primary text-sm mt-2 block">
                Explore advanced topics →
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Why rent instead of buy?</h2>
          <div className="space-y-4">
            <div className="p-6 rounded-lg border">
              <h3 className="text-xl font-medium mb-2">Cost-Effective</h3>
              <p className="text-gray-600">
                High-end GPUs can cost thousands of dollars. Renting lets you access powerful 
                hardware for a fraction of the cost, paying only for what you use.
              </p>
            </div>
            <div className="p-6 rounded-lg border">
              <h3 className="text-xl font-medium mb-2">Flexibility</h3>
              <p className="text-gray-600">
                Scale resources based on your needs. Use spot instances for cost savings, upgrade for 
                intensive workloads, or switch between different GPU types for optimal performance.
              </p>
            </div>
            <div className="p-6 rounded-lg border">
              <h3 className="text-xl font-medium mb-2">No Maintenance</h3>
              <p className="text-gray-600">
                Avoid dealing with hardware setup, cooling, electricity costs, and upgrades. 
                Everything is managed for you.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Getting Started</h2>
          <p className="text-gray-600">
            Ready to start your GPU-powered project? Whether you're a hobbyist fine-tuning models, 
            a startup building an MVP, or a researcher running experiments, we can help you find the 
            right GPU. Compare prices and specifications with our
            <Link href="/" className="btn btn-primary btn-sm mx-1">
              🔍 GPU Price List
            </Link>
            to find the perfect balance of performance and cost for your needs.
          </p>
        </div>
      </section>
    </div>
  );
} 