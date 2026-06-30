/* ============================================================
   Techinrent Office — single-file front-end CRM (localStorage)
   Roles: manager (super admin) + sdr (limited)
   ============================================================ */

/* ---------- constants ---------- */
const STAGES = ['New Lead','Contacted','Qualified','Demo Scheduled','Demo Completed','Proposal Sent','Negotiation','Won','Lost','Follow-up'];
const STAGE_CLASS = {'New Lead':'st-new','Contacted':'st-contacted','Qualified':'st-qualified','Demo Scheduled':'st-demo-scheduled','Demo Completed':'st-demo-completed','Proposal Sent':'st-proposal-sent','Negotiation':'st-negotiation','Won':'st-won','Lost':'st-lost','Follow-up':'st-follow-up'};
const SERVICES = ['Lead Generation','Account Management','LinkedIn Connections','Account Recovery','Hiring Support','B2B Sales Partnership'];
const DB_KEY='tir_crm', INBOX_KEY='tir_inbox', SESS_KEY='tir_sess';

/* ---------- helpers ---------- */
const $ = (s,r)=> (r||document).querySelector(s);
const uid = ()=> Math.random().toString(36).slice(2,9);
const esc = (s)=> String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n)=> '$'+(Number(n)||0).toLocaleString();
function fmt(ts){ if(!ts) return '—'; const d=new Date(ts); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtT(ts){ if(!ts) return '—'; const d=new Date(ts); return d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function ago(ts){ const s=(Date.now()-ts)/1000; if(s<60)return'just now'; if(s<3600)return Math.floor(s/60)+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2400); }

/* ---------- seed ---------- */
function makeLead(o){ const now=Date.now(); return {
  id:uid(), name:o.name||'Unknown', email:o.email||'', phone:o.phone||'', company:o.company||'',
  service:o.service||'Lead Generation', source:o.source||'Manual', stage:o.stage||'New Lead',
  ownerId:o.ownerId||null, value:o.value||0, followUpAt:o.followUpAt||null,
  notes:o.note?[{ts:o.ts||now,by:'system',text:o.note}]:[],
  activities:[{ts:o.ts||now,by:'system',type:'created',text:'Lead created from '+(o.source||'Manual')}],
  createdAt:o.ts||now }; }

function seed(){
  const u1={id:'u1',name:'Vibhanshu',username:'vibhanshu',password:'mybaby',role:'manager',email:'vibhanshu@techinrent.com',status:'active'};
  const u2={id:'u2',name:'Aanya Sharma',username:'aanya',password:'sdr123',role:'sdr',email:'aanya@techinrent.com',status:'active'};
  const u3={id:'u3',name:'Rohit Verma',username:'rohit',password:'sdr123',role:'sdr',email:'rohit@techinrent.com',status:'active'};
  const D=Date.now(), day=86400000;
  const leads=[
    {...makeLead({name:'Priya Nair',email:'priya@nimbussaas.com',phone:'+91 90000 11111',company:'Nimbus SaaS',service:'Lead Generation',source:'Website',stage:'Qualified',ownerId:'u2',value:1200,ts:D-6*day}),followUpAt:D+1*day},
    {...makeLead({name:'Mark Doyle',email:'mark@brightagency.io',company:'Bright Agency',service:'Account Management',source:'Website',stage:'Demo Scheduled',ownerId:'u2',value:600,ts:D-5*day}),followUpAt:D+2*day},
    {...makeLead({name:'Sofia Reyes',email:'sofia@hrpro.co',company:'HRPro',service:'Account Recovery',source:'Referral',stage:'Won',ownerId:'u3',value:900,ts:D-12*day})},
    {...makeLead({name:'Daniel Kim',email:'daniel@scalelabs.com',company:'ScaleLabs',service:'Lead Generation',source:'LinkedIn',stage:'Negotiation',ownerId:'u3',value:2400,ts:D-8*day}),followUpAt:D-1*day},
    {...makeLead({name:'Aisha Khan',email:'aisha@medisure.in',company:'MediSure',service:'B2B Sales Partnership',source:'Website',stage:'Contacted',ownerId:'u2',value:0,ts:D-3*day})},
    {...makeLead({name:'Tom Becker',email:'tom@verifycheck.com',company:'VerifyCheck',service:'Hiring Support',source:'Website',stage:'Proposal Sent',ownerId:'u3',value:1500,ts:D-7*day}),followUpAt:D+3*day},
    {...makeLead({name:'Lena Müller',email:'lena@growthco.de',company:'GrowthCo',service:'Account Management',source:'Manual',stage:'New Lead',ownerId:null,value:0,ts:D-1*day})},
    {...makeLead({name:'Carlos Ruiz',email:'carlos@insureplan.com',company:'InsurePlan',service:'Lead Generation',source:'Website',stage:'Lost',ownerId:'u2',value:0,ts:D-15*day})}
  ];
  return {
    users:[u1,u2,u3],
    leads,
    attendance:[
      {id:uid(),userId:'u2',date:todayStr(),clockIn:D-3*3600000,clockOut:null,status:'present'},
      {id:uid(),userId:'u3',date:todayStr(),clockIn:D-4*3600000,clockOut:D-1*3600000,status:'present'}
    ],
    dailyReports:[
      {id:uid(),userId:'u3',date:todayStr(),calls:14,meetings:2,summary:'Followed up with ScaleLabs and VerifyCheck. Booked 1 demo.',ts:D-3600000}
    ],
    blogPosts:[
      {id:uid(),title:'5 LinkedIn Headlines That Get Replies',body:'Your headline is the first thing prospects read...',authorId:'u1',status:'published',createdAt:D-9*day},
      {id:uid(),title:'How I Booked 6 Demos in a Week',body:'A breakdown of the outreach sequence I used...',authorId:'u2',status:'pending',createdAt:D-1*day}
    ],
    activityLogs:[
      {ts:D-3600000,userId:'u2',action:'Updated lead "Priya Nair" to Qualified'},
      {ts:D-7200000,userId:'u3',action:'Logged a call with ScaleLabs'},
      {ts:D-2*day,userId:'u1',action:'Created SDR account for Aanya Sharma'}
    ],
    notifications:[
      {id:uid(),ts:D-1*day,text:'New website inquiry from Lena Müller',read:false},
      {id:uid(),ts:D-1*day,text:'Aanya submitted a blog post for approval',read:false}
    ],
    settings:{company:'TechInRent',email:'vibhanshu@techinrent.com',phone:'+91 78987 11748',currency:'USD'}
  };
}

/* ---------- data layer ---------- */
function load(){ let d=null; try{ d=JSON.parse(localStorage.getItem(DB_KEY)); }catch(e){} if(!d||!d.users){ d=seed(); localStorage.setItem(DB_KEY,JSON.stringify(d)); } return d; }
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
let db = load();

// migration: upgrade the old default manager login to the configured one
(function(){
  var m = db.users && db.users.find(function(u){ return u.role==='manager'; });
  if (m && m.username==='manager') { m.username='vibhanshu'; m.password='mybaby'; m.name='Vibhanshu'; save(); }
})();

function mergeInbox(){
  let inbox=[]; try{ inbox=JSON.parse(localStorage.getItem(INBOX_KEY))||[]; }catch(e){}
  if(inbox.length){
    inbox.forEach(x=>{
      db.leads.unshift(makeLead({name:x.name,email:x.email,service:x.service,source:'Website',note:x.message,ts:x.ts}));
      db.notifications.unshift({id:uid(),ts:Date.now(),text:'New website inquiry from '+(x.name||'a visitor'),read:false});
    });
    localStorage.removeItem(INBOX_KEY); save();
  }
}
mergeInbox();

/* ---------- auth ---------- */
function session(){ try{ return JSON.parse(localStorage.getItem(SESS_KEY)); }catch(e){ return null; } }
function currentUser(){ const s=session(); return s? db.users.find(u=>u.id===s.id):null; }
function logActivity(action){ const u=currentUser(); db.activityLogs.unshift({ts:Date.now(),userId:u?u.id:'system',action}); save(); }
function userName(id){ const u=db.users.find(x=>x.id===id); return u?u.name:'Unassigned'; }
function initials(n){ return (n||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase(); }

function doLogin(e){
  e.preventDefault();
  const un=$('#li-user').value.trim(), pw=$('#li-pass').value;
  const u=db.users.find(x=>x.username===un && x.password===pw);
  if(!u){ $('#li-err').classList.remove('hidden'); return false; }
  if(u.status==='inactive'){ $('#li-err').textContent='This account is inactive. Contact your manager.'; $('#li-err').classList.remove('hidden'); return false; }
  localStorage.setItem(SESS_KEY, JSON.stringify({id:u.id,role:u.role,name:u.name}));
  logActivity('Logged in');
  // Seamlessly unlock the server-side bookings API with the same credentials.
  if(u.role==='manager'){ apiLogin(un, pw); }
  S.view = 'dashboard';
  render();
  return false;
}
function logout(){ logActivity('Logged out'); localStorage.removeItem(SESS_KEY); apiLogout(); render(); }

/* ---------- demo bookings API (server-side, persistent) ---------- */
let API_TOKEN = sessionStorage.getItem('tir_api_token') || null;
let BOOKINGS = [];
let BOOKING_STATUSES = ['New','Contacted','Confirmed','Completed','Cancelled','No-show'];
async function apiLogin(username, password){
  try{
    const r = await fetch('/api/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const j = await r.json().catch(()=>({}));
    if(r.ok && j.token){ API_TOKEN=j.token; sessionStorage.setItem('tir_api_token',j.token); return true; }
  }catch(e){}
  return false;
}
function apiLogout(){ API_TOKEN=null; try{ sessionStorage.removeItem('tir_api_token'); }catch(e){} }
async function fetchBookings(){
  if(!API_TOKEN) return {auth:false};
  try{
    const r = await fetch('/api/bookings',{headers:{Authorization:'Bearer '+API_TOKEN}});
    if(r.status===401){ apiLogout(); return {auth:false}; }
    const j = await r.json().catch(()=>({}));
    if(r.ok){ BOOKINGS=j.bookings||[]; if(j.statuses) BOOKING_STATUSES=j.statuses; return {auth:true, ok:true}; }
    return {auth:true, ok:false, error:j.error||'Error'};
  }catch(e){ return {auth:true, ok:false, error:'Network error'}; }
}
async function updateBookingStatus(id, status){
  if(!API_TOKEN) return;
  try{
    const r = await fetch('/api/bookings',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+API_TOKEN},body:JSON.stringify({id,status})});
    if(r.ok){ const j=await r.json(); const b=BOOKINGS.find(x=>x.id===id); if(b&&j.booking) Object.assign(b,j.booking); toast('Status updated to '+status); }
    else if(r.status===401){ apiLogout(); loadBookings(); }
    else { toast('Could not update status'); }
  }catch(e){ toast('Network error'); }
}
function unlockBookings(e){
  e.preventDefault();
  const pw=$('#bk-pass').value; const u=currentUser();
  apiLogin(u?u.username:'', pw).then(ok=>{ if(ok){ loadBookings(); } else { const er=$('#bk-err'); if(er) er.style.display='block'; } });
  return false;
}

/* ---------- app state ---------- */
let S = { view:'dashboard', sidebarOpen:false, leadSearch:'', leadStage:'', leadOwner:'' };

/* ============================================================
   RENDER
   ============================================================ */
function render(){
  const root=$('#root'); const u=currentUser();
  closeModal();
  if(!u){ root.innerHTML=loginView(); return; }
  root.innerHTML=appShell(u);
  renderContent();
}

function loginView(){
  return `<div class="login-wrap"><div class="login-card">
    <div class="lg-brand"><img src="/assets/logo.png" alt="TechInRent"> Techinrent Office</div>
    <p class="sub">Admin Portal — sign in to continue</p>
    <div id="li-err" class="login-err hidden">Invalid username or password.</div>
    <form onsubmit="return doLogin(event)">
      <div class="fld"><label>Username</label><input id="li-user" autocomplete="username" required></div>
      <div class="fld"><label>Password</label><div class="pw-wrap"><input id="li-pass" type="password" autocomplete="current-password" required><button type="button" class="pw-eye" aria-label="Show password" onclick="togglePw('li-pass',this)">👁</button></div></div>
      <button class="btn btn-primary btn-block" type="submit">Sign In →</button>
    </form>
  </div></div>`;
}

/* Toggle a password field's visibility (eye button) */
function togglePw(id, btn){
  const el = document.getElementById(id); if(!el) return;
  const show = el.type === 'password';
  el.type = show ? 'text' : 'password';
  if(btn){ btn.textContent = show ? '🙈' : '👁'; btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); }
}

