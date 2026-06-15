// 浏览器端 Web Push 客户端封装。
// - urlBase64ToUint8Array: VAPID 公钥转 PushSubscription 需要的格式
// - subscribe: 一次性完成 permission + subscribe + POST 后端
// - unsubscribe: 反向
// - getSubscription: 查当前订阅(用于 NotificationBell 初始状态)

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
    return null;
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (!res.ok) {
    console.warn("[push] subscribe POST failed:", res.status);
    // 回滚浏览器订阅,保持 UI 一致
    await sub.unsubscribe();
    return null;
  }
  return sub;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  if (!sub) return true;
  const endpoint = sub.endpoint;
  const ok = await sub.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  return ok;
}
