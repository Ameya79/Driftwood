/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backendTarget = process.env.WORKER_URL
      ? `${process.env.WORKER_URL}/api/:path*`
      : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/:path*";

    return [
      {
        source: "/api/:path*",
        destination: backendTarget,
      },
    ];
  },
};

export default nextConfig;
