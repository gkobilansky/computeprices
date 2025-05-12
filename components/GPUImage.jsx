'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function GPUImage({ slug, name }) {
    const [showFallback, setShowFallback] = useState(false);

    if (showFallback) {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p className="text-gray-500 mt-6 text-lg">{name}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-video flex items-center justify-center">
            <Image
                src={`/images/gpus/${slug}.webp`}
                alt={`${name} GPU`}
                fill
                sizes="(max-width: 768px) 80vw, 600px"
                className="object-contain"
                priority
                onError={() => setShowFallback(true)}
            />
        </div>
    );
} 