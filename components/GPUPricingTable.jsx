import { formatPrice } from '@/lib/utils';

export default function GPUPricingTable({ prices }) {
  if (!prices || prices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No pricing data available for this GPU at the moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Provider</th>
            {/* <th>Region</th> */}
            {/* <th>Instance Type</th> */}
            <th>Hourly Price</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price, index) => (
            <tr key={index}>
              <td>
                <div className="flex items-center gap-2">
                  {price.slug && (
                    <img 
                      src={`/logos/${price.slug}.png`} 
                      alt={price.provider_name} 
                      className="w-6 h-6"
                      width={24}
                      height={24}
                    />
                  )}
                  {price.provider_name}
                </div>
              </td>
              {/* <td>{price.region}</td> */}
              {/* <td>{price.instance_type}</td> */}
              <td>{formatPrice(price.price_per_hour)}/hr</td>
              <td className="px-6 py-4">
                  {price.source_url && (
                    <div className="tooltip" data-tip={price.source_name}>
                      <a href={price.source_url} target="_blank" rel="noopener noreferrer" 
                         className="text-gray-500 hover:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Cloud GPU Instance",
            "offers": prices.map(price => ({
              "@type": "Offer",
              "price": price.price_per_hour,
              "priceCurrency": "USD",
              "priceValidUntil": new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
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
} 