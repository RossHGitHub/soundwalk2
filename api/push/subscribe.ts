import { savePushSubscription } from "../_push.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const result = await savePushSubscription(req.body, req.headers["user-agent"]);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save push subscription";
    return res.status(400).json({ error: message });
  }
}
