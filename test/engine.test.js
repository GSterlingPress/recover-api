import test from 'node:test';import assert from 'node:assert/strict';import {decide} from '../src/engine.js';
test('unsafe timeout on POST verifies first',()=>assert.equal(decide({method:'POST',error:'upstream timeout',sideEffect:true,idempotencyKey:false}).decision,'VERIFY_FIRST'));
test('429 waits',()=>assert.equal(decide({method:'GET',status:429,headers:{'retry-after':'2'}}).decision,'WAIT'));
test('GET 503 retries',()=>assert.equal(decide({method:'GET',status:503,attempt:0}).decision,'RETRY_NOW'));
test('validation repairs',()=>assert.equal(decide({method:'POST',status:422,error:'missing field'}).decision,'REPAIR_REQUEST'));
test('exhausted escalates',()=>assert.equal(decide({method:'GET',status:503,attempt:3,maxAttempts:3}).decision,'ESCALATE'));
