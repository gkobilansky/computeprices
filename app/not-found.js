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
          The page you're looking for has either been moved, deleted, or never existed. 
          Maybe it's processing in another compute queue? 
        </p>
        <Link 
          href="/"
          className="btn btn-primary btn-lg"
        >
          <span className="mr-2">⚡</span>
          Return to Homepage
        </Link>
      </div>
    </div>
  );
} 