'use client';

import Link from 'next/link';
import GPUGuide from '@/components/GPUGuide';
import { TrainIcon, ArtIcon, AnalyticsIcon, ResearchIcon } from '@/components/GPUUsageIcons';

export default function WhyGPUs() {
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