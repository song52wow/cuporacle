/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 部署到 Cloudflare Pages（模式 B）：保留 SSR，使用 @cloudflare/next-on-pages 适配器
  // 关闭 standalone 输出 —— Cloudflare 自带运行时，不需要 Node server
  output: undefined,
  // 构建期跳过 ESLint（项目里残留若干未用 import / JSX 注释 / 未转义引号）
  // 日常 lint 仍可通过 `npm run lint` 触发；后续清理完可删除此配置
  eslint: { ignoreDuringBuilds: true },
  // 允许 next/image 加载 flagcdn.com 的国旗 SVG
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
  async rewrites() {
    // 把官网 /api/* 代理到 admin 后端，浏览器同源，免 CORS
    // 注意：NEXT_PUBLIC_API_BASE 是构建期内联变量，必须在 next build 时提供
    // - 模式 B（连真实后端）：构建时设 https://your-admin.example.com
    // - 模式 A（纯 mock 演示）：BASE 留空 → 不挂 rewrites，前端 lib/api.ts 自动回退 mock
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
    if (!apiBase) return [];
    return [
      { source: "/api/:path*", destination: `${apiBase}/api/:path*` },
    ];
  },
};

export default nextConfig;