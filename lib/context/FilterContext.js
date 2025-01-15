'use client';

import { createContext, useContext, useState } from 'react';

const FilterContext = createContext({
  selectedProvider: null,
  setSelectedProvider: () => {},
  selectedGPU: null,
  setSelectedGPU: () => {},
});

export function FilterProvider({ children }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedGPU, setSelectedGPU] = useState(null);

  return (
    <FilterContext.Provider
      value={{
        selectedProvider,
        setSelectedProvider,
        selectedGPU,
        setSelectedGPU,
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