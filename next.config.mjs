/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'img.youtube.com',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'www.computeprices.com',
                    },
                ],
                destination: 'https://computeprices.com/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
