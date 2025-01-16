import { notFound } from 'next/navigation';
import { getGPUBySlug, generateGPUMetadata, getAllGPUSlugs } from '@/lib/utils/gpu';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import GPUPricingTable from '@/components/GPUPricingTable';
import BreadcrumbNav from '@/components/BreadcrumbNav';

export async function generateMetadata({ params }) {
  if (!params?.slug) {
    return {
      title: 'GPU Not Found',
      description: 'The requested GPU could not be found.'
    };
  }

  try {
    const gpu = await getGPUBySlug(params.slug);
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

export default async function GPUPage({ params }) {
  // Early return for missing slug
  if (!params?.slug) {
    return notFound();
  }

  const gpu = await getGPUBySlug(params.slug).catch(() => null);
  if (!gpu) {
    return notFound();
  }

  try {
    const gpuPrices = await fetchGPUPrices({ selectedGPU: gpu.id });

    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'GPUs', href: '/gpus' },
      { label: gpu.name, href: `/gpus/${params.slug}` },
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <BreadcrumbNav items={breadcrumbs} />

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">
            {gpu.name}
            <span className="gradient-text-1"> GPU Cloud</span>
          </h1>
          <p className="text-gray-600 text-xl mb-8">
            Compare prices and specifications for {gpu.name} instances across major cloud providers
          </p>
        </section>

        {/* Specifications */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Specifications</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Memory</h3>
                <p className="text-2xl font-bold">{gpu.vram}GB VRAM</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Architecture</h3>
                <p className="text-2xl font-bold">{gpu.architecture}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Compute Units</h3>
                <p className="text-2xl font-bold">{gpu.compute_units}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Current Pricing</h2>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <GPUPricingTable prices={gpuPrices} />
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Common Use Cases</h2>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <p className="text-gray-600">{gpu.use_cases}</p>
            </div>
          </div>
        </section>

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
                }
              ]
            })
          }}
        />
      </div>
    );
  } catch (error) {
    console.error(`Error rendering page for ${params.slug}:`, error);
    notFound();
  }
} 