import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  cmsMongoClientPromise?: Promise<MongoClient>;
};

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const dbName = process.env.MONGODB_DB ?? "hindjal";

  if (!globalForMongo.cmsMongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.cmsMongoClientPromise = client.connect();
  }

  const client = await globalForMongo.cmsMongoClientPromise;
  return client.db(dbName);
}
