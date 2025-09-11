'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PriceComponent from './PriceComponent';
import NewsletterSignup from './NewsletterSignup';

export default function Footer() {
  const [gpuModels, setGpuModels] = useState([]);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    async function fetchGPUModels() {
      const { data, error } = await supabase
        .from('gpu_models')
        .select('name, slug')
        .order('name');
      
      if (!error && data) {
        setGpuModels(data);
      }
    }

    fetchGPUModels();
  }, []);

  useEffect(() => {
    async function fetchProviders() {
      const { data, error } = await supabase
        .from('providers')
        .select('name, slug')
        .order('name');

      if (!error && data) {
        setProviders(data);
      }
    }

    fetchProviders();
  }, []);

  return (
    <footer className="border-t py-12 mt-8 bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About Compute Prices</h3>
            <p className="text-sm text-gray-600">
              Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads.
            </p>
            <p className="text-sm">
              Built with 🦾 by{' '}
              <a 
                href="https://lansky.tech" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                lansky.tech
              </a>
            </p>
            <NewsletterSignup />
            <p className="text-sm">
              <a href="https://startupfa.me/s/compute-prices?utm_source=computeprices.com" target="_blank"><Image src="/featured-badge-small.webp" alt="Featured on Startup Fame" width="224" height="36" /></a>
            </p>
          </div>

          {/* Providers Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cloud Providers</h3>
            <div className="grid grid-cols-2 gap-2">
              {providers.map(provider => (
                <Link
                  key={provider.slug}
                  href={`/providers/${provider.slug}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary group"
                >
                  <Image
                    src={`/logos/${provider.slug}.png`}
                    alt={`${provider.name} logo`}
                    width={16}
                    height={16}
                    className="flex-shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span className="truncate">{provider.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Comparisons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Provider Comparisons</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/compare/aws-vs-coreweave" className="text-sm text-gray-600 hover:text-primary">
                  AWS vs CoreWeave
                </Link>
              </li>
              <li>
                <Link href="/compare/aws-vs-runpod" className="text-sm text-gray-600 hover:text-primary">
                  AWS vs RunPod
                </Link>
              </li>
              <li>
                <Link href="/compare/coreweave-vs-lambda" className="text-sm text-gray-600 hover:text-primary">
                  CoreWeave vs Lambda
                </Link>
              </li>
              <li>
                <Link href="/compare/google-vs-azure" className="text-sm text-gray-600 hover:text-primary">
                  Google vs Azure
                </Link>
              </li>
              <li>
                <Link href="/compare/runpod-vs-vast" className="text-sm text-gray-600 hover:text-primary">
                  RunPod vs Vast
                </Link>
              </li>
              <li>
                <Link href="/compare/lambda-vs-vast" className="text-sm text-gray-600 hover:text-primary">
                  Lambda vs Vast
                </Link>
              </li>
              <li>
                <Link href="/compare/aws-vs-google" className="text-sm text-gray-600 hover:text-primary">
                  AWS vs Google
                </Link>
              </li>
              <li>
                <Link href="/compare/coreweave-vs-runpod" className="text-sm text-gray-600 hover:text-primary">
                  CoreWeave vs RunPod
                </Link>
              </li>
            </ul>
          </div>



          {/* GPUs Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tracked GPUs</h3>
            <div className="grid grid-cols-2 gap-2">
              {gpuModels.map(gpu => (
                <Link 
                  key={gpu.name}
                  href={`/gpus/${gpu.slug}`}
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  {gpu.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="text-center space-y-4">
            <PriceComponent />
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Compute Prices. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 
