// ── FIREBASE INIT ─────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBLS9Qxt-aHRhgzf0CtegeVg5CdByA3ouc",
  authDomain: "plan2026-b945e.firebaseapp.com",
  projectId: "plan2026-b945e",
  storageBucket: "plan2026-b945e.firebasestorage.app",
  messagingSenderId: "663556645289",
  appId: "1:663556645289:web:e1bb6a241df259442664b8",
  measurementId: "G-BL9PDSYY0Z"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const DOC_REF = db.collection('plans').doc('main');

// ── DATA ──────────────────────────────────────────
const DEFAULTS={
  groups:[
    {id:1,name:'Grupo 1',day:'Miércoles',time:'7:30 PM',color:'purple',
     leader:'Omarly Morales',assistant:'[ Editar ]',host:'[ Editar ]',
     members:['Omarly Morales','Diarelys Duno','Andrea','Ohtiel Morales','Jose','Jefferson Morales','Carlos Aguirre','Danitza Cancino','Daniel Aguilar']},
    {id:2,name:'Jóvenes',day:'Miércoles',time:'7:30 PM',color:'indigo',
     leader:'Jornelys Rojas',assistant:'[ Editar ]',host:'[ Editar ]',
     members:['Jornelys Rojas','Jacob Rojas','Valeria','Sophie Salazar','Gabby Mendoza','Estefani Rojas','Juliet Salazar']},
    {id:3,name:'Grupo 3',day:'Miércoles',time:'7:30 PM',color:'blue',
     leader:'Karen Morales',assistant:'[ Editar ]',host:'[ Editar ]',
     members:['Karen Morales','Eryka Maestre','Miguel Ofrad','Endrina Baez','Noe Aaron Sanchez','Miguel Hernandez','YesliDavila']},
    {id:4,name:'Grupo 2',day:'Viernes',time:'7:30 PM',color:'teal',
     leader:'Jorge Rojas',assistant:'[ Editar ]',host:'Hemni',
     members:['Jorge Rojas','Nelenys Ruiz','Grecelys','Hemni']},
  ],
  prayerList:['Nehemias Nava','Omarly Morales','Jornelys Rojas','Karen Morales','Jorge Rojas',
    'Diarelys Duno','Jacob Rojas','Valeria','Andrea','Ohtiel Morales','Jose','Jefferson Morales',
    'Carlos Aguirre','Danitza Cancino','Daniel Aguilar','Eryka Maestre','Miguel Ofrad',
    'Endrina Baez','Noe Aaron Sanchez','YesliDavila','Nelenys Ruiz','Grecelys','Hemni',
    'Sophie Salazar','Gabby Mendoza','Estefani Rojas','Juliet Salazar','Isaac Rojas'],
  completions:{},goalProgress:{},notes:'',customEvents:[],
  activities:{
    women:   ['2026-03-26','2026-05-28','2026-07-23'],
    menBreak:['2026-04-18','2026-06-20'],
    fasting: ['2026-03-20','2026-06-19'],
  }
};

// Load from localStorage first (instant), then sync from Firestore
function loadLocal(){
  const r=localStorage.getItem('cdg2026v5');
  if(!r)return JSON.parse(JSON.stringify(DEFAULTS));
  try{const d=JSON.parse(r);if(!d.customEvents)d.customEvents=[];return d;}
  catch{return JSON.parse(JSON.stringify(DEFAULTS));}
}

// Save to both localStorage AND Firestore
let _saveTimer=null;
function save(){
  // Instant local save
  localStorage.setItem('cdg2026v5',JSON.stringify(D));
  // Debounced cloud save (waits 800ms to batch rapid changes)
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{
    DOC_REF.set({data:JSON.stringify(D),updatedAt:firebase.firestore.FieldValue.serverTimestamp()})
      .then(()=>{console.log('☁️ Guardado en la nube');showSyncStatus('synced');})
      .catch(err=>{console.error('❌ Error guardando en la nube:',err);showSyncStatus('error');});
  },800);
  showSyncStatus('saving');
}

