import BreadcrumbNav from '@/components/BreadcrumbNav';
import LearningPhase from '@/components/learn/LearningPhase';
import Section from '@/components/learn/Section';
import MLResources from '@/components/learn/MLResources';
import OngoingLearning from '@/components/learn/OngoingLearning';
import LearningOverview from '@/components/learn/LearningOverview';
import VideoCarousel, { VideoType } from '@/components/learn/VideoCarousel';

export const metadata = {
  title: 'Machine Learning and AI - Learning Path',
  description: 'A comprehensive guide on Machine Learning and AI, designed for practical application with GPU computing. Start with foundational concepts, then build and deploy advanced models.',
};

const ongoingLearningData = {
  stayUpdated: [
    {
      title: 'TWIML AI Newsletter',
      url: 'https://twimlai.com/newsletter/'
    },
    {
      title: 'Deep Learning Weekly',
      url: 'https://www.deeplearningweekly.com/'
    },
    {
      title: 'AI Researchers to Follow',
      url: 'https://twitter.com/i/lists/1647749749644148737'
    }
  ],
  communities: [
    {
      title: 'r/MachineLearning',
      url: 'https://www.reddit.com/r/MachineLearning/'
    },
    {
      title: 'Hugging Face Discord',
      url: 'https://discord.gg/huggingface'
    },
    {
      title: 'PyTorch Community',
      url: 'https://pytorch.org/community'
    }
  ],
  conferences: [
    {
      title: 'NeurIPS',
      url: 'https://nips.cc/',
      description: 'Neural Information Processing Systems'
    },
    {
      title: 'ICML',
      url: 'https://icml.cc/',
      description: 'International Conference on Machine Learning'
    },
    {
      title: 'ICLR',
      url: 'https://iclr.cc/',
      description: 'International Conference on Learning Representations'
    }
  ]
};

// Add video data interfaces
const phase1Videos: VideoType[] = [
  {
    id: 'phase1-1',
    title: 'Machine Learning for Beginners',
    channelName: 'freeCodeCamp',
    whyWatch: 'A comprehensive introduction that starts from the very basics of what machine learning is, why it\'s important, and how to get started. Ideal for absolute beginners.',
    posterUrl: 'https://img.youtube.com/vi/NWONeJKn6kc/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=NWONeJKn6kc'
  },
  {
    id: 'phase1-2',
    title: 'Intro to Machine Learning with Python',
    channelName: 'sentdex',
    whyWatch: 'Provides a hands-on overview of essential Python libraries (NumPy, pandas, scikit-learn). You\'ll see how to install them and work through simple ML tasks.',
    posterUrl: 'https://img.youtube.com/vi/GjKQ6V_ViQE/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=GjKQ6V_ViQE'
  },
  {
    id: 'phase1-3',
    title: 'Neural Networks from Scratch - EXPLAINED!',
    channelName: '3Blue1Brown',
    whyWatch: 'Grant Sanderson provides an intuitive, visual explanation of neural networks that will give you a strong foundation in deep learning concepts.',
    posterUrl: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=aircAruvnKk'
  }
];

const phase2Videos: VideoType[] = [
  {
    id: 'phase2-1',
    title: 'Neural Networks from Scratch - P.1 Intro and Neuron Code',
    channelName: 'sentdex',
    whyWatch: 'This series dives into building a neural network from scratch in Python, giving you a deep understanding of how everything works under the hood before moving to higher-level frameworks.',
    posterUrl: 'https://img.youtube.com/vi/Wo5dMEP_BbI/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=Wo5dMEP_BbI'
  },
  {
    id: 'phase2-2',
    title: 'TensorFlow 2.0 Complete Course - Python Neural Networks for Beginners',
    channelName: 'freeCodeCamp',
    whyWatch: 'A thorough, project-based course that starts with the basics of TensorFlow/Keras and progresses to building various deep learning models, including convolutional networks for image tasks.',
    posterUrl: 'https://img.youtube.com/vi/tPYj3fFJGjk/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=tPYj3fFJGjk'
  },
  {
    id: 'phase2-3',
    title: 'Convolutional Neural Networks (CNN) - EXPLAINED',
    channelName: '3Blue1Brown',
    whyWatch: '3Blue1Brown\'s visual explanations break down the math and intuition behind CNNs, making it an excellent primer before you start coding your own image recognition models.',
    posterUrl: 'https://img.youtube.com/vi/YRhxdVk_sIs/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=YRhxdVk_sIs'
  }
];

