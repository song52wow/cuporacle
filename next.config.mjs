/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // 把官网 /api/* 代理到 admin 后端，浏览器同源，免 CORS
    // 后端地址由 NEXT_PUBLIC_API_BASE 控制（与前端 fetch 共享同一变量）
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${apiBase}/api/:path*` },
    ];
  },
};

export default nextConfig;
