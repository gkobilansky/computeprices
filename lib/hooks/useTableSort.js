import { useState, useCallback } from 'react';

export function useTableSort(initialKey = null, initialDirection = 'asc') {
  const [sortConfig, setSortConfig] = useState({
    key: initialKey,
    direction: initialDirection
  });

  // Get nested values using a helper function
  const getValue = (obj, key) => {
    switch (key) {
      case 'provider':
        return obj.providers.name.toLowerCase();
      case 'gpu_model':
        return obj.gpu_models.name.toLowerCase();
      case 'price_per_hour':
        return Number(obj.price_per_hour);
      case 'vram':
        return Number(obj.gpu_models.vram);
      case 'regions':
        return obj.regions.length;
      default:
        return obj[key];
    }
  };

  const handleSort = useCallback((data, key) => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const getSortedData = useCallback((data) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortConfig]);

  return {
    sortConfig,
    handleSort,
    getSortedData
  };
} 