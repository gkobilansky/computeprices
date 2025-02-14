'use client';

import ChatMessage from './ChatMessage';

export default function MLResources() {
  return (
    <div className="mt-16 p-6">
      <h2 className="text-2xl text-center font-bold mb-6">Advice from a robot</h2>
      <div className="flex justify-center items-center">
        <div className="mockup-phone border-primary">
          <div className="camera"></div> 
          <div className="display">
            <div className="artboard artboard-demo phone-1">
              <div className="h-full overflow-y-auto px-4 py-8 space-y-6">
                <style jsx>{`
                  .chat-bubble-ios-blue {
                    background-color: #007AFF !important;
                    color: white;
                  }
                  .chat-bubble-ios-blue a {
                    color: white;
                    text-decoration: underline;
                  }
                  .chat-bubble-ios-gray {
                    background-color: #8E8E93 !important;
                    color: white;
                  }
                  .chat-bubble-ios-gray a {
                    color: white;
                    text-decoration: underline;
                  }
                  .chat-bubble-ios-blue a:hover,
                  .chat-bubble-ios-gray a:hover {
                    opacity: 0.8;
                  }
                `}</style>

                <ChatMessage
                  isLearner
                  avatar="🎓"
                  messages={[{ text: "I want to learn about AI. Where should I start?" }]}
                />

                <ChatMessage
                  avatar="🤖"
                  messages={[{
                    text: "Let's start with some excellent free courses:",
                    links: [
                      {
                        title: "Fast.ai's Practical Deep Learning",
                        url: "https://course.fast.ai",
                        description: "Perfect for hands-on learners"
                      },
                      {
                        title: "Andrew Ng's ML Course",
                        url: "https://www.coursera.org/learn/machine-learning",
                        description: "Great for fundamentals"
                      },
                      {
                        title: "DeepLearning.AI",
                        url: "https://www.deeplearning.ai",
                        description: "Structured paths for different specializations"
                      }
                    ]
                  }]}
                />

                <ChatMessage
                  isLearner
                  avatar="🎓"
                  messages={[{ text: "What about books and reading materials?" }]}
                />

                <ChatMessage
                  avatar="🤖"
                  messages={[{
                    text: "Here are some excellent reading resources:",
                    links: [
                      {
                        title: "Dive into Deep Learning",
                        url: "https://d2l.ai",
                        description: "Interactive book with code examples"
                      },
                      {
                        title: "Microsoft's ML for Beginners",
                        url: "https://github.com/microsoft/ML-For-Beginners",
                        description: "12-week curriculum"
                      }
                    ]
                  }]}
                />

                <ChatMessage
                  isLearner
                  avatar="🎓"
                  messages={[{ text: "How can I get hands-on practice?" }]}
                />

                <ChatMessage
                  avatar="🤖"
                  messages={[{
                    text: "Try these platforms for practical experience:",
                    links: [
                      {
                        title: "Kaggle",
                        url: "https://kaggle.com",
                        description: "Competitions, datasets, and community for data science"
                      },
                      {
                        title: "Hugging Face Courses",
                        url: "https://huggingface.co/learn",
                        description: "Learn to use state-of-the-art models and libraries"
                      }
                    ]
                  }]}
                />

                <ChatMessage
                  isLearner
                  avatar="🎓"
                  messages={[{ text: "I want to understand GPU hardware better. Any resources?" }]}
                />

                <ChatMessage
                  avatar="🤖"
                  messages={[{
                    text: "Here's what you need to know about GPUs:",
                    links: [
                      {
                        title: "NVIDIA CUDA Programming Guide",
                        url: "https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html",
                        description: "Comprehensive guide to GPU architecture and CUDA programming"
                      },
                      {
                        title: "GPU Architecture Fundamentals",
                        url: "https://www.youtube.com/playlist?list=PLAwxTw4SYaPnFKojVQrmyOGFCqHTxfdv2",
                        description: "Stanford course on GPU architecture and parallel computing"
                      },
                      {
                        title: "Modern GPU Design",
                        url: "https://www.chipmaking.com/gpu-architecture",
                        description: "Deep dive into modern GPU manufacturing and design principles"
                      }
                    ]
                  }]}
                />

                <ChatMessage
                  isLearner
                  avatar="🎓"
                  messages={[{ text: "What about AI ethics and safety?" }]}
                />

                <ChatMessage
                  avatar="🤖"
                  messages={[{
                    text: "Essential resources for responsible AI:",
                    links: [
                      {
                        title: "Anthropic's AI Safety Guide",
                        url: "https://www.anthropic.com/index/core-views-on-ai-safety",
                        description: "Core principles"
                      },
                      {
                        title: "Alignment Forum",
                        url: "https://www.alignmentforum.org",
                        description: "Technical discussions"
                      },
                      {
                        title: "Fast.ai Ethics",
                        url: "https://ethics.fast.ai",
                        description: "Practical guidelines"
                      }
                    ]
                  }]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 