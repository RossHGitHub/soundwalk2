import { MongoClient, ObjectId } from "mongodb";
import { requireEnv } from "./_envGuard.js";

let client: MongoClient | null = null;

async function getDb() {
  const uri = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DB");

  if (!client) {
    console.log("Connecting to Mongo (setlists) with URI prefix:", uri.slice(0, 20));
    client = new MongoClient(uri);
    await client.connect();
  }

  return client.db(dbName);
}

function sanitizeSetLists(body: any) {
  const sets = Array.isArray(body?.sets) ? body.sets : [];

  return {
    title: String(body?.title ?? "").trim(),
    sets: sets
      .filter((set: any) => set && typeof set.id === "string")
      .map((set: any) => ({
        id: String(set.id),
        name: String(set.name ?? "").trim() || "Untitled Set",
        entries: Array.isArray(set.entries)
          ? set.entries
              .filter(
                (entry: any) =>
                  entry &&
                  typeof entry.id === "string" &&
                  typeof entry.songId === "string"
              )
              .map((entry: any) => ({
                id: String(entry.id),
                songId: String(entry.songId),
              }))
          : [],
      })),
  };
}

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb();
    const col = db.collection("setlists");

    if (req.method === "GET") {
      const setlists = await col.find().sort({ updatedAt: -1, title: 1 }).toArray();
      return res.status(200).json(
        setlists.map((setlist) => ({
          ...setlist,
          _id: setlist._id.toString(),
        }))
      );
    }

    if (req.method === "POST") {
      const payload = sanitizeSetLists(req.body);
      const hasEntries = payload.sets.some(
        (set: { entries: Array<{ id: string; songId: string }> }) => set.entries.length > 0
      );

      if (!payload.title) {
        return res.status(400).json({ error: "Setlist title is required." });
      }

      if (!hasEntries) {
        return res.status(400).json({ error: "Setlist must contain at least one song." });
      }

      const now = new Date();
      const newSetList = {
        ...payload,
        createdAt: now,
        updatedAt: now,
      };

      const result = await col.insertOne(newSetList);
      return res.status(201).json({
        ...newSetList,
        _id: result.insertedId.toString(),
      });
    }

    if (req.method === "PUT") {
      const id = req.body?._id;
      if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Missing or invalid _id" });
      }

      const payload = sanitizeSetLists(req.body);
      const hasEntries = payload.sets.some(
        (set: { entries: Array<{ id: string; songId: string }> }) => set.entries.length > 0
      );

      if (!payload.title) {
        return res.status(400).json({ error: "Setlist title is required." });
      }

      if (!hasEntries) {
        return res.status(400).json({ error: "Setlist must contain at least one song." });
      }

      const result = await col.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...payload,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      if (!result) {
        return res.status(404).json({ error: "Setlist not found" });
      }

      return res.status(200).json({
        ...result,
        _id: result._id.toString(),
      });
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Missing or invalid id" });
      }

      const result = await col.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) {
        return res.status(404).json({ error: "Setlist not found" });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Setlists API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
