'use client';

import { useState, useMemo, useEffect } from 'react';
import FeatureCategorySection, { FeatureCategorySectionSkeleton } from './FeatureCategorySection';
import FeatureTooltip, { InfoIcon } from './FeatureTooltip';

/**
 * FeatureComparisonMatrix - Main component coordinating all feature comparisons
 * Displays comprehensive feature comparison between two providers
 */
export default function FeatureComparisonMatrix({
  provider1Data,
  provider2Data,
  provider1Name,
  provider2Name,
  comparisonData = null,
  loading = false,
  className = ''
}) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showWinner, setShowWinner] = useState(true);
  const [filterImportant, setFilterImportant] = useState(false);

  // Feature categories configuration
  const featureCategories = [
    {
      key: 'gpuSelection',
      name: 'GPU Selection & Availability',
      description: 'Available GPU models, latest generation support, and multi-GPU capabilities',
      features: [
        { key: 'gpuSelection.available', name: 'GPU Available', notes: 'Whether GPU compute is available' },
        { key: 'gpuSelection.score', name: 'Selection Score', notes: 'Overall GPU selection quality (1-10)' },
        { key: 'gpuSelection.models', name: 'GPU Models', notes: 'List of available GPU models' },
        { key: 'gpuSelection.latestGeneration', name: 'Latest Generation', notes: 'Access to newest GPU architectures' },
        { key: 'gpuSelection.multiGPU', name: 'Multi-GPU Support', notes: 'Support for multiple GPUs per instance' },
        { key: 'gpuSelection.bareMetalAccess', name: 'Bare Metal Access', notes: 'Direct hardware access without virtualization' }
      ]
    },
    {
      key: 'pricing',
      name: 'Pricing Model & Flexibility',
      description: 'Pricing structure, billing models, and cost optimization options',
      features: [
        { key: 'pricing.score', name: 'Pricing Score', notes: 'Overall pricing competitiveness (1-10)' },
        { key: 'pricing.flexible', name: 'Flexible Pricing', notes: 'Multiple pricing options available' },
        { key: 'pricing.model', name: 'Billing Model', notes: 'How billing is calculated (hourly, per-second, etc.)' },
        { key: 'pricing.minimumCommitment', name: 'Minimum Commitment', notes: 'Required minimum usage or commitment' },
        { key: 'pricing.averageCostRange', name: 'Cost Range', notes: 'Typical cost range per GPU hour' },
        { key: 'pricing.spotPricing', name: 'Spot Pricing', notes: 'Discounted pricing for interruptible workloads' },
        { key: 'pricing.reservedDiscounts', name: 'Reserved Discounts', notes: 'Discounts for longer-term commitments' },
        { key: 'pricing.transparentPricing', name: 'Transparent Pricing', notes: 'Clear, upfront pricing without hidden costs' }
      ]
    },
    {
      key: 'performance',
      name: 'Performance & Speed',
      description: 'Network, storage, compute performance and interconnect capabilities',
      features: [
        { key: 'performance.score', name: 'Performance Score', notes: 'Overall performance rating (1-10)' },
        { key: 'performance.networkSpeed', name: 'Network Speed', notes: 'Network performance quality' },
        { key: 'performance.storageSpeed', name: 'Storage Speed', notes: 'Storage I/O performance' },
        { key: 'performance.cpuPerformance', name: 'CPU Performance', notes: 'CPU compute performance' },
        { key: 'performance.gpuInterconnect', name: 'GPU Interconnect', notes: 'GPU-to-GPU connection technology' },
        { key: 'performance.bandwidth', name: 'Bandwidth', notes: 'Available network bandwidth' }
      ]
    },
    {
      key: 'scalability',
      name: 'Scalability & Infrastructure',
      description: 'Auto-scaling, maximum capacity, and orchestration capabilities',
      features: [
        { key: 'scalability.score', name: 'Scalability Score', notes: 'Overall scalability rating (1-10)' },
        { key: 'scalability.autoScaling', name: 'Auto-Scaling', notes: 'Automatic resource scaling based on demand' },
        { key: 'scalability.maxGPUs', name: 'Maximum GPUs', notes: 'Maximum number of GPUs available' },
        { key: 'scalability.multiRegion', name: 'Multi-Region', notes: 'Support for multiple geographic regions' },
        { key: 'scalability.loadBalancing', name: 'Load Balancing', notes: 'Built-in load balancing capabilities' },
        { key: 'scalability.orchestration', name: 'Orchestration', notes: 'Container orchestration and management tools' }
      ]
    },
    {
      key: 'support',
      name: 'Support & Documentation',
      description: 'Technical support quality, documentation, and community resources',
      features: [
        { key: 'support.score', name: 'Support Score', notes: 'Overall support quality rating (1-10)' },
        { key: 'support.documentation', name: 'Documentation', notes: 'Quality and completeness of documentation' },
        { key: 'support.communitySupport', name: 'Community Support', notes: 'Community forums and user groups' },
        { key: 'support.technicalSupport', name: 'Technical Support', notes: 'Official technical support availability' },
        { key: 'support.responsiveness', name: 'Responsiveness', notes: 'Speed of support response' },
        { key: 'support.expertise', name: 'Expertise Level', notes: 'Technical expertise of support team' }
      ]
    },
    {
      key: 'developerExperience',
      name: 'Developer Experience',
      description: 'Ease of use, APIs, tools, and setup complexity',
      features: [
        { key: 'developerExperience.score', name: 'Developer Experience Score', notes: 'Overall developer experience rating (1-10)' },
        { key: 'developerExperience.easeOfUse', name: 'Ease of Use', notes: 'How easy the platform is to use' },
        { key: 'developerExperience.api', name: 'API Quality', notes: 'API completeness and usability' },
        { key: 'developerExperience.cli', name: 'CLI Tools', notes: 'Command line interface availability' },
        { key: 'developerExperience.dashboard', name: 'Dashboard', notes: 'Web interface quality and features' },
        { key: 'developerExperience.setupTime', name: 'Setup Time', notes: 'Time required for initial setup' }
      ]
    },
    {
      key: 'security',
      name: 'Security & Compliance',
      description: 'Security features, compliance certifications, and data protection',
      features: [
        { key: 'security.score', name: 'Security Score', notes: 'Overall security rating (1-10)' },
        { key: 'security.compliance', name: 'Compliance Certifications', notes: 'Industry compliance standards met' },
        { key: 'security.encryption', name: 'Encryption', notes: 'Data encryption in transit and at rest' },
        { key: 'security.networkSecurity', name: 'Network Security', notes: 'Network isolation and security features' },
        { key: 'security.accessControl', name: 'Access Control', notes: 'Identity and access management' },
        { key: 'security.auditLogging', name: 'Audit Logging', notes: 'Security audit and logging capabilities' }
      ]
    },
    {
      key: 'geographicCoverage',
      name: 'Geographic Coverage',
      description: 'Global presence, regions, availability zones, and latency',
      features: [
        { key: 'geographicCoverage.score', name: 'Coverage Score', notes: 'Overall geographic coverage rating (1-10)' },
        { key: 'geographicCoverage.regions', name: 'Regions', notes: 'Number of available regions' },
        { key: 'geographicCoverage.availabilityZones', name: 'Availability Zones', notes: 'Number of availability zones' },
        { key: 'geographicCoverage.globalPresence', name: 'Global Presence', notes: 'Extent of worldwide coverage' },
        { key: 'geographicCoverage.latency', name: 'Latency', notes: 'Network latency characteristics' }
      ]
    }
  ];

  // Initialize expanded state - expand important categories by default
  useEffect(() => {
    const importantCategories = ['gpuSelection', 'pricing', 'performance'];
    const initialExpanded = {};
    
    featureCategories.forEach(category => {
      initialExpanded[category.key] = importantCategories.includes(category.key);
    });
    
    setExpandedCategories(initialExpanded);
  }, []);

  // Filter categories based on importance and availability
  const visibleCategories = useMemo(() => {
    let categories = featureCategories;
    
    if (filterImportant) {
      const importantCategories = ['gpuSelection', 'pricing', 'performance', 'scalability'];
      categories = categories.filter(cat => importantCategories.includes(cat.key));
    }
    
    // Filter out categories with no data
    categories = categories.filter(category => {
      return category.features.some(feature => {
        const p1Value = provider1Data?.features && getNestedValue(provider1Data.features, feature.key);
        const p2Value = provider2Data?.features && getNestedValue(provider2Data.features, feature.key);
        return p1Value !== null && p1Value !== undefined || 
               p2Value !== null && p2Value !== undefined;
      });
    });
    
    return categories;
  }, [featureCategories, filterImportant, provider1Data, provider2Data]);

  // Utility function to get nested values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Calculate overall scores
  const calculateOverallScore = (providerData) => {
    if (!providerData?.features) return 0;
    
    const scores = featureCategories.map(cat => 
      getNestedValue(providerData.features, `${cat.key}.score`)
    ).filter(score => typeof score === 'number' && score >= 1 && score <= 10);
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const provider1OverallScore = calculateOverallScore(provider1Data);
  const provider2OverallScore = calculateOverallScore(provider2Data);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading feature comparison...</span>
          </div>
        </div>
        {[...Array(4)].map((_, index) => (
          <FeatureCategorySectionSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!provider1Data || !provider2Data) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-8 text-center ${className}`}>
        <div className="text-gray-600">
          No feature comparison data available.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Feature Comparison Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Feature Comparison
            </h2>
            <p className="text-gray-600">
              Comprehensive comparison of features, capabilities, and services
            </p>
          </div>
          
          {/* Overall Scores */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{provider1Name}</div>
              <div className={`text-2xl font-bold ${
                provider1OverallScore > provider2OverallScore ? 'text-green-600' : 
                provider1OverallScore < provider2OverallScore ? 'text-red-600' : 'text-gray-900'
              }`}>
                {provider1OverallScore}/10
              </div>
            </div>
            <div className="text-gray-400">vs</div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{provider2Name}</div>
              <div className={`text-2xl font-bold ${
                provider2OverallScore > provider1OverallScore ? 'text-green-600' : 
                provider2OverallScore < provider1OverallScore ? 'text-red-600' : 'text-gray-900'
              }`}>
                {provider2OverallScore}/10
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilterImportant(!filterImportant)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterImportant 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterImportant ? '✓ Key Features Only' : 'Show All Features'}
            </button>
            
            <button
              onClick={() => setShowWinner(!showWinner)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showWinner 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showWinner ? '✓ Highlight Winners' : 'Show Winners'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const allExpanded = {};
                featureCategories.forEach(cat => { allExpanded[cat.key] = true; });
                setExpandedCategories(allExpanded);
              }}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => {
                const allCollapsed = {};
                featureCategories.forEach(cat => { allCollapsed[cat.key] = false; });
                setExpandedCategories(allCollapsed);
              }}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="space-y-4">
        {visibleCategories.map((category) => (
          <FeatureCategorySection
            key={category.key}
            categoryName={category.name}
            categoryKey={category.key}
            features={category.features}
            description={category.description}
            provider1Data={provider1Data}
            provider2Data={provider2Data}
            provider1Name={provider1Name}
            provider2Name={provider2Name}
            isExpanded={expandedCategories[category.key] || false}
            onToggle={() => handleCategoryToggle(category.key)}
            showWinner={showWinner}
          />
        ))}
      </div>

      {/* Summary */}
      {visibleCategories.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-600">
            No feature data available for comparison.
          </div>
        </div>
      )}
    </div>
  );
}