const MANAGER_NAV=[
  {g:'Overview',items:[['dashboard','📊','Dashboard']]},
  {g:'Sales',items:[['bookings','📅','Demo Bookings'],['leads','🎯','Lead Management'],['pipeline','🔀','Sales Pipeline'],['inquiries','📥','Website Inquiries']]},
  {g:'Team',items:[['users','👥','SDR / Users'],['attendance','🕘','Attendance'],['activity','📜','Activity Logs']]},
  {g:'Content',items:[['blog','📝','Blog Management']]},
  {g:'Insights',items:[['reports','📈','Reports & Analytics']]},
  {g:'System',items:[['profile','👤','My Profile'],['settings','⚙️','CRM Settings']]}
];
const SDR_NAV=[
  {g:'Overview',items:[['dashboard','📊','My Dashboard']]},
  {g:'Sales',items:[['myleads','🎯','My Leads']]},
  {g:'My Day',items:[['attendance','🕘','Attendance & Time'],['daily','🗒️','Daily Report']]},
  {g:'Content',items:[['blog','📝','Blog Posts']]},
  {g:'Me',items:[['performance','🏆','My Performance'],['profile','👤','My Profile']]}
];

function appShell(u){
  const nav = u.role==='manager'?MANAGER_NAV:SDR_NAV;
  const unread = db.notifications.filter(n=>!n.read).length;
  const pendingBlogs = db.blogPosts.filter(b=>b.status==='pending').length;
  let navHtml='';
  nav.forEach(grp=>{
    navHtml+=`<div class="nav-group">${grp.g}</div>`;
    grp.items.forEach(([v,ic,l])=>{
      const badge = (v==='blog'&&u.role==='manager'&&pendingBlogs)?`<span class="badge-n">${pendingBlogs}</span>`:'';
      navHtml+=`<div class="nav-item ${S.view===v?'active':''}" onclick="go('${v}')"><span class="ic">${ic}</span>${l}${badge}</div>`;
    });
  });
  return `
  <div class="app">
    <aside class="sidebar ${S.sidebarOpen?'open':''}" id="sidebar">
      <div class="s-brand"><img src="/assets/logo.png" alt=""> Techinrent Office</div>
      ${navHtml}
      <div class="nav-group">Account</div>
      <div class="nav-item" onclick="logout()"><span class="ic">🚪</span>Sign Out</div>
      <div class="nav-item" onclick="window.location.href='/index.html'"><span class="ic">🌐</span>View Website</div>
    </aside>
    <div class="main">
      <div class="topbar2">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="menu-toggle" onclick="toggleSidebar()">☰</button>
          <h1 id="view-title">Dashboard</h1>
        </div>
        <div class="tb2-right">
          <span class="bell" onclick="openNotifs()">🔔${unread?`<span class="dot">${unread}</span>`:''}</span>
          <div class="who-chip"><div class="avatar">${initials(u.name)}</div>
            <div><div class="nm">${esc(u.name)}</div><div class="rl">${u.role==='manager'?'Manager (Super Admin)':'SDR'}</div></div>
          </div>
        </div>
      </div>
      <div class="content" id="content"></div>
    </div>
  </div>`;
}

function go(v){ S.view=v; S.sidebarOpen=false; render(); }
function toggleSidebar(){ S.sidebarOpen=!S.sidebarOpen; const sb=$('#sidebar'); if(sb) sb.classList.toggle('open'); }

function renderContent(){
  const u=currentUser(); if(!u) return;
  const titles={dashboard:u.role==='manager'?'Dashboard':'My Dashboard',bookings:'Demo Bookings',leads:'Lead Management',pipeline:'Sales Pipeline',inquiries:'Website Inquiries',users:'SDR / User Management',attendance:u.role==='manager'?'Attendance Management':'Attendance & Time Tracking',activity:'Activity Logs',blog:'Blog Management',reports:'Reports & Analytics',settings:'CRM Settings',myleads:'My Leads',daily:'Daily Activity Report',performance:'My Performance',profile:'My Profile'};
  const tt=$('#view-title'); if(tt) tt.textContent=titles[S.view]||'';
  const c=$('#content'); if(!c) return;
  const allowedSDR=['dashboard','myleads','attendance','daily','blog','performance','profile'];
  if(u.role==='sdr' && !allowedSDR.includes(S.view)) S.view='dashboard';
  let html='';
  if(u.role==='manager'){
    html=({dashboard:mgrDashboard,bookings:bookingsView,leads:()=>leadsView(false),pipeline:pipelineView,inquiries:inquiriesView,users:usersView,attendance:mgrAttendance,activity:activityView,blog:blogView,reports:reportsView,settings:settingsView,profile:profileView}[S.view]||mgrDashboard)();
  } else {
    html=({dashboard:sdrDashboard,myleads:()=>leadsView(true),attendance:sdrAttendance,daily:dailyView,blog:blogView,performance:perfView,profile:profileView}[S.view]||sdrDashboard)();
  }
  c.innerHTML=html;
}

/* ============================================================
   MANAGER VIEWS
   ============================================================ */
function kpi(v,l,ic){ return `<div class="kpi"><span class="ic">${ic}</span><div class="v">${v}</div><div class="l">${l}</div></div>`; }

function mgrDashboard(){
  const leads=db.leads;
  const won=leads.filter(l=>l.stage==='Won');
  const openLeads=leads.filter(l=>!['Won','Lost'].includes(l.stage));
  const wonValue=won.reduce((a,l)=>a+ (+l.value||0),0);
  const dueFollow=leads.filter(l=>l.followUpAt&&l.followUpAt<=Date.now()+86400000&&!['Won','Lost'].includes(l.stage));
  return `
  <div class="kpis">
    ${kpi(leads.length,'Total Leads','🎯')}
    ${kpi(openLeads.length,'Open Pipeline','🔀')}
    ${kpi(won.length,'Deals Won','🏆')}
    ${kpi(money(wonValue),'Won Value','💰')}
  </div>
  <div class="row-2">
    <div class="panel">
      <div class="panel-h"><h3>Pipeline by stage</h3><button class="btn btn-ghost btn-sm" onclick="go('pipeline')">Open board →</button></div>
      <div class="panel-b">${stageBars(leads)}</div>
    </div>
    <div class="panel">
      <div class="panel-h"><h3>SDR performance</h3></div>
      <div class="panel-b">${sdrBars()}</div>
    </div>
  </div>
  <div class="row-2">
    <div class="panel">
      <div class="panel-h"><h3>Follow-ups due</h3><span class="pill2">${dueFollow.length} due</span></div>
      <div class="panel-b">${dueFollow.length?`<div class="table-scroll"><table class="tbl"><thead><tr><th>Lead</th><th>Owner</th><th>Due</th><th>Stage</th></tr></thead><tbody>${dueFollow.map(l=>`<tr onclick="openLead('${l.id}')" style="cursor:pointer"><td class="nm">${esc(l.name)}</td><td>${esc(userName(l.ownerId))}</td><td>${fmt(l.followUpAt)}</td><td><span class="stage ${STAGE_CLASS[l.stage]}">${l.stage}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No follow-ups due. 🎉</div>'}</div>
    </div>
    <div class="panel">
      <div class="panel-h"><h3>Recent activity</h3><button class="btn btn-ghost btn-sm" onclick="go('activity')">All →</button></div>
      <div class="panel-b"><ul class="timeline">${db.activityLogs.slice(0,6).map(a=>`<li><div class="t-txt">${esc(a.action)}</div><div class="t-meta">${esc(userName(a.userId))} · ${ago(a.ts)}</div></li>`).join('')}</ul></div>
    </div>
  </div>`;
}

function stageBars(leads){
  const max=Math.max(1,...STAGES.map(s=>leads.filter(l=>l.stage===s).length));
  return `<div class="bars">${STAGES.map(s=>{const n=leads.filter(l=>l.stage===s).length;return `<div class="bar-row"><span class="lbl">${s}</span><span class="bar-track"><span class="bar-fill" style="width:${n/max*100}%"></span></span><span class="vn">${n}</span></div>`;}).join('')}</div>`;
}
function sdrBars(){
  const sdrs=db.users.filter(u=>u.role==='sdr');
  const max=Math.max(1,...sdrs.map(u=>db.leads.filter(l=>l.ownerId===u.id).length));
  return `<div class="bars">${sdrs.map(u=>{const tot=db.leads.filter(l=>l.ownerId===u.id).length;const won=db.leads.filter(l=>l.ownerId===u.id&&l.stage==='Won').length;return `<div class="bar-row"><span class="lbl">${esc(u.name)}</span><span class="bar-track"><span class="bar-fill" style="width:${tot/max*100}%"></span></span><span class="vn">${tot}</span></div><div class="t-meta" style="margin:-4px 0 4px 130px">${won} won</div>`;}).join('')}</div>`;
}

function leadFilters(forSDR){
  return `<div class="toolbar">
    <input type="search" id="f-search" placeholder="Search name, company, email…" value="${esc(S.leadSearch)}" oninput="S.leadSearch=this.value;renderContent()">
    <select id="f-stage" onchange="S.leadStage=this.value;renderContent()"><option value="">All stages</option>${STAGES.map(s=>`<option ${S.leadStage===s?'selected':''}>${s}</option>`).join('')}</select>
    ${forSDR?'':`<select id="f-owner" onchange="S.leadOwner=this.value;renderContent()"><option value="">All owners</option><option value="unassigned" ${S.leadOwner==='unassigned'?'selected':''}>Unassigned</option>${db.users.filter(u=>u.role==='sdr').map(u=>`<option value="${u.id}" ${S.leadOwner===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select>`}
    <div class="spacer"></div>
    <button class="btn btn-primary btn-sm" onclick="openLeadForm()">+ Add Lead</button>
  </div>`;
}
function filterLeads(forSDR){
  const u=currentUser();
  let ls=db.leads.slice();
  if(forSDR) ls=ls.filter(l=>l.ownerId===u.id);
  if(S.leadStage) ls=ls.filter(l=>l.stage===S.leadStage);
  if(!forSDR && S.leadOwner) ls=ls.filter(l=> S.leadOwner==='unassigned'? !l.ownerId : l.ownerId===S.leadOwner);
  if(S.leadSearch){ const q=S.leadSearch.toLowerCase(); ls=ls.filter(l=>(l.name+l.company+l.email).toLowerCase().includes(q)); }
  return ls;
}
function leadsView(forSDR){
  const ls=filterLeads(forSDR);
  return leadFilters(forSDR)+`
  <div class="panel"><div class="table-scroll"><table class="tbl">
    <thead><tr><th>Lead</th><th>Company</th><th>Service</th><th>Stage</th>${forSDR?'':'<th>Owner</th>'}<th>Source</th><th>Value</th><th>Follow-up</th></tr></thead>
    <tbody>${ls.length?ls.map(l=>`<tr style="cursor:pointer" onclick="openLead('${l.id}')">
      <td><div class="nm">${esc(l.name)}</div><div class="sub">${esc(l.email)}</div></td>
      <td>${esc(l.company)||'—'}</td><td>${esc(l.service)}</td>
      <td><span class="stage ${STAGE_CLASS[l.stage]}">${l.stage}</span></td>
      ${forSDR?'':`<td>${esc(userName(l.ownerId))}</td>`}
      <td><span class="pill2">${esc(l.source)}</span></td>
      <td>${l.value?money(l.value):'—'}</td>
      <td>${l.followUpAt?`<span style="color:${l.followUpAt<Date.now()?'var(--red)':'var(--slate)'}">${fmt(l.followUpAt)}</span>`:'—'}</td>
    </tr>`).join(''):`<tr><td colspan="8"><div class="empty">No leads found.</div></td></tr>`}</tbody>
  </table></div></div>`;
}

function pipelineView(){
  const u=currentUser(); const forSDR=u.role==='sdr';
  let ls=db.leads.slice(); if(forSDR) ls=ls.filter(l=>l.ownerId===u.id);
  return `<div class="kanban">${STAGES.map(s=>{
    const col=ls.filter(l=>l.stage===s);
    return `<div class="kcol"><h4>${s}<span>${col.length}</span></h4>${col.map(l=>`<div class="kcard" onclick="openLead('${l.id}')"><div class="nm">${esc(l.name)}</div><div class="meta">${esc(l.company)||esc(l.service)}</div><div class="meta">${esc(userName(l.ownerId))} · ${l.value?money(l.value):'—'}</div></div>`).join('')||'<div class="t-meta" style="padding:6px">—</div>'}</div>`;
  }).join('')}</div>`;
}

function inquiriesView(){
  const ls=db.leads.filter(l=>l.source==='Website');
  return `<p style="color:var(--muted);margin:0 0 14px">Leads captured automatically from the website contact forms. They arrive as <b>New Lead</b> and unassigned until you assign an SDR.</p>
  <div class="panel"><div class="table-scroll"><table class="tbl">
  <thead><tr><th>Name</th><th>Email</th><th>Interested In</th><th>Stage</th><th>Owner</th><th>Received</th><th></th></tr></thead>
  <tbody>${ls.length?ls.map(l=>`<tr><td class="nm">${esc(l.name)}</td><td>${esc(l.email)}</td><td>${esc(l.service)}</td><td><span class="stage ${STAGE_CLASS[l.stage]}">${l.stage}</span></td><td>${esc(userName(l.ownerId))}</td><td>${fmt(l.createdAt)}</td><td><button class="btn btn-ghost btn-sm" onclick="openLead('${l.id}')">Open</button></td></tr>`).join(''):`<tr><td colspan="7"><div class="empty">No website inquiries yet. Submit the website contact form to see one appear here.</div></td></tr>`}</tbody>
  </table></div></div>`;
}

function usersView(){
  const us=db.users;
  return `<div class="toolbar"><div class="spacer"></div><button class="btn btn-primary btn-sm" onclick="openUserForm()">+ Add SDR</button></div>
  <div class="panel"><div class="table-scroll"><table class="tbl">
  <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Leads</th><th>Status</th><th>Actions</th></tr></thead>
  <tbody>${us.map(u=>`<tr><td class="nm">${esc(u.name)}</td><td>${esc(u.username)}</td><td>${esc(u.email)}</td><td><span class="pill2">${u.role==='manager'?'Manager':'SDR'}</span></td><td>${db.leads.filter(l=>l.ownerId===u.id).length}</td><td><span class="tag ${u.status==='active'?'tag-on':'tag-off'}">${u.status}</span></td>
  <td>${u.role==='manager'?'<span class="t-meta">—</span>':`<button class="btn btn-ghost btn-sm" onclick="openUserForm('${u.id}')">Edit</button> <button class="btn btn-ghost btn-sm" onclick="toggleUser('${u.id}')">${u.status==='active'?'Disable':'Enable'}</button> <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>`}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}

function mgrAttendance(){
  const t=todayStr();
  const rows=db.users.filter(u=>u.role==='sdr').map(u=>{
    const rec=db.attendance.find(a=>a.userId===u.id&&a.date===t);
    const hrs=rec&&rec.clockIn?(((rec.clockOut||Date.now())-rec.clockIn)/3600000).toFixed(1):'0.0';
    return `<tr><td class="nm">${esc(u.name)}</td><td>${rec?'<span class="tag tag-on">Present</span>':'<span class="tag tag-off">Absent</span>'}</td><td>${rec&&rec.clockIn?fmtT(rec.clockIn):'—'}</td><td>${rec&&rec.clockOut?fmtT(rec.clockOut):(rec?'<span class="t-meta">active</span>':'—')}</td><td>${hrs} h</td></tr>`;
  }).join('');
  const hist=db.attendance.slice().sort((a,b)=>b.clockIn-a.clockIn).slice(0,12).map(a=>`<tr><td class="nm">${esc(userName(a.userId))}</td><td>${a.date}</td><td>${a.clockIn?fmtT(a.clockIn):'—'}</td><td>${a.clockOut?fmtT(a.clockOut):'—'}</td></tr>`).join('');
  return `<div class="toolbar"><div class="spacer"></div><button class="btn btn-ghost btn-sm" onclick="exportAttendance()">⬇ Export CSV</button></div>
  <div class="panel"><div class="panel-h"><h3>Today — ${t}</h3></div><div class="table-scroll"><table class="tbl"><thead><tr><th>SDR</th><th>Status</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  <div class="panel"><div class="panel-h"><h3>Attendance history</h3></div><div class="table-scroll"><table class="tbl"><thead><tr><th>SDR</th><th>Date</th><th>In</th><th>Out</th></tr></thead><tbody>${hist}</tbody></table></div></div>`;
}

function activityView(){
  return `<div class="panel"><div class="panel-h"><h3>System activity logs</h3><span class="pill2">${db.activityLogs.length} events</span></div>
  <div class="panel-b"><ul class="timeline">${db.activityLogs.slice(0,40).map(a=>`<li><div class="t-txt">${esc(a.action)}</div><div class="t-meta">${esc(userName(a.userId))} · ${fmtT(a.ts)}</div></li>`).join('')}</ul></div></div>`;
}

function blogView(){
  const u=currentUser(); const mgr=u.role==='manager';
  let posts=db.blogPosts.slice().sort((a,b)=>b.createdAt-a.createdAt);
  if(!mgr) posts=posts.filter(p=>p.authorId===u.id);
  return `<div class="toolbar"><div class="spacer"></div><button class="btn btn-primary btn-sm" onclick="openBlogForm()">+ New Post</button></div>
  <p style="color:var(--muted);margin:-6px 0 14px">${mgr?'Review and approve SDR submissions, or publish your own posts.':'Drafts you submit go to your manager for approval before they are published.'}</p>
  <div class="panel"><div class="table-scroll"><table class="tbl">
  <thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
  <tbody>${posts.length?posts.map(p=>`<tr><td class="nm">${esc(p.title)}</td><td>${esc(userName(p.authorId))}</td><td><span class="tag tag-${p.status==='published'?'pub':p.status==='pending'?'pending':'draft'}">${p.status}</span></td><td>${fmt(p.createdAt)}</td>
  <td><button class="btn btn-ghost btn-sm" onclick="openBlogForm('${p.id}')">${(mgr||p.status!=='published')?'Edit':'View'}</button> ${mgr&&p.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="approveBlog('${p.id}')">Approve</button> <button class="btn btn-danger btn-sm" onclick="rejectBlog('${p.id}')">Reject</button>`:''} ${mgr?`<button class="btn btn-danger btn-sm" onclick="deleteBlog('${p.id}')">Del</button>`:''}</td></tr>`).join(''):`<tr><td colspan="5"><div class="empty">No posts yet.</div></td></tr>`}</tbody>
  </table></div></div>`;
}

function reportsView(){
  const leads=db.leads, won=leads.filter(l=>l.stage==='Won');
  const conv=leads.length?Math.round(won.length/leads.length*100):0;
  const wonValue=won.reduce((a,l)=>a+(+l.value||0),0);
  const pipeValue=leads.filter(l=>!['Won','Lost'].includes(l.stage)).reduce((a,l)=>a+(+l.value||0),0);
  return `<div class="kpis">
    ${kpi(leads.length,'Total Leads','🎯')}${kpi(conv+'%','Win Rate','📈')}${kpi(money(pipeValue),'Open Pipeline Value','🔀')}${kpi(money(wonValue),'Won Revenue','💰')}
  </div>
  <div class="toolbar"><div class="spacer"></div>
    <label class="btn btn-ghost btn-sm" style="cursor:pointer">⬆ Import Leads CSV<input type="file" accept=".csv" style="display:none" onchange="importLeads(this)"></label>
    <button class="btn btn-ghost btn-sm" onclick="exportLeads()">⬇ Export Leads CSV</button>
    <button class="btn btn-ghost btn-sm" onclick="exportAttendance()">⬇ Export Attendance</button>
  </div>
  <div class="row-2">
    <div class="panel"><div class="panel-h"><h3>Leads by stage</h3></div><div class="panel-b">${stageBars(leads)}</div></div>
    <div class="panel"><div class="panel-h"><h3>Leads by SDR</h3></div><div class="panel-b">${sdrBars()}</div></div>
  </div>
  <div class="panel"><div class="panel-h"><h3>Lead source breakdown</h3></div><div class="panel-b">${sourceBars()}</div></div>`;
}
function sourceBars(){
  const srcs=[...new Set(db.leads.map(l=>l.source))];
  const max=Math.max(1,...srcs.map(s=>db.leads.filter(l=>l.source===s).length));
  return `<div class="bars">${srcs.map(s=>{const n=db.leads.filter(l=>l.source===s).length;return `<div class="bar-row"><span class="lbl">${esc(s)}</span><span class="bar-track"><span class="bar-fill" style="width:${n/max*100}%"></span></span><span class="vn">${n}</span></div>`;}).join('')}</div>`;
}

function settingsView(){
  const s=db.settings;
  const matrix=[['Dashboard','✓','✓'],['View all leads','✓','Own only'],['Assign leads','✓','—'],['Manage users','✓','—'],['Blog: publish','✓','Submit only'],['Attendance','View all','Own only'],['Reports & analytics','✓','—'],['CRM settings','✓','—']];
  return `<div class="row-2">
    <div class="panel"><div class="panel-h"><h3>Company settings</h3></div><div class="panel-b">
      <div class="grid-2c">
        <div class="fld"><label>Company name</label><input id="set-company" value="${esc(s.company)}"></div>
        <div class="fld"><label>Currency</label><select id="set-cur"><option ${s.currency==='USD'?'selected':''}>USD</option><option ${s.currency==='INR'?'selected':''}>INR</option><option ${s.currency==='EUR'?'selected':''}>EUR</option></select></div>
        <div class="fld"><label>Email</label><input id="set-email" value="${esc(s.email)}"></div>
        <div class="fld"><label>Phone</label><input id="set-phone" value="${esc(s.phone)}"></div>
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Roles & permissions</h3></div><div class="panel-b">
      <table class="tbl"><thead><tr><th>Capability</th><th>Manager</th><th>SDR</th></tr></thead>
      <tbody>${matrix.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
    </div></div>
  </div>
  <div class="panel"><div class="panel-h"><h3>Danger zone</h3></div><div class="panel-b"><p style="color:var(--muted)">Reset all CRM data back to the original demo seed. This cannot be undone.</p><button class="btn btn-danger" onclick="resetData()">Reset CRM Data</button></div></div>`;
}

/* ============================================================
   MY PROFILE (both roles) — change name, username, password
   ============================================================ */
function profileView(){
  const u=currentUser();
  return `<div class="row-2">
    <div class="panel"><div class="panel-h"><h3>My account</h3></div><div class="panel-b">
      <div class="grid-2c">
        <div class="fld"><label>Full name</label><input id="pf-name" value="${esc(u.name)}"></div>
        <div class="fld"><label>Username (login)</label><input id="pf-user" value="${esc(u.username)}"></div>
      </div>
      <div class="fld"><label>Email</label><input id="pf-email" value="${esc(u.email||'')}"></div>
      <button class="btn btn-primary" onclick="saveProfile()">Save changes</button>
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Change password</h3></div><div class="panel-b">
      <div class="fld"><label>Current password</label><div class="pw-wrap"><input id="pf-cur" type="password" placeholder="••••••"><button type="button" class="pw-eye" aria-label="Show password" onclick="togglePw('pf-cur',this)">👁</button></div></div>
      <div class="grid-2c">
        <div class="fld"><label>New password</label><div class="pw-wrap"><input id="pf-new" type="password"><button type="button" class="pw-eye" aria-label="Show password" onclick="togglePw('pf-new',this)">👁</button></div></div>
        <div class="fld"><label>Confirm new password</label><div class="pw-wrap"><input id="pf-new2" type="password"><button type="button" class="pw-eye" aria-label="Show password" onclick="togglePw('pf-new2',this)">👁</button></div></div>
      </div>
      <button class="btn btn-primary" onclick="changePassword()">Update password</button>
    </div></div>
  </div>
  <p class="t-meta" style="margin-top:8px">Signed in as <strong>${esc(u.name)}</strong> · ${u.role==='manager'?'Manager (Super Admin)':'SDR'}</p>`;
}
function saveProfile(){
  const u=currentUser();
  const name=$('#pf-name').value.trim(), un=$('#pf-user').value.trim(), email=$('#pf-email').value.trim();
  if(!name||!un){ toast('Name and username are required'); return; }
  if(db.users.some(x=>x.username===un && x.id!==u.id)){ toast('That username is already taken'); return; }
  u.name=name; u.username=un; u.email=email;
  const s=session(); if(s){ s.name=name; localStorage.setItem(SESS_KEY,JSON.stringify(s)); }
  logActivity('Updated own profile'); save(); render(); toast('Profile updated');
}
function changePassword(){
  const u=currentUser();
  const cur=$('#pf-cur').value, n=$('#pf-new').value, n2=$('#pf-new2').value;
  if(u.password && cur!==u.password){ toast('Current password is incorrect'); return; }
  if(!n || n.length<4){ toast('New password must be at least 4 characters'); return; }
  if(n!==n2){ toast('New passwords do not match'); return; }
  u.password=n; logActivity('Changed own password'); save();
  $('#pf-cur').value=''; $('#pf-new').value=''; $('#pf-new2').value='';
  toast('Password updated');
}

/* ============================================================
   SDR VIEWS
   ============================================================ */
function sdrDashboard(){
  const u=currentUser();
  const mine=db.leads.filter(l=>l.ownerId===u.id);
  const won=mine.filter(l=>l.stage==='Won');
  const due=mine.filter(l=>l.followUpAt&&l.followUpAt<=Date.now()+86400000&&!['Won','Lost'].includes(l.stage));
  const t=todayStr(); const rec=db.attendance.find(a=>a.userId===u.id&&a.date===t);
  return `<div class="kpis">
    ${kpi(mine.length,'My Leads','🎯')}${kpi(mine.filter(l=>!['Won','Lost'].includes(l.stage)).length,'In Pipeline','🔀')}${kpi(won.length,'Won','🏆')}${kpi(due.length,'Follow-ups Due','⏰')}
  </div>
  <div class="row-2">
    <div class="panel"><div class="panel-h"><h3>Follow-ups due</h3><button class="btn btn-ghost btn-sm" onclick="go('myleads')">My leads →</button></div>
      <div class="panel-b">${due.length?`<div class="table-scroll"><table class="tbl"><thead><tr><th>Lead</th><th>Due</th><th>Stage</th></tr></thead><tbody>${due.map(l=>`<tr style="cursor:pointer" onclick="openLead('${l.id}')"><td class="nm">${esc(l.name)}</td><td>${fmt(l.followUpAt)}</td><td><span class="stage ${STAGE_CLASS[l.stage]}">${l.stage}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nothing due. Great job! 🎉</div>'}</div></div>
    <div class="panel"><div class="panel-h"><h3>Today</h3></div><div class="panel-b">
      <p>Status: ${rec?'<span class="tag tag-on">Clocked in</span>':'<span class="tag tag-off">Not clocked in</span>'}</p>
      ${rec?`<p class="t-meta">In at ${fmtT(rec.clockIn)}${rec.clockOut?(' · Out at '+fmtT(rec.clockOut)):''}</p>`:''}
      <button class="btn btn-primary btn-sm" onclick="go('attendance')">Attendance & Time →</button>
      <button class="btn btn-ghost btn-sm" onclick="go('daily')">Submit Daily Report →</button>
    </div></div>
  </div>
  <div class="panel"><div class="panel-h"><h3>My pipeline</h3></div><div class="panel-b">${stageBars(mine)}</div></div>`;
}

function sdrAttendance(){
  const u=currentUser(); const t=todayStr();
  const rec=db.attendance.find(a=>a.userId===u.id&&a.date===t);
  const hrs=rec&&rec.clockIn?(((rec.clockOut||Date.now())-rec.clockIn)/3600000).toFixed(1):'0.0';
  const hist=db.attendance.filter(a=>a.userId===u.id).sort((a,b)=>b.clockIn-a.clockIn).slice(0,14);
  return `<div class="panel"><div class="panel-h"><h3>Time tracking — ${t}</h3></div><div class="panel-b">
    <div class="kpis" style="margin-bottom:14px"><div class="kpi"><div class="v">${rec?'Yes':'No'}</div><div class="l">Clocked in</div></div><div class="kpi"><div class="v">${hrs} h</div><div class="l">Hours today</div></div><div class="kpi"><div class="v">${rec&&rec.clockIn?fmtT(rec.clockIn):'—'}</div><div class="l">Clock in</div></div><div class="kpi"><div class="v">${rec&&rec.clockOut?fmtT(rec.clockOut):'—'}</div><div class="l">Clock out</div></div></div>
    ${!rec?`<button class="btn btn-primary" onclick="clockIn()">🟢 Clock In</button>`:(!rec.clockOut?`<button class="btn btn-danger" onclick="clockOut()">🔴 Clock Out</button>`:`<span class="t-meta">You have completed today's shift.</span>`)}
  </div></div>
  <div class="panel"><div class="panel-h"><h3>My attendance history</h3></div><div class="table-scroll"><table class="tbl"><thead><tr><th>Date</th><th>In</th><th>Out</th><th>Hours</th></tr></thead><tbody>${hist.map(a=>{const h=a.clockIn?(((a.clockOut||a.clockIn)-a.clockIn)/3600000).toFixed(1):'0.0';return `<tr><td>${a.date}</td><td>${a.clockIn?fmtT(a.clockIn):'—'}</td><td>${a.clockOut?fmtT(a.clockOut):'—'}</td><td>${h} h</td></tr>`;}).join('')||'<tr><td colspan="4"><div class="empty">No records.</div></td></tr>'}</tbody></table></div></div>`;
}

function dailyView(){
  const u=currentUser();
  const mine=db.dailyReports.filter(r=>r.userId===u.id).sort((a,b)=>b.ts-a.ts);
  return `<div class="panel"><div class="panel-h"><h3>Submit today's activity report</h3></div><div class="panel-b">
    <div class="grid-2c">
      <div class="fld"><label>Calls made</label><input id="dr-calls" type="number" min="0" value="0"></div>
      <div class="fld"><label>Meetings / demos</label><input id="dr-meet" type="number" min="0" value="0"></div>
    </div>
    <div class="fld"><label>Summary</label><textarea id="dr-sum" rows="3" placeholder="What did you accomplish today?"></textarea></div>
    <div class="fld"><label>Call log screenshot (proof of total calls)</label>
      <input id="dr-img" type="file" accept="image/*" onchange="handleDailyImg(this)">
      <div id="dr-img-prev" style="margin-top:8px"></div>
    </div>
    <button class="btn btn-primary" onclick="submitDaily()">Submit Report</button>
  </div></div>
  <div class="panel"><div class="panel-h"><h3>My recent reports</h3></div><div class="table-scroll"><table class="tbl"><thead><tr><th>Date</th><th>Calls</th><th>Meetings</th><th>Summary</th><th>Call proof</th></tr></thead><tbody>${mine.map(r=>`<tr><td>${r.date}</td><td>${r.calls}</td><td>${r.meetings}</td><td>${esc(r.summary)}</td><td>${r.image?`<img src="${r.image}" alt="call log" title="Click to view" style="height:36px;border-radius:6px;cursor:pointer;border:1px solid var(--line)" onclick="openDailyImg('${r.id}')">`:'<span class="t-meta">—</span>'}</td></tr>`).join('')||'<tr><td colspan="5"><div class="empty">No reports yet.</div></td></tr>'}</tbody></table></div></div>`;
}

/* Daily-report call-log image: compress client-side, keep in memory until submit */
let _drImg=null;
function _compressImg(file, cb){
  const reader=new FileReader();
  reader.onload=function(e){
    const img=new Image();
    img.onload=function(){
      const max=1200; let w=img.width, h=img.height;
      if(w>max||h>max){ const s=Math.min(max/w,max/h); w=Math.round(w*s); h=Math.round(h*s); }
      const c=document.createElement('canvas'); c.width=w; c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      cb(c.toDataURL('image/jpeg',0.7));
    };
    img.onerror=function(){ cb(null); };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function handleDailyImg(input){
  const f=input.files&&input.files[0];
  if(!f){ _drImg=null; const p=$('#dr-img-prev'); if(p)p.innerHTML=''; return; }
  if(!/^image\//.test(f.type)){ toast('Please select an image file'); input.value=''; _drImg=null; return; }
  _compressImg(f,function(dataUrl){
    if(!dataUrl){ toast('Could not read that image'); return; }
    _drImg=dataUrl;
    const p=$('#dr-img-prev'); if(p) p.innerHTML='<img src="'+dataUrl+'" alt="call log preview" style="max-width:180px;max-height:140px;border-radius:8px;border:1px solid var(--line)">';
  });
}
function openDailyImg(id){
  const r=db.dailyReports.find(x=>x.id===id); if(!r||!r.image) return;
  modal(`<div class="modal" onclick="event.stopPropagation()"><div class="modal-h"><h3>Call log — ${esc(r.date)}</h3><button class="x" onclick="closeModal()">×</button></div><div class="modal-b" style="text-align:center"><img src="${r.image}" alt="call log" style="max-width:100%;border-radius:8px"></div></div>`);
}

function perfView(){
  const u=currentUser();
  const mine=db.leads.filter(l=>l.ownerId===u.id);
  const won=mine.filter(l=>l.stage==='Won');
  const conv=mine.length?Math.round(won.length/mine.length*100):0;
  const val=won.reduce((a,l)=>a+(+l.value||0),0);
  return `<div class="kpis">${kpi(mine.length,'Assigned Leads','🎯')}${kpi(won.length,'Deals Won','🏆')}${kpi(conv+'%','Win Rate','📈')}${kpi(money(val),'Revenue Won','💰')}</div>
  <div class="row-2"><div class="panel"><div class="panel-h"><h3>My pipeline by stage</h3></div><div class="panel-b">${stageBars(mine)}</div></div>
  <div class="panel"><div class="panel-h"><h3>My recent activity</h3></div><div class="panel-b"><ul class="timeline">${db.activityLogs.filter(a=>a.userId===u.id).slice(0,8).map(a=>`<li><div class="t-txt">${esc(a.action)}</div><div class="t-meta">${ago(a.ts)}</div></li>`).join('')||'<li><div class="t-txt">No activity yet.</div></li>'}</ul></div></div></div>`;
}

/* ============================================================
   MODALS
   ============================================================ */
function modal(html){ $('#modal-root').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">${html}</div>`; }
function closeModal(){ const m=$('#modal-root'); if(m) m.innerHTML=''; }

function openLead(id){
  const l=db.leads.find(x=>x.id===id); if(!l) return;
  const u=currentUser(); const mgr=u.role==='manager';
  const sdrs=db.users.filter(x=>x.role==='sdr');
  modal(`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-h"><h3>${esc(l.name)} <span class="stage ${STAGE_CLASS[l.stage]}" style="margin-left:8px">${l.stage}</span></h3><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="grid-2c">
        <div class="fld"><label>Email</label><input value="${esc(l.email)}" onchange="updLead('${l.id}','email',this.value)"></div>
        <div class="fld"><label>Phone</label><input value="${esc(l.phone)}" onchange="updLead('${l.id}','phone',this.value)"></div>
        <div class="fld"><label>Company</label><input value="${esc(l.company)}" onchange="updLead('${l.id}','company',this.value)"></div>
        <div class="fld"><label>Service</label><select onchange="updLead('${l.id}','service',this.value)">${SERVICES.map(s=>`<option ${l.service===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="fld"><label>Stage</label><select onchange="updStage('${l.id}',this.value)">${STAGES.map(s=>`<option ${l.stage===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="fld"><label>Deal value ($)</label><input type="number" value="${l.value||0}" onchange="updLead('${l.id}','value',this.value)"></div>
        <div class="fld"><label>Owner (SDR)</label><select ${mgr?'':'disabled'} onchange="assignLead('${l.id}',this.value)"><option value="">Unassigned</option>${sdrs.map(s=>`<option value="${s.id}" ${l.ownerId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="fld"><label>Follow-up date</label><input type="date" value="${l.followUpAt?new Date(l.followUpAt).toISOString().slice(0,10):''}" onchange="setFollow('${l.id}',this.value)"></div>
      </div>
      <div style="margin:6px 0 14px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="logCall('${l.id}')">📞 Log Call</button>
        <button class="btn btn-ghost btn-sm" onclick="logMeeting('${l.id}')">📅 Log Meeting</button>
        <button class="btn btn-ghost btn-sm" onclick="logEmail('${l.id}')">✉️ Log Email</button>
      </div>
      <label style="font-size:.8rem;font-weight:700;color:var(--slate)">Add note</label>
      <div style="display:flex;gap:8px;margin:6px 0 12px"><input id="note-in" placeholder="Type a note…" style="flex:1;padding:9px 12px;border:1px solid var(--line);border-radius:8px"><button class="btn btn-primary btn-sm" onclick="addNote('${l.id}')">Add</button></div>
      ${l.notes.length?`<div style="margin-bottom:14px">${l.notes.slice().reverse().map(n=>`<div class="note-item">${esc(n.text)}<div class="m">${esc(n.by==='system'?'system':userName(n.by))} · ${fmtT(n.ts)}</div></div>`).join('')}</div>`:''}
      <h3 style="font-size:.95rem;margin:6px 0">Activity timeline</h3>
      <ul class="timeline">${l.activities.slice().reverse().map(a=>`<li><div class="t-txt">${esc(a.text)}</div><div class="t-meta">${esc(a.by==='system'?'system':userName(a.by))} · ${fmtT(a.ts)}</div></li>`).join('')}</ul>
    </div>
    <div class="modal-f">${mgr?`<button class="btn btn-danger" onclick="deleteLead('${l.id}')">Delete Lead</button>`:''}<button class="btn btn-primary" onclick="closeModal()">Done</button></div>
  </div>`);
}

function openLeadForm(){
  const u=currentUser(); const mgr=u.role==='manager'; const sdrs=db.users.filter(x=>x.role==='sdr');
  modal(`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-h"><h3>Add new lead</h3><button class="x" onclick="closeModal()">×</button></div>
    <form onsubmit="return createLead(event)"><div class="modal-b">
      <div class="grid-2c">
        <div class="fld"><label>Name *</label><input id="nl-name" required></div>
        <div class="fld"><label>Email</label><input id="nl-email" type="email"></div>
        <div class="fld"><label>Phone</label><input id="nl-phone"></div>
        <div class="fld"><label>Company</label><input id="nl-company"></div>
        <div class="fld"><label>Service</label><select id="nl-service">${SERVICES.map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div class="fld"><label>Deal value ($)</label><input id="nl-value" type="number" value="0"></div>
        <div class="fld"><label>Stage</label><select id="nl-stage">${STAGES.map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div class="fld"><label>Owner</label><select id="nl-owner"><option value="${mgr?'':u.id}">${mgr?'Unassigned':esc(u.name)}</option>${mgr?sdrs.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join(''):''}</select></div>
      </div>
    </div><div class="modal-f"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Create Lead</button></div></form>
  </div>`);
}

function openUserForm(id){
  const u=id?db.users.find(x=>x.id===id):null;
  modal(`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-h"><h3>${u?'Edit SDR':'Add SDR'}</h3><button class="x" onclick="closeModal()">×</button></div>
    <form onsubmit="return saveUser(event,'${id||''}')"><div class="modal-b">
      <div class="grid-2c">
        <div class="fld"><label>Full name *</label><input id="uf-name" value="${u?esc(u.name):''}" required></div>
        <div class="fld"><label>Email</label><input id="uf-email" type="email" value="${u?esc(u.email):''}"></div>
        <div class="fld"><label>Username *</label><input id="uf-user" value="${u?esc(u.username):''}" required></div>
        <div class="fld"><label>Password *</label><input id="uf-pass" value="${u?esc(u.password):'sdr123'}" required></div>
      </div>
    </div><div class="modal-f"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">${u?'Save':'Create SDR'}</button></div></form>
  </div>`);
}

function openBlogForm(id){
  const u=currentUser(); const mgr=u.role==='manager';
  const p=id?db.blogPosts.find(x=>x.id===id):null;
  const readOnly = p && !mgr && p.status==='published';
  modal(`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-h"><h3>${p?(readOnly?'View post':'Edit post'):'New blog post'}</h3><button class="x" onclick="closeModal()">×</button></div>
    <form onsubmit="return saveBlog(event,'${id||''}')"><div class="modal-b">
      <div class="fld"><label>Title</label><input id="bf-title" value="${p?esc(p.title):''}" ${readOnly?'disabled':''} required></div>
      <div class="fld"><label>Content</label><textarea id="bf-body" rows="8" ${readOnly?'disabled':''}>${p?esc(p.body):''}</textarea></div>
      ${!mgr?'<p class="t-meta">Submitting sends this post to your manager for approval.</p>':''}
    </div><div class="modal-f"><button type="button" class="btn btn-ghost" onclick="closeModal()">Close</button>${readOnly?'':`<button type="submit" class="btn btn-primary">${mgr?'Save & Publish':'Submit for Approval'}</button>`}</div></form>
  </div>`);
}

function openNotifs(){
  modal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:460px">
    <div class="modal-h"><h3>Notifications</h3><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">${db.notifications.length?db.notifications.slice(0,30).map(n=>`<div class="note-item" style="${n.read?'opacity:.6':''}">${esc(n.text)}<div class="m">${ago(n.ts)}</div></div>`).join(''):'<div class="empty">No notifications.</div>'}</div>
    <div class="modal-f"><button class="btn btn-ghost" onclick="markNotifs()">Mark all read</button><button class="btn btn-primary" onclick="closeModal()">Close</button></div>
  </div>`);
}

/* ============================================================
   ACTIONS
   ============================================================ */
function refreshAfter(){ save(); renderContent(); }
function updLead(id,field,val){ const l=db.leads.find(x=>x.id===id); if(!l)return; l[field]=field==='value'?(+val||0):val; save(); }
function updStage(id,val){ const l=db.leads.find(x=>x.id===id); if(!l)return; const old=l.stage; l.stage=val; l.activities.push({ts:Date.now(),by:currentUser().id,type:'stage',text:`Stage changed: ${old} → ${val}`}); logActivity(`Updated lead "${l.name}" to ${val}`); save(); openLead(id); renderContent(); }
function assignLead(id,owner){ const l=db.leads.find(x=>x.id===id); if(!l)return; l.ownerId=owner||null; l.activities.push({ts:Date.now(),by:currentUser().id,type:'assign',text:'Assigned to '+(owner?userName(owner):'Unassigned')}); logActivity(`Assigned "${l.name}" to ${owner?userName(owner):'Unassigned'}`); save(); openLead(id); renderContent(); }
function setFollow(id,val){ const l=db.leads.find(x=>x.id===id); if(!l)return; l.followUpAt=val?new Date(val+'T09:00:00').getTime():null; l.activities.push({ts:Date.now(),by:currentUser().id,type:'followup',text:'Follow-up set for '+(val||'none')}); save(); toast('Follow-up updated'); }
function addNote(id){ const inp=$('#note-in'); const v=inp.value.trim(); if(!v)return; const l=db.leads.find(x=>x.id===id); l.notes.push({ts:Date.now(),by:currentUser().id,text:v}); l.activities.push({ts:Date.now(),by:currentUser().id,type:'note',text:'Note added'}); save(); openLead(id); }
function logCall(id){ logTouch(id,'📞 Call logged','Logged a call'); }
function logMeeting(id){ logTouch(id,'📅 Meeting logged','Logged a meeting'); }
function logEmail(id){ logTouch(id,'✉️ Email logged','Logged an email'); }
function logTouch(id,text,act){ const l=db.leads.find(x=>x.id===id); l.activities.push({ts:Date.now(),by:currentUser().id,type:'touch',text}); logActivity(`${act} with ${l.name}`); save(); openLead(id); toast(text); }
function deleteLead(id){ if(!confirm('Delete this lead permanently?'))return; const l=db.leads.find(x=>x.id===id); db.leads=db.leads.filter(x=>x.id!==id); logActivity(`Deleted lead "${l.name}"`); save(); closeModal(); renderContent(); toast('Lead deleted'); }
function createLead(e){ e.preventDefault(); const o={name:$('#nl-name').value.trim(),email:$('#nl-email').value.trim(),phone:$('#nl-phone').value.trim(),company:$('#nl-company').value.trim(),service:$('#nl-service').value,value:+$('#nl-value').value||0,stage:$('#nl-stage').value,ownerId:$('#nl-owner').value||null,source:'Manual'}; const l=makeLead(o); l.stage=o.stage; l.value=o.value; l.ownerId=o.ownerId; db.leads.unshift(l); logActivity(`Created lead "${l.name}"`); save(); closeModal(); renderContent(); toast('Lead created'); return false; }

function saveUser(e,id){ e.preventDefault(); const name=$('#uf-name').value.trim(),email=$('#uf-email').value.trim(),un=$('#uf-user').value.trim(),pw=$('#uf-pass').value;
  if(db.users.some(u=>u.username===un&&u.id!==id)){ toast('Username already taken'); return false; }
  if(id){ const u=db.users.find(x=>x.id===id); Object.assign(u,{name,email,username:un,password:pw}); logActivity(`Edited SDR "${name}"`); }
  else { db.users.push({id:uid(),name,email,username:un,password:pw,role:'sdr',status:'active'}); logActivity(`Created SDR account for ${name}`); }
  save(); closeModal(); renderContent(); toast('Saved'); return false; }
function toggleUser(id){ const u=db.users.find(x=>x.id===id); u.status=u.status==='active'?'inactive':'active'; logActivity(`${u.status==='active'?'Enabled':'Disabled'} SDR "${u.name}"`); save(); renderContent(); }
function deleteUser(id){ const u=db.users.find(x=>x.id===id); if(!confirm(`Delete ${u.name}? Their leads will become unassigned.`))return; db.leads.forEach(l=>{ if(l.ownerId===id) l.ownerId=null; }); db.users=db.users.filter(x=>x.id!==id); logActivity(`Deleted SDR "${u.name}"`); save(); renderContent(); toast('SDR deleted'); }

function approveBlog(id){ const p=db.blogPosts.find(x=>x.id===id); p.status='published'; logActivity(`Approved blog "${p.title}"`); save(); renderContent(); toast('Published'); }
function rejectBlog(id){ const p=db.blogPosts.find(x=>x.id===id); p.status='rejected'; logActivity(`Rejected blog "${p.title}"`); save(); renderContent(); toast('Rejected'); }
function deleteBlog(id){ const p=db.blogPosts.find(x=>x.id===id); if(!confirm('Delete this post?'))return; db.blogPosts=db.blogPosts.filter(x=>x.id!==id); save(); renderContent(); }
function saveBlog(e,id){ e.preventDefault(); const u=currentUser(); const title=$('#bf-title').value.trim(),body=$('#bf-body').value.trim(); if(id){ const p=db.blogPosts.find(x=>x.id===id); p.title=title;p.body=body; if(u.role!=='manager')p.status='pending'; }
  else { const status=u.role==='manager'?'published':'pending'; db.blogPosts.unshift({id:uid(),title,body,authorId:u.id,status,createdAt:Date.now()}); if(u.role!=='manager'){ db.notifications.unshift({id:uid(),ts:Date.now(),text:`${u.name} submitted a blog post for approval`,read:false}); } logActivity(`Created blog "${title}"`); }
  save(); closeModal(); renderContent(); toast(u.role==='manager'?'Saved':'Submitted for approval'); return false; }

function clockIn(){ const u=currentUser(); db.attendance.push({id:uid(),userId:u.id,date:todayStr(),clockIn:Date.now(),clockOut:null,status:'present'}); logActivity('Clocked in'); save(); renderContent(); toast('Clocked in'); }
function clockOut(){ const u=currentUser(); const rec=db.attendance.find(a=>a.userId===u.id&&a.date===todayStr()&&!a.clockOut); if(rec){ rec.clockOut=Date.now(); logActivity('Clocked out'); save(); renderContent(); toast('Clocked out'); } }
function submitDaily(){ const u=currentUser(); const calls=+$('#dr-calls').value||0,meetings=+$('#dr-meet').value||0,summary=$('#dr-sum').value.trim(); const image=_drImg||null; try { db.dailyReports.unshift({id:uid(),userId:u.id,date:todayStr(),calls,meetings,summary,image,ts:Date.now()}); save(); } catch(e){ db.dailyReports.shift(); toast('Image too large to store — try a smaller screenshot'); return; } _drImg=null; logActivity(`Submitted daily report (${calls} calls, ${meetings} meetings)`); renderContent(); toast('Report submitted'); }

function saveSettings(){ db.settings={company:$('#set-company').value,currency:$('#set-cur').value,email:$('#set-email').value,phone:$('#set-phone').value}; logActivity('Updated CRM settings'); save(); toast('Settings saved'); }
function markNotifs(){ db.notifications.forEach(n=>n.read=true); save(); render(); openNotifs(); }
function resetData(){ if(!confirm('Reset ALL CRM data to demo defaults?'))return; localStorage.removeItem(DB_KEY); db=load(); render(); toast('Data reset'); }

/* CSV export/import */
function download(name,text){ const b=new Blob([text],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); }
function exportLeads(){ const h=['Name','Email','Phone','Company','Service','Stage','Owner','Source','Value','Created']; const rows=db.leads.map(l=>[l.name,l.email,l.phone,l.company,l.service,l.stage,userName(l.ownerId),l.source,l.value,fmt(l.createdAt)]); download('techinrent-leads.csv',[h,...rows].map(r=>r.map(c=>`"${String(c==null?'':c).replace(/"/g,'""')}"`).join(',')).join('\n')); toast('Leads exported'); }
function exportAttendance(){ const h=['SDR','Date','ClockIn','ClockOut','Hours']; const rows=db.attendance.map(a=>[userName(a.userId),a.date,a.clockIn?fmtT(a.clockIn):'',a.clockOut?fmtT(a.clockOut):'',a.clockIn?(((a.clockOut||a.clockIn)-a.clockIn)/3600000).toFixed(1):'0']); download('techinrent-attendance.csv',[h,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')); toast('Attendance exported'); }
function importLeads(input){ const f=input.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ const lines=String(r.result).split(/\r?\n/).filter(Boolean); let n=0; lines.forEach((line,i)=>{ if(i===0&&/name/i.test(line))return; const c=line.split(',').map(x=>x.replace(/^"|"$/g,'').trim()); if(c[0]){ db.leads.unshift(makeLead({name:c[0],email:c[1]||'',phone:c[2]||'',company:c[3]||'',service:c[4]||'Lead Generation',source:'Import'})); n++; } }); logActivity(`Imported ${n} leads from CSV`); save(); renderContent(); toast(n+' leads imported'); }; r.readAsText(f); }

/* ============================================================
   DEMO BOOKINGS (server-side, persistent across devices)
   ============================================================ */
function bookingsView(){
  setTimeout(loadBookings, 0);
  return `<div id="bookings-root"><div class="empty">Loading demo bookings…</div></div>`;
}
async function loadBookings(){
  const root=document.getElementById('bookings-root'); if(!root) return;
  if(!API_TOKEN){ root.innerHTML=bookingsUnlockHTML(); return; }
  root.innerHTML='<div class="empty">Loading demo bookings…</div>';
  const res=await fetchBookings();
  if(!res.auth){ root.innerHTML=bookingsUnlockHTML(); return; }
  if(!res.ok){ root.innerHTML=`<div class="empty">Could not load bookings: ${esc(res.error||'error')}</div>`; return; }
  root.innerHTML=bookingsTableHTML();
}
function bookingsUnlockHTML(){
  return `<div class="panel" style="max-width:440px"><div class="panel-h"><h3>🔒 Unlock demo bookings</h3></div><div class="panel-b">
    <p style="color:var(--muted);margin:0 0 12px">Enter the admin password to view and manage live demo requests submitted from the website.</p>
    <form onsubmit="return unlockBookings(event)">
      <div class="fld"><label>Admin password</label><input id="bk-pass" type="password" autocomplete="current-password" required></div>
      <div id="bk-err" style="display:none;color:var(--red);font-size:.85rem;margin:6px 0">Incorrect password. Please try again.</div>
      <button class="btn btn-primary" type="submit" style="margin-top:8px">Unlock</button>
    </form></div></div>`;
}
function bookingPreferred(b){
  if(!b.preferredAt) return '—';
  const d=new Date(b.preferredAt);
  if(isNaN(d.getTime())) return esc(b.preferredAt);
  return d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function bookingsTableHTML(){
  const rows = BOOKINGS.length ? BOOKINGS.map(b=>{
    const opts=BOOKING_STATUSES.map(s=>`<option ${b.status===s?'selected':''}>${s}</option>`).join('');
    return `<tr>
      <td><div class="nm">${esc(b.fullName)}</div><div class="sub">${esc(b.email)}</div></td>
      <td>${esc(b.company)||'—'}</td>
      <td>${esc(b.phone)||'—'}</td>
      <td>${esc(b.service)||'—'}</td>
      <td>${bookingPreferred(b)}</td>
      <td><span class="pill2">${esc(b.source||'Website')}</span></td>
      <td>${fmtT(b.createdAt)}</td>
      <td><select onchange="updateBookingStatus('${b.id}',this.value)">${opts}</select></td>
      <td>${b.message?`<button class="btn btn-ghost btn-sm" onclick="viewBookingMsg('${b.id}')">View</button>`:'—'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="9"><div class="empty">No demo bookings yet. They appear here the moment a visitor submits the booking form on the website.</div></td></tr>`;
  return `<div class="toolbar"><p style="margin:0;color:var(--muted)">Live demo requests captured from the website booking form — <b>${BOOKINGS.length}</b> total.</p><div class="spacer"></div>
    <button class="btn btn-ghost btn-sm" onclick="loadBookings()">↻ Refresh</button>
    <button class="btn btn-ghost btn-sm" onclick="exportBookings()">⬇ Export CSV</button></div>
  <div class="panel"><div class="table-scroll"><table class="tbl">
    <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Service</th><th>Preferred</th><th>Source</th><th>Received</th><th>Status</th><th>Message</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}
function viewBookingMsg(id){
  const b=BOOKINGS.find(x=>x.id===id); if(!b) return;
  modal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:540px">
    <div class="modal-h"><h3>${esc(b.fullName)}</h3><button class="x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <p style="line-height:1.7"><b>Email:</b> ${esc(b.email)}<br><b>Phone:</b> ${esc(b.phone||'—')}<br><b>Company:</b> ${esc(b.company||'—')}<br><b>Service:</b> ${esc(b.service||'—')}<br><b>Preferred time:</b> ${bookingPreferred(b)}<br><b>Status:</b> ${esc(b.status)}</p>
      <label style="font-size:.8rem;font-weight:700;color:var(--slate)">Message</label>
      <p style="white-space:pre-wrap;background:#f1f4f9;padding:12px;border-radius:8px;margin-top:6px">${esc(b.message||'(no message)')}</p>
    </div>
    <div class="modal-f"><a class="btn btn-ghost" href="mailto:${esc(b.email)}">✉️ Reply by email</a><button class="btn btn-primary" onclick="closeModal()">Close</button></div>
  </div>`);
}
function exportBookings(){
  const h=['Name','Company','Email','Phone','Service','Preferred','Source','Status','Received','Message'];
  const rows=BOOKINGS.map(b=>[b.fullName,b.company,b.email,b.phone,b.service,b.preferredAt,b.source,b.status,fmtT(b.createdAt),b.message]);
  download('techinrent-bookings.csv',[h,...rows].map(r=>r.map(c=>`"${String(c==null?'':c).replace(/"/g,'""')}"`).join(',')).join('\n'));
  toast('Bookings exported');
}

/* ---------- boot ---------- */
render();
