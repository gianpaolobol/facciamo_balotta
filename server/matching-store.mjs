export const MATCHING_SCHEMA=`CREATE TABLE IF NOT EXISTS matching_preferences(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, enabled INTEGER NOT NULL, intent TEXT NOT NULL, scope TEXT NOT NULL, availability TEXT NOT NULL, accepted INTEGER NOT NULL, policy_version TEXT NOT NULL, updated INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS pairing_withdrawal AFTER UPDATE OF first_decision,second_decision ON pairings WHEN NEW.first_decision='no' OR NEW.second_decision='no' BEGIN UPDATE appointments SET cancelled=1,version=version+1,confirmed_first=0,confirmed_second=0 WHERE pair_id=NEW.id AND cancelled=0; END;
CREATE TRIGGER IF NOT EXISTS block_ends_pairing AFTER INSERT ON user_blocks BEGIN UPDATE pairings SET first_decision=CASE WHEN first_user=NEW.blocker_id THEN 'no' ELSE first_decision END,second_decision=CASE WHEN second_user=NEW.blocker_id THEN 'no' ELSE second_decision END WHERE (first_user=NEW.blocker_id AND second_user=NEW.blocked_id) OR (first_user=NEW.blocked_id AND second_user=NEW.blocker_id); END;
CREATE TRIGGER IF NOT EXISTS suspension_ends_pairing_insert AFTER INSERT ON user_safety WHEN NEW.suspended=1 BEGIN UPDATE pairings SET first_decision='no',second_decision='no' WHERE first_user=NEW.user_id OR second_user=NEW.user_id; END;
CREATE TRIGGER IF NOT EXISTS suspension_ends_pairing_update AFTER UPDATE OF suspended ON user_safety WHEN NEW.suspended=1 BEGIN UPDATE pairings SET first_decision='no',second_decision='no' WHERE first_user=NEW.user_id OR second_user=NEW.user_id; END;
CREATE TRIGGER IF NOT EXISTS consent_withdraws_pending AFTER UPDATE ON matching_preferences WHEN NEW.enabled=0 OR NEW.accepted=0 OR NEW.policy_version<>'2026-11-07' BEGIN UPDATE pairings SET first_decision='no',second_decision='no' WHERE (first_user=NEW.user_id OR second_user=NEW.user_id) AND NOT(first_decision='yes' AND second_decision='yes'); END;
`;
export const POLICY_VERSION='2026-11-07';
const provinces="('Bologna','Modena','Reggio Emilia','Parma','Piacenza','Ferrara','Ravenna','Forlì-Cesena','Rimini')";
const activeFor=alias=>`NOT EXISTS(SELECT 1 FROM pairings p LEFT JOIN appointments a ON a.pair_id=p.id WHERE (p.first_user=${alias} OR p.second_user=${alias}) AND p.first_decision<>'no' AND p.second_decision<>'no' AND (a.id IS NULL OR (a.cancelled=0 AND a.starts_at>?)))`;
const eligible=`ma.enabled=1 AND mb.enabled=1 AND ma.accepted=1 AND mb.accepted=1 AND ma.policy_version='2026-11-07' AND mb.policy_version='2026-11-07'
 AND json_type(pa.data,'$.adult')='true' AND json_type(pb.data,'$.adult')='true' AND json_extract(pa.data,'$.city') IN ${provinces} AND json_extract(pb.data,'$.city') IN ${provinces}
 AND (json_extract(pa.data,'$.city')=json_extract(pb.data,'$.city') OR (ma.scope='region' AND mb.scope='region'))
 AND (ma.intent='both' OR mb.intent='both' OR ma.intent=mb.intent)
 AND EXISTS(SELECT 1 FROM json_each(pa.data,'$.interests') ia JOIN json_each(pb.data,'$.interests') ib ON ia.value=ib.value)
 AND EXISTS(SELECT 1 FROM json_each(ma.availability) aa JOIN json_each(mb.availability) ab ON aa.value=ab.value)
 AND NOT EXISTS(SELECT 1 FROM user_blocks WHERE (blocker_id=ma.user_id AND blocked_id=mb.user_id) OR (blocker_id=mb.user_id AND blocked_id=ma.user_id))
 AND NOT EXISTS(SELECT 1 FROM user_safety WHERE user_id IN(ma.user_id,mb.user_id) AND suspended=1)
 AND NOT EXISTS(SELECT 1 FROM pairings WHERE (first_user=ma.user_id AND second_user=mb.user_id) OR (first_user=mb.user_id AND second_user=ma.user_id))
 AND ${activeFor('ma.user_id')} AND ${activeFor('mb.user_id')}`;
const from="matching_preferences ma JOIN profiles pa ON pa.user_id=ma.user_id JOIN matching_preferences mb ON mb.user_id<>ma.user_id JOIN profiles pb ON pb.user_id=mb.user_id";
const present=row=>row?{enabled:Boolean(row.enabled),intent:row.intent,scope:row.scope,availability:JSON.parse(row.availability),accepted:Boolean(row.accepted),policyVersion:row.policy_version}:null;
export function createMatchingStore({first,all}){
 const current=userId=>first("SELECT p.id FROM pairings p LEFT JOIN appointments a ON a.pair_id=p.id WHERE (p.first_user=? OR p.second_user=?) AND p.first_decision<>'no' AND p.second_decision<>'no' AND (a.id IS NULL OR (a.cancelled=0 AND a.starts_at>?)) ORDER BY p.created DESC,p.id LIMIT 1",userId,userId,Date.now());
 return {
  async get(userId){return present(await first('SELECT * FROM matching_preferences WHERE user_id=?',userId));},
  async save(userId,p){await first('INSERT INTO matching_preferences VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,intent=excluded.intent,scope=excluded.scope,availability=excluded.availability,accepted=excluded.accepted,policy_version=excluded.policy_version,updated=excluded.updated RETURNING user_id',userId,p.enabled?1:0,p.intent,p.scope,JSON.stringify(p.availability),p.accepted?1:0,p.policyVersion,Date.now());return p;},
  async ensureSuggestion(userId){
   const existing=await current(userId);if(existing)return existing;
   const now=Date.now(),rows=await all(`SELECT mb.user_id,pa.data AS self_profile,pb.data AS peer_profile FROM ${from} WHERE ma.user_id=? AND ${eligible} ORDER BY mb.user_id LIMIT 100`,userId,now,now);
   const ranked=rows.map(row=>{const a=JSON.parse(row.self_profile),b=JSON.parse(row.peer_profile),shared=[...new Set(a.interests)].filter(x=>b.interests.includes(x));return {...row,score:shared.length*10+(a.city===b.city?1:0)};}).sort((a,b)=>b.score-a.score||a.user_id.localeCompare(b.user_id));
   for(const peer of ranked){const [a,b]=[userId,peer.user_id].sort();const made=await first(`INSERT INTO pairings(id,first_user,second_user,created) SELECT ?,?,?,? FROM ${from} WHERE ma.user_id=? AND mb.user_id=? AND ${eligible} ON CONFLICT(first_user,second_user) DO NOTHING RETURNING id`,crypto.randomUUID(),a,b,now,userId,peer.user_id,Date.now(),Date.now());if(made)return made;}
   return current(userId);
  }
 };
}
