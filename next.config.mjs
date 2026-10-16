/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async headers() {
    return [
      {
        source: '/share/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' }
        ]
      },
      {
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' }
        ]
      }
    ];
  }
};

export default nextConfig;
