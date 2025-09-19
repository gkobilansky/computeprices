import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-base-100 to-base-200">
      <div className="text-center max-w-2xl mx-auto">
        {/* ASCII Art GPU */}
        <pre className="font-mono text-primary text-sm mb-8 hidden md:block">
          {`
     ┌───────────────────┐
     │  ▄▄▄▄▄▄▄  ║║║║║║ │
     │  ████████ ║║║║║║ │
     │  ▀▀▀▀▀▀▀  ║║║║║║ │
     └─────┬─────┘║║║║║║
           │      ║║║║║║
     ╔═════╧══════╗║║║║║
     ║ ERROR 404  ║║║║║║
     ╚════════════╝║║║║
          `}
        </pre>
        
        <h1 className="text-5xl font-bold mb-4 gradient-text-1">Oops! GPU Not Found</h1>
        <p className="text-xl text-gray-600 mb-6">
          Looks like this GPU has been mining elsewhere! 🔍
        </p>
        <p className="text-gray-500 mb-8">
          The page you&rsquo;re looking for has either been moved, deleted, or never existed. 
          Maybe it&rsquo;s processing in another compute queue? 
        </p>
        
        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link 
            href="/"
            className="btn btn-primary btn-lg"
          >
            <span className="mr-2">⚡</span>
            Return to Homepage
          </Link>
          
          <Link 
            href="/providers"
            className="btn btn-secondary btn-lg"
          >
            <span className="mr-2">🏢</span>
            Browse Providers
          </Link>
          
          <Link 
            href="/gpus"
            className="btn btn-accent btn-lg"
          >
            <span className="mr-2">🎮</span>
            Explore GPUs
          </Link>
        </div>
        
        {/* Popular Comparisons */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Popular Provider Comparisons
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link 
              href="/compare/aws-vs-coreweave"
              className="badge badge-outline hover:badge-primary transition-colors"
            >
              AWS vs CoreWeave
            </Link>
            <Link 
              href="/compare/aws-vs-runpod"
              className="badge badge-outline hover:badge-primary transition-colors"
            >
              AWS vs RunPod
            </Link>
            <Link 
              href="/compare/coreweave-vs-lambda"
              className="badge badge-outline hover:badge-primary transition-colors"
            >
              CoreWeave vs Lambda
            </Link>
            <Link 
              href="/compare/google-vs-azure"
              className="badge badge-outline hover:badge-primary transition-colors"
            >
              Google vs Azure
            </Link>
            <Link 
              href="/compare/fluidstack-vs-vast"
              className="badge badge-outline hover:badge-primary transition-colors"
            >
              FluidStack vs Vast.ai
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
