/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'img.youtube.com',
            },
        ],
    },
};

export default nextConfig;
