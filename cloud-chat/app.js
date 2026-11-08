'use strict';
const conversations=[
 {id:'lounge',name:'The Lounge',preview:'Jules: Anyone up for a game night?',time:'10:48',kind:'room',avatar:'☁',tone:'room',unread:2,subtitle:'A little corner of the internet to feel at home.'},
 {id:'mira',name:'Mira',preview:'That sounds lovely! ✨',time:'10:32',kind:'person',avatar:'M',tone:'lilac',unread:1},
 {id:'creative',name:'Creative minds',preview:'Aria shared a new post',time:'Yesterday',kind:'room',avatar:'✿',tone:'peach',unread:0},
 {id:'kai',name:'Kai',preview:'You: See you later!',time:'Yesterday',kind:'person',avatar:'K',tone:'green',unread:0},
 {id:'gamers',name:'Game lounge',preview:'Jules: Queue is open 🎮',time:'Mon',kind:'room',avatar:'✦',tone:'blue',unread:0},
 {id:'aria',name:'Aria',preview:'Voice message',time:'Sun',kind:'person',avatar:'A',tone:'peach',unread:0}
];
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
let active='lounge',filter='all',authMode='login';
const rankData=[
 ['Member','Your starting place. Chat, react, join rooms and meet the community.','Community'],
 ['VIP','Share media and give your profile a little more personality.','Community'],
 ['Super VIP','Unlock animated profile effects and extra ways to stand out.','Community'],
 ['Classic','A signature badge and a timeless place in the community.','Community'],
 ['Premium','Create private rooms and send gifts to people you appreciate.','Community'],
 ['Moderator','Keep conversations welcoming with basic moderation tools.','Staff'],
 ['Admin','Manage rooms, publish community news and handle reports.','Staff'],
 ['Super Admin','Oversee staff access and support consistent moderation.','Staff'],
 ['Commissor','Lead automated filters and community safety workflows.','Staff'],
 ['Chief Commissor','Coordinate safety staff and review staff applications.','Staff'],
 ['Coowner','Help oversee the platform and publish system notices.','Staff'],
 ['Elite','Advanced platform safety controls and audit tools.','Staff'],
 ['Owner','Full platform authority, configuration and rank policy.','Staff']
];
function renderRanks(){const grid=$('#rank-grid');if(!grid)return;grid.innerHTML=rankData.map((r,i)=>'<article class="rank-card '+(i>=5?'staff-rank':'member-rank')+'"><div class="rank-card-top"><span class="rank-number">'+String(i+1).padStart(2,'0')+'</span><span class="rank-type">'+r[2]+'</span></div><div class="rank-emblem">'+(i<5?'✧':'♜')+'</div><h3>'+r[0]+'</h3><p>'+r[1]+'</p><div class="rank-progress"><i style="width:'+Math.round((i+1)/13*100)+'%"></i></div></article>').join('');const features=[['Member','Chat, reactions and public rooms'],['VIP','Image and file sharing'],['Super VIP','Animated profile effects'],['Classic','Custom profile badge'],['Premium','Private rooms and gifts'],['Moderator','Warn, timeout and message removal'],['Admin','Room management and community news'],['Super Admin','Staff management'],['Commissor','Automated filters and report workflows'],['Chief Commissor','Staff application review'],['Coowner','Platform-wide system notices'],['Elite','Advanced safety and audit tools'],['Owner','Full platform configuration']];$('#feature-list').innerHTML=features.map(f=>'<div class="feature-row"><span>'+f[0]+'</span><strong>'+f[1]+'</strong></div>').join('')}

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}
function renderConversations(){const q=$('#search').value.toLowerCase();$('#conversation-list').innerHTML=conversations.filter(c=>(filter==='all'||(filter==='unread'&&c.unread)||(filter==='groups'&&c.kind==='room'))&&(c.name+' '+c.preview).toLowerCase().includes(q)).map(c=>'<div class="conversation '+(c.id===active?'active':'')+'" data-id="'+c.id+'"><div class="avatar '+(c.tone==='room'?'avatar-blue':'avatar-'+c.tone)+'">'+c.avatar+'</div><div class="conversation-copy"><div class="conversation-top"><strong>'+c.name+'</strong><time>'+c.time+'</time></div><p>'+c.preview+'</p></div>'+(c.unread?'<i class="unread-dot"></i>':'')+'</div>').join('');$$('.conversation').forEach(el=>el.addEventListener('click',()=>openConversation(el.dataset.id)))}
function openConversation(id){active=id;const c=conversations.find(x=>x.id===id);if(!c)return;c.unread=0;$('#chat-title').textContent=c.name;$('#crumb-current').textContent=c.name;$('#details-title').textContent=c.name;$('#details-description').textContent=c.subtitle||'A private conversation, just between you two.';$('#message-input').placeholder='Message '+c.name+'...';renderConversations();toast('Opened '+c.name)}
function switchView(view){$$('.view').forEach(el=>el.classList.remove('active'));const target=$('#'+view+'-view');if(target)target.classList.add('active');$$('.rail-btn[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#view-title').textContent=({chat:'Messages',discover:'Discover',friends:'Friends',feed:'Community'})[view]||'Cloud Chat';if(view!=='chat')$('#crumb-current').textContent=({discover:'Discover',friends:'Friends',feed:'Community'})[view]}
$('.rail-btn[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$$('.tab').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.tab').forEach(t=>t.classList.toggle('active',t===b));renderConversations()}));
$('#search').addEventListener('input',renderConversations);
$('#message-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#message-input');const value=input.value.trim();if(!value)return;const row=document.createElement('div');row.className='message-row own';const body=document.createElement('div');body.className='message-body';const meta=document.createElement('div');meta.className='message-meta';const name=document.createElement('strong');name.textContent='You';const time=document.createElement('span');time.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});meta.append(name,time);const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=value;body.append(meta,bubble);const avatar=document.createElement('div');avatar.className='avatar avatar-self';avatar.textContent='Y';row.append(body,avatar);$('#messages').append(row);$('#messages').scrollTop=$('#messages').scrollHeight;input.value='';const c=conversations.find(x=>x.id===active);if(c){c.preview='You: '+value;c.time='Now';renderConversations()}});
$('#notifications').addEventListener('click',()=>toast('You’re all caught up on this preview!'));
$('#notification-count').textContent='3';
$('#theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('light');toast(document.body.classList.contains('light')?'Light appearance':'Dark appearance')});
$('#members-btn').addEventListener('click',()=>$('#details-panel').classList.toggle('open'));
$('#close-details').addEventListener('click',()=>$('#details-panel').classList.remove('open'));
$('#call-btn').addEventListener('click',()=>toast('Voice rooms are coming soon.'));
$('#new-chat').addEventListener('click',()=>{$('#modal').classList.add('open')});
$('#add-room').addEventListener('click',()=>toast('Room creation will be connected to your account system.'));
$('#profile-menu').addEventListener('click',()=>toast('Profile settings are part of the next integration step.'));
$('#modal-close').addEventListener('click',()=>$('#modal').classList.remove('open'));
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')$('#modal').classList.remove('open')});
$$('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>{authMode=b.dataset.auth;$$('.auth-tabs button').forEach(t=>t.classList.toggle('active',t===b));$('#auth-form button').innerHTML=authMode==='login'?'Sign in <span>→</span>':'Create account <span>→</span>'}));
$('#auth-form').addEventListener('submit',e=>{e.preventDefault();toast('Preview only — secure sign-in will be connected next.');});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
$('#message-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#message-form').requestSubmit()}});
renderConversations();
renderRanks();
