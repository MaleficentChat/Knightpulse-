'use strict';
const {RANKS,hasMinimumRank}=require('./rank-policy');
const FEATURES=Object.freeze([
 {id:'chat',label:'Send messages and react',minimumRank:'Member',group:'Community'},
 {id:'media',label:'Share images and files',minimumRank:'VIP',group:'Community'},
 {id:'animated-profile',label:'Animated profile effects',minimumRank:'Super VIP',group:'Identity'},
 {id:'custom-badge',label:'Custom profile badge',minimumRank:'Classic',group:'Identity'},
 {id:'private-rooms',label:'Create private rooms and send gifts',minimumRank:'Premium',group:'Community'},
 {id:'moderation',label:'Warn, timeout and remove messages',minimumRank:'Moderator',group:'Moderation'},
 {id:'room-management',label:'Manage rooms and publish community news',minimumRank:'Admin',group:'Management'},
 {id:'staff-management',label:'Manage moderator team and staff access',minimumRank:'Super Admin',group:'Management'},
 {id:'automated-filters',label:'Configure automated filters and review reports',minimumRank:'Commissor',group:'Safety'},
 {id:'staff-review',label:'Review staff applications and assign duties',minimumRank:'Chief Commissor',group:'Safety'},
 {id:'system-notices',label:'Send platform-wide system notices',minimumRank:'Coowner',group:'Platform'},
 {id:'advanced-controls',label:'Advanced safety controls and audit tools',minimumRank:'Elite',group:'Platform'},
 {id:'owner-controls',label:'Full platform configuration and rank policy',minimumRank:'Owner',group:'Platform'}
]);
function canUseFeature(rank,featureId){const feature=FEATURES.find(item=>item.id===featureId);return Boolean(feature&&hasMinimumRank(rank,feature.minimumRank));}
function featuresForRank(rank){return FEATURES.filter(feature=>canUseFeature(rank,feature.id));}
module.exports=Object.freeze({FEATURES,canUseFeature,featuresForRank,RANKS});
