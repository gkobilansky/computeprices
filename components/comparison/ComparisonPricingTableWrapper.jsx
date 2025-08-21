'use client';

import ComparisonPricingTable from './ComparisonPricingTable';

export default function ComparisonPricingTableWrapper({ 
  provider1Id, 
  provider2Id,
  provider1Name,
  provider2Name 
}) {
  return (
    <ComparisonPricingTable
      provider1Id={provider1Id}
      provider2Id={provider2Id}
      provider1Name={provider1Name}
      provider2Name={provider2Name}
    />
  );
}