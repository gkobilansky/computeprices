'use client';

const PROVIDER_LOGOS = [
  { name: 'AWS', logo: '/logos/aws.png' },
  { name: 'Lambda', logo: '/logos/lambda.png' },
  { name: 'RunPod', logo: '/logos/runpod.png' },
  { name: 'CoreWeave', logo: '/logos/coreweave.png' },
  { name: 'Vast.ai', logo: '/logos/vast.png' },
  { name: 'DataCrunch', logo: '/logos/datacrunch.png' },
  { name: 'FluidStack', logo: '/logos/fluidstack.png' },
  { name: 'Hyperstack', logo: '/logos/hyperstack.png' },
  { name: 'TensorDock', logo: '/logos/tensordock.png' },
  { name: 'Paperspace', logo: '/logos/paperspace.png' },
  { name: 'Azure', logo: '/logos/azure.png' },
  { name: 'Google', logo: '/logos/google.png' },
];

export default function ProviderLogoScroller() {
  // Double the logos for seamless infinite scroll
  const duplicatedLogos = [...PROVIDER_LOGOS, ...PROVIDER_LOGOS];

  return (
    <div className="w-full overflow-hidden py-4">
      <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
        Tracking prices from
      </p>
      <div className="relative">
        {/* Gradient masks for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling container */}
        <div className="flex animate-scroll hover:pause-animation">
          {duplicatedLogos.map((provider, index) => (
            <div
              key={`${provider.name}-${index}`}
              className="flex-shrink-0 mx-6 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={provider.logo}
                alt={provider.name}
                className="h-6 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
