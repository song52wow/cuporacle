// Web Push 工具:VAPID 配置 + 单条推送发送。
// 不在这里做并发/重试/broadcast 循环,那是 push-handlers 的职责。

import webpush, { WebPushError, type PushSubscription } from "web-push";

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string; // mailto: 或 https://
}

export function configureVapid(cfg: VapidConfig): void {
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
}

export interface SendResult {
  ok: boolean;
  statusCode: number;
  gone?: boolean; // 410/404 → 客户端订阅已失效
  error?: string;
}

export async function sendOne(
  sub: PushSubscription,
  payload: string,
  ttl = 60 * 60 * 24  // 1 天
): Promise<SendResult> {
  try {
    const res = await webpush.sendNotification(sub, payload, { TTL: ttl });
    return { ok: true, statusCode: res.statusCode };
  } catch (e) {
    if (e instanceof WebPushError) {
      const gone = e.statusCode === 404 || e.statusCode === 410;
      return { ok: false, statusCode: e.statusCode, gone, error: e.body };
    }
    return { ok: false, statusCode: 0, error: (e as Error).message };
  }
}
