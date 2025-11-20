'use client';

import { useState } from 'react';

const reactions = [
  { value: 'up', label: 'Yes, I found it', icon: '👍' },
  { value: 'down', label: 'Not yet', icon: '👎' }
];

export default function FeedbackWidget() {
  const [reaction, setReaction] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reaction && !details.trim()) {
      setStatus('error');
      setMessage('Choose a thumbs up/down or add a quick note so we know how we can help.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reaction: reaction || undefined,
          details: details.trim(),
          email: email.trim() || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to send feedback right now.');
      }

      setStatus('success');
      setMessage(data?.message || 'Thanks for the feedback!');
      setReaction('');
      setDetails('');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {reactions.map((option) => {
          const isSelected = reaction === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setReaction(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition text-sm ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/40'
                  : 'border-gray-200 hover:border-primary hover:text-primary'
              }`}
              aria-pressed={isSelected}
            >
              <span aria-hidden="true" className="text-lg">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What would make this page more useful?
        </label>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={3}
          className="textarea textarea-bordered w-full bg-white"
          placeholder="Tell us what you were looking for, missing providers, or any feature ideas."
          required={reaction === 'down'}
          maxLength={1500}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (optional, so we can follow up)
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input input-bordered w-full bg-white"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`btn btn-primary ${status === 'loading' ? 'loading' : ''}`}
        >
          {status === 'success' ? 'Sent' : 'Send feedback'}
        </button>
        {status === 'error' && (
          <span className="text-sm text-error">{message}</span>
        )}
        {status === 'success' && (
          <span className="text-sm text-success">{message}</span>
        )}
      </div>
    </form>
  );
}
