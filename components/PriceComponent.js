'use client'

import { useState, useEffect } from 'react';
import { fetchLatestPriceDate } from '@/lib/utils/fetchLatestPriceDate';

function PriceComponent() {
    const [latestPriceData, setLatestPriceData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function getData() {
            try {
                const data = await fetchLatestPriceDate();
                setLatestPriceData(data);
            } catch (error) {
                setError('Failed to fetch latest price data');
            }
        }

        getData();
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            {latestPriceData ? (
                <div>
                    <h3>Found a GPU for <span className="font-medium">
                        ${latestPriceData.price_per_hour?.toFixed(2)}</span><span className="text-gray-500 text-sm">/hour</span> on {new Date(latestPriceData.created_at).toLocaleDateString()} at {new Date(latestPriceData.created_at).toLocaleTimeString()}</h3>
                </div>
            ) : (
                <p>Loading prices...</p>
            )}
        </div>
    );
}

export default PriceComponent;
