'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const API_BASE=(document.querySelector('meta[name="cloudchat-api"]')?.content||'').replace(/\/$/,'');
const RANKS=['Member','VIP','Super VIP','Classic','Premium','Moderator','Admin','Super Admin','Commissor','Chief Commissor','Coowner','Elite','Owner'];
let me=null,socket=null,rooms=[],users=[],active={kind:'room',id:null,name:'The Lounge'},filter='all',authMode='login',typingTimer=null;
const rankNotes={
 'Member':'Your starting place. Chat, react, join rooms and meet the community.',
 'VIP':'Share media and give your profile a little more personality.',
 'Super VIP':'Unlock animated profile effects and extra ways to stand out.',
 'Classic':'A signature badge and a timeless place in the community.',
 'Premium':'Create private rooms and send gifts to people you appreciate.',
 'Moderator':'Keep conversations welcoming with basic moderation tools.',
 'Admin':'Manage rooms, publish community news and handle reports.',
 'Super Admin':'Oversee staff access and support consistent moderation.',
 'Commissor':'Lead automated filters and community safety workflows.',
 'Chief Commissor':'Coordinate safety staff and review staff applications.',
 'Coowner':'Help oversee the platform and publish system notices.',
 'Elite':'Advanced platform safety controls and audit tools.',
 'Owner':'Full platform authority, configuration and rank policy.'
};
async function api(path,options={}){
 const res=await fetch(API_BASE+path,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok){if(res.status===401&&path!=='/api/me')showAuth();throw new Error(data.error||'The request could not be completed.')}
 return data;
}
function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)}
function showAuth(){if(socket){socket.disconnect();socket=null}$('#modal').classList.add('open')}
function hideAuth(){$('#modal').classList.remove('open')}
function setAuthMode(mode){authMode=mode;$$('.auth-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.auth===mode));$('#auth-form button[type="submit"]').innerHTML=mode==='login'?'Sign in <span>→</span>':'Create account <span>→</span>';$('#auth-username').closest('label').querySelector('span').textContent=mode==='login'?'Username or email':'Choose a username';$('#auth-email-label').hidden=mode==='login';$('#auth-username').autocomplete=mode==='login'?'username':'username';$('#auth-password').autocomplete=mode==='login'?'current-password':'new-password';$('#auth-password').minLength=8}
function renderRanks(){
 const grid=$('#rank-grid');if(!grid)return;
 grid.innerHTML=RANKS.map((rank,i)=>{const card=document.createElement('article');card.className='rank-card '+(i>=5?'staff-rank':'member-rank');const top=document.createElement('div');top.className='rank-card-top';const number=document.createElement('span');number.className='rank-number';number.textContent=String(i+1).padStart(2,'0');const type=document.createElement('span');type.className='rank-type';type.textContent=i>=5?'STAFF':'COMMUNITY';top.append(number,type);const emblem=document.createElement('div');emblem.className='rank-emblem';emblem.textContent=i>=5?'♜':'✧';const h=document.createElement('h3');h.textContent=rank;const p=document.createElement('p');p.textContent=rankNotes[rank];const progress=document.createElement('div');progress.className='rank-progress';const bar=document.createElement('i');bar.style.width=Math.round((i+1)/RANKS.length*100)+'%';progress.append(bar);card.append(top,emblem,h,p,progress);return card}).map(x=>x.outerHTML).join('');
 const featureList=$('#feature-list');if(featureList)featureList.innerHTML=RANKS.map(rank=>{const row=document.createElement('div');row.className='feature-row';const a=document.createElement('span');a.textContent=rank;const b=document.createElement('strong');b.textContent=({Member:'Chat, reactions and public rooms',VIP:'Image and file sharing', 'Super VIP':'Animated profile effects',Classic:'Custom profile badge',Premium:'Private rooms and gifts',Moderator:'Warn, timeout and message removal',Admin:'Room management and community news','Super Admin':'Staff management',Commissor:'Automated filters and report workflows','Chief Commissor':'Staff application review',Coowner:'Platform-wide system notices',Elite:'Advanced safety and audit tools',Owner:'Full platform configuration'})[rank];row.append(a,b);return row.outerHTML}).join('');
}
function initials(name){return String(name||'?').trim().slice(0,1).toUpperCase()}
function formatTime(value){const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function renderConversationList(){
 const q=$('#search').value.toLowerCase();
 const items=[...rooms.map(r=>({...r,kind:'room',preview:r.description||'Public room',tone:'room',avatar:'☁',unread:0})),...users.map(u=>({...u,kind:'person',preview:u.online?'Online now':'Direct message',tone:'lilac',avatar:initials(u.username),unread:0}))];
 const filtered=items.filter(c=>(filter==='all'||(filter==='groups'&&c.kind==='room'))&&(c.name||c.username||'').toLowerCase().includes(q));
 $('#conversation-list').replaceChildren();
 filtered.forEach(c=>{
  const el=document.createElement('div');el.className='conversation '+(active.kind===c.kind&&Number(active.id)===Number(c.id)?'active':'');el.dataset.kind=c.kind;el.dataset.id=c.id;
  const av=document.createElement('div');av.className='avatar '+(c.kind==='room'?'avatar-blue':'avatar-lilac');av.textContent=c.avatar;
  const copy=document.createElement('div');copy.className='conversation-copy';const top=document.createElement('div');top.className='conversation-top';const name=document.createElement('strong');name.textContent=c.name||c.username;const time=document.createElement('time');time.textContent=c.kind==='person'?(c.online?'Online':''):'Room';top.append(name,time);const preview=document.createElement('p');preview.textContent=c.preview;copy.append(top,preview);el.append(av,copy);
  if(c.kind==='person'&&c.online){const dot=document.createElement('i');dot.className='unread-dot';el.append(dot)}
  el.addEventListener('click',()=>openConversation(c.kind,c.id,c.name||c.username));$('#conversation-list').append(el);
 });
}
function addMessage(message,ownOverride=false){
 const isRoom=active.kind==='room';
 const senderId=Number(message.user?.id||message.user_id||message.sender_id);
 const name=message.user?.username||message.username||'Member';
 const own=ownOverride||(me&&senderId===Number(me.id));
 const row=document.createElement('div');row.className='message-row'+(own?' own':'');
 const body=document.createElement('div');body.className='message-body';const meta=document.createElement('div');meta.className='message-meta';
 const strong=document.createElement('strong');strong.textContent=own?'You':name;const time=document.createElement('span');time.textContent=formatTime(message.created_at);meta.append(strong,time);
 const rank=message.user?.rank||message.rank;if(rank&&rank!=='Member'){const tag=document.createElement('span');tag.className='role-tag';tag.textContent=rank.toUpperCase();meta.append(tag)}
 const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=message.body;body.append(meta,bubble);
 const avatar=document.createElement('div');avatar.className='avatar '+(own?'avatar-self':'avatar-lilac');avatar.textContent=initials(name);
 if(own)row.append(body,avatar);else row.append(avatar,body);
 const container=$('#messages');if(!container)return;container.append(row);container.scrollTop=container.scrollHeight;
}
async function loadMessages(){
 const box=$('#messages');box.replaceChildren();const divider=document.createElement('div');divider.className='day-divider';const span=document.createElement('span');span.textContent='RECENT MESSAGES';divider.append(span);box.append(divider);
 if(active.kind==='room'){
  const data=await api('/api/rooms/'+active.id+'/messages');data.messages.forEach(m=>addMessage(m));
 }else{
  const data=await api('/api/dms/'+active.id);data.messages.forEach(m=>addMessage(m));
 }
}
async function openConversation(kind,id,name){
 if(active.kind==='room'&&active.id&&socket)socket.emit('room:leave',active.id);
 active={kind,id:Number(id),name};$('#chat-title').textContent=name;$('#crumb-current').textContent=name;$('#details-title').textContent=name;$('#details-description').textContent=kind==='room'?(rooms.find(r=>Number(r.id)===Number(id))?.description||'Community room'):'Private conversation';$('#message-input').placeholder='Message '+name+'...';$('#chat-subtitle').textContent=kind==='room'?'A little corner of the internet to feel at home.':'A private conversation, just between you two.';
 if(kind==='room'&&socket)socket.emit('room:join',Number(id));
 renderConversationList();await loadMessages();switchView('chat');
}
function switchView(view){$$('.view').forEach(el=>el.classList.remove('active'));const target=$('#'+view+'-view');if(target)target.classList.add('active');$$('.rail-btn[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#view-title').textContent=({chat:'Messages',discover:'Discover',friends:'Friends',feed:'Community',ranks:'Ranks & perks'})[view]||'Cloud Chat';if(view!=='chat')$('#crumb-current').textContent=({discover:'Discover',friends:'Friends',feed:'Community',ranks:'Ranks & perks'})[view]||view}
async function refreshUsers(){const data=await api('/api/users');users=data.users;renderConversationList();renderMembers()}
function renderMembers(){const list=$('.member-list');if(!list)return;list.replaceChildren();const all=[me,...users];all.filter(Boolean).slice(0,30).forEach(u=>{const row=document.createElement('div');row.className='member';const av=document.createElement('div');av.className='avatar avatar-lilac';av.textContent=initials(u.username);if(u.online){const dot=document.createElement('i');av.append(dot)}const copy=document.createElement('span');const name=document.createElement('strong');name.textContent=u.username;const rank=document.createElement('small');rank.textContent=u.rank;copy.append(name,rank);row.append(av,copy);if(u.rank!=='Member'){const badge=document.createElement('b');badge.textContent='✦';row.append(badge)}list.append(row)})}
function connectSocket(){
 if(socket)socket.disconnect();
 const connect=()=>{socket=window.io(API_BASE||undefined,{withCredentials:true,transports:['websocket','polling']});socket.on('connect',()=>{if(active.kind==='room'&&active.id)socket.emit('room:join',active.id);$('#typing-line').textContent='Connected';});socket.on('connect_error',()=>toast('Live connection unavailable. Refresh and try again.'));socket.on('room:message',m=>{if(active.kind==='room'&&Number(m.roomId)===Number(active.id))addMessage(m)});socket.on('dm:message',m=>{if(active.kind==='dm'&&[Number(m.sender_id),Number(m.recipient_id)].includes(Number(active.id)))addMessage(m)});socket.on('presence:update',p=>{const u=users.find(x=>Number(x.id)===Number(p.userId));if(u)u.online=!!p.online;renderConversationList();renderMembers()});socket.on('typing',p=>{if(active.kind==='room')$('#typing-line').textContent=p.username+' is typing…';clearTimeout(typingTimer);typingTimer=setTimeout(()=>$('#typing-line').textContent='Connected',1800)});socket.on('chat:error',e=>toast(e.message||'Message failed.'))};
 if(window.io){connect();return}
 const script=document.createElement('script');script.src=(API_BASE||'')+'/socket.io/socket.io.js';script.onload=connect;script.onerror=()=>toast('Could not load the live chat connection.');document.head.append(script);
}
async function loadApp(){
 const data=await api('/api/me');me=data.user;hideAuth();$('#profile-menu').title=me.username+' · '+me.rank;$$('.profile-copy strong').forEach(x=>x.textContent=me.username);$$('.avatar-self').forEach(x=>x.textContent=initials(me.username));
 const roomData=await api('/api/rooms');rooms=roomData.rooms;await refreshUsers();connectSocket();renderConversationList();
 if(!active.id&&rooms.length)active={kind:'room',id:Number(rooms[0].id),name:rooms[0].name};
 if(active.kind==='room'&&active.id)await openConversation('room',active.id,active.name||rooms[0].name);
}
async function boot(){
 renderRanks();setAuthMode('login');
 try{await loadApp()}catch(e){showAuth()}
}
$('.rail-btn[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$$('.tab').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.tab').forEach(t=>t.classList.toggle('active',t===b));renderConversationList()}));
$('#search').addEventListener('input',renderConversationList);
$('#message-form').addEventListener('submit',async e=>{e.preventDefault();const input=$('#message-input'),body=input.value.trim();if(!body||!active.id)return;input.value='';try{if(active.kind==='room'){await api('/api/rooms/'+active.id+'/messages',{method:'POST',body:JSON.stringify({body})})}else{await api('/api/dms/'+active.id,{method:'POST',body:JSON.stringify({body})})}}catch(err){input.value=body;toast(err.message)}});
$('#message-input').addEventListener('input',()=>{if(socket&&active.kind==='room'&&active.id)socket.emit('typing',{roomId:active.id})});
$('#notifications').addEventListener('click',()=>toast('You’re all caught up.'));
$('#notification-count').textContent='0';
$('#theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('light');toast(document.body.classList.contains('light')?'Light appearance':'Dark appearance')});
$('#members-btn').addEventListener('click',()=>$('#details-panel').classList.toggle('open'));
$('#close-details').addEventListener('click',()=>$('#details-panel').classList.remove('open'));
$('#call-btn').addEventListener('click',()=>toast('Voice rooms are not connected yet.'));
$('#new-chat').addEventListener('click',async()=>{switchView('friends');await refreshUsers()});
$('#add-room').addEventListener('click',()=>toast('Room creation is a later feature; the three starter rooms are live.'));
$('#profile-menu').addEventListener('click',async()=>{if(!me)return;if(confirm('Sign out of Cloud Chat?')){try{await api('/api/auth/logout',{method:'POST'});me=null;showAuth()}catch(e){toast(e.message)}}});
$('#modal-close').addEventListener('click',()=>{if(me)hideAuth()});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&me)hideAuth()});
$$('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.auth)));
$('#auth-form').addEventListener('submit',async e=>{
 e.preventDefault();const username=$('#auth-username').value.trim(),email=$('#auth-email').value.trim(),password=$('#auth-password').value;const button=$('#auth-form button[type="submit"]');button.disabled=true;
 try{const result=authMode==='login'?await api('/api/auth/login',{method:'POST',body:JSON.stringify({login:username,password})}):await api('/api/auth/register',{method:'POST',body:JSON.stringify({username,email,password})});me=result.user;await loadApp();toast(result.firstAccount?'Your Owner account is ready.':'Welcome to Cloud Chat!')}
 catch(err){toast(err.message)}finally{button.disabled=false}
});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
$('#message-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#message-form').requestSubmit()}});
boot();
