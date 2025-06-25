'use client';

import { createContext, useContext, useState } from 'react';

const FilterContext = createContext({
  // Existing filters
  selectedProvider: null,
  setSelectedProvider: () => {},
  selectedGPU: null,
  setSelectedGPU: () => {},

  // Quick search filters
  useCase: '',
  setUseCase: () => { },
  budget: '',
  setBudget: () => { },

  // Search queries
  providerQuery: '',
  setProviderQuery: () => { },
  gpuQuery: '',
  setGpuQuery: () => { },

  // Display options
  showBestPriceOnly: false,
  setShowBestPriceOnly: () => { },

  // Actions
  clearAllFilters: () => { },
  applyQuickSearch: () => { },
});

export function FilterProvider({ children }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedGPU, setSelectedGPU] = useState(null);
  const [useCase, setUseCase] = useState('');
  const [budget, setBudget] = useState('');
  const [providerQuery, setProviderQuery] = useState('');
  const [gpuQuery, setGpuQuery] = useState('');
  const [showBestPriceOnly, setShowBestPriceOnly] = useState(false);

  const clearAllFilters = () => {
    setSelectedProvider(null);
    setSelectedGPU(null);
    setUseCase('');
    setBudget('');
    setProviderQuery('');
    setGpuQuery('');
    setShowBestPriceOnly(false);
  };

  // Quick search logic to auto-filter based on use case and budget
  const applyQuickSearch = () => {
    // This will be called when the "Find Best Options" button is clicked
    // The filtering logic will be handled in the table component
  };

  return (
    <FilterContext.Provider
      value={{
        selectedProvider,
        setSelectedProvider,
        selectedGPU,
        setSelectedGPU,
        useCase,
        setUseCase,
        budget,
        setBudget,
        providerQuery,
        setProviderQuery,
        gpuQuery,
        setGpuQuery,
        showBestPriceOnly,
        setShowBestPriceOnly,
        clearAllFilters,
        applyQuickSearch,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
} 