// Sync indicator
function showSyncStatus(status){
  let el=document.getElementById('sync-status');
  if(!el){
    el=document.createElement('div');el.id='sync-status';
    el.style.cssText='position:fixed;bottom:70px;right:16px;z-index:50;font-size:11px;font-weight:700;padding:5px 12px;border-radius:99px;display:flex;align-items:center;gap:5px;transition:all .3s;pointer-events:none;';
    document.body.appendChild(el);
  }
  if(status==='saving'){el.style.background='rgba(255,159,10,.15)';el.style.color='#FF9F0A';el.textContent='☁️ Guardando...';el.style.opacity='1';}
  else if(status==='synced'){el.style.background='rgba(52,199,89,.15)';el.style.color='#34C759';el.textContent='✓ Sincronizado';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',2000);}
  else if(status==='error'){el.style.background='rgba(255,59,48,.15)';el.style.color='#FF3B30';el.textContent='⚠ Error de red';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',4000);}
  else if(status==='loaded'){el.style.background='rgba(0,122,255,.15)';el.style.color='#007AFF';el.textContent='☁️ Datos cargados';el.style.opacity='1';setTimeout(()=>el.style.opacity='0',2500);}
}

// Load from Firestore and merge (async, runs after initial render)
function syncFromCloud(){
  DOC_REF.get().then(doc=>{
    if(doc.exists&&doc.data().data){
      const cloudData=JSON.parse(doc.data().data);
      if(cloudData.customEvents===undefined)cloudData.customEvents=[];
      // Use cloud data as source of truth
      D=cloudData;
      localStorage.setItem('cdg2026v5',JSON.stringify(D));
      // Re-render current view
      renderDash();
      showSyncStatus('loaded');
      console.log('☁️ Datos sincronizados desde la nube');
    } else {
      // No data in cloud yet — upload local data
      console.log('☁️ Primera vez — subiendo datos locales a la nube');
      save();
    }
  }).catch(err=>{
    console.warn('⚠️ No se pudo conectar a la nube, usando datos locales:',err);
    showSyncStatus('error');
  });
}

// Listen for real-time changes from other devices/tabs
function listenForChanges(){
  DOC_REF.onSnapshot(doc=>{
    if(!doc.exists||!doc.data().data)return;
    const cloudData=JSON.parse(doc.data().data);
    if(cloudData.customEvents===undefined)cloudData.customEvents=[];
    // Only update if cloud data is different from local
    const localStr=JSON.stringify(D);
    const cloudStr=JSON.stringify(cloudData);
    if(localStr!==cloudStr){
      D=cloudData;
      localStorage.setItem('cdg2026v5',JSON.stringify(D));
      renderDash();
      showSyncStatus('loaded');
    }
  },err=>{
    console.warn('⚠️ Error en listener de tiempo real:',err);
  });
}

let D=loadLocal();

// ── Tokens ────────────────────────────────────────
const GCOL={
  purple:{dot:'#AF52DE',strip:'#AF52DE',chipBg:'rgba(175,82,222,.12)',chipBorder:'rgba(175,82,222,.2)',chipTxt:'#AF52DE'},
  indigo:{dot:'#5856D6',strip:'#5856D6',chipBg:'rgba(88,86,214,.12)',chipBorder:'rgba(88,86,214,.2)',chipTxt:'#5856D6'},
  blue:  {dot:'#007AFF',strip:'#007AFF',chipBg:'rgba(0,122,255,.12)', chipBorder:'rgba(0,122,255,.2)', chipTxt:'#007AFF'},
  teal:  {dot:'#30B0C7',strip:'#30B0C7',chipBg:'rgba(48,176,199,.12)',chipBorder:'rgba(48,176,199,.2)',chipTxt:'#30B0C7'},
};
const CAT={
  general:{dot:'#AF52DE',bg:'rgba(175,82,222,.1)',txt:'#AF52DE'},
  women:  {dot:'#FF2D55',bg:'rgba(255,45,85,.1)',txt:'#FF2D55'},
  men:    {dot:'#FF9F0A',bg:'rgba(255,159,10,.1)',txt:'#FF9F0A'},
  fasting:{dot:'#5856D6',bg:'rgba(88,86,214,.1)',txt:'#5856D6'},
  special:{dot:'#FF6B35',bg:'rgba(255,107,53,.1)',txt:'#FF6B35'},
  prayer: {dot:'#007AFF',bg:'rgba(0,122,255,.1)',txt:'#007AFF'},
};
const CAT_ICON={general:'📌',women:'👩',men:'🥞',fasting:'✨',special:'⭐',prayer:'🙏'};
const CAT_NAME={general:'General',women:'Mujeres',men:'Hombres',fasting:'Ayuno',special:'Especial',prayer:'Oración'};
const DAYS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS=[{y:2026,m:2,n:'Marzo'},{y:2026,m:3,n:'Abril'},{y:2026,m:4,n:'Mayo'},{y:2026,m:5,n:'Junio'},{y:2026,m:6,n:'Julio'},{y:2026,m:7,n:'Agosto'}];

// ── Utils ──────────────────────────────────────────
function curWeek(){const s=new Date('2026-03-14'),n=new Date();return Math.max(0,Math.min(23,Math.floor((n-s)/6048e5)));}
function weekInfo(w){const s=new Date('2026-03-14');s.setDate(s.getDate()+w*7);const e=new Date(s);e.setDate(e.getDate()+6);const f=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'short'});return{label:`${f(s)} — ${f(e)}`};}
function fmtDate(s){return new Date(s+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});}
function totalMembers(){return D.groups.reduce((a,g)=>a+g.members.length,0);}
function byDay(day){return D.groups.filter(g=>g.day===day).map(g=>g.name).join(' + ')||day;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function esc2(s){return s.replace(/'/g,"&#39;");}
let _evId=null;

// ── Toast ─────────────────────────────────────────
let _tt;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),2500);}

// ── Notifications ──────────────────────────────────
function requestNotifPerm(){
  if(!('Notification' in window))return toast('Tu navegador no soporta notificaciones');
  Notification.requestPermission().then(p=>{if(p==='granted')toast('🔔 Notificaciones activadas');});
}

// ── TABS ──────────────────────────────────────────
const ALL_TABS=['dash','grupos','cal','pray','metas','share'];
function showTab(name){
  ALL_TABS.forEach(t=>{
    document.getElementById('s-'+t).classList.remove('active');
    const ni=document.getElementById('n-'+t);
    if(ni){ni.classList.remove('active');ni.querySelector('.nav-icon-wrap').style.background='';ni.querySelector('.nav-icon-wrap').style.color='';}
    const bt=document.getElementById('bt-'+t);
    if(bt)bt.classList.remove('active');
  });
  const sec=document.getElementById('s-'+name);
  sec.classList.add('active','fade-up');
  const ni=document.getElementById('n-'+name);
  if(ni){ni.classList.add('active');ni.querySelector('.nav-icon-wrap').style.background='var(--sys-blue)';ni.querySelector('.nav-icon-wrap').style.color='white';}
  const bt=document.getElementById('bt-'+name);
  if(bt)bt.classList.add('active');
  ({dash:renderDash,grupos:renderGroups,cal:renderCal,pray:renderPray,metas:renderMetas,share:renderShare}[name]||renderDash)();
}

