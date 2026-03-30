import { MongoClient, ObjectId } from "mongodb";
import { requireEnv } from "./_envGuard.js";

let client: MongoClient | null = null;

async function getDb() {
  const uri = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DB");

  if (!client) {
    console.log("Connecting to Mongo (songs) with URI prefix:", uri.slice(0, 20));
    client = new MongoClient(uri);
    await client.connect();
  }

  return client.db(dbName);
}

function sanitizeSong(body: any) {
  return {
    title: String(body?.title ?? "").trim(),
    artist: String(body?.artist ?? "").trim(),
    duration: String(body?.duration ?? "").trim(),
    lyrics: String(body?.lyrics ?? "").trim(),
    backingTrack: !!body?.backingTrack,
  };
}

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb();
    const col = db.collection("songs");

    if (req.method === "GET") {
      const songs = await col.find().sort({ title: 1, artist: 1 }).toArray();
      return res.status(200).json(
        songs.map((song) => ({
          ...song,
          _id: song._id.toString(),
        }))
      );
    }

    if (req.method === "POST") {
      const song = sanitizeSong(req.body);

      if (!song.title || !song.duration) {
        return res.status(400).json({ error: "Title and duration are required." });
      }

      const now = new Date();
      const newSong = {
        ...song,
        createdAt: now,
        updatedAt: now,
      };

      const result = await col.insertOne(newSong);
      return res.status(201).json({
        ...newSong,
        _id: result.insertedId.toString(),
      });
    }

    if (req.method === "PUT") {
      const id = req.body?._id;
      if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Missing or invalid _id" });
      }

      const song = sanitizeSong(req.body);
      if (!song.title || !song.duration) {
        return res.status(400).json({ error: "Title and duration are required." });
      }

      const updatedSong = {
        ...song,
        updatedAt: new Date(),
      };

      const result = await col.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updatedSong },
        { returnDocument: "after" }
      );

      if (!result) {
        return res.status(404).json({ error: "Song not found" });
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
        return res.status(404).json({ error: "Song not found" });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Songs API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
