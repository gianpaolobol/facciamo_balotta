// Deliberately no foreign key to users: deleting an account must not erase usage.
export const INVITATIONS_SCHEMA=`
CREATE TABLE IF NOT EXISTS invitation_batches(
 account_hash TEXT NOT NULL,
 batch_id TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 contacts TEXT NOT NULL,
 statuses TEXT NOT NULL,
 recipient_count INTEGER NOT NULL CHECK(recipient_count BETWEEN 1 AND 20),
 day TEXT NOT NULL,
 created INTEGER NOT NULL,
 PRIMARY KEY(account_hash,batch_id)
);
CREATE INDEX IF NOT EXISTS invitation_batches_day ON invitation_batches(day,account_hash);
CREATE INDEX IF NOT EXISTS invitation_batches_created ON invitation_batches(created);
`;
export function createInvitationsStore({first,all}){
 const find=(account,batch)=>first('SELECT * FROM invitation_batches WHERE account_hash=? AND batch_id=?',account,batch);
 return {
  actor:(sessionHash,userId)=>first(`SELECT u.id,u.provider,u.subject FROM sessions s JOIN users u ON u.id=s.user_id JOIN profiles p ON p.user_id=u.id WHERE s.hash=? AND u.id=? AND s.expires>? AND json_type(p.data,'$.adult')='true' AND NOT EXISTS(SELECT 1 FROM user_safety WHERE user_id=u.id AND suspended=1)`,sessionHash,userId,Date.now()),
  async reserve({accountHash,batchId,fingerprint,contacts,now=Date.now()}){
   await all('DELETE FROM invitation_batches WHERE created<? RETURNING batch_id',now-7*86400000);
   const existing=await find(accountHash,batchId);
   if(existing)return {owner:false,row:existing};
   const day=new Date(now).toISOString().slice(0,10),count=contacts.length;
   // Both limits and the whole batch are reserved in one atomic SQLite/D1 statement.
   const row=await first(`INSERT INTO invitation_batches(account_hash,batch_id,fingerprint,contacts,statuses,recipient_count,day,created)
    SELECT ?,?,?,?,?,?,?,?
    WHERE (SELECT COALESCE(SUM(recipient_count),0) FROM invitation_batches WHERE day=? AND account_hash=?)+?<=20
    AND (SELECT COALESCE(SUM(recipient_count),0) FROM invitation_batches WHERE day=?)+?<=50
    ON CONFLICT(account_hash,batch_id) DO NOTHING RETURNING *`,accountHash,batchId,fingerprint,JSON.stringify(contacts),JSON.stringify(contacts.map(()=> 'unknown')),count,day,now,day,accountHash,count,day,count);
   if(row)return {owner:true,row};
   const concurrent=await find(accountHash,batchId);
   return concurrent?{owner:false,row:concurrent}:{error:'quota'};
  },
  finish:(account,batch,index,status)=>first('UPDATE invitation_batches SET statuses=json_set(statuses,?,?) WHERE account_hash=? AND batch_id=? RETURNING batch_id',`$[${index}]`,status,account,batch),
  statuses:find
 };
}