// ── DASHBOARD ─────────────────────────────────────
function renderDash(){
  const wk=curWeek(),key='w'+wk,comp=D.completions[key]||{},wd=weekInfo(wk);
  document.getElementById('wk-label').textContent=`Semana ${wk+1} de 24 · ${wd.label}`;
  document.getElementById('st-m').textContent=totalMembers();
  document.getElementById('st-g').textContent=D.groups.length;
  document.getElementById('st-w').textContent=`${wk+1}/24`;
  const pct=Math.round((wk/24)*100);
  ['sb-bar2'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.width=pct+'%';});
  ['sb-pct2'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=pct+'%';});
  const items=[
    {id:'team',icon:'👥',label:'Reunión Líderes — Lunes 7:30 PM',sub:'Equipo de grupos'},
    {id:'gwed',icon:'📖',label:'Grupos Miércoles',sub:byDay('Miércoles')},
    {id:'gfri',icon:'📖',label:'Grupo Viernes',sub:byDay('Viernes')},
    {id:'sun', icon:'⛪',label:'Culto Dominical',sub:'Domingo'},
    {id:'rpt', icon:'📊',label:'Informe en DiscipulApp',sub:'discipulapp.org'},
    {id:'pray',icon:'🙏',label:'Oración 6:00 AM diaria',sub:'20 min · plan rotativo'},
  ];
  const done=Object.values(comp).filter(Boolean).length;
  const wpct=Math.round((done/items.length)*100);
  document.getElementById('st-c').textContent=wpct+'%';
  document.getElementById('week-bar').style.width=wpct+'%';
  document.getElementById('week-pct').textContent=wpct+'%';
  document.getElementById('checklist').innerHTML=items.map(it=>{
    const on=comp[it.id]||false;
    return`<div class="chk-row" onclick="toggle('${key}','${it.id}')">
      <div class="chk-box ${on?'on':''}">✓</div>
      <div class="chk-content">
        <div class="chk-label ${on?'done':''}">${it.icon} ${it.label}</div>
        <div class="chk-sub">${it.sub}</div>
      </div>
    </div>`;
  }).join('');
  const today=new Date();
  const evts=[];
  (D.activities.women||[]).forEach(d=>evts.push({d,icon:'👩',label:'Actividad Ministerio Mujeres',bg:'rgba(255,45,85,.1)'}));
  (D.activities.menBreak||[]).forEach(d=>evts.push({d,icon:'🥞',label:'Desayuno de Hombres',bg:'rgba(255,159,10,.1)'}));
  (D.activities.fasting||[]).forEach(d=>evts.push({d,icon:'✨',label:'Ayuno Congregacional',bg:'rgba(88,86,214,.1)'}));
  (D.customEvents||[]).forEach(e=>evts.push({d:e.start,icon:CAT_ICON[e.cat]||'📌',label:e.title,bg:CAT[e.cat]?.bg||'rgba(0,122,255,.1)'}));
  const fut=evts.filter(e=>new Date(e.d+'T12:00:00')>=today).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,5);
  document.getElementById('upcoming').innerHTML=fut.length?fut.map(e=>`
    <div class="event-row">
      <div class="event-icon-circle" style="background:${e.bg}">${e.icon}</div>
      <div>
        <div class="event-title">${e.label}</div>
        <div class="event-date">${fmtDate(e.d)}</div>
      </div>
    </div>`).join(''):`<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-label">Sin actividades próximas</div></div>`;
  document.getElementById('team-notes').value=D.notes||'';
}
function toggle(key,id){if(!D.completions[key])D.completions[key]={};D.completions[key][id]=!D.completions[key][id];save();renderDash();}
function saveNotes(){D.notes=document.getElementById('team-notes').value;save();const b=document.getElementById('save-notes-btn');b.textContent='✓ Guardado';setTimeout(()=>b.textContent='Guardar',2000);}

// ── GROUPS ────────────────────────────────────────
function renderGroups(){
  document.getElementById('groups-grid').innerHTML=D.groups.map(g=>{
    const c=GCOL[g.color]||GCOL.blue,mc=g.members.length;
    return`<div class="group-card">
      <div class="group-color-strip" style="background:${c.dot}"></div>
      <div class="group-card-header">
        <input type="text" value="${esc(g.name)}" class="group-name-input" onblur="updGrpName(${g.id},this.value)" onkeydown="if(event.key==='Enter')this.blur()">
        <div class="sched-chip" onclick="openSched(${g.id})">
          <span class="sched-chip-text">${g.day} · ${g.time}</span>
          <span class="sched-chip-edit">✎</span>
        </div>
      </div>
      <div class="role-list">
        <div class="role-row" onclick="openRole(${g.id},'leader')"><span class="role-label">👑 Líder</span><span class="role-value">${esc(g.leader)} <span class="role-edit">✎</span></span></div>
        <div class="role-row" onclick="openRole(${g.id},'assistant')"><span class="role-label">🤝 Asistente</span><span class="role-value">${esc(g.assistant)} <span class="role-edit">✎</span></span></div>
        <div class="role-row" onclick="openRole(${g.id},'host')"><span class="role-label">🏠 Anfitrión</span><span class="role-value">${esc(g.host)} <span class="role-edit">✎</span></span></div>
      </div>
      <div class="members-section">
        <div class="members-header">
          <span class="members-title">👥 Miembros (${mc})</span>
          <button class="btn btn-xs btn-secondary" onclick="openAddToGroup(${g.id})">＋ Añadir</button>
        </div>
        <div class="members-chips">
          ${mc?g.members.map(m=>`<span class="member-chip" style="background:${c.chipBg};border:1px solid ${c.chipBorder};color:${c.chipTxt}" onclick="removeMember(${g.id},'${esc2(m)}')" title="Toca para eliminar">${esc(m)} ✕</span>`).join(''):'<span style="font-size:13px;color:var(--label-3);font-style:italic">Sin miembros</span>'}
        </div>
      </div>
    </div>`;
  }).join('');
}
function updGrpName(id,v){const g=D.groups.find(x=>x.id===id);if(g&&v.trim()){g.name=v.trim();save();}}

