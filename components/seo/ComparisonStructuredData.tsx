import { Provider } from '@/types/comparison'
import { 
  generateComparisonStructuredData,
  generateJSONLD
} from '@/lib/seo/structured-data'
import { 
  generateComparisonBreadcrumbs,
  generateComparisonFAQ,
  extractComparisonStats
} from '@/lib/seo/comparison-metadata'

interface ComparisonStructuredDataProps {
  provider1: Provider
  provider2: Provider
  comparisonData?: any[]
}

/**
 * Component that renders all structured data for comparison pages
 */
export default function ComparisonStructuredData({
  provider1,
  provider2,
  comparisonData = []
}: ComparisonStructuredDataProps) {
  // Extract comparison statistics for enhanced structured data
  const comparisonStats = extractComparisonStats(comparisonData)
  
  // Generate all structured data
  const structuredData = generateComparisonStructuredData(
    provider1,
    provider2,
    comparisonData,
    comparisonStats || undefined
  )

  // Generate breadcrumbs
  const breadcrumbs = generateComparisonBreadcrumbs(provider1, provider2)

  // Generate FAQ schema
  const faqSchema = generateComparisonFAQ(provider1, provider2, comparisonStats || undefined)

  return (
    <>
      {/* Main ComparisonShopping structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(structuredData.comparisonShopping)
        }}
      />

      {/* WebPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(structuredData.webPage)
        }}
      />

      {/* ItemList for comparison results */}
      {comparisonData.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(structuredData.itemList)
          }}
        />
      )}

      {/* Organization schemas for both providers */}
      {structuredData.organizations.map((org, index) => (
        <script
          key={`org-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(org)
          }}
        />
      ))}

      {/* Breadcrumb navigation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(breadcrumbs)
        }}
      />

      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(faqSchema)
        }}
      />

      {/* Review schema if we have comparison stats */}
      {comparisonStats && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(structuredData.review)
          }}
        />
      )}
    </>
  )
}