'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setError('');

        // Here you would typically send this to your API endpoint
        // For now, we'll just simulate a successful signup
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
            setStatus('success');
            setEmail('');
        } catch (err) {
            setStatus('error');
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
                We will be releasing new tools to help you make the most of cloud compute.
            </p>
            <p className="text-sm text-gray-600 mb-2">
                Join the waitlist.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2 items-stretch">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 input input-sm input-bordered bg-white/50"
                    disabled={status === 'loading' || status === 'success'}
                />
                <button
                    type="submit"
                    className={`btn btn-sm btn-primary ${status === 'loading' ? 'loading' : ''}`}
                    disabled={status === 'loading' || status === 'success'}
                >
                    {status === 'success' ? 'Joined!' : 'Join'}
                </button>
            </form>
            {error && (
                <p className="mt-2 text-error text-sm">{error}</p>
            )}
            {status === 'success' && (
                <p className="mt-2 text-success text-sm">Thanks for joining!</p>
            )}
        </div>
    );
} 