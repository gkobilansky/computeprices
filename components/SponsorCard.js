'use client';

import React, { useState } from 'react';
import providers from '@/data/providers.json';
import { useFilter } from '@/lib/context/FilterContext';

function SponsorCard() {
  const { selectedProvider } = useFilter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedProvider) {
    return null;
  }

  const providerDetails = providers.find(p => p.name === selectedProvider.name);

  if (!providerDetails.name !== 'Shadeform') {
    return null;
  }

  const { name, description, pros, cons, link } = providerDetails;

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Check out our sponsor</p>
          <h2 className="card-title text-xl font-bold">{name}</h2>
        </div>
        
        <a href={link} className="btn btn-gradient-2 btn-sm mt-2">Visit Shadeform</a>
      </div>
    </div>
  );
}

export default SponsorCard; 