import { OngoingLearningProps } from '@/types/learn';

export default function OngoingLearning({ stayUpdated, communities, conferences }: OngoingLearningProps) {
  return (
    <div className="mt-16 p-6">
      <h2 className="text-2xl text-center font-bold mb-6">Ongoing Learning</h2>
      <p className="mb-6">
        The field of AI and ML is rapidly evolving. Stay current with these resources and communities:
      </p>
      
      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
          <ul className="space-y-3">
            {stayUpdated.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.url} 
                  className="link link-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Join some communities</h3>
          <ul className="space-y-3">
            {communities.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.url} 
                  className="link link-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Major Conferences</h3>
        <ul className="space-y-3">
          {conferences.map((item, index) => (
            <li key={index} className="flex flex-col sm:flex-row sm:items-baseline">
              <a 
                href={item.url} 
                className="link link-primary hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </a>
              <span className="text-base-content/80 sm:ml-2">- {item.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 