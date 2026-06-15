"use client";

// 通知订阅开关。
// - 不支持 Web Push 的浏览器 / iOS < 16.4:不渲染按钮
// - 三种状态:加载中 / 未订阅(显示"开启") / 已订阅(显示"关闭")
// - 权限被拒:显示灰色"通知被屏蔽",引导用户在浏览器设置中开启

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { isPushSupported, getCurrentSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function NotificationBell() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      // iOS < 16.4 在 PWA 模式下 PushManager 存在但 subscribe 失败;
      // 这里先看权限,再看现有订阅。
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      const sub = await getCurrentSubscription();
      if (!cancelled) setStatus(sub ? "subscribed" : "unsubscribed");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading" || status === "unsupported") return null;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (status === "subscribed") {
        await unsubscribeFromPush();
        setStatus("unsubscribed");
      } else if (status === "unsubscribed") {
        const sub = await subscribeToPush();
        setStatus(sub ? "subscribed" : Notification.permission === "denied" ? "denied" : "unsubscribed");
      }
    } finally {
      setBusy(false);
    }
  }

  const icon = status === "subscribed" ? Bell : status === "denied" ? BellOff : BellRing;
  const Icon = icon;
  const label =
    status === "subscribed"
      ? "通知已开启"
      : status === "denied"
        ? "通知被屏蔽"
        : "开启新预测通知";

  return (
    <button
      onClick={handleToggle}
      disabled={busy || status === "denied"}
      title={label}
      className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-full hairline text-white/70 hover:text-white hover:bg-white/[0.04] transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
