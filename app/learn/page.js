export default function LearnML() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text-1">Machine Learning & AI</h1>
        <p className="text-xl">Curated resources to help you get started with ML and AI</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Free Courses Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Free Courses</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://course.fast.ai" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Fast.ai Practical Deep Learning
                </a>
                <p className="text-sm">Practical deep learning for coders with real-world applications</p>
              </li>
              <li>
                <a href="https://www.coursera.org/learn/machine-learning" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Andrew Ng's Machine Learning Course
                </a>
                <p className="text-sm">Classic introduction to machine learning fundamentals</p>
              </li>
              <li>
                <a href="https://www.deeplearning.ai" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  DeepLearning.AI
                </a>
                <p className="text-sm">Structured learning paths for different AI specializations</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Books & Reading Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Books & Reading</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://d2l.ai" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Dive into Deep Learning
                </a>
                <p className="text-sm">Interactive deep learning book with code, math, and discussions</p>
              </li>
              <li>
                <a href="https://github.com/microsoft/ML-For-Beginners" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Microsoft's ML for Beginners
                </a>
                <p className="text-sm">12-week curriculum about machine learning basics</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Practice & Projects Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Practice & Projects</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://kaggle.com" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Kaggle
                </a>
                <p className="text-sm">Competitions, datasets, and community for data science</p>
              </li>
              <li>
                <a href="https://huggingface.co/learn" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Hugging Face Courses
                </a>
                <p className="text-sm">Learn to use state-of-the-art models and libraries</p>
              </li>
            </ul>
          </div>
        </div>

        {/* New GPU Architecture & Hardware Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">GPU Architecture & Hardware</h2>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html" 
                  className="link link-primary" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  NVIDIA CUDA Programming Guide
                </a>
                <p className="text-sm">Comprehensive guide to GPU architecture and CUDA programming</p>
              </li>
              <li>
                <a 
                  href="https://www.youtube.com/playlist?list=PLAwxTw4SYaPnFKojVQrmyOGFCqHTxfdv2" 
                  className="link link-primary" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  GPU Architecture Fundamentals
                </a>
                <p className="text-sm">Stanford course on GPU architecture and parallel computing</p>
              </li>
              <li>
                <a 
                  href="https://www.chipmaking.com/gpu-architecture" 
                  className="link link-primary" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Modern GPU Design
                </a>
                <p className="text-sm">Deep dive into modern GPU manufacturing and design principles</p>
              </li>
            </ul>
          </div>
        </div>

        {/* AI Tools & Frameworks Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">AI Tools & Frameworks</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://pytorch.org/tutorials" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  PyTorch Tutorials
                </a>
                <p className="text-sm">Official tutorials for the popular deep learning framework</p>
              </li>
              <li>
                <a href="https://www.tensorflow.org/learn" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  TensorFlow Learning
                </a>
                <p className="text-sm">Comprehensive guides for TensorFlow development</p>
              </li>
              <li>
                <a href="https://lightning.ai" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Lightning AI
                </a>
                <p className="text-sm">Framework for high-performance AI development</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Research Papers & Publications */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Research & Publications</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://arxiv.org/list/cs.AI/recent" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  arXiv AI Papers
                </a>
                <p className="text-sm">Latest research papers in artificial intelligence</p>
              </li>
              <li>
                <a href="https://paperswithcode.com" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Papers with Code
                </a>
                <p className="text-sm">ML papers with implemented code examples</p>
              </li>
              <li>
                <a href="https://distill.pub" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Distill.pub
                </a>
                <p className="text-sm">Clear explanations of machine learning concepts</p>
              </li>
            </ul>
          </div>
        </div>

        {/* AI Ethics & Safety Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">AI Ethics & Safety</h2>
            <ul className="space-y-3">
              <li>
                <a href="https://www.anthropic.com/index/core-views-on-ai-safety" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Anthropic AI Safety
                </a>
                <p className="text-sm">Core views and research on AI safety</p>
              </li>
              <li>
                <a href="https://www.alignmentforum.org" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Alignment Forum
                </a>
                <p className="text-sm">Discussion platform for AI alignment research</p>
              </li>
              <li>
                <a href="https://ethics.fast.ai" className="link link-primary" target="_blank" rel="noopener noreferrer">
                  Fast.ai Ethics
                </a>
                <p className="text-sm">Practical AI ethics course for practitioners</p>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
} 