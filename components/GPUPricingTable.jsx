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
            <th>Region</th>
            <th>Instance Type</th>
            <th>Hourly Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price, index) => (
            <tr key={index}>
              <td>
                <div className="flex items-center gap-2">
                  {price.provider_logo && (
                    <img 
                      src={price.provider_logo} 
                      alt={price.provider_name} 
                      className="w-6 h-6"
                      width={24}
                      height={24}
                    />
                  )}
                  {price.provider_name}
                </div>
              </td>
              <td>{price.region}</td>
              <td>{price.instance_type}</td>
              <td>${formatPrice(price.price_per_hour)}/hr</td>
              <td>
                <a
                  href={price.instance_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  View
                </a>
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