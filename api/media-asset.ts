import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import {
  getMediaCollection,
  getR2BucketName,
  getR2Client,
  inferContentType,
  verifyMediaSignature,
} from "./_media.js";

async function sendObjectBody(res: any, body: any) {
  if (body && typeof body.pipe === "function") {
    body.pipe(res);
    return;
  }

  if (body && typeof body.transformToByteArray === "function") {
    const bytes = await body.transformToByteArray();
    res.send(Buffer.from(bytes));
    return;
  }

  if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
    res.send(Buffer.from(body));
    return;
  }

  throw new Error("Unsupported media body");
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", ["GET", "HEAD"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = typeof req.query?.id === "string" ? req.query.id : "";
    const exp = typeof req.query?.exp === "string" ? req.query.exp : "";
    const sig = typeof req.query?.sig === "string" ? req.query.sig : "";

    if (!id || !ObjectId.isValid(id) || !verifyMediaSignature(id, exp, sig)) {
      return res.status(403).json({ error: "Invalid or expired media token" });
    }

    const col = await getMediaCollection();
    const media = await col.findOne({ _id: new ObjectId(id), active: true });
    if (!media) {
      return res.status(404).json({ error: "Media item not found" });
    }

    const client = getR2Client();
    const bucket = getR2BucketName();
    const object = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: media.objectKey,
      })
    );

    res.status(200);
    res.setHeader("Content-Type", object.ContentType || media.contentType || inferContentType(media.objectKey));
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (typeof object.ContentLength === "number") {
      res.setHeader("Content-Length", object.ContentLength.toString());
    }

    if (object.ETag) {
      res.setHeader("ETag", object.ETag);
    }

    if (req.method === "HEAD") {
      return res.end();
    }

    await sendObjectBody(res, object.Body);
  } catch (error) {
    console.error("Media asset error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