let _sGid=null,_sDay=null,_sTime=null;
function openSched(gid){
  _sGid=gid;const g=D.groups.find(x=>x.id===gid);_sDay=g.day;_sTime=g.time;
  document.getElementById('m-sched-title').textContent='Horario — '+g.name;
  document.getElementById('time-custom').value='';
  document.querySelectorAll('.chip').forEach(b=>{const t=b.textContent.trim();b.classList.toggle('sel',t===g.day||t===g.time);});
  document.getElementById('m-schedule').style.display='flex';
}
function selDay(d){_sDay=d;document.querySelectorAll('.chip').forEach(b=>{const t=b.textContent.trim();if(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].includes(t))b.classList.toggle('sel',t===d);});}
function selTime(t){_sTime=t;document.getElementById('time-custom').value='';document.querySelectorAll('.chip').forEach(b=>{const tx=b.textContent.trim();if(['6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM'].includes(tx))b.classList.toggle('sel',tx===t);});}
function doSaveSched(){if(!_sGid)return;const g=D.groups.find(x=>x.id===_sGid),c=document.getElementById('time-custom').value.trim();if(c)_sTime=c;if(_sDay)g.day=_sDay;if(_sTime)g.time=_sTime;save();renderGroups();renderDash();closeAll();}

let _rCtx=null;
function openRole(gid,role){
  _rCtx={gid,role};const g=D.groups.find(x=>x.id===gid);
  const names={leader:'Líder',assistant:'Asistente',host:'Anfitrión'};
  document.getElementById('m-role-title').textContent=`Cambiar ${names[role]} — ${g.name}`;
  const sel=document.getElementById('role-sel'),uniq=[...new Set(D.groups.flatMap(x=>x.members))];
  sel.innerHTML='<option value="">— Elegir —</option>'+uniq.map(m=>`<option value="${esc(m)}"${g[role]===m?' selected':''}>${esc(m)}</option>`).join('');
  document.getElementById('role-inp').value=g[role].startsWith('[')?'':g[role];
  document.getElementById('m-role').style.display='flex';
}
function doSaveRole(){if(!_rCtx)return;const{gid,role}=_rCtx,g=D.groups.find(x=>x.id===gid),v=document.getElementById('role-inp').value.trim()||document.getElementById('role-sel').value;if(v){g[role]=v;save();renderGroups();}closeAll();}

let _addGid=null;
function openAddToGroup(gid){_addGid=gid;openAddModal();}
function openAddModal(){
  const sel=document.getElementById('add-group');
  sel.innerHTML='<option value="">Seleccionar...</option>'+D.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');
  if(_addGid)sel.value=_addGid;
  document.getElementById('add-name').value='';document.getElementById('add-role').value='member';
  document.getElementById('m-add').style.display='flex';
  setTimeout(()=>document.getElementById('add-name').focus(),80);
}
function doAddMember(){
  const name=document.getElementById('add-name').value.trim(),gid=parseInt(document.getElementById('add-group').value),role=document.getElementById('add-role').value;
  if(!name||!gid){toast('⚠️ Completa nombre y grupo');return;}
  const g=D.groups.find(x=>x.id===gid);
  if(!g.members.includes(name))g.members.push(name);
  if(role!=='member')g[role]=name;
  save();closeAll();renderGroups();_addGid=null;toast('✓ Persona añadida');
}
function removeMember(gid,name){if(!confirm(`¿Quitar a "${name}"?`))return;const g=D.groups.find(x=>x.id===gid);g.members=g.members.filter(m=>m!==name);['leader','assistant','host'].forEach(r=>{if(g[r]===name)g[r]='[ Editar ]';});save();renderGroups();}

// ── CALENDAR ──────────────────────────────────────
function renderCal(){
  document.getElementById('cal-view').innerHTML=MONTHS.map(mo=>{
    const evts=getMonthEvents(mo.y,mo.m);
    return`<div class="cal-month-card">
      <div class="cal-month-header">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="cal-month-name">${mo.n} ${mo.y}</div>
          <div class="cal-month-count">${evts.length} eventos</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="exportMonthICS(${mo.y},${mo.m})">📥</button>
          <button class="btn btn-sm btn-primary" onclick="openAddEvent('${mo.y}-${String(mo.m+1).padStart(2,'0')}-01')">＋</button>
        </div>
      </div>
      ${evts.map(e=>{
        const cc=CAT[e.cat]||CAT.general;
        return`<div class="cal-row" onclick="openEventDetail(${JSON.stringify(e).replace(/"/g,'&quot;')})">
          <div class="cal-date-block"><div class="cal-day-num">${e.dn}</div><div class="cal-day-name">${e.dayName}</div></div>
          <div class="cal-dot" style="background:${cc.dot}"></div>
          <div class="cal-info"><div class="cal-event-title">${e.icon} ${e.title}</div><div class="cal-event-sub">${e.sub||''}</div></div>
          <div class="cal-tag" style="background:${cc.bg};color:${cc.txt}">${CAT_NAME[e.cat]||'General'}</div>
        </div>`;
      }).join('')}
      ${evts.length===0?`<div class="empty-state" style="padding:20px"><div class="empty-icon" style="font-size:28px">📅</div><div class="empty-label">Sin eventos</div></div>`:''}
    </div>`;
  }).join('');
}

