
(function(){
  const state = { theme: localStorage.getItem('theme')||'light', team: localStorage.getItem('team')||'Select Team', role: localStorage.getItem('role')||'Normal User' };

  function seedTeams(){
    if(localStorage.getItem('teams')) return;
    const teams=[
      {id:'hr', name:'HR', description:'Employee services and onboarding', primaryOwner:'Alice', secondaryOwner:'Bob', members:['Nishtha','Rohan','Isha']},
      {id:'ops', name:'Ops', description:'Operations support and process mgmt', primaryOwner:'Gaurav', secondaryOwner:'Kriti', members:['Aman','Divya','Shreya']},
      {id:'admin-ops', name:'Admin Ops', description:'Administrative operations and facilities', primaryOwner:'Charlie', secondaryOwner:'David', members:['Kunal','Priya']},
      {id:'it-support', name:'IT Support', description:'Helpdesk & endpoint management', primaryOwner:'Sanjay', secondaryOwner:'Meera', members:['Anil','Varun','Tara']}
    ];
    localStorage.setItem('teams', JSON.stringify(teams));
  }
  seedTeams();
  const getTeams=()=>JSON.parse(localStorage.getItem('teams')||'[]');
  const saveTeams=(t)=>localStorage.setItem('teams', JSON.stringify(t));
  const findTeam=(id)=>getTeams().find(x=>x.id===id);

  function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme); const t=document.getElementById('themeToggle'); if(t) t.textContent= state.theme==='dark'?'☀️':'🌙'; }

  function renderChrome(active){
    const header=document.getElementById('app-header');
    if(header){
      header.innerHTML=`<div class="navbar"><div class="brand" onclick="location.href='index.html'" style="cursor:pointer"><div class="logo"></div><div>ESM Console</div></div><div class="nav-controls"><select id="teamSelect" class="select"><option ${state.team==='Select Team'?'selected':''}>Select Team</option>${getTeams().map(t=>`<option ${state.team===t.name?'selected':''}>${t.name}</option>`).join('')}</select><select id="roleSelect" class="select">${['Admin','Functional Head','Team Manager','Team Member','Normal User'].map(r=>`<option ${state.role===r?'selected':''}>${r}</option>`).join('')}</select><button id="themeToggle" class="icon-btn button ghost" title="Toggle theme">${state.theme==='dark'?'☀️':'🌙'}</button><div class="icon-btn" title="Notifications">🔔</div><div class="icon-btn" title="Profile">👤</div></div></div>`;
      document.getElementById('themeToggle').onclick=()=>{state.theme= state.theme==='dark'?'light':'dark'; localStorage.setItem('theme',state.theme); applyTheme();};
      const ts=document.getElementById('teamSelect'); if(ts){ ts.onchange=(e)=>{ state.team=e.target.value; localStorage.setItem('team', state.team);} }
      const rs=document.getElementById('roleSelect'); if(rs){ rs.onchange=(e)=>{ state.role=e.target.value; localStorage.setItem('role', state.role); syncRoleVisibility(); renderSidebar(active); }}
    }
    renderSidebar(active);
  }

  function renderSidebar(active){
    const sidebar=document.getElementById('app-sidebar'); if(!sidebar) return;
    const items=[
      {href:'index.html',label:'Dashboard'},
      {href:'tickets.html',label:'Tickets'},
      {href:'formbuilder.html',label:'Ticket Form Builder',roles:['Admin','Functional Head','Team Manager']},
      {href:'workflow.html',label:'Workflow Builder',roles:['Admin','Functional Head','Team Manager']},
      {href:'team.html',label:'Teams'},
      {href:'monitoring.html',label:'Monitoring',roles:['Admin']}
    ];
    const visible=items.filter(it=>!it.roles||it.roles.includes(state.role));
    sidebar.innerHTML = `<div class="sidebar"><div class="nav-group"><h4>Navigate</h4>${visible.map(it=>`<a class="nav-item ${active===it.href?'active':''}" href="${it.href}">${it.label}</a>`).join('')}</div></div>`;
  }

  function syncRoleVisibility(){ document.querySelectorAll('[data-role]').forEach(el=>{ const allowed=(el.getAttribute('data-role')||'').split(',').map(s=>s.trim()); el.style.display=(allowed.length===1 && allowed[0]==='')||allowed.includes(state.role)?'':'none'; }); }

  // Teams list: strictly team management view
  function renderTeamsTable(){
    const tbody=document.getElementById('teams-tbody'); if(!tbody) return;
    const q=document.getElementById('team-search'); const qv=(q&&q.value||'').toLowerCase();
    const teams=getTeams().filter(t=>!qv || t.name.toLowerCase().includes(qv) || t.primaryOwner.toLowerCase().includes(qv) || t.secondaryOwner.toLowerCase().includes(qv));
    tbody.innerHTML = teams.map(t=>`<tr><td><a href="team-edit.html?team=${encodeURIComponent(t.id)}">${t.name}</a></td><td>${t.description}</td><td>${t.members.length} members</td><td>${t.primaryOwner}</td><td>${t.secondaryOwner}</td><td>${['Admin','Functional Head','Team Manager'].includes(state.role)?`<button class='button' onclick="location.href='team-edit.html?team=${encodeURIComponent(t.id)}'">Edit</button>`:''}</td></tr>`).join('');
  }

  function parseQS(){ const q={}; location.search.replace(/^\?/,'').split('&').filter(Boolean).forEach(p=>{const[k,v]=p.split('='); q[decodeURIComponent(k)]=decodeURIComponent(v||'');}); return q; }
  function bindTeamEdit(){
    const wrap=document.getElementById('team-edit-wrap'); if(!wrap) return;
    const team=findTeam(parseQS().team); if(!team){ wrap.innerHTML='<div class="card">Team not found.</div>'; return; }
    const nameEl=document.getElementById('t-name'); const descEl=document.getElementById('t-desc'); const primEl=document.getElementById('t-primary'); const secEl=document.getElementById('t-secondary');
    nameEl.value=team.name; descEl.value=team.description; primEl.value=team.primaryOwner; secEl.value=team.secondaryOwner;

    // owners dropdowns from members (plus free text allowed)
    function refreshOwnerDropdowns(){
      const opts=team.members.map(m=>`<option ${m===team.primaryOwner?'selected':''}>${m}</option>`).join('');
      primEl.innerHTML = `<option ${team.members.includes(team.primaryOwner)?'':'selected'}>${team.primaryOwner}</option>` + opts;
      const opts2=team.members.map(m=>`<option ${m===team.secondaryOwner?'selected':''}>${m}</option>`).join('');
      secEl.innerHTML = `<option ${team.members.includes(team.secondaryOwner)?'':'selected'}>${team.secondaryOwner}</option>` + opts2;
    }

    // If inputs are not select yet, convert them
    primEl.outerHTML = `<select id='t-primary' class='select'></select>`; secEl.outerHTML = `<select id='t-secondary' class='select'></select>`;
    const _prim=()=>document.getElementById('t-primary'); const _sec=()=>document.getElementById('t-secondary');

    // render members chips with remove
    const memWrap=document.getElementById('members');
    function drawMembers(){ memWrap.innerHTML = team.members.map((m,i)=>`<span class='chip'>${m} <button class='button' data-rm='${i}'>x</button></span>`).join(' '); refreshOwnerDropdowns(); }
    drawMembers();
    memWrap.addEventListener('click', (e)=>{ const idx=e.target&&e.target.getAttribute('data-rm'); if(idx!==null && idx!==undefined){ team.members.splice(parseInt(idx),1); drawMembers(); }});

    document.getElementById('add-member-btn').onclick=()=>{ const inp=document.getElementById('add-member'); const vals=(inp.value||'').split(',').map(s=>s.trim()).filter(Boolean); if(!vals.length) return; vals.forEach(v=>{ if(!team.members.includes(v)) team.members.push(v); }); inp.value=''; drawMembers(); };

    document.getElementById('save-team-btn').onclick=()=>{
      const teams=getTeams(); const i=teams.findIndex(t=>t.id===team.id);
      teams[i]={...team, name:nameEl.value.trim()||team.name, description:descEl.value.trim(), primaryOwner:_prim().value, secondaryOwner:_sec().value};
      saveTeams(teams); alert('Team saved'); location.href='team.html';
    };
  }

  // Monitoring demo charts (no external libs)
  function renderMonitoring(){
    const elBar=document.getElementById('bar'); const elPie=document.getElementById('pie'); if(!elBar||!elPie) return;
    const ctxB=elBar.getContext('2d'); const ctxP=elPie.getContext('2d');
    // mock dataset: team-wise Open/Closed tickets
    const teams=getTeams();
    const data=teams.map((t,i)=>({name:t.name, open: 10 + (i*3)%9, closed: 8 + (i*4)%7 }));
    // BAR
    const W=elBar.width=600, H=elBar.height=280; ctxB.clearRect(0,0,W,H);
    const max=Math.max(...data.map(d=>d.open+d.closed))+5; const bw= Math.floor((W-80)/data.length);
    data.forEach((d,idx)=>{
      const x=50+idx*bw; const total=d.open+d.closed; const hTot=(total/max)*(H-60);
      // closed
      const hC=(d.closed/max)*(H-60); ctxB.fillStyle='#60a5fa'; ctxB.fillRect(x, H-30-hC, bw*0.36, hC);
      // open
      const hO=(d.open/max)*(H-60); ctxB.fillStyle='#f59e0b'; ctxB.fillRect(x+bw*0.42, H-30-hO, bw*0.36, hO);
      ctxB.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); ctxB.font='12px sans-serif'; ctxB.fillText(d.name, x, H-10);
    });
    // axes
    ctxB.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--border').trim(); ctxB.beginPath(); ctxB.moveTo(40,10); ctxB.lineTo(40,H-30); ctxB.lineTo(W-20,H-30); ctxB.stroke();

    // PIE (overall open vs closed)
    const totalOpen=data.reduce((a,b)=>a+b.open,0); const totalClosed=data.reduce((a,b)=>a+b.closed,0); const sum=totalOpen+totalClosed;
    const cx=150, cy=140, r=110; let start=0; const segs=[{val:totalOpen,color:'#f59e0b',label:'Open'},{val:totalClosed,color:'#60a5fa',label:'Closed'}];
    elPie.width=320; elPie.height=280; ctxP.clearRect(0,0,elPie.width,elPie.height);
    segs.forEach(s=>{ const ang=(s.val/sum)*Math.PI*2; ctxP.beginPath(); ctxP.moveTo(cx,cy); ctxP.arc(cx,cy,r,start,start+ang); ctxP.closePath(); ctxP.fillStyle=s.color; ctxP.fill(); start+=ang; });
    ctxP.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); ctxP.font='14px sans-serif';
    ctxP.fillText(`Open: ${totalOpen}`, 280-120, 40); ctxP.fillStyle='#f59e0b'; ctxP.fillRect(280-150, 30, 12,12);
    ctxP.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); ctxP.fillText(`Closed: ${totalClosed}`, 280-120, 60); ctxP.fillStyle='#60a5fa'; ctxP.fillRect(280-150, 50, 12,12);
  }

  window.__esm={state,renderChrome,applyTheme,syncRoleVisibility,renderTeamsTable,bindTeamEdit,renderMonitoring};
  document.addEventListener('DOMContentLoaded', applyTheme);
})();
