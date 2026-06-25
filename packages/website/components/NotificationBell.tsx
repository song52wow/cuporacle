"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { isPushSupported, getCurrentSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
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
      ? t("enabled")
      : status === "denied"
        ? t("denied")
        : t("enable");

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
