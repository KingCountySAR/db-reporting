import { MongoClient } from 'mongodb';
import { config as loadEnv } from 'dotenv';
import { D4HWebClient } from './d4h/lib/src/d4hWebClient';
import { loadMissions } from './loadMissions';

['.env', '.env.local'].forEach(p => loadEnv({ path: p }));
const mongo = new MongoClient(process.env.MONGODB_URI!);
const d4hWebClient = new D4HWebClient();

Promise.all([
  loadMissions(mongo, d4hWebClient)
])
  .then(() => {
    mongo.close();
    console.log('all done');
  })