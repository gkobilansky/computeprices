import { SectionProps } from '@/types/learn';

export default function Section({ number, title, concept, resources, gpuTieIn }: SectionProps) {
  return (
    <div className="collapse collapse-arrow bg-base-100 mb-4">
      <input type="checkbox" /> 
      <div className="collapse-title font-medium">
        <h3 className="text-2xl font-semibold">{number} {title}</h3>
        <p className="text-base mt-1">{concept}</p>
      </div>
      <div className="collapse-content">
        <div className="space-y-4">
          <h4 className="text-xl font-medium">Resources</h4>
          <ul className="space-y-3">
            {resources.map((resource, index) => (
              <li key={index}>
                <a 
                  href={resource.url} 
                  className="link link-primary font-medium block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.title}
                </a>
                {resource.description && (
                  <p className="text-sm text-base-content/80">{resource.description}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {gpuTieIn && (
          <div className="mt-6 p-4 bg-base-200 rounded-lg border border-base-300">
            <h4 className="text-lg font-medium mb-2">GPU Insights</h4>
            <p>{gpuTieIn}</p>
          </div>
        )}
      </div>
    </div>
  );
} 