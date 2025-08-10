// api/gigs.ts
import { MongoClient, ObjectId } from "mongodb";
import type { VercelRequest, VercelResponse } from "@vercel/node"; // optional types

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB || "soundwalk";

if (!uri) {
  throw new Error("Missing MONGODB_URI env var");
}

// Cache the client across lambda invocations (important for serverless).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  // @ts-ignore
  var _mongo: { client?: MongoClient; db?: any } | undefined;
}

async function connect() {
  if (global._mongo && global._mongo.client) {
    return { client: global._mongo.client, db: global._mongo.db };
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  global._mongo = { client, db };
  return { client, db };
}

function formatGig(doc: any) {
  return {
    ...doc,
    _id: doc._id.toString(),
    // normalize date to YYYY-MM-DD string for the frontend
    date:
      doc.date instanceof Date
        ? doc.date.toISOString().slice(0, 10)
        : new Date(doc.date).toISOString().slice(0, 10),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { db } = await connect();
  const col = db.collection("gigs");
  const method = req.method;

  try {
    if (method === "GET") {
      const docs = await col.find({}).sort({ date: 1 }).toArray();
      return res.status(200).json(docs.map(formatGig));
    }

    if (method === "POST") {
      const body = req.body;
      const doc = {
        venue: body.venue || "",
        date: body.date ? new Date(body.date) : new Date(),
        startTime: body.startTime || null,
        description: body.description || "",
        fee: Number(body.fee) || 0,
        privateEvent: !!body.privateEvent,
        postersNeeded: !!body.postersNeeded,
      };
      const r = await col.insertOne(doc);
      return res.status(201).json(formatGig({ ...doc, _id: r.insertedId }));
    }

    if (method === "PUT") {
      const body = req.body;
      const id = body.id || body._id;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const update = {
        venue: body.venue || "",
        date: body.date ? new Date(body.date) : new Date(),
        startTime: body.startTime || null,
        description: body.description || "",
        fee: Number(body.fee) || 0,
        privateEvent: !!body.privateEvent,
        postersNeeded: !!body.postersNeeded,
      };

      const r = await col.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: "after" }
      );

      if (!r.value) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(formatGig(r.value));
    }

    if (method === "DELETE") {
      // Support both query param and body
      const id = (req.query?.id as string) || req.body?.id;
      if (!id) return res.status(400).json({ error: "Missing id" });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
