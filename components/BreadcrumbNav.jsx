import Link from 'next/link';

export default function BreadcrumbNav({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-500">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-600" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-primary hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@id": `https://computeprices.com${item.href}`,
                "name": item.label
              }
            }))
          })
        }}
      />
    </nav>
  );
} 