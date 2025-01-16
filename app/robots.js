export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: 'https://computeprices.com/sitemap.xml',
    host: 'https://computeprices.com',
  };
} 