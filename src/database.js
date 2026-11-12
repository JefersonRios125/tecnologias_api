import { MongoClient } from 'mongodb';

export async function openDatabase(uri, name) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    return { client, db: client.db(name) };
  } catch (error) {
    await client.close();
    throw error;
  }
}