const phase3Videos: VideoType[] = [
  {
    id: 'phase3-1',
    title: 'Recurrent Neural Networks (RNN) - EXPLAINED',
    channelName: '3Blue1Brown',
    whyWatch: 'Visual, intuitive walkthrough of how RNNs handle sequential data (like text and time series). Great for foundational understanding before tackling LSTMs or GRUs.',
    posterUrl: 'https://img.youtube.com/vi/LHXXI4-IEns/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=LHXXI4-IEns'
  },
  {
    id: 'phase3-2',
    title: 'Generative Adversarial Networks (GANs) Explained',
    channelName: 'Two Minute Papers',
    whyWatch: 'Quickly grasp the core idea behind GANs—how two networks (generator and discriminator) compete and learn to produce realistic outputs.',
    posterUrl: 'https://img.youtube.com/vi/PJpt3KwzZtg/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=PJpt3KwzZtg'
  },
  {
    id: 'phase3-3',
    title: 'Transformers Explained - What They Are and How They Work',
    channelName: 'StatQuest with Josh Starmer',
    whyWatch: 'Provides a straightforward, step-by-step breakdown of the Transformer architecture, covering the attention mechanism and why Transformers outperform traditional RNNs for many tasks.',
    posterUrl: 'https://img.youtube.com/vi/4Bdc55j80l8/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=4Bdc55j80l8'
  }
];

const phase4Videos: VideoType[] = [
  {
    id: 'phase4-1',
    title: 'Best Practices for MLOps with MLFlow, with Zoltan C. Toth',
    channelName: 'MLflow',
    whyWatch: 'A comprehensive guide to managing the machine learning lifecycle using MLflow, covering experiment tracking, metrics analysis, and model registry for effective lifecycle management.',
    posterUrl: 'https://img.youtube.com/vi/ewAzwSvyU7o/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=ewAzwSvyU7o'
  },
  {
    id: 'phase4-2',
    title: 'Start the machine learning lifecycle with MLOps | CLL99',
    channelName: 'Microsoft Developer',
    whyWatch: 'Learn best practices for creating and managing machine learning models using MLOps processes, covering the entire ML lifecycle from creation to monitoring and incident response.',
    posterUrl: 'https://img.youtube.com/vi/MYP3Bmsncq4/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=MYP3Bmsncq4'
  },
  {
    id: 'phase4-3',
    title: 'MLOps for managing the end to end life cycle with Azure Machine Learning service',
    channelName: 'Microsoft Azure',
    whyWatch: 'Explore MLOps capabilities in Azure Machine Learning service, with practical demonstrations of asset management and orchestration services for effective ML lifecycle management.',
    posterUrl: 'https://img.youtube.com/vi/0MaHb070H_8/maxresdefault.jpg',
    youtubeUrl: 'https://youtube.com/watch?v=0MaHb070H_8'
  }
];

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
        <h1 className="text-4xl font-bold mb-4">
          Artificial Intelligence: Put those GPUs to work
        </h1>
        <p className="text-xl">
          We designed this learning path with a focus on practical application, 
          leveraging the power of GPUs to accelerate your learning and development.
        </p>
      </div>

      <LearningOverview />

      <div id="phase-1">
        <LearningPhase
          number="1"
          title="Foundations - Getting Your Feet Wet"
          description="Build a solid understanding of AI basics and set up your essential coding environment. This phase is crucial for anyone new to the field."
        >
          <Section
            number="1.1"
            title="Introduction to AI: What, Why, and How"
            concept="Understand the landscape of AI, ML, and Deep Learning. Explore common ML tasks and see how they're transforming various industries."
            resources={[
              {
                title: "Elements of AI - Free Online Course",
                url: "https://www.elementsofai.com/",
                description: "A beginner-friendly introduction to AI concepts"
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
      </div>
      <div className="my-12 -mx-4 md:-mx-8 lg:-mx-16">
        <h2 className="text-2xl font-bold mb-4">Our Favorite Foundational Youtube Videos</h2>
        <VideoCarousel videos={phase1Videos} />
      </div>

      <div id="phase-2">
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
      </div>
      <div className="mt-12 -mx-4 md:-mx-8 lg:-mx-16">
        <h2 className="text-2xl font-bold mb-4">The Best Deep Learning Youtube Videos</h2>
        <VideoCarousel videos={phase2Videos} />
      </div>

      <div id="phase-3">
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
      </div>
      <div className="mt-12 -mx-4 md:-mx-8 lg:-mx-16">
        <h2 className="text-2xl font-bold mb-4">More Advanced Deep Learning Vids</h2>
        <VideoCarousel videos={phase3Videos} />
      </div>

      <div id="phase-4">
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
      </div>
      <div className="mt-12 -mx-4 md:-mx-8 lg:-mx-16">
        <h2 className="text-2xl font-bold mb-4">Youtube Videos for Deploying and Managing ML Models</h2>
        <VideoCarousel videos={phase4Videos} />
      </div>
      <div id="ongoing-learning">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MLResources />
        <OngoingLearning {...ongoingLearningData} />
      </div>
      </div>
    </div>
  );
} 