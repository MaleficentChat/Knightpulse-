'use strict';

// Canonical staff ordering. Higher index means greater authority.
// Keep role policy in one place; never compare rank strings lexicographically.
const RANKS = Object.freeze([
  'Member',
  'VIP',
  'Premium',
  'Royal',
  'Moderator',
  'Admin',
  'Superadmin',
  'Commissor',
  'Instructor',
  'Coowner',
  'Owner',
  'Developer'
]);

const RANK_LEVEL = new Map(RANKS.map((rank, index) => [rank.toLowerCase(), index]));

function normalizeRank(rank) {
  if (typeof rank !== 'string') return 'Member';
  const normalized = rank.trim().toLowerCase();
  for (const known of RANKS) {
    if (known.toLowerCase() === normalized) return known;
  }
  return 'Member';
}

function rankLevel(rank) {
  return RANK_LEVEL.get(normalizeRank(rank).toLowerCase());
}

function hasMinimumRank(actorRank, minimumRank) {
  return rankLevel(actorRank) >= rankLevel(minimumRank);
}

// A staff member may not moderate, inspect, or alter an equal-or-higher rank.
// Developer is the highest protected rank.
function mayActOn(actorRank, targetRank) {
  return rankLevel(actorRank) > rankLevel(targetRank);
}

module.exports = Object.freeze({
  RANKS,
  normalizeRank,
  rankLevel,
  hasMinimumRank,
  mayActOn
});