function getMonthEvents(y,m){
  const evts=[],days=new Date(y,m+1,0).getDate();
  const wed=byDay('Miércoles'),fri=byDay('Viernes');
  for(let d=1;d<=days;d++){
    const dow=new Date(y,m,d).getDay();
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dn=DAYS[dow];
    if(dow===0)evts.push({dn:d,dayName:dn,icon:'⛪',title:'Culto Dominical',sub:'Servicio congregacional',cat:'general',date:ds});
    if(dow===1)evts.push({dn:d,dayName:dn,icon:'👥',title:'Reunión Equipo Líderes',sub:'7:30 PM · Líderes',cat:'general',date:ds});
    if(dow===3)evts.push({dn:d,dayName:dn,icon:'📖',title:'Grupos Miércoles',sub:wed+' · 7:30 PM',cat:'general',date:ds});
    if(dow===5)evts.push({dn:d,dayName:dn,icon:'📖',title:'Grupo Viernes',sub:fri+' · 7:30 PM',cat:'general',date:ds});
  }
  const add=(dates,cat,icon,title,sub)=>dates.forEach(ds=>{const dt=new Date(ds+'T12:00:00');if(dt.getFullYear()===y&&dt.getMonth()===m)evts.push({dn:dt.getDate(),dayName:DAYS[dt.getDay()],icon,title,sub,cat,date:ds});});
  add(D.activities.women,'women','👩','Actividad Ministerio Mujeres','Cada 2 meses');
  add(D.activities.menBreak,'men','🥞','Desayuno de Hombres','Evento especial');
  add(D.activities.fasting,'fasting','✨','Ayuno Congregacional','Ayuno trimestral');
  (D.customEvents||[]).forEach(e=>{
    const dt=new Date(e.start+'T12:00:00');
    if(dt.getFullYear()===y&&dt.getMonth()===m)
      evts.push({dn:dt.getDate(),dayName:DAYS[dt.getDay()],icon:CAT_ICON[e.cat]||'📌',title:e.title,sub:e.location||e.desc||'',cat:e.cat,date:e.start,timeStart:e.timeStart,timeEnd:e.timeEnd,isCustom:true,evId:e.id});
  });
  evts.sort((a,b)=>a.dn-b.dn);return evts;
}

function openAddEvent(defaultDate){
  _evId=null;
  document.getElementById('m-event-title').textContent='Nuevo evento';
  document.getElementById('ev-title').value='';
  document.getElementById('ev-start').value=defaultDate||'';
  document.getElementById('ev-end').value='';
  document.getElementById('ev-time-start').value='19:30';
  document.getElementById('ev-time-end').value='21:00';
  document.getElementById('ev-cat').value='general';
  document.getElementById('ev-location').value='';
  document.getElementById('ev-desc').value='';
  document.getElementById('ev-export-row').style.display='none';
  document.getElementById('m-event').style.display='flex';
}
function openEditEvent(evId){
  const e=D.customEvents.find(x=>x.id===evId);if(!e)return;
  _evId=evId;
  document.getElementById('m-event-title').textContent='Editar evento';
  document.getElementById('ev-title').value=e.title;
  document.getElementById('ev-start').value=e.start;
  document.getElementById('ev-end').value=e.end||'';
  document.getElementById('ev-time-start').value=e.timeStart||'19:30';
  document.getElementById('ev-time-end').value=e.timeEnd||'21:00';
  document.getElementById('ev-cat').value=e.cat||'general';
  document.getElementById('ev-location').value=e.location||'';
  document.getElementById('ev-desc').value=e.desc||'';
  document.getElementById('ev-export-row').style.display='none';
  closeAll();document.getElementById('m-event').style.display='flex';
}
function doSaveEvent(){
  const title=document.getElementById('ev-title').value.trim();
  if(!title){toast('⚠️ El título es obligatorio');return;}
  const ev={
    id:_evId||(Date.now()+''),title,
    start:document.getElementById('ev-start').value,
    end:document.getElementById('ev-end').value,
    timeStart:document.getElementById('ev-time-start').value,
    timeEnd:document.getElementById('ev-time-end').value,
    cat:document.getElementById('ev-cat').value,
    location:document.getElementById('ev-location').value.trim(),
    desc:document.getElementById('ev-desc').value.trim(),
  };
  if(_evId){const i=D.customEvents.findIndex(x=>x.id===_evId);if(i>=0)D.customEvents[i]=ev;}
  else D.customEvents.push(ev);
  save();
  document.getElementById('ev-gcal-btn').onclick=()=>window.open(buildGCalLink(ev),'_blank');
  document.getElementById('ev-ical-btn').onclick=()=>downloadSingleICS(ev);
  document.getElementById('ev-export-row').style.display='grid';
  toast('✓ Evento guardado');renderCal();renderDash();
}
function deleteEvent(evId){if(!confirm('¿Eliminar este evento?'))return;D.customEvents=D.customEvents.filter(x=>x.id!==evId);save();closeAll();renderCal();renderDash();toast('🗑 Evento eliminado');}

