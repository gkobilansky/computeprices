'use client';

/**
 * FeatureIndicator - Visual indicators for different types of feature values
 * Supports checkmarks, star ratings, badges, color coding, and text values
 */
export default function FeatureIndicator({ 
  value, 
  type = 'auto',
  className = '',
  size = 'md' 
}) {
  // Auto-detect indicator type based on value
  const getIndicatorType = (value) => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      if (value >= 1 && value <= 10) return 'score';
      return 'number';
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (['excellent', 'good', 'fair', 'poor', 'basic', 'limited'].includes(lowerValue)) {
        return 'quality';
      }
      if (['yes', 'no', 'true', 'false', 'available', 'unavailable'].includes(lowerValue)) {
        return 'boolean';
      }
      if (lowerValue.includes('unlimited') || lowerValue.includes('thousands')) {
        return 'scale';
      }
      return 'text';
    }
    if (Array.isArray(value)) return 'array';
    return 'text';
  };

  const actualType = type === 'auto' ? getIndicatorType(value) : type;
  
  // Size configurations
  const sizeConfig = {
    sm: { icon: 'w-3 h-3', text: 'text-xs', badge: 'px-2 py-0.5 text-xs' },
    md: { icon: 'w-4 h-4', text: 'text-sm', badge: 'px-2 py-1 text-sm' },
    lg: { icon: 'w-5 h-5', text: 'text-base', badge: 'px-3 py-1 text-base' }
  };

  const sizes = sizeConfig[size];

  // Boolean indicators (checkmarks, X marks)
  const renderBoolean = () => {
    const isTrue = value === true || 
                   value === 'yes' || 
                   value === 'true' || 
                   value === 'available' ||
                   value === 1;
    
    return (
      <div className={`inline-flex items-center ${className}`}>
        {isTrue ? (
          <svg className={`${sizes.icon} text-green-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className={`${sizes.icon} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    );
  };

  // Score indicators (1-10 with star rating visual)
  const renderScore = () => {
    const score = parseInt(value);
    const maxStars = 5;
    const starValue = Math.round((score / 10) * maxStars);
    
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="flex">
          {[...Array(maxStars)].map((_, i) => (
            <svg
              key={i}
              className={`${sizes.icon} ${i < starValue ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className={`${sizes.text} text-gray-600 ml-1`}>{score}/10</span>
      </div>
    );
  };

  // Quality indicators (excellent, good, fair, poor)
  const renderQuality = () => {
    const qualityConfig = {
      excellent: { color: 'text-green-600 bg-green-100', icon: '⭐' },
      good: { color: 'text-blue-600 bg-blue-100', icon: '👍' },
      fair: { color: 'text-yellow-600 bg-yellow-100', icon: '⚡' },
      poor: { color: 'text-red-600 bg-red-100', icon: '⚠️' },
      basic: { color: 'text-gray-600 bg-gray-100', icon: '📝' },
      limited: { color: 'text-orange-600 bg-orange-100', icon: '⚠️' }
    };

    const config = qualityConfig[value?.toLowerCase()] || qualityConfig.basic;
    
    return (
      <span className={`inline-flex items-center gap-1 ${sizes.badge} rounded-full ${config.color} ${className}`}>
        <span>{config.icon}</span>
        <span className="capitalize">{value}</span>
      </span>
    );
  };

  // Array indicators (show count with expandable list)
  const renderArray = () => {
    if (!Array.isArray(value) || value.length === 0) {
      return <span className={`${sizes.text} text-gray-400 ${className}`}>None</span>;
    }

    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <span className={`${sizes.badge} bg-blue-100 text-blue-800 rounded-full`}>
          {value.length}
        </span>
        <span className={`${sizes.text} text-gray-600`}>
          {value.length === 1 ? 'item' : 'items'}
        </span>
      </div>
    );
  };

  // Scale indicators (unlimited, thousands, etc.)
  const renderScale = () => {
    const scaleConfig = {
      unlimited: { color: 'text-purple-600 bg-purple-100', icon: '∞' },
      thousands: { color: 'text-green-600 bg-green-100', icon: '🚀' },
      limited: { color: 'text-yellow-600 bg-yellow-100', icon: '⚠️' }
    };

    const lowerValue = value?.toString().toLowerCase();
    const config = Object.entries(scaleConfig).find(([key]) => 
      lowerValue?.includes(key)
    )?.[1] || { color: 'text-gray-600 bg-gray-100', icon: '📊' };
    
    return (
      <span className={`inline-flex items-center gap-1 ${sizes.badge} rounded-full ${config.color} ${className}`}>
        <span>{config.icon}</span>
        <span>{value}</span>
      </span>
    );
  };

  // Number indicators
  const renderNumber = () => {
    return (
      <span className={`${sizes.text} font-medium text-gray-900 ${className}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    );
  };

  // Text indicators (default fallback)
  const renderText = () => {
    if (!value || value === 'N/A' || value === 'n/a') {
      return <span className={`${sizes.text} text-gray-400 ${className}`}>N/A</span>;
    }
    
    return (
      <span className={`${sizes.text} text-gray-900 ${className}`}>
        {value}
      </span>
    );
  };

  // Render based on type
  switch (actualType) {
    case 'boolean':
      return renderBoolean();
    case 'score':
      return renderScore();
    case 'quality':
      return renderQuality();
    case 'array':
      return renderArray();
    case 'scale':
      return renderScale();
    case 'number':
      return renderNumber();
    default:
      return renderText();
  }
}