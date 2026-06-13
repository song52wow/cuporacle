# CupOracle · 世界杯 AI 预测官网

> 面向客户的 2026 世界杯 AI 预测展示平台。基于多模型 LLM 共识，展示赛程、概率化胜负、比分分布、关键因素与多模型对比。

## 技术栈

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**（深色霓虹主题，玻璃拟态卡片）
- **Framer Motion**（入场 / 数值动效）
- **Lucide Icons**

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:3000
```

## 数据来源

官网默认通过 `lib/api.ts` 调用 `../admin` 的 FastAPI 后端（`http://localhost:8000`）。
**后端未启动时会自动回退到内置 mock 数据**，保证本地预览可用。

### 真实联调

1. 先把 `admin` 后端起来：
   ```bash
   cd ../admin
   make dev    # FastAPI on :8000
   ```
2. 在本目录新建 `.env.local`：
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```
3. 重启 `npm run dev`，前端会自动 fetch 真实数据。

### 强制使用 mock

```env
# .env.local
NEXT_PUBLIC_USE_MOCK=1
```

## 目录结构

```
app/
  page.tsx              # 首页（Hero + 统计 + 焦点战 + 价值 + CTA）
  matches/
    page.tsx            # 赛事列表（筛选 / 搜索 / 分组）
    [id]/page.tsx       # 比赛详情（预测可视化 / 多模型对比 / 球员评分）
components/
  SiteHeader / Footer   # 全站导航 + 页脚
  MatchCard             # 通用比赛卡片
  WinProbBar            # 胜平负概率条
  ScoreDistributionBars # 比分分布条形图
  match-detail/         # 详情页子组件
  sections/             # 首页各 section
lib/
  api.ts                # API 客户端（带 mock fallback）
  mock.ts               # 与 admin schema 对齐的 mock 数据
  types.ts              # TS 类型（与 admin Pydantic schema 一一对应）
  utils.ts              # cn / 格式化工具
```

## 设计系统

- **背景**：`#0a0a14` 深空黑 + 紫/青径向光晕
- **主色**：青→紫渐变 (`#22d3ee → #a855f7`)
- **强调色**：霓虹绿 (`#00ff9d`) 代表置信度 / 完成态
- **字体**：Geist Sans（UI）+ Geist Mono（数据）
- **动效**：Framer Motion 数字滚动、概率条入场、滚动渐显

## 部署

```bash
npm run build
npm start
```

或一键部署到 Vercel / Cloudflare Pages。
