/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.WORKER_URL
          ? `${process.env.WORKER_URL}/api/:path*`
          : "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
