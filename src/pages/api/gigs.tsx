// pages/api/gigs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local or Vercel env vars");
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

type Gig = {
  _id?: ObjectId;
  venue: string;
  date: Date;
  startTime?: string;
  description?: string;
  fee?: number;
  privateEvent?: boolean;
  postersNeeded?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db("soundwalkd");
  const gigs = db.collection<Gig>("gigs");

  if (req.method === "GET") {
    try {
      const now = new Date();
      const query = { date: { $gte: now } };
      const allGigs = await gigs.find(query).sort({ date: 1 }).toArray();
      res.status(200).json(allGigs);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch gigs" });
    }
  } else if (req.method === "POST") {
    try {
      const newGig: Gig = req.body;
      if (!newGig.date) {
        res.status(400).json({ error: "Date is required" });
        return;
      }
      newGig.date = new Date(newGig.date);
      const result = await gigs.insertOne(newGig);
      res.status(201).json(result.ops[0]);
    } catch (e) {
      res.status(500).json({ error: "Failed to create gig" });
    }
  } else if (req.method === "PUT") {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        res.status(400).json({ error: "ID is required for update" });
        return;
      }
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }
      const result = await gigs.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
      res.status(200).json(result.value);
    } catch (e) {
      res.status(500).json({ error: "Failed to update gig" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
