// api/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { requireEnv } from './_envGuard.js';

let client: MongoClient | null = null;

async function getDb() {
  const uri = requireEnv('MONGODB_URI');
  const dbName = requireEnv('MONGODB_DB');
  if (!client) {
    console.log('Connecting to Mongo (auth) with URI prefix:', uri.slice(0, 20));
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const JWT_SECRET = requireEnv('JWT_SECRET');

    const { user_id, password } = (req.body || {}) as { user_id?: string; password?: string };
    if (!user_id || !password) return res.status(400).json({ error: 'Missing credentials' });

    const db = await getDb();
    const col = db.collection('users');

    const user = await col.findOne<{ _id: any; user_id: string; passwordHash?: string }>({ user_id });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id.toString(), username: user.user_id }, JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ token });
  } catch (err: any) {
    console.error('Login error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
