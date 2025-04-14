export function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format a date string or Date object into a human-readable format
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const dateObject = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObject);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
} 