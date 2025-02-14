import { LearningPhaseProps } from '@/types/learn';

export default function LearningPhase({ number, title, description, children }: LearningPhaseProps) {
  return (
    <div className="collapse collapse-plus bg-base-200 mb-8">
      <input type="checkbox" defaultChecked /> 
      <div className="collapse-title">
        <h2 className="text-3xl font-bold">Phase {number}: {title}</h2>
        <p className="text-lg mt-2">{description}</p>
      </div>
      <div className="collapse-content pt-4">
        {children}
      </div>
    </div>
  );
} 