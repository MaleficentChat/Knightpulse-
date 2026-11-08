'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const policy=require('../src/core/rank-policy');
const expected=['Member','VIP','Super VIP','Classic','Premium','Moderator','Admin','Super Admin','Commissor','Chief Commissor','Coowner','Elite','Owner'];
test('Cloud Chat rank hierarchy exactly matches the requested order',()=>{assert.deepEqual(policy.RANKS,expected);for(let i=1;i<expected.length;i++)assert.ok(policy.rankLevel(expected[i-1])<policy.rankLevel(expected[i]));});
test('rank matching is case-insensitive and unknown ranks fall back to Member',()=>{assert.equal(policy.normalizeRank('sUpEr aDmIn'),'Super Admin');assert.equal(policy.hasMinimumRank('unknown','VIP'),false);assert.equal(policy.normalizeRank(null),'Member');});
test('staff cannot act on equal or higher ranks',()=>{assert.equal(policy.mayActOn('Admin','Admin'),false);assert.equal(policy.mayActOn('Admin','Super Admin'),false);assert.equal(policy.mayActOn('Chief Commissor','Commissor'),true);assert.equal(policy.mayActOn('Owner','Elite'),true);assert.equal(policy.mayActOn('Owner','Owner'),false);});