function openEventDetail(e){
  if(typeof e==='string')e=JSON.parse(e);
  document.getElementById('m-evd-title').textContent=e.icon+' '+e.title;
  let body=`<div style="margin-bottom:6px">📅 ${fmtDate(e.date)}</div>`;
  if(e.timeStart)body+=`<div style="margin-bottom:6px">🕐 ${e.timeStart}${e.timeEnd?' — '+e.timeEnd:''}</div>`;
  if(e.sub)body+=`<div>ℹ️ ${e.sub}</div>`;
  document.getElementById('m-evd-body').innerHTML=body;
  document.getElementById('m-evd-gcal').onclick=()=>window.open(buildGCalLink({title:e.title,start:e.date,end:e.date,timeStart:e.timeStart||'19:30',timeEnd:e.timeEnd||'21:00',desc:e.sub||'',location:''}),'_blank');
  document.getElementById('m-evd-ical').onclick=()=>downloadSingleICS({title:e.title,start:e.date,end:e.date,timeStart:e.timeStart||'19:30',timeEnd:e.timeEnd||'21:00',desc:e.sub||'',location:''});
  const editBtn=document.getElementById('m-evd-edit'),delBtn=document.getElementById('m-evd-del');
  if(e.isCustom){editBtn.style.display='flex';delBtn.style.display='flex';editBtn.onclick=()=>openEditEvent(e.evId);delBtn.onclick=()=>deleteEvent(e.evId);}
  else{editBtn.style.display='none';delBtn.style.display='none';}
  document.getElementById('m-event-detail').style.display='flex';
}

// ── PRAYER ────────────────────────────────────────
function renderPray(){
  document.getElementById('pray-list-rows').innerHTML=D.prayerList.length?
    D.prayerList.map((name,i)=>`
      <div class="list-row">
        <div class="list-row-icon" style="background:rgba(0,122,255,.1);font-size:13px;font-weight:700;color:var(--sys-blue)">${i+1}</div>
        <input type="text" value="${esc(name)}" class="pray-person-name" onblur="updatePrayName(${i},this.value)" onkeydown="if(event.key==='Enter')this.blur()" placeholder="Nombre...">
        <button class="pray-del-btn" onclick="deletePrayName(${i})" title="Eliminar">✕</button>
      </div>`).join('')
    :`<div class="empty-state"><div class="empty-icon">🙏</div><div class="empty-label">Lista vacía</div><div class="empty-sub">Añade personas con el botón ＋</div></div>`;

  const members=D.prayerList,wk=curWeek();
  if(!members.length){document.getElementById('pray-view').innerHTML='';return;}
  let html='';
  for(let w=0;w<24;w++){
    const isNow=w===wk,wd=weekInfo(w);
    const assigns=DAYS.map((_,i)=>members[(w*7+i)%members.length]);
    html+=`<div class="pray-week-card ${isNow?'current':''}">
      <div class="pray-week-header">
        <div class="pray-week-label">${isNow?'⭐ ':''}Semana ${w+1} · ${wd.label}</div>
        ${isNow?'<div class="pray-week-badge">Esta semana</div>':''}
      </div>
      <div class="pray-day-grid">
        ${assigns.map((n,i)=>`<div class="pray-day-cell"><div class="pray-day-lbl">${DAYS[i]}</div><div class="pray-day-name">${n}</div></div>`).join('')}
      </div>
    </div>`;
  }
  document.getElementById('pray-view').innerHTML=html;
}
function updatePrayName(index,newName){
  const name=newName.trim();
  if(name&&name!==D.prayerList[index]){D.prayerList[index]=name;save();toast('✓ Nombre actualizado');}
  else if(!name){document.getElementById('pray-list-rows').querySelectorAll('input')[index].value=D.prayerList[index];}
}
function deletePrayName(index){if(!confirm(`¿Quitar a "${D.prayerList[index]}" del plan de oración?`))return;D.prayerList.splice(index,1);save();renderPray();toast('🗑 Persona eliminada');}
function openPrayModal(){document.getElementById('pray-name').value='';document.getElementById('m-pray').style.display='flex';setTimeout(()=>document.getElementById('pray-name').focus(),80);}
function doAddPray(){const n=document.getElementById('pray-name').value.trim();if(!n)return;if(!D.prayerList.includes(n)){D.prayerList.push(n);save();renderPray();toast('✓ Añadido al plan');}closeAll();}

