'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../src/core/rank-policy');

test('staff hierarchy preserves the required order', () => {
  assert.ok(policy.rankLevel('Moderator') < policy.rankLevel('Admin'));
  assert.ok(policy.rankLevel('Superadmin') < policy.rankLevel('Commissor'));
  assert.ok(policy.rankLevel('Commissor') < policy.rankLevel('Instructor'));
  assert.ok(policy.rankLevel('Instructor') < policy.rankLevel('Coowner'));
  assert.ok(policy.rankLevel('Coowner') < policy.rankLevel('Owner'));
  assert.ok(policy.rankLevel('Owner') < policy.rankLevel('Developer'));
});

test('minimum-rank checks are case-insensitive and unknown ranks are Member', () => {
  assert.equal(policy.hasMinimumRank('aDmIn', 'Moderator'), true);
  assert.equal(policy.hasMinimumRank('unknown-role', 'VIP'), false);
});

test('staff cannot act on equal or higher ranks', () => {
  assert.equal(policy.mayActOn('Admin', 'Admin'), false);
  assert.equal(policy.mayActOn('Admin', 'Superadmin'), false);
  assert.equal(policy.mayActOn('Instructor', 'Commissor'), true);
  assert.equal(policy.mayActOn('Developer', 'Owner'), true);
  assert.equal(policy.mayActOn('Developer', 'Developer'), false);
});

test('normalization never grants an unknown role elevated access', () => {
  assert.equal(policy.normalizeRank('made-up-rank'), 'Member');
  assert.equal(policy.normalizeRank(null), 'Member');
});
