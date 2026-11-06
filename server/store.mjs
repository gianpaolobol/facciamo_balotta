import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export function createStore(path) {
 const db=new DatabaseSync(path);
 db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, provider TEXT NOT NULL, subject TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, UNIQUE(provider,subject));
 CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts(hash TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS handoffs(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, challenge TEXT NOT NULL, expires INTEGER NOT NULL);`);
 function prune() { const now=Date.now(); for(const table of ['attempts','sessions','handoffs']) db.prepare(`DELETE FROM ${table} WHERE expires < ?`).run(now); }
 return {
  close:()=>db.close(),
  upsertIdentity(provider,subject,email,name) {
   const existing=db.prepare('SELECT * FROM users WHERE provider=? AND subject=?').get(provider,subject);
   if(existing) return existing;
   const id=randomUUID(); db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,provider,subject,email,name);
   return {id,provider,subject,email,name};
  },
  putAttempt(hash,data) { prune(); db.prepare('INSERT INTO attempts VALUES(?,?,?)').run(hash,JSON.stringify(data),Date.now()+600_000); },
  takeAttempt(hash) { const row=db.prepare('DELETE FROM attempts WHERE hash=? RETURNING *').get(hash); return row&&row.expires>Date.now()?JSON.parse(row.data):null; },
  putSession(hash,userId) { prune(); db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,userId,Date.now()+604_800_000); },
  getSession(hash) { return db.prepare('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').get(hash,Date.now()); },
  dropSession(hash) { db.prepare('DELETE FROM sessions WHERE hash=?').run(hash); },
  putHandoff(hash,userId,challenge) { prune(); db.prepare('INSERT INTO handoffs VALUES(?,?,?,?)').run(hash,userId,challenge,Date.now()+60_000); },
  takeHandoff(hash) { const row=db.prepare('DELETE FROM handoffs WHERE hash=? RETURNING *').get(hash); return row&&row.expires>Date.now()?row:null; },
  getProfile(id) { const row=db.prepare('SELECT data FROM profiles WHERE user_id=?').get(id); return row?JSON.parse(row.data):null; },
  saveProfile(id,profile) { db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run(id,JSON.stringify(profile)); },
  deleteAccount(id) { db.prepare('DELETE FROM users WHERE id=?').run(id); },
 };
}
