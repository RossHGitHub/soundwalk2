import { MongoClient } from "mongodb";
import webpush from "web-push";
import { requireEnv } from "./_envGuard.js";

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type StoredPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PushNotification = {
  title: string;
  body: string;
  tag: string;
  url?: string;
};

let client: MongoClient | null = null;
let vapidConfigured = false;

function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY ?? "";
}

function getVapidPrivateKey() {
  return process.env.VAPID_PRIVATE_KEY ?? "";
}

function getVapidSubject() {
  return process.env.VAPID_SUBJECT ?? "mailto:admin@soundwalk.local";
}

async function getDb() {
  const uri = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DB");

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  return client.db(dbName);
}

function isValidPushSubscription(value: any): value is PushSubscriptionPayload {
  return (
    !!value &&
    typeof value.endpoint === "string" &&
    !!value.keys &&
    typeof value.keys.p256dh === "string" &&
    typeof value.keys.auth === "string"
  );
}

function ensureVapidConfigured() {
  if (vapidConfigured) {
    return true;
  }

  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();

  if (!publicKey || !privateKey) {
    console.warn("Push notifications disabled: missing VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY");
    return false;
  }

  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function savePushSubscription(rawSubscription: any, userAgent?: string) {
  if (!isValidPushSubscription(rawSubscription)) {
    throw new Error("Invalid push subscription payload");
  }

  const db = await getDb();
  const collection = db.collection<StoredPushSubscription>("push_subscriptions");
  const now = new Date();

  const subscription: StoredPushSubscription = {
    endpoint: rawSubscription.endpoint,
    expirationTime: rawSubscription.expirationTime ?? null,
    keys: {
      p256dh: rawSubscription.keys.p256dh,
      auth: rawSubscription.keys.auth,
    },
    userAgent,
    createdAt: now,
    updatedAt: now,
  };

  await collection.updateOne(
    { endpoint: subscription.endpoint },
    {
      $set: {
        expirationTime: subscription.expirationTime,
        keys: subscription.keys,
        userAgent: subscription.userAgent,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return {
    ok: true,
    endpoint: subscription.endpoint,
  };
}

export async function sendPushNotificationToAll(notification: PushNotification) {
  if (!ensureVapidConfigured()) {
    return { delivered: 0, failed: 0, skipped: true };
  }

  const db = await getDb();
  const collection = db.collection<StoredPushSubscription>("push_subscriptions");
  const subscriptions = await collection.find().toArray();

  if (subscriptions.length === 0) {
    return { delivered: 0, failed: 0, skipped: false };
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    tag: notification.tag,
    url: notification.url ?? "/admin",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
  });

  let delivered = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
        delivered += 1;
      } catch (error: any) {
        failed += 1;
        const statusCode = Number(error?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
        }
      }
    })
  );

  if (staleEndpoints.length > 0) {
    await collection.deleteMany({ endpoint: { $in: staleEndpoints } });
  }

  return {
    delivered,
    failed,
    skipped: false,
  };
}
