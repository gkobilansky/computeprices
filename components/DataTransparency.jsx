import React from 'react';

export default function DataTransparency() {
    return (
        <aside className="mb-16">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    About Our Data
                </h3>
                <div className="prose max-w-none text-sm text-gray-600">
                    <p>
                        We continuously work to provide accurate and up-to-date information about GPU specifications and pricing.
                        Our data is sourced from:
                    </p>
                    <ul className="list-disc pl-5 mt-2">
                        <li>Official manufacturer specifications and documentation</li>
                        <li>Direct cloud provider pricing APIs and websites</li>
                        <li>Public benchmark results and technical documentation</li>
                        <li>Community contributions and verified user reports</li>
                    </ul>
                    <p className="mt-4">
                        While we strive for accuracy, some specifications may be incomplete or require verification.
                        If you notice any discrepancies or have additional information to contribute, please
                        <a href="https://github.com/gkobilansky/computeprices/issues" className="text-primary hover:text-primary-focus ml-1">
                            open an issue on GitHub
                        </a>.
                    </p>
                </div>
            </div>
        </aside>
    );
} 