'use client';

function formatPrice(price) {
  if (price === null || price === undefined) return '-';
  const num = parseFloat(price);
  if (num < 0.01) return `$${num.toFixed(4)}`;
  if (num < 1) return `$${num.toFixed(3)}`;
  return `$${num.toFixed(2)}`;
}

function formatContext(contextWindow) {
  if (!contextWindow) return '-';
  if (contextWindow >= 1000000) return `${(contextWindow / 1000000).toFixed(1)}M`;
  return `${(contextWindow / 1000).toFixed(0)}K`;
}

export default function LLMPricingTable({ prices }) {
  const sortedPrices = [...prices].sort((a, b) =>
    parseFloat(a.price_per_1m_input) - parseFloat(b.price_per_1m_input)
  );

  if (sortedPrices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No LLM pricing data available for this provider.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Model</th>
            <th>Creator</th>
            <th>Context</th>
            <th>Input/1M</th>
            <th>Output/1M</th>
          </tr>
        </thead>
        <tbody>
          {sortedPrices.map((price) => (
            <tr key={price.id}>
              <td className="font-medium">{price.model_name}</td>
              <td className="text-gray-600">{price.creator}</td>
              <td className="text-gray-600">
                {formatContext(price.context_window)}
              </td>
              <td>{formatPrice(price.price_per_1m_input)}</td>
              <td>{formatPrice(price.price_per_1m_output)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
