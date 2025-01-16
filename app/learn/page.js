import BreadcrumbNav from '@/components/BreadcrumbNav';

export const metadata = {
  title: 'Machine Learning and AI - Learning Path',
  description: 'A comprehensive guide on Machine Learning and AI, designed for practical application with GPU computing. Start with foundational concepts, then build and deploy advanced models.',
};

function LearningPhase({ number, title, description, children }) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-4">Phase {number}: {title}</h2>
      <p className="text-lg mb-6">{description}</p>
      {children}
    </div>
  );
}

function Section({ number, title, concept, resources, gpuTieIn }) {
  return (
    <div className="mb-8 pl-4 border-l-4 border-primary">
      <h3 className="text-2xl font-semibold mb-3">{number} {title}</h3>
      <p className="mb-4">{concept}</p>
      
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
  );
}

function MLResources() {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h3 className="text-xl">More resources to help you with ML and AI</h3>
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

export default function AILearningPath() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BreadcrumbNav 
        items={[
          { label: 'Home', href: '/' },
          { label: 'AI Learning Path', href: '/learn' },
        ]} 
      />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 gradient-text-1">
          Machine Learning and Artificial Intelligence: From Beginner to GPU-Powered Practitioner
        </h1>
        <p className="text-xl">
          We designed this learning path with a focus on practical application, 
          leveraging the power of GPUs to accelerate your learning and development.
        </p>
      </div>

      <LearningPhase
        number="1"
        title="Foundations - Getting Your Feet Wet"
        description="Build a solid understanding of ML/AI basics and set up your essential coding environment. This phase is crucial for anyone new to the field."
      >
        <Section
          number="1.1"
          title="Introduction to ML/AI: What, Why, and How"
          concept="Understand the landscape of AI, ML, and Deep Learning. Explore common ML tasks and see how they're transforming various industries."
          resources={[
            {
              title: "Elements of AI - Free Online Course",
              url: "https://www.elementsofai.com/",
              description: "A beginner-friendly introduction to AI concepts (now available in Ukrainian!)"
            },
            {
              title: "What is Machine Learning? - IBM",
              url: "https://www.ibm.com/cloud/learn/machine-learning"
            },
            {
              title: "Artificial Intelligence vs. Machine Learning vs. Deep Learning - Zendesk",
              url: "https://www.zendesk.com/blog/machine-learning-and-deep-learning/"
            },
            {
              title: "Machine Learning for Everyone",
              url: "https://vas3k.com/blog/machine_learning/"
            }
          ]}
          gpuTieIn="While basic ML concepts don't require specialized hardware, understanding how GPUs accelerate training will become crucial as you progress in your journey."
        />

        <Section
          number="1.2"
          title="Python for Data Science: The Essential Toolkit"
          concept="Equip yourself with the essential Python libraries for data manipulation, analysis, and visualization. Focus on NumPy, Pandas, and Matplotlib."
          resources={[
            {
              title: "Google's Python Class",
              url: "https://developers.google.com/edu/python/"
            },
            {
              title: "Kaggle's Python Micro-Course",
              url: "https://www.kaggle.com/learn/python"
            },
            {
              title: "NumPy Tutorial - Official Documentation",
              url: "https://numpy.org/doc/stable/user/absolute_beginners.html"
            },
            {
              title: "Pandas Getting Started - Official Tutorials",
              url: "https://pandas.pydata.org/docs/getting_started/index.html"
            },
            {
              title: "Matplotlib Tutorials - Official Documentation",
              url: "https://matplotlib.org/stable/tutorials/index.html"
            }
          ]}
        />

        <Section
          number="1.3"
          title="Introduction to Machine Learning Algorithms: Your First Models"
          concept="Dive into practical ML with Scikit-learn. Implement fundamental algorithms like Linear Regression, Logistic Regression, Decision Trees, and K-Nearest Neighbors."
          resources={[
            {
              title: "Scikit-learn Tutorials - Official Documentation",
              url: "https://scikit-learn.org/stable/tutorial/"
            },
            {
              title: "Machine Learning Mastery - Linear Regression Tutorial",
              url: "https://machinelearningmastery.com/linear-regression-for-machine-learning/"
            },
            {
              title: "Introduction to Statistical Learning",
              url: "https://www.statlearning.com/"
            }
          ]}
          gpuTieIn="While these basic algorithms don't require GPU acceleration, they build the foundation for understanding more complex models that will benefit from GPU computing."
        />
      </LearningPhase>

      <LearningPhase
        number="2"
        title="Deep Learning - Unleashing the Power of Neural Networks"
        description="Enter the world of Deep Learning. Explore neural networks, learn to build them with TensorFlow/Keras, and discover their applications in image recognition."
      >
        <Section
          number="2.1"
          title="Neural Networks Fundamentals: Building Blocks of Deep Learning"
          concept="Grasp the core concepts of neural networks: neurons, layers, activation functions, backpropagation, and the training process."
          resources={[
            {
              title: "Neural Networks and Deep Learning - Free Online Book",
              url: "http://neuralnetworksanddeeplearning.com/",
              description: "Comprehensive guide to understanding neural networks from the ground up"
            },
            {
              title: "3Blue1Brown - Neural Networks Series",
              url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",
              description: "Visual explanations of neural network concepts"
            }
          ]}
          gpuTieIn="As you start training neural networks, even simple ones, you'll notice the computational demands. This is where GPU acceleration begins to show its value."
        />

        <Section
          number="2.2"
          title="TensorFlow and Keras: Your Deep Learning Frameworks"
          concept="Get hands-on with TensorFlow and Keras. Learn to construct, train, and evaluate neural networks for various tasks."
          resources={[
            {
              title: "TensorFlow Website",
              url: "https://www.tensorflow.org/"
            },
            {
              title: "Keras Website",
              url: "https://keras.io/"
            },
            {
              title: "TensorFlow Keras Guide",
              url: "https://www.tensorflow.org/guide/keras"
            },
            {
              title: "Keras Documentation",
              url: "https://keras.io/api/"
            }
          ]}
          gpuTieIn="TensorFlow and Keras are designed to leverage GPU acceleration. Setting up your environment with GPU support can speed up training by orders of magnitude."
        />

        <Section
          number="2.3"
          title="Convolutional Neural Networks (CNNs): Mastering Image Data"
          concept="Explore the architecture of CNNs and understand their effectiveness in image classification, object detection, and other computer vision applications."
          resources={[
            {
              title: "CS231n: Convolutional Neural Networks for Visual Recognition - Stanford",
              url: "https://cs231n.github.io/",
              description: "Stanford's renowned course on CNNs and computer vision"
            },
            {
              title: "A Comprehensive Guide to Convolutional Neural Networks",
              url: "https://towardsdatascience.com/a-comprehensive-guide-to-convolutional-neural-networks-the-eli5-way-3bd2b1164a53",
              description: "Clear explanation of CNN architectures and principles"
            }
          ]}
          gpuTieIn="CNNs are particularly well-suited for GPU acceleration due to their parallel nature. Training complex vision models becomes practical only with GPU support."
        />
      </LearningPhase>

      <LearningPhase
        number="3"
        title="Advanced Deep Learning - Specialized Architectures and Techniques"
        description="Take your Deep Learning skills to the next level. Explore RNNs, Generative AI, and the cutting-edge Transformer architecture."
      >
        <Section
          number="3.1"
          title="Recurrent Neural Networks (RNNs): Understanding Sequential Data"
          concept="Learn about RNNs, LSTMs, and GRUs, and how they process sequential data for tasks like natural language processing and time series analysis."
          resources={[
            {
              title: "Understanding LSTMs - Blog Post",
              url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/",
              description: "Comprehensive guide to understanding LSTM networks"
            },
            {
              title: "Sequence Models - DeepLearning.AI",
              url: "https://www.coursera.org/learn/nlp-sequence-models",
              description: "Deep dive into RNNs and their applications"
            }
          ]}
          gpuTieIn="Training RNNs on large sequences requires significant computational power. GPUs can dramatically reduce training time for these models."
        />

        <Section
          number="3.2"
          title="Generative AI: Creating New Data"
          concept="Dive into the fascinating world of Generative AI. Explore models like GANs and VAEs, and their applications in creating new content."
          resources={[
            {
              title: "Generative Deep Learning, 2nd Edition - Book",
              url: "https://www.oreilly.com/library/view/generative-deep-learning/9781098134174/",
              description: "Comprehensive guide to generative models"
            },
            {
              title: "The GAN Zoo - GitHub",
              url: "https://github.com/hindupuravinash/the-gan-zoo",
              description: "Extensive collection of GAN architectures and implementations"
            }
          ]}
          gpuTieIn="Generative models are computationally intensive and typically require high-end GPUs for reasonable training times."
        />

        <Section
          number="3.3"
          title="Transformers: The State of the Art in NLP (and Beyond)"
          concept="Understand the revolutionary Transformer architecture and its impact on Natural Language Processing and other fields. Learn about models like BERT and GPT."
          resources={[
            {
              title: "The Illustrated Transformer - Blog Post",
              url: "https://jalammar.github.io/illustrated-transformer/",
              description: "Visual guide to understanding Transformer architecture"
            },
            {
              title: "The Annotated Transformer - Harvard",
              url: "https://nlp.seas.harvard.edu/2018/04/03/attention.html",
              description: "Detailed implementation walkthrough of the Transformer paper"
            }
          ]}
          gpuTieIn="Training Transformer models requires substantial GPU resources. Even fine-tuning pre-trained models benefits significantly from GPU acceleration."
        />

        <Section
          number="3.4"
          title="Optimizing for GPU Performance"
          concept="Maximize the power of your rented GPU. Learn techniques like efficient data loading, mixed precision training, and model parallelism."
          resources={[
            {
              title: "TensorFlow Performance Guide",
              url: "https://www.tensorflow.org/guide/performance/overview",
              description: "Official guide to optimizing TensorFlow performance"
            },
            {
              title: "PyTorch Performance Tuning Guide",
              url: "https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html",
              description: "Best practices for PyTorch performance optimization"
            }
          ]}
          gpuTieIn="Understanding GPU optimization techniques is crucial for cost-effective training of large models. These skills can significantly reduce your computing costs."
        />
      </LearningPhase>

      <LearningPhase
        number="4"
        title="Building and Deploying - From Model to Application"
        description="Bridge the gap between training and deployment. Learn how to get your models working in the real world and discover best practices for managing the ML lifecycle."
      >
        <Section
          number="4.1"
          title="Model Deployment: Getting Your Model into the World"
          concept="Explore various deployment options, including TensorFlow Serving, TorchServe, and cloud-based ML platforms."
          resources={[
            {
              title: "TensorFlow Serving - Guide",
              url: "https://www.tensorflow.org/tfx/guide/serving",
              description: "Official guide to deploying TensorFlow models"
            },
            {
              title: "Deploying PyTorch Models - Guide",
              url: "https://pytorch.org/serve/",
              description: "Learn to deploy PyTorch models in production"
            }
          ]}
          gpuTieIn="Consider GPU requirements for serving models in production, especially for real-time inference tasks."
        />

        <Section
          number="4.2"
          title="MLOps: The DevOps of Machine Learning"
          concept="Get introduced to MLOps for automating and streamlining the ML lifecycle, from data preparation to model monitoring."
          resources={[
            {
              title: "MLOps Principles",
              url: "https://ml-ops.org",
              description: "Core concepts and best practices in MLOps"
            },
            {
              title: "What is MLOps?",
              url: "https://cloud.google.com/learn/what-is-mlops",
              description: "Google Cloud's comprehensive guide to MLOps"
            }
          ]}
          gpuTieIn="Learn to manage GPU resources effectively in your ML pipeline to optimize costs and performance."
        />

        <Section
          number="4.3"
          title="Project Portfolio: Showcasing Your Skills"
          concept="Build a strong portfolio to demonstrate your skills and attract potential employers or collaborators."
          resources={[
            {
              title: "Kaggle Competitions",
              url: "https://www.kaggle.com/competitions",
              description: "Participate in ML competitions to build your portfolio"
            },
            {
              title: "Papers with Code",
              url: "https://paperswithcode.com/",
              description: "Implement state-of-the-art models from research papers"
            }
          ]}
          gpuTieIn="Tackle ambitious portfolio projects that showcase your ability to work with GPU-accelerated models effectively."
        />
      </LearningPhase>

      <MLResources/>

      <div className="mt-16 p-6 bg-base-200 rounded-lg border border-base-300">
        <h2 className="text-2xl font-bold mb-4">Ongoing Learning: Staying at the Forefront of AI</h2>
        <p className="mb-6">
          The field of AI and ML is rapidly evolving. Stay current with these resources and communities:
        </p>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold mb-3">Stay Updated</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://twimlai.com/newsletter/" 
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TWIML AI Newsletter
                </a>
              </li>
              <li>
                <a 
                  href="https://www.deeplearningweekly.com/" 
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Deep Learning Weekly
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/i/lists/1647749749644148737" 
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AI Researchers to Follow
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-3">Join the Community</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.reddit.com/r/MachineLearning/" 
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  r/MachineLearning
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/huggingface" 
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hugging Face Discord
                </a>
              </li>
              <li>
                <a 
                  href="https://pytorch.org/community" 
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PyTorch Community
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Major Conferences</h3>
          <ul className="space-y-2">
            <li>
              <a 
                href="https://nips.cc/" 
                className="link link-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                NeurIPS
              </a>
              {" - Neural Information Processing Systems"}
            </li>
            <li>
              <a 
                href="https://icml.cc/" 
                className="link link-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                ICML
              </a>
              {" - International Conference on Machine Learning"}
            </li>
            <li>
              <a 
                href="https://iclr.cc/" 
                className="link link-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                ICLR
              </a>
              {" - International Conference on Learning Representations"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 