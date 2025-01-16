import { notFound } from 'next/navigation';
import { getProviderBySlug, generateProviderMetadata, getAllProviderSlugs, generateProviderSchema } from '@/lib/utils/provider';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import ProviderGPUTable from '@/components/ProviderGPUTable';
import BreadcrumbNav from '@/components/BreadcrumbNav';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) return {};
  return generateProviderMetadata(provider);
}

export async function generateStaticParams() {
  const slugs = await getAllProviderSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ProviderPage({ params }) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  
  if (!provider) {
    notFound();
  }

  const gpuPrices = await fetchGPUPrices({ selectedProvider: provider.id });

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Providers', href: '/providers' },
    { label: provider.name, href: `/providers/${provider.slug}` },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <BreadcrumbNav items={breadcrumbs} />

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
      <section className="mb-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-bold mb-6">Key Features</h2>
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
      <section className="mb-16" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" className="sr-only">Provider Comparison</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-green-600">Advantages</h3>
              <ul className="list-disc list-inside space-y-3">
                {provider.pros.map((pro, index) => (
                  <li key={index} className="text-gray-600">{pro}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-red-600">Limitations</h3>
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
      <section className="mb-16" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className="text-2xl font-bold mb-6">Available GPUs</h2>
        <ProviderGPUTable prices={gpuPrices} />
      </section>

      {/* Compute Services */}
      {provider.computeServices && (
        <section className="mb-16" aria-labelledby="services-heading">
          <h2 id="services-heading" className="text-2xl font-bold mb-6">Compute Services</h2>
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
      <section className="mb-16" aria-labelledby="getting-started-heading">
        <h2 id="getting-started-heading" className="text-2xl font-bold mb-6">Getting Started</h2>
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
                "name": `What GPU types does ${provider.name} offer?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${provider.name} offers various GPU types for different workloads. Check the pricing table above for current GPU availability and pricing.`
                }
              },
              {
                "@type": "Question",
                "name": `How do I get started with ${provider.name}?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": provider.gettingStarted?.map(step => step.title).join(', ') || `Visit ${provider.name}'s website to create an account and start using their GPU services.`
                }
              }
            ]
          })
        }}
      />

      {/* Provider Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProviderSchema(provider, gpuPrices))
        }}
      />
    </div>
  );
} 