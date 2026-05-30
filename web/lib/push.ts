import "server-only";

// VAPID public key (safe to expose)
export const VAPID_PUBLIC_KEY = "BFfhNfiQk-domnclYRatx6tTSod-8-FhOag1z26NjsnBOmLB3j5kOov1C1Tl2Yfp2lSY8-N7uA0gDY4wNRW3dy4";

type PushPayload = { title: string; body: string; url?: string; icon?: string };

export async function sendPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return;

  try {
    const webpush = await import("web-push");
    webpush.setVapidDetails(
      "mailto:kahdigital42@gmail.com",
      VAPID_PUBLIC_KEY,
      privateKey
    );
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify({ ...payload, icon: "/icon.svg", badge: "/icon.svg" })
    );
  } catch (err) {
    // Subscription expired or invalid — caller should delete it
    if ((err as { statusCode?: number }).statusCode === 410) throw err;
    console.error("[push] sendPush error:", err);
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const { prisma } = await import("@/lib/db");
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await sendPush(sub, payload);
      } catch (err) {
        if ((err as { statusCode?: number }).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
