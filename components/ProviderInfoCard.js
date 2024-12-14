import React from 'react';

function ProviderInfoCard({ selectedProvider }) {
  if (!selectedProvider) {
    return <div className="p-4 border rounded shadow">Select a provider to see details</div>;
  }

  const { name, description, pros, cons } = selectedProvider;

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold">{name}</h2>
      <p className="mt-2">{description}</p>
      <div className="mt-4">
        <h3 className="font-semibold">Pros:</h3>
        <ul className="list-disc list-inside">
          {pros.map((pro, index) => (
            <li key={index}>{pro}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">Cons:</h3>
        <ul className="list-disc list-inside">
          {cons.map((con, index) => (
            <li key={index}>{con}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProviderInfoCard; 