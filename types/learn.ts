export interface ResourceType {
  title: string;
  url: string;
  description?: string;
}

export interface SectionProps {
  number: string;
  title: string;
  concept: string;
  resources: ResourceType[];
  gpuTieIn?: string;
}

export interface LearningPhaseProps {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export interface ChatMessageProps {
  isLearner?: boolean;
  avatar: string;
  messages: {
    text: string;
    links?: Array<{
      title: string;
      url: string;
      description?: string;
    }>;
  }[];
}

export interface OngoingLearningProps {
  stayUpdated: Array<{
    title: string;
    url: string;
  }>;
  communities: Array<{
    title: string;
    url: string;
  }>;
  conferences: Array<{
    title: string;
    url: string;
    description: string;
  }>;
} 