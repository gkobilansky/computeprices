'use client';

export default function ComparisonLayout({ 
  children, 
  className = "" 
}) {
  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// Sub-component for full-width sections (like pricing tables)
export function ComparisonFullSection({ 
  title, 
  children, 
  className = "" 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden lg:col-span-2 ${className}`}>
      {title && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
