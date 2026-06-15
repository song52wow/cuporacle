// CupOracle Service Worker
// 手写,无 Workbox。版本号变化时旧缓存会被自动清理。

const CACHE_VERSION = "cuporacle-v1-20260615";
const APP_SHELL = [
  "/",
  "/matches",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/badge-72.png",
];

// ─── Install: 预缓存 app shell,跳过等待 ───────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll 任一失败整个 install 失败;用 individual put 容忍单条缺失
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[sw] precache failed:", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Activate: 清理旧版本缓存,接管未受控页面 ─────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ─── Fetch: 三类策略 ─────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST/PUT 等透传

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 跨域透传(国旗 SVG / API 代理)

  // 1. 静态资源:cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/badge-72.png" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 2. 页面/数据:stale-while-revalidate
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/matches") ||
    url.pathname.startsWith("/api/")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});

// ─── Push: 显示系统通知 ──────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CupOracle", body: event.data.text() };
  }
  const { title = "CupOracle", body = "", tag, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag,
      data, // { url }
      requireInteraction: false,
    })
  );
});

// ─── Notification click: 打开/聚焦目标 URL ───────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.includes(url) && "focus" in c) {
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })()
  );
});

// ─── 策略实现 ────────────────────────────────────────────────
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    // 静态资源无离线兜底,直接失败
    return new Response("offline", { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached) {
    // 后台静默 revalidate;返回旧值
    networkPromise.catch(() => {});
    return cached;
  }

  const res = await networkPromise;
  if (res) return res;

  // 离线且无缓存 → 兜底页
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    const offline = await cache.match("/offline.html");
    if (offline) return offline;
  }
  return new Response("offline", { status: 503 });
}
