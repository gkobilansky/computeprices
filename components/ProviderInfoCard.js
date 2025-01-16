'use client';

import React, { useState } from 'react';
import providers from '@/data/providers.json';
import { useFilter } from '@/lib/context/FilterContext';

function ProviderInfoCard() {
  const { selectedProvider } = useFilter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedProvider) {
    return <div className="card bg-base-200 shadow-md"><div className="card-body">Select a provider to see details</div></div>;
  }

  const providerDetails = providers.find(p => p.name === selectedProvider.name);

  if (!providerDetails) {
    return <div className="card bg-base-200 shadow-md"><div className="card-body">We don't have enough info about this provider yet</div></div>;
  }

  const { name, description, pros, cons, link } = providerDetails;

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title text-xl font-bold">{name}</h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-circle btn-sm"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        <a href={link} className="btn btn-gradient-2 btn-sm mt-2">Visit Provider</a>

        {isExpanded && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default ProviderInfoCard; 