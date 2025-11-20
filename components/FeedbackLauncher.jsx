'use client';

import { useState } from 'react';
import FeedbackWidget from './FeedbackWidget';

export default function FeedbackLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-sm gap-2 shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        💬 Feedback
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Feedback"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute top-3 right-3"
              aria-label="Close feedback modal"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Help us improve</h3>
              <p className="text-sm text-gray-600">Tell us if you found what you need and what would make this page better.</p>
            </div>
            <FeedbackWidget />
          </div>
        </div>
      )}
    </>
  );
}
