'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * FeatureTooltip - Interactive tooltip component for feature explanations
 * Provides hover and click interactions with positioning intelligence
 */
export default function FeatureTooltip({ 
  children, 
  content, 
  title = null,
  trigger = 'hover', // 'hover', 'click', or 'both'
  position = 'top', // 'top', 'bottom', 'left', 'right', 'auto'
  maxWidth = 300,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Calculate optimal position if set to 'auto'
  useEffect(() => {
    if (position === 'auto' && isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let optimalPosition = 'top';

      // Check if there's enough space above
      if (triggerRect.top < tooltipRect.height + 10) {
        optimalPosition = 'bottom';
      }

      // Check if there's enough space below (for bottom position)
      if (optimalPosition === 'bottom' && 
          triggerRect.bottom + tooltipRect.height + 10 > viewportHeight) {
        // Try left or right
        if (triggerRect.left > tooltipRect.width + 10) {
          optimalPosition = 'left';
        } else if (triggerRect.right + tooltipRect.width + 10 < viewportWidth) {
          optimalPosition = 'right';
        } else {
          optimalPosition = 'top'; // Fallback
        }
      }

      setActualPosition(optimalPosition);
    }
  }, [isVisible, position]);

  // Handle show/hide logic
  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  
  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'both') {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' || trigger === 'both') {
      hideTooltip();
    }
  };

  const handleClick = (e) => {
    if (trigger === 'click' || trigger === 'both') {
      e.stopPropagation();
      setIsVisible(!isVisible);
    }
  };

  // Close on outside click for click-triggered tooltips
  useEffect(() => {
    if (trigger === 'click' || trigger === 'both') {
      const handleOutsideClick = (e) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target) &&
            tooltipRef.current && !tooltipRef.current.contains(e.target)) {
          hideTooltip();
        }
      };

      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [trigger]);

  // Position-specific styles
  const getPositionStyles = () => {
    const positions = {
      top: {
        tooltip: 'bottom-full mb-2',
        arrow: 'top-full border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent'
      },
      bottom: {
        tooltip: 'top-full mt-2',
        arrow: 'bottom-full border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent'
      },
      left: {
        tooltip: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
        arrow: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent'
      },
      right: {
        tooltip: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
        arrow: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent'
      }
    };

    return positions[actualPosition] || positions.top;
  };

  const positionStyles = getPositionStyles();

  // Don't render tooltip if no content
  if (!content) {
    return <>{children}</>;
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Element */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-help"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={hideTooltip}
          />
          
          {/* Tooltip Content */}
          <div
            ref={tooltipRef}
            className={`absolute z-50 ${positionStyles.tooltip}`}
            style={{ maxWidth }}
          >
            <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3">
              {/* Title if provided */}
              {title && (
                <div className="font-semibold text-white mb-1 border-b border-gray-600 pb-1">
                  {title}
                </div>
              )}
              
              {/* Content */}
              <div className="text-gray-200">
                {typeof content === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  content
                )}
              </div>
            </div>

            {/* Arrow */}
            <div 
              className={`absolute w-0 h-0 border-4 ${positionStyles.arrow}`}
              style={{
                left: actualPosition === 'top' || actualPosition === 'bottom' ? '50%' : 'auto',
                transform: actualPosition === 'top' || actualPosition === 'bottom' ? 'translateX(-50%)' : 'none'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * FeatureTooltipWrapper - Convenience wrapper for common tooltip scenarios
 */
export function FeatureTooltipWrapper({ 
  children, 
  feature, 
  notes,
  className = ''
}) {
  if (!notes && !feature?.notes) {
    return <>{children}</>;
  }

  const content = notes || feature?.notes;
  const title = feature?.title || feature?.name;

  return (
    <FeatureTooltip
      content={content}
      title={title}
      trigger="both"
      position="auto"
      className={className}
    >
      {children}
    </FeatureTooltip>
  );
}

/**
 * InfoIcon - Reusable info icon for tooltips
 */
export function InfoIcon({ className = 'w-4 h-4 text-gray-400' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * HelpIcon - Question mark icon for help tooltips
 */
export function HelpIcon({ className = 'w-4 h-4 text-gray-400' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a1.5 1.5 0 112.12 2.12A3 3 0 105.5 9H7a1 1 0 100-2 1 1 0 00-1-1 1.5 1.5 0 01-.06-3zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}