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

  // Comparison-specific filters
  comparisonMode: false,
  setComparisonMode: () => { },
  provider1: null,
  setProvider1: () => { },
  provider2: null,
  setProvider2: () => { },
  showBothAvailable: false,
  setShowBothAvailable: () => { },
  showBestPricesOnly: false,
  setShowBestPricesOnly: () => { },
  priceRangeFilter: 'all',
  setPriceRangeFilter: () => { },
  manufacturerFilter: 'all',
  setManufacturerFilter: () => { },

  // Actions
  clearAllFilters: () => { },
  clearComparisonFilters: () => { },
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

  // Comparison-specific state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [provider1, setProvider1] = useState(null);
  const [provider2, setProvider2] = useState(null);
  const [showBothAvailable, setShowBothAvailable] = useState(false);
  const [showBestPricesOnly, setShowBestPricesOnly] = useState(false);
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');

  const clearAllFilters = () => {
    setSelectedProvider(null);
    setSelectedGPU(null);
    setUseCase('');
    setBudget('');
    setProviderQuery('');
    setGpuQuery('');
    setShowBestPriceOnly(false);
    clearComparisonFilters();
  };

  const clearComparisonFilters = () => {
    setShowBothAvailable(false);
    setShowBestPricesOnly(false);
    setPriceRangeFilter('all');
    setManufacturerFilter('all');
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
        
        // Comparison-specific state
        comparisonMode,
        setComparisonMode,
        provider1,
        setProvider1,
        provider2,
        setProvider2,
        showBothAvailable,
        setShowBothAvailable,
        showBestPricesOnly,
        setShowBestPricesOnly,
        priceRangeFilter,
        setPriceRangeFilter,
        manufacturerFilter,
        setManufacturerFilter,
        
        clearAllFilters,
        clearComparisonFilters,
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