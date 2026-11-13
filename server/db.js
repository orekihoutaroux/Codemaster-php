const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'codemaster_php';

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log(`[db] Connected to MongoDB -> db "${dbName}"`);

  // Helpful indexes (safe to call every boot; no-ops if they already exist)
  await db.collection('players').createIndex({ username: 1 }, { unique: true });
  await db.collection('questions').createIndex({ id: 1 }, { unique: true });
  await db.collection('question_edits').createIndex({ id: 1 }, { unique: true });
  await db.collection('leaderboard').createIndex({ score: -1 });
  await db.collection('player_progress_history').createIndex({ username: 1, archivedAt: -1 });

  return db;
}

function getDB() {
  if (!db) throw new Error('DB not connected yet - call connectDB() first');
  return db;
}

module.exports = { connectDB, getDB };
