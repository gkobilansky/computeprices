import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { getProviderBySlug, generateProviderMetadata, getAllProviderSlugs, generateProviderSchema } from '@/lib/utils/provider';
import { fetchGPUPrices, getProviderSuggestions } from '@/lib/utils/fetchGPUData';
import ProviderGPUTable from '@/components/ProviderGPUTable';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import CompareProviders from '@/components/CompareProviders';
import Image from 'next/image';
import DataTransparency from '@/components/DataTransparency';

export const revalidate = 3600;

const getCachedProviderData = unstable_cache(
  async (providerId) => {
    const [gpuPrices, providerSuggestions] = await Promise.all([
      fetchGPUPrices({ selectedProvider: providerId }),
      getProviderSuggestions(providerId),
    ]);

    return {
      gpuPrices: gpuPrices ?? [],
      providerSuggestions: providerSuggestions ?? [],
    };
  },
  ['provider-page-data'],
  { revalidate }
);

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

  const { gpuPrices, providerSuggestions } = await getCachedProviderData(provider.id);

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
          {!provider.isMinimal && (
            <Image src={`/logos/${provider.slug}.png`} alt={provider.name} width={100} height={100} className='w-10 h-10 rounded-full inline-block mr-2'/>
          )}
          <span> {provider.name}</span>
        </h1>
        <p className="text-gray-600 text-xl mb-8">
          {provider.description}
        </p>
        <div className="flex gap-4 justify-center">
          {provider.link && (
            <a
              href={provider.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Visit {provider.name}
            </a>
          )}
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
      {!provider.isMinimal && provider.features?.length > 0 && (
        <section className="mb-16" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold mb-6">Key Features</h2>
          <div className="rounded-lg border border-base-200 bg-base-100/50">
            <dl className="divide-y divide-base-200">
              {provider.features?.map((feature, index) => (
                <div key={index} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.14-.094l4.057-5.494z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="min-w-0 w-full lg:grid lg:grid-cols-12 lg:gap-6">
                      <dt className="font-medium text-base-content lg:col-span-4">{feature.title}</dt>
                      <dd className="mt-1 lg:mt-0 text-sm text-base-content/70 leading-relaxed lg:col-span-8">
                        {feature.description}
                      </dd>
                    </div>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Pros & Cons */}
      {!provider.isMinimal && (provider.pros?.length > 0 || provider.cons?.length > 0) && (
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
      )}

      {/* GPU Pricing */}
      <section className="mb-16" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className="text-2xl font-bold mb-6">Available GPUs</h2>
        <ProviderGPUTable prices={gpuPrices} />
      </section>

      {/* Compute Services */}
      {!provider.isMinimal && provider.computeServices && (
        <section className="mb-16" aria-labelledby="services-heading">
          <h2 id="services-heading" className="text-2xl font-bold mb-6">Compute Services</h2>
          <div className="rounded-lg border border-base-200 bg-base-100/50">
            <div className="divide-y divide-base-200">
              {provider.computeServices.map((service, index) => (
                <div key={index} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.14-.094l4.057-5.494z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="min-w-0 w-full lg:grid lg:grid-cols-12 lg:gap-6">
                      <div className="lg:col-span-4">
                        <h3 className="font-medium text-base-content">{service.name}</h3>
                      </div>
                      <div className="lg:col-span-8">
                        {service.description && (
                          <p className="text-sm text-base-content/70 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                        {service.features && service.features.length > 0 && (
                          <div className="mt-3 lg:mt-2">
                            <h4 className="text-sm font-semibold text-base-content/80 mb-1">Features</h4>
                            <ul role="list" className="space-y-1">
                              {service.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-base-content/70">
                                  <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Options */}
      {!provider.isMinimal && provider.pricingOptions && (
        <section className="mb-16" aria-labelledby="pricing-options-heading">
          <h2 id="pricing-options-heading" className="text-2xl font-bold mb-6">Pricing Options</h2>
          <div className="rounded-lg border border-base-200 bg-base-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-base-200/60">
                  <tr>
                    <th scope="col" className="text-left font-semibold text-base-content/80 py-3 px-4 w-48">Option</th>
                    <th scope="col" className="text-left font-semibold text-base-content/80 py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {provider.pricingOptions.map((option, index) => (
                    <tr key={index} className="align-top">
                      <td className="py-4 px-4 text-base-content font-medium">{option.name}</td>
                      <td className="py-4 px-4 text-base-content/70 leading-relaxed">{option.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Getting Started */}
      {!provider.isMinimal && (
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
                {(!provider.gettingStarted || provider.gettingStarted.length === 0) && (
                  <p className="text-gray-600">Getting started guide coming soon...</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Compare Providers */}
      <CompareProviders 
        suggestions={providerSuggestions} 
        currentProvider={provider}
      />

      {/* Data Transparency */}
      <DataTransparency />

      {/* Provider Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProviderSchema(provider, gpuPrices))
        }}
      />

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
                  "text": `${provider.name} offers various GPU types including ${gpuPrices.map(p => p.gpu_model_name).join(', ')}. Check the pricing table above for current availability and pricing.`
                }
              },
              {
                "@type": "Question",
                "name": `How do I get started with ${provider.name}?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": provider.gettingStarted?.map(step => step.title).join(', ') || `Visit ${provider.name}'s website to create an account and start using their GPU services.`
                }
              },
              {
                "@type": "Question",
                "name": `What are ${provider.name}'s main advantages?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${provider.name}'s main advantages include: ${provider.pros.join(', ')}.`
                }
              },
              {
                "@type": "Question",
                "name": `What are ${provider.name}'s limitations?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${provider.name}'s main limitations include: ${provider.cons.join(', ')}.`
                }
              }
            ]
          })
        }}
      />

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://computeprices.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Providers",
                "item": "https://computeprices.com/providers"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": provider.name,
                "item": `https://computeprices.com/providers/${provider.slug}`
              }
            ]
          })
        }}
      />
    </div>
  );
} 
