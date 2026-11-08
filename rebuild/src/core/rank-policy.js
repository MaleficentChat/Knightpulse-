'use strict';

// Canonical Cloud Chat hierarchy. Higher index means greater authority.
// Rank labels are intentionally kept exactly as the product displays them.
const RANKS = Object.freeze([
  "Member",
  "VIP",
  "Super VIP",
  "Classic",
  "Premium",
  "Moderator",
  "Admin",
  "Super Admin",
  "Commissor",
  "Chief Commissor",
  "Coowner",
  "Elite",
  "Owner"
]);
const RANK_LEVEL = new Map(RANKS.map((rank,index)=>[rank.toLowerCase(),index]));
function normalizeRank(rank){if(typeof rank!=='string')return 'Member';return RANKS.find(item=>item.toLowerCase()===rank.trim().toLowerCase())||'Member';}
function rankLevel(rank){return RANK_LEVEL.get(normalizeRank(rank).toLowerCase());}
function hasMinimumRank(actorRank,minimumRank){return rankLevel(actorRank)>=rankLevel(minimumRank);}
// Lower/equal ranks cannot moderate, inspect, or alter an equal-or-higher rank.
function mayActOn(actorRank,targetRank){return rankLevel(actorRank)>rankLevel(targetRank);}
module.exports=Object.freeze({RANKS,normalizeRank,rankLevel,hasMinimumRank,mayActOn});
