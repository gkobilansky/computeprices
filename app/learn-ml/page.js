export default function LearnML() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text-1">Learn Machine Learning & AI</h1>
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
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          These resources are regularly updated. Last checked: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
} 