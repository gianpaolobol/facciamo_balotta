export const SHARED_IMAGE_FROM='FROM profile_images i JOIN pairings p ON(p.first_user=i.user_id OR p.second_user=i.user_id) JOIN matching_preferences mp ON mp.user_id=i.user_id';
export const SHARED_IMAGE_WHERE=`p.id=? AND (p.first_user=? OR p.second_user=?) AND i.user_id<>? AND i.slot=? AND i.approved=1 AND p.first_decision<>'no' AND p.second_decision<>'no'
 AND mp.enabled=1 AND mp.accepted=1 AND mp.policy_version='2026-11-07'
 AND EXISTS(SELECT 1 FROM profiles WHERE user_id=p.first_user AND json_type(data,'$.adult')='true') AND EXISTS(SELECT 1 FROM profiles WHERE user_id=p.second_user AND json_type(data,'$.adult')='true')
 AND NOT EXISTS(SELECT 1 FROM user_safety WHERE user_id IN(p.first_user,p.second_user) AND suspended=1)
 AND NOT EXISTS(SELECT 1 FROM user_blocks WHERE (blocker_id=p.first_user AND blocked_id=p.second_user) OR (blocker_id=p.second_user AND blocked_id=p.first_user))`;
