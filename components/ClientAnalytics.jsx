'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useEffect } from 'react';

export default function ClientAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
