import test from 'node:test';import assert from 'node:assert/strict';import {withImageDeadline,IMAGE_TIMEOUT_MS} from '../worker/image-deadline.mjs';
test('binding deadline rejects stalled generation and ignores late completion',async()=>{
 assert.equal(IMAGE_TIMEOUT_MS,60000);let finish;const pending=withImageDeadline(()=>new Promise(resolve=>finish=resolve),10);await assert.rejects(pending,e=>e.status===503);finish('late image');await assert.rejects(pending);assert.equal(await withImageDeadline(()=>Promise.resolve('image'),100),'image');
});
