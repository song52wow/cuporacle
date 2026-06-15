"use client";

// 客户端组件:在浏览器加载时注册 Service Worker。
// 必须放成独立组件,避免污染 server layout。
// 注册失败时静默 — manifest 和 iOS meta 仍能生效,主页面不受影响。

import { useEffect } from "react";

export function SwRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // 仅在 HTTPS / localhost 注册
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        // 不打扰用户;DevTools 可见
        console.warn("[pwa] SW registration failed:", err);
      });
  }, []);

  return null;
}
