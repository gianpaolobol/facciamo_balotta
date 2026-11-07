import {readFile,readdir} from 'node:fs/promises';
import {unstable_splitSqlQuery} from 'wrangler';
export async function applyLocalMigrations(db){
 const directory=new URL('../../migrations/',import.meta.url),names=(await readdir(directory)).filter(n=>/^\d+.*\.sql$/.test(n)).sort();
 for(const name of names){const sql=await readFile(new URL(name,directory),'utf8');await db.batch(unstable_splitSqlQuery(sql).map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));}
}
