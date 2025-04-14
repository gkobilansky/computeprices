import { notFound } from 'next/navigation';
import { getGPUBySlug, generateGPUMetadata, getAllGPUSlugs } from '@/lib/utils/gpu';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import Link from 'next/link';
import GPUPricingTable from '@/components/GPUPricingTable';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import GPUImage from '@/components/GPUImage';
import { formatDate, formatPrice } from '@/lib/utils';
import DataTransparency from '@/components/DataTransparency';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!slug) {
    return {
      title: 'GPU Not Found',
      description: 'The requested GPU could not be found.'
    };
  }

  try {
    const gpu = await getGPUBySlug(slug);
    if (!gpu) {
      return {
        title: 'GPU Not Found',
        description: 'The requested GPU could not be found.'
      };
    }
    return generateGPUMetadata(gpu);
  } catch (error) {
    return {
      title: 'GPU Information',
      description: 'Cloud GPU pricing and specifications'
    };
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGPUSlugs();
  return slugs.map((slug) => ({ slug }));
}

function SpecCard({ title, value, unit = '', icon = null }) {
  return (
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body">
        <h3 className="card-title text-gray-600 text-sm flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h3>
        <p className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

function SpecRow({ label, value, emphasize = false }) {
  return (
    <div className="grid grid-cols-2 py-3 border-b last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className={emphasize ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function PerformanceBar({ label, value, maxValue, tier = 'mid' }) {
  if (!value) return null;

  const percentage = (value / maxValue) * 100;
  const cappedPercentage = Math.min(percentage, 100);

  const tierColors = {
    entry: 'bg-blue-500',
    mid: 'bg-green-500',
    high: 'bg-yellow-500',
    ultra: 'bg-red-500'
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${tierColors[tier] || tierColors.mid}`}
          style={{ width: `${cappedPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export default async function GPUPage({ params }) {
  const { slug } = await params;
  // Early return for missing slug
  if (!slug) {
    return notFound();
  }

  const gpu = await getGPUBySlug(slug).catch(() => null);
  if (!gpu) {
    return notFound();
  }

  try {
    const gpuPrices = await fetchGPUPrices({ selectedGPU: gpu.id });

    // Get lowest price for hero section
    const lowestPrice = gpuPrices.length > 0
      ? gpuPrices.reduce((min, p) => p.price_per_hour < min.price_per_hour ? p : min, gpuPrices[0])
      : null;

    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'GPUs', href: '/gpus' },
      { label: gpu.name, href: `/gpus/${slug}` },
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <BreadcrumbNav items={breadcrumbs} />

        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4">
              {gpu.name}
              <span className="gradient-text-1"> GPU</span>
            </h1>
            <p className="text-gray-600 text-xl mb-6">
              {gpu.description || `${gpu.name} GPU for cloud computing, machine learning, and AI workloads`}
            </p>

            <div className="stats bg-base-100 shadow-sm mb-6">
              <div className="stat">
                <div className="stat-title">Starting Price</div>
                <div className="stat-value text-primary">
                  {lowestPrice ? `${formatPrice(lowestPrice.price_per_hour)}/hr` : 'Contact for pricing'}
                </div>
                <div className="stat-desc">Available on {gpuPrices.length} cloud providers</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="#pricing" className="btn btn-primary">
                Compare Prices
              </a>
              <a href={gpu.link || '#specs'} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Manufacturer Details
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-b from-base-200 to-base-100 rounded-xl">
            <GPUImage slug={slug} name={gpu.name} />
          </div>
        </section>

        {/* Key Specifications */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Key Specifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-base-100 p-6 rounded-lg border border-base-200">
              <h3 className="text-gray-600 text-sm flex items-center gap-2 mb-2">
                <span className="text-primary">💾</span>
                Memory
              </h3>
              <p className="text-2xl font-bold">
                {gpu.vram}
                <span className="text-sm font-normal text-gray-500 ml-1">GB VRAM</span>
              </p>
            </div>
            <div className="bg-base-100 p-6 rounded-lg border border-base-200">
              <h3 className="text-gray-600 text-sm flex items-center gap-2 mb-2">
                <span className="text-primary">🏗️</span>
                Architecture
              </h3>
              <p className="text-2xl font-bold">{gpu.architecture}</p>
            </div>
            <div className="bg-base-100 p-6 rounded-lg border border-base-200">
              <h3 className="text-gray-600 text-sm flex items-center gap-2 mb-2">
                <span className="text-primary">⚙️</span>
                Compute Units
              </h3>
              <p className="text-2xl font-bold">{gpu.compute_units || 'N/A'}</p>
            </div>
            <div className="bg-base-100 p-6 rounded-lg border border-base-200">
              <h3 className="text-gray-600 text-sm flex items-center gap-2 mb-2">
                <span className="text-primary">🧮</span>
                Tensor Cores
              </h3>
              <p className="text-2xl font-bold">{gpu.tensor_cores || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section id="specs" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Technical Specifications</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Hardware Details</h3>
              <div className="space-y-4 divide-y divide-base-200">
                <SpecRow label="Manufacturer" value={gpu.manufacturer} />
                <SpecRow label="Architecture" value={gpu.architecture} emphasize={true} />
                <SpecRow label="CUDA Cores" value={gpu.cuda_cores || 'N/A'} />
                <SpecRow label="Tensor Cores" value={gpu.tensor_cores || 'N/A'} />
                <SpecRow label="RT Cores" value={gpu.rt_cores || 'N/A'} />
                <SpecRow label="Compute Units" value={gpu.compute_units || 'N/A'} />
                <SpecRow label="Generation" value={gpu.generation ? `Gen ${gpu.generation}` : 'N/A'} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Memory & Performance</h3>
              <div className="space-y-4 divide-y divide-base-200">
                <SpecRow label="VRAM" value={`${gpu.vram}GB`} emphasize={true} />
                <SpecRow label="Memory Interface" value={gpu.memory_interface_bit ? `${gpu.memory_interface_bit}-bit` : 'N/A'} />
                <SpecRow label="Memory Bandwidth" value={gpu.memory_bandwidth_gbps ? `${gpu.memory_bandwidth_gbps} GB/s` : 'N/A'} />
                <SpecRow label="FP32 Performance" value={gpu.fp32_performance_tflops ? `${gpu.fp32_performance_tflops} TFLOPS` : 'N/A'} />
                <SpecRow label="FP16 Performance" value={gpu.fp16_performance_tflops ? `${gpu.fp16_performance_tflops} TFLOPS` : 'N/A'} />
                <SpecRow label="INT8 Performance" value={gpu.int8_performance_tops ? `${gpu.int8_performance_tops} TOPS` : 'N/A'} />
              </div>
            </div>
          </div>
        </section>

        {/* Performance Section */}
        {(gpu.fp32_performance_tflops || gpu.cuda_cores || gpu.tensor_cores || gpu.ml_perf_inference_score) && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Performance</h2>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Computing Power</h3>
                    {gpu.cuda_cores && (
                      <PerformanceBar
                        label="CUDA Cores"
                        value={gpu.cuda_cores}
                        maxValue={25000}
                        tier={gpu.performance_tier || 'mid'}
                      />
                    )}
                    {gpu.tensor_cores && (
                      <PerformanceBar
                        label="Tensor Cores"
                        value={gpu.tensor_cores}
                        maxValue={600}
                        tier={gpu.performance_tier || 'mid'}
                      />
                    )}
                    {gpu.rt_cores && (
                      <PerformanceBar
                        label="RT Cores"
                        value={gpu.rt_cores}
                        maxValue={150}
                        tier={gpu.performance_tier || 'mid'}
                      />
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Computational Performance</h3>
                    {gpu.fp32_performance_tflops && (
                      <PerformanceBar
                        label="FP32 (TFLOPS)"
                        value={gpu.fp32_performance_tflops}
                        maxValue={500}
                        tier={gpu.performance_tier || 'mid'}
                      />
                    )}
                    {gpu.fp16_performance_tflops && (
                      <PerformanceBar
                        label="FP16 (TFLOPS)"
                        value={gpu.fp16_performance_tflops}
                        maxValue={1000}
                        tier={gpu.performance_tier || 'mid'}
                      />
                    )}
                    {gpu.int8_performance_tops && (
                      <PerformanceBar
                        label="INT8 (TOPS)"
                        value={gpu.int8_performance_tops}
                        maxValue={2000}
                        tier={gpu.performance_tier || 'mid'}
                      />
                    )}
                  </div>
                </div>

                {(gpu.ml_perf_inference_score || gpu.ml_perf_training_score) && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">ML Benchmark Scores</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      {gpu.ml_perf_inference_score && (
                        <PerformanceBar
                          label="MLPerf Inference"
                          value={gpu.ml_perf_inference_score}
                          maxValue={1000}
                          tier={gpu.performance_tier || 'mid'}
                        />
                      )}
                      {gpu.ml_perf_training_score && (
                        <PerformanceBar
                          label="MLPerf Training"
                          value={gpu.ml_perf_training_score}
                          maxValue={1000}
                          tier={gpu.performance_tier || 'mid'}
                        />
                      )}
                    </div>
                  </div>
                )}

                {gpu.benchmark_links && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Benchmark Resources</h3>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(gpu.benchmark_links || {}).map(([name, url]) => (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          {name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Pros and Cons Section */}
        {(gpu.pros?.length > 0 || gpu.cons?.length > 0) && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Pros and Cons</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4 text-success">Pros</h3>
                  <ul className="space-y-2">
                    {gpu.pros?.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-success mt-1">✓</span>
                        <span>{pro}</span>
                      </li>
                    )) || (
                        <li className="text-gray-500">No pros specified</li>
                      )}
                  </ul>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4 text-error">Cons</h3>
                  <ul className="space-y-2">
                    {gpu.cons?.map((con, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-error mt-1">✗</span>
                        <span>{con}</span>
                      </li>
                    )) || (
                        <li className="text-gray-500">No cons specified</li>
                      )}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {gpu.features?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Key Features</h2>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="grid md:grid-cols-2 gap-4">
                  {gpu.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Detailed Description */}
        {gpu.detailed_description && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">About {gpu.name}</h2>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body prose max-w-none">
                {gpu.detailed_description}
              </div>
            </div>
          </section>
        )}

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Common Use Cases</h2>
          <div className="bg-base-100 rounded-lg border border-base-200 p-6">
            <div className="prose max-w-none">
              <p className="text-gray-600">{gpu.use_cases || `The ${gpu.name} is commonly used in various compute-intensive applications.`}</p>

              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Machine Learning & AI</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Training large language models and transformers</li>
                    <li>Computer vision and image processing</li>
                    <li>Deep learning model development</li>
                    <li>High-performance inference workloads</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Graphics & Compute</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>3D rendering and visualization</li>
                    <li>Scientific simulations</li>
                    <li>Data center graphics virtualization</li>
                    <li>High-performance computing (HPC)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Context */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Market Context</h2>
          <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-lg p-6">
            <div className="prose max-w-none">
              <p className="text-gray-600">
                The {gpu.name} sits within {gpu.manufacturer}'s {gpu.architecture} architecture lineup,
                {gpu.performance_tier ? ` positioned in the ${gpu.performance_tier} performance tier` : ''}.
                {gpu.server_gpu ? " It's designed specifically for data center and enterprise use." : ""}
              </p>

              <div className="mt-6 flex gap-4 flex-wrap">
                <div className="bg-base-100 rounded-lg p-4 flex-1 min-w-[250px]">
                  <h3 className="font-semibold mb-2">Cloud Availability</h3>
                  <p className="text-gray-600">
                    Available across {gpuPrices.length} cloud providers with prices ranging from {lowestPrice ? formatPrice(lowestPrice.price_per_hour) : 'N/A'}/hr.
                    Pricing and availability may vary by region and provider.
                  </p>
                </div>

                <div className="bg-base-100 rounded-lg p-4 flex-1 min-w-[250px]">
                  <h3 className="font-semibold mb-2">Market Position</h3>
                  <p className="text-gray-600">
                    {gpu.release_date ? `Released in ${new Date(gpu.release_date).getFullYear()}, ` : ''}
                    this GPU {gpu.msrp_usd ? `launched at $${gpu.msrp_usd.toLocaleString()}` : 'is positioned'} for
                    {gpu.server_gpu ? ' enterprise and data center' : ' professional'} workloads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section id="pricing" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Current Pricing</h2>
          <div className="bg-base-100 rounded-lg border border-base-200 p-6">
            <GPUPricingTable prices={gpuPrices} />
            <div className="mt-4 text-sm text-gray-500">
              <p>Prices are updated regularly. Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        {/* Affiliate Links Section */}
        {gpu.affiliate_links && Object.keys(gpu.affiliate_links).length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Where to Buy</h2>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(gpu.affiliate_links).map(([vendor, url]) => (
                    <a
                      key={vendor}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-primary"
                    >
                      Buy at {vendor}
                    </a>
                  ))}
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  *Some links are affiliate links. We may earn a commission if you make a purchase.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Data Transparency */}
        <DataTransparency />

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": `What is the VRAM capacity of ${gpu.name}?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `The ${gpu.name} comes with ${gpu.vram}GB of VRAM (Video RAM).`
                  }
                },
                {
                  "@type": "Question",
                  "name": `Where can I rent ${gpu.name} GPUs?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `${gpu.name} GPUs are available from multiple cloud providers. Compare their current prices and specifications on this page.`
                  }
                },
                {
                  "@type": "Question",
                  "name": `What are common use cases for ${gpu.name}?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": gpu.use_cases || `${gpu.name} GPUs are commonly used for AI training, machine learning, deep learning, and high-performance computing workloads.`
                  }
                }
              ]
            })
          }}
        />

        {/* Product Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": gpu.name,
              "image": gpu.image_url || `/og-image.png`,
              "description": gpu.description || `${gpu.name} GPU for cloud computing, machine learning, and AI workloads`,
              "brand": {
                "@type": "Brand",
                "name": gpu.manufacturer
              },
              "offers": gpuPrices.map((price) => ({
                "@type": "Offer",
                "price": price.price_per_hour,
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": price.provider_name
                }
              }))
            })
          }}
        />
      </div>
    );
  } catch (error) {
    console.error(`Error rendering page for ${slug}:`, error);
    notFound();
  }
} 