// ── GOALS ─────────────────────────────────────────
const GOAL_DEFS=[
  {id:'attend',icon:'📋',bg:'rgba(0,122,255,.1)',title:'Asistencia',monthly:'80% asistencia semanal',quarterly:'Registro en DiscipulApp'},
  {id:'growth',icon:'🌱',bg:'rgba(52,199,89,.1)',title:'Crecimiento',monthly:'1 persona nueva invitada',quarterly:'2–3 personas nuevas'},
  {id:'study', icon:'📖',bg:'rgba(88,86,214,.1)',title:'Estudio Bíblico',monthly:'Completar el material del mes',quarterly:'Terminar libro o serie'},
  {id:'prayer',icon:'🙏',bg:'rgba(0,122,255,.08)',title:'Oración',monthly:'Participar en plan de 6 AM',quarterly:'Ayuno completado'},
  {id:'serve', icon:'🤲',bg:'rgba(255,159,10,.1)',title:'Servicio',monthly:'1 miembro sirviendo',quarterly:'2 incorporados al servicio'},
];
function renderMetas(){
  if(!D.goalProgress)D.goalProgress={};
  document.getElementById('metas-view').innerHTML=D.groups.map(g=>{
    const c=GCOL[g.color]||GCOL.blue,mc=g.members.length;
    const size=mc<=5?'Pequeño':mc<=10?'Mediano':'Grande';
    return`<div class="card" style="overflow:visible">
      <div class="card-header" style="border-left:3px solid ${c.dot}">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:16px;font-weight:800;color:var(--label)">${esc(g.name)}</div>
          <div style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:${c.chipBg};color:${c.chipTxt}">${g.day}</div>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--label-2)">${size} · ${mc}</div>
      </div>
      ${GOAL_DEFS.map(gd=>{
        const key=`${g.id}-${gd.id}`,pct=D.goalProgress[key]||0;
        return`<div class="goal-row">
          <div class="goal-icon-bg" style="background:${gd.bg}">${gd.icon}</div>
          <div class="goal-content">
            <div class="goal-title">${gd.title}</div>
            <div class="goal-desc">📅 ${gd.monthly}<br>📊 ${gd.quarterly}</div>
            <div class="goal-slider-row">
              <div class="goal-track"><div class="goal-fill" id="bar-${key}" style="width:${pct}%"></div></div>
              <span class="goal-pct" id="lbl-${key}">${pct}%</span>
              <input type="range" min="0" max="100" value="${pct}" oninput="updGoal('${key}',+this.value)">
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}
function updGoal(key,val){if(!D.goalProgress)D.goalProgress={};D.goalProgress[key]=val;const b=document.getElementById('bar-'+key),l=document.getElementById('lbl-'+key);if(b)b.style.width=val+'%';if(l)l.textContent=val+'%';save();}

// ── CALENDAR SHARE ────────────────────────────────
let _shareCalLink='';
function renderShare(){
  document.getElementById('month-export-list').innerHTML=MONTHS.map(mo=>`
    <div class="list-row tappable" onclick="exportMonthICS(${mo.y},${mo.m})">
      <div class="list-row-icon" style="background:rgba(0,122,255,.08);font-size:13px;font-weight:700;color:var(--sys-blue)">${mo.n.substring(0,3)}</div>
      <div class="list-row-content">
        <div class="list-row-title">${mo.n} ${mo.y}</div>
        <div class="list-row-sub">Descargar eventos de ${mo.n}</div>
      </div>
      <div class="list-row-right"><span class="list-chevron">›</span></div>
    </div>`).join('');
}
function generateShareLink(){
  const email=document.getElementById('share-email').value.trim();
  if(!email){toast('⚠️ Ingresa un correo');return;}
  const calName='Casa+de+Dios+Plan+2026';
  const baseUrl=window.location.href.split('?')[0].split('#')[0];
  _shareCalLink=`${baseUrl}?cal=export&email=${encodeURIComponent(email)}`;
  document.getElementById('share-link-text').textContent=_shareCalLink;
  document.getElementById('share-link-area').style.display='block';
  toast('✓ Enlace generado');
}
function copyCalLink(){
  const text=document.getElementById('share-link-text').textContent;
  navigator.clipboard?.writeText(text).then(()=>toast('✓ Enlace copiado')).catch(()=>{
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('✓ Enlace copiado');
  });
}
function openGCalLink(){const url=buildGCalLink({title:'Casa de Dios 2026',start:'2026-03-14',end:'2026-08-31',timeStart:'08:00',timeEnd:'09:00',desc:'Plan de trabajo Casa de Dios 2026',location:'Casa de Dios'});window.open(url,'_blank');}
function openAppleCal(){exportAllICS();}
function openWebcal(){const url='webcal://casadedios.church/calendar/2026.ics';toast('Enlace webcal:// copiado — pégalo en tu app de calendario');navigator.clipboard?.writeText(url);}
function openOutlook(){const url='https://outlook.live.com/calendar/0/addevent?subject=Casa+de+Dios+2026&startdt=2026-03-14T08:00:00&enddt=2026-03-14T09:00:00&body=Plan+de+trabajo+Casa+de+Dios+2026';window.open(url,'_blank');}
function openAppleCalDirect(){exportAllICS();}
function openOutlookDirect(){exportAllICS();}

// ── ICS ───────────────────────────────────────────
function buildGCalLink(ev){
  const fmt=(ds,ts)=>{const[y,m,d]=ds.split('-');const[hRaw,minStr]=ts.split(':');const isPM=ts.toUpperCase().includes('PM');let h=parseInt(hRaw);if(isPM&&h<12)h+=12;if(!isPM&&h===12)h=0;return`${y}${m}${d}T${String(h).padStart(2,'0')}${minStr.replace(/\D/g,'')}00`;};
  const start=fmt(ev.start||'2026-03-14',ev.timeStart||'19:30');
  const end=fmt(ev.end||ev.start||'2026-03-14',ev.timeEnd||'21:00');
  return`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&details=${encodeURIComponent(ev.desc||'Casa de Dios 2026')}&location=${encodeURIComponent(ev.location||'Casa de Dios')}`;
}
function buildICSEvent(ev,uid){
  const fmt=(ds,ts)=>{const[y,m,d]=ds.split('-');const[hRaw,minStr]=ts.split(':');const isPM=ts.toUpperCase().includes('PM');let h=parseInt(hRaw);if(isPM&&h<12)h+=12;if(!isPM&&h===12)h=0;return`${y}${m}${d}T${String(h).padStart(2,'0')}${minStr.replace(/\D/g,'')}00`;};
  return`BEGIN:VEVENT\r\nUID:${uid||Date.now()}@casadedios2026\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z\r\nDTSTART:${fmt(ev.start||'2026-03-14',ev.timeStart||'19:30')}\r\nDTEND:${fmt(ev.end||ev.start||'2026-03-14',ev.timeEnd||'21:00')}\r\nSUMMARY:${ev.title}\r\nDESCRIPTION:${ev.desc||'Casa de Dios 2026'}\r\nLOCATION:${ev.location||'Casa de Dios'}\r\nEND:VEVENT\r\n`;
}
function buildRecurringICS(title,desc,dow,start,end,ts,te,uid){
  const[y,m,d]=start.split('-'),fmt=t=>{const[h,min]=t.split(':');return`${y}${m}${d}T${String(parseInt(h)).padStart(2,'0')}${min}00`;};
  const BYDAY=['SU','MO','TU','WE','TH','FR','SA'];
  return`BEGIN:VEVENT\r\nUID:${uid}@cdg2026\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z\r\nDTSTART:${fmt(ts)}\r\nDTEND:${fmt(te)}\r\nRRULE:FREQ=WEEKLY;BYDAY=${BYDAY[dow]};UNTIL=${end.replace(/-/g,'')}T000000Z\r\nSUMMARY:${title}\r\nDESCRIPTION:${desc}\r\nLOCATION:Casa de Dios\r\nEND:VEVENT\r\n`;
}
function downloadICS(content,filename){
  const blob=new Blob(['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Casa de Dios//Plan 2026//ES\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Casa de Dios 2026\r\n'+content+'END:VCALENDAR'],{type:'text/calendar;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}
function downloadSingleICS(ev){downloadICS(buildICSEvent(ev,ev.id||Date.now()),'evento.ics');}
function exportMonthICS(y,m){
  let body='';
  body+=buildRecurringICS('Culto Dominical','Servicio congregacional',0,'2026-03-15','2026-08-31','10:00','12:00','sunday');
  body+=buildRecurringICS('Reunión Líderes','Reunión semanal',1,'2026-03-16','2026-08-31','19:30','21:00','leaders');
  body+=buildRecurringICS('Grupos Miércoles',byDay('Miércoles'),3,'2026-03-18','2026-08-31','19:30','21:00','wed');
  body+=buildRecurringICS('Grupo Viernes',byDay('Viernes'),5,'2026-03-20','2026-08-31','19:30','21:00','fri');
  getMonthEvents(y,m).filter(e=>e.isCustom||['women','men','fasting','special','prayer'].includes(e.cat))
    .forEach((e,i)=>body+=buildICSEvent({title:e.title,start:e.date,end:e.date,timeStart:e.timeStart||'19:30',timeEnd:e.timeEnd||'21:00',desc:e.sub||'',location:''},e.date+i));
  downloadICS(body,`casa-de-dios-${MONTHS.find(x=>x.m===m)?.n||m}.ics`);
  toast('📅 Calendario exportado');
}
function exportAllICS(){
  let body='';
  body+=buildRecurringICS('Culto Dominical','Servicio congregacional',0,'2026-03-15','2026-08-31','10:00','12:00','sunday');
  body+=buildRecurringICS('Reunión Líderes','Reunión semanal',1,'2026-03-16','2026-08-31','19:30','21:00','leaders');
  body+=buildRecurringICS('Grupos Miércoles',byDay('Miércoles'),3,'2026-03-18','2026-08-31','19:30','21:00','wed');
  body+=buildRecurringICS('Grupo Viernes',byDay('Viernes'),5,'2026-03-20','2026-08-31','19:30','21:00','fri');
  const all=[
    ...(D.activities.women||[]).map(d=>({title:'Actividad Ministerio Mujeres',start:d,end:d,timeStart:'19:30',timeEnd:'21:00',desc:'Ministerio de mujeres',location:'Casa de Dios'})),
    ...(D.activities.menBreak||[]).map(d=>({title:'Desayuno de Hombres',start:d,end:d,timeStart:'08:00',timeEnd:'10:00',desc:'Ministerio de hombres',location:'Casa de Dios'})),
    ...(D.activities.fasting||[]).map(d=>({title:'Ayuno Congregacional',start:d,end:d,timeStart:'06:00',timeEnd:'18:00',desc:'Ayuno congregacional',location:'Casa de Dios'})),
    ...(D.customEvents||[]),
  ];
  all.forEach((e,i)=>body+=buildICSEvent(e,(e.id||i)+''));
  downloadICS(body,'casa-de-dios-plan-2026.ics');
  toast('📅 Plan 2026 exportado');
}
function openGCalAll(){window.open('https://calendar.google.com/calendar/r','_blank');}

// ── CLOSE ─────────────────────────────────────────
function closeAll(){
  ['m-add','m-role','m-schedule','m-pray','m-event','m-event-detail'].forEach(id=>document.getElementById(id).style.display='none');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();});
document.getElementById('add-name').addEventListener('keydown',e=>{if(e.key==='Enter')doAddMember();});
document.getElementById('pray-name').addEventListener('keydown',e=>{if(e.key==='Enter')doAddPray();});

// ── INIT ──────────────────────────────────────────
renderDash();
document.getElementById('n-dash').querySelector('.nav-icon-wrap').style.background='var(--sys-blue)';
document.getElementById('n-dash').querySelector('.nav-icon-wrap').style.color='white';

// Sync from Firebase after initial render (non-blocking)
setTimeout(()=>{
  syncFromCloud();
  listenForChanges();
},500);

setTimeout(()=>{
  if('Notification' in window&&Notification.permission==='default')
    toast('🔔 Activa notificaciones en la barra lateral');
},3000);

