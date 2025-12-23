window.__APP_LOADED__ = true;
window.addEventListener('DOMContentLoaded', function(){
(function(){
  // ================= HOLIDAYS (Bahamas, dynamic with observed logic) =================
  const nthWeekdayOfMonth=(year, month, weekday, nth)=>{ const first=new Date(year,month,1); const delta=(7 + weekday - first.getDay())%7; return new Date(year,month,1 + delta + 7*(nth-1)); };
  const firstFridayInJune = year => nthWeekdayOfMonth(year,5,5,1);
  const firstMondayInAugust = year => nthWeekdayOfMonth(year,7,1,1);
  const secondMondayInOctober = year => nthWeekdayOfMonth(year,9,1,2);
  const easterSunday = (Y)=>{ const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4; const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3); const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4; const L=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*L)/451); const month=Math.floor((h+L-7*m+114)/31)-1; const day=((h+L-7*m+114)%31)+1; return new Date(Y,month,day); };
  const addDaysX=(d,n)=>{ const r=new Date(d); r.setDate(r.getDate()+n); return r; };
  const fmtISO = d => d.toISOString().slice(0,10);
  const observeIfWeekend=(d)=>{ const wd=d.getDay(); if(wd===0) return addDaysX(d,1); if(wd===6) return addDaysX(d,2); return d; };
  const buildBahamasHolidays=(year)=>{
    const list=[];
    const push=(date,name,observe=true)=>{
      const iso=fmtISO(date);
      list.push({iso,name,observed:false});
      if(observe){
        const obsISO=fmtISO(observeIfWeekend(date));
        if(obsISO!==iso){
          list.push({iso:obsISO,name:name+' (Observed)',observed:true});
        }
      }
    };
    // Fixed
    push(new Date(year,0,1), "New Year's Day");
    push(new Date(year,0,10), "Majority Rule Day");
    push(new Date(year,6,10), "Independence Day");
    push(new Date(year,11,25), "Christmas Day");
    push(new Date(year,11,26), "Boxing Day");
    // Moveable (Christian)
    const easter=easterSunday(year);
    list.push({iso:fmtISO(addDaysX(easter,-2)), name:'Good Friday', observed:false});
    list.push({iso:fmtISO(addDaysX(easter, 1)), name:'Easter Monday', observed:false});
    list.push({iso:fmtISO(addDaysX(easter,50)), name:'Whit Monday', observed:false});
    // Civic
    list.push({iso:fmtISO(firstFridayInJune(year)), name:'Randol Fawkes Labour Day', observed:false});
    list.push({iso:fmtISO(firstMondayInAugust(year)), name:'Emancipation Day', observed:false});
    list.push({iso:fmtISO(secondMondayInOctober(year)), name:'National Heroes Day', observed:false});
    return list;
  };
  const HolidayCache=new Map(); // year -> Map(iso -> {name, observed})
  const getHolidayMap=(year)=>{
    if(!HolidayCache.has(year)){
      const m=new Map();
      buildBahamasHolidays(year).forEach((entry)=> m.set(entry.iso, {name:entry.name, observed:!!entry.observed}));
      HolidayCache.set(year,m);
    }
    return HolidayCache.get(year);
  };
  const getHolidayEntry=(iso)=>{ const y=parseInt(iso.slice(0,4),10); const map=getHolidayMap(y); return map.get(iso) || null; };

  // ================== HELPERS ==================
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthsS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt=d=>d.toISOString().slice(0,10);
  const parse=s=>new Date(s+'T00:00:00');
  const fmtHuman=d=>`${d.getDate()} ${monthsS[d.getMonth()]} ${d.getFullYear()}`;
  const isSunday = d => d.getDay()===0;
  // COUNTING RULE: exclude Sundays, exclude observed holidays, exclude actual weekday holidays; include actual Saturday holidays
  const isHolidayISO = iso => {
    const e = getHolidayEntry(iso);
    if(!e) return false;
    const d = new Date(iso+'T00:00:00');
    const wd = d.getDay();
    if (e.observed) return true;          // observed weekday is excluded
    if (wd === 0) return true;            // Sunday excluded
    if (wd >= 1 && wd <= 5) return true;  // actual weekday holiday excluded
    return false;                          // actual Saturday holiday counted
  };
  const isBiz = d => !isSunday(d) && !isHolidayISO(fmt(d));
  const addDays=(d,n)=>{const r=new Date(d); r.setDate(r.getDate()+n); return r};
  function addBiz(start,n){let d=new Date(start),a=0;while(a<n){d.setDate(d.getDate()+1);if(isBiz(d))a++;}return d}
  function subBiz(start,n){let d=new Date(start),a=0;while(a<n){d.setDate(d.getDate()-1);if(isBiz(d))a++;}return d}

  function writWindow(issue,min,max){return{earliest:addBiz(issue,min),latest:addBiz(issue,max)}}
  function noticeWindow(issue){return{earliest:new Date(issue),latest:addBiz(issue,2)}}
  function nominationWindow(notice){return{earliest:addBiz(notice,5),latest:addBiz(notice,8)}}
  function pubNomWindow(nom){return{earliest:new Date(nom),latest:addBiz(nom,2)}}
  function pollWindow(issue,isBye){let e=addBiz(issue,26), l=addBiz(issue,isBye?30:31); while(!isBiz(e)) e=addDays(e,1); while(!isBiz(l)) l=addDays(l,-1); return{earliest:e, latest:l}}
  function issueWindowFromPoll(poll,isBye){return{earliest:subBiz(poll,isBye?30:31), latest:subBiz(poll,26)}}
  function registerFromIssue(issue){return addBiz(issue,15)}
  function lastAdvance(issue){return addBiz(issue,14)}
  function lastOverseas(issue){return addBiz(issue,7)}

  const TYPE_TO_CLASS={ writ:'hl-writ', notice:'hl-notice', nomination:'hl-nomination', pubNom:'hl-pubnom', poll:'hl-poll', issueSuggest:'hl-issue-suggest', advance:'hl-advance', register:'hl-register', overseas:'hl-overseas' };
  const TYPE_LANE={ writ:'top', notice:'top', poll:'top', nomination:'bottom', pubNom:'bottom', issueSuggest:'top' };
  const TYPE_COLOR={
  anchor:'var(--cal-anchor)',
  latest:'var(--cal-latest)',
  register:'var(--cal-register)',
  writ:'var(--cal-writ)',
  notice:'var(--cal-notice)',
  nomination:'var(--cal-nomination)',
  pubNom:'var(--cal-pubnom)',
  poll:'var(--cal-poll)',
  advance:'var(--cal-advance)',
  overseas:'var(--cal-overseas)'
  };

  function init(id, isBye){
    const cfg={id,isBye, latestReturnDays:isBye?60:90, writMin:26, writMax:isBye?30:35};
    const grid=document.getElementById('grid_'+id);
    const title=document.getElementById('title_'+id);
    const err=document.getElementById('err_'+id);
    const rangesBtn=document.getElementById('ranges_'+id);
    const resetBtn=document.getElementById('reset_'+id);
    const prev=document.getElementById('prev_'+id);
    const next=document.getElementById('next_'+id);
    const printCal=document.getElementById('printCal_'+id);
    const printKey=document.getElementById('printKey_'+id);
    const multi=document.getElementById('multi_'+id);
    const inputs={ anchor:document.getElementById('anchor_'+id), issue:document.getElementById('issue_'+id), notice:document.getElementById('notice_'+id), nom:document.getElementById('nom_'+id), pubnom:document.getElementById('pubnom_'+id), poll:document.getElementById('poll_'+id), ret:document.getElementById('ret_'+id) };

    const state={ showRanges:false, field:'issue', anchor:new Date(), issue:null, notice:null, nom:null, pubnom:null, poll:null, ret:null };
    if(isBye){ inputs.anchor.value='2025-09-28'; state.anchor=parse('2025-09-28'); }
    else inputs.anchor.value=fmt(state.anchor);
    let y=state.anchor.getFullYear(), m=state.anchor.getMonth();

    // focus tracking
    Object.entries(inputs).forEach(([k,el])=> el.addEventListener('focus',()=> state.field=k));

    // changes
    Object.entries(inputs).forEach(([k,el])=> el.addEventListener('change',()=>{
      err.textContent='';
      if(!el.value){ state[k]=null; build(); return; }
      const d=parse(el.value);
      if(k==='anchor'){ state.anchor=d; y=d.getFullYear(); m=d.getMonth(); build(); return; }
      if(d<state.anchor){ err.textContent='Date is before anchor.'; el.value=''; return; }
      if(k==='poll' && !isBiz(d)){ err.textContent='Poll cannot be on a Sunday/holiday.'; el.value=''; return; }
      if(k==='ret' && state.issue){ const r=writWindow(state.issue,cfg.writMin,cfg.writMax); if(d<r.earliest||d>r.latest){ err.textContent='Return must be within the statutory window.'; el.value=''; return; }}
      if(k==='notice' && state.issue){ const r=noticeWindow(state.issue); if(d<r.earliest||d>r.latest){ err.textContent='Public Notice of Election must be ≤2 days after Issue of Writ.'; el.value=''; return; }}
      if(k==='nom' && state.notice){ const r=nominationWindow(state.notice); if(d<r.earliest||d>r.latest){ err.textContent='Nomination must be 5–8 days after Public Notice of Election.'; el.value=''; return; }}
      if(k==='pubnom' && state.nom){ const r=pubNomWindow(state.nom); if(d<r.earliest||d>r.latest){ err.textContent='Public Notice of Nomination must be ≤2 days after Nomination Day.'; el.value=''; return; }}
      state[k]=d; build();
    }));

    rangesBtn.addEventListener('click',()=>{ state.showRanges=!state.showRanges; rangesBtn.textContent=state.showRanges? 'Hide ranges' : 'Show ranges'; render(); });
    resetBtn.addEventListener('click',()=>{ ['issue','notice','nom','pubnom','poll','ret'].forEach(k=>{ state[k]=null; inputs[k].value=''; }); render(); });
    prev.addEventListener('click',()=>{ m--; if(m<0){m=11;y--;} buildGrid(y,m); render(); });
    next.addEventListener('click',()=>{ m++; if(m>11){m=0;y++;} buildGrid(y,m); render(); });

    if(printCal) printCal.addEventListener('click',()=> printCalendar());
    if(printKey) printKey.addEventListener('click',()=> printKeyDates());

    function buildGrid(Y,M){
      grid.innerHTML='';
      const heads=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      heads.forEach(h=>{const d=document.createElement('div');d.className='day-head';d.textContent=h;grid.appendChild(d);});
      const first=new Date(Y,M,1), last=new Date(Y,M+1,0);
      title && (title.textContent=months[M]+' '+Y);
      for(let i=0;i<first.getDay();i++){ const s=document.createElement('div'); s.className='cell holiday'; grid.appendChild(s); }
      for(let day=1;day<=last.getDate();day++){
        const dt=new Date(Y,M,day); const iso=fmt(dt);
        const cell=document.createElement('div'); cell.className='cell'; cell.dataset.iso=iso;
        const num=document.createElement('div'); num.className='dateNum'; num.textContent=day; cell.appendChild(num);
        const top=document.createElement('div'); top.className='tagTop'; cell.appendChild(top);
        const bottom=document.createElement('div'); bottom.className='tagBottom'; cell.appendChild(bottom);
        const numTop=document.createElement('div'); numTop.className='numTopRight'; cell.appendChild(numTop);
        const numBottom=document.createElement('div'); numBottom.className='numBottomRight'; cell.appendChild(numBottom);

        const entry = getHolidayEntry(iso);
        if (isSunday(dt) || isHolidayISO(iso)) {
          cell.classList.add('holiday');
        }
        if (entry) {
          const htag=document.createElement('div');
          htag.className='tag';
          htag.style.color='#666';
          htag.textContent=entry.name;
          top.appendChild(htag);
        }

        cell.addEventListener('click',()=> onPick(dt));
        grid.appendChild(cell);
      }
    }

    function tag(cell,text,pos,color){ if(!cell||!text) return; const n=document.createElement('div'); n.className='tag'; if(color) n.style.color=color; n.textContent=text; (pos==='top'?cell.querySelector('.tagTop'):cell.querySelector('.tagBottom')).appendChild(n); }
    function paint(cell,cls){ const d=document.createElement('div'); d.className='paint '+cls; cell.appendChild(d); return d; }
    function chip(cell,type,label){ const el=document.createElement('div'); el.className='chip '+(type||''); el.textContent=label; const lane=(TYPE_LANE[type]||'top')==='top'?'.numTopRight':'.numBottomRight'; cell.querySelector(lane).appendChild(el); }

    function fill(byIso,start,end,cls,bizOnly,typeKey,idxStart){
      if(!start||!end) return {oor:false};
      let oor=false; const d=new Date(start);
      const limit=addDays(state.anchor,cfg.latestReturnDays);
      let num=idxStart||1;
      const reversed=(typeKey==='issueSuggest');
      if(reversed) num=isBye?30:31;
      while(d<=end){
        const iso=fmt(d);
        const cell=byIso[iso];
        const ok=!bizOnly||isBiz(d);
        if(ok){
          if(cell){
            if(state.showRanges){
              paint(cell,cls);
              const n=parseInt(cell.dataset.rCount||'0')+1; cell.dataset.rCount=String(n);
              const t=cell.dataset.rTypes?cell.dataset.rTypes.split('|'):[]; if(typeKey&&!t.includes(typeKey)) t.push(typeKey); cell.dataset.rTypes=t.join('|');
              chip(cell,typeKey,num);
            }
            if(d>limit){
              oor=true;
              let b=cell.querySelector('.badge-oor');
              if(!b){
                b=document.createElement('div');
                b.className='badge-oor';
                b.textContent='OOR';
                cell.appendChild(b);
              }
            }
          }
          num=reversed?num-1:num+1;
        }
        d.setDate(d.getDate()+1);
      }
      return {oor};
    }

    function render(){
      const cells=[...grid.querySelectorAll('.cell')];
      const byIso=Object.fromEntries(cells.filter(c=>c.dataset.iso).map(c=>[c.dataset.iso,c]));
      cells.forEach(c=>{ const hol=c.classList.contains('holiday'); c.className='cell'; if(hol) c.classList.add('holiday'); c.querySelectorAll('.paint,.tri,.tag,.chip,.badge-oor').forEach(e=>e.remove()); delete c.dataset.rCount; delete c.dataset.rTypes; });

      const anchorISO=fmt(state.anchor); if(byIso[anchorISO]){ paint(byIso[anchorISO],'hl-anchor'); tag(byIso[anchorISO], isBye?'Vacancy':'Dissolution','top', TYPE_COLOR.anchor); }
      const latest=addDays(state.anchor,cfg.latestReturnDays); const latestISO=fmt(latest); if(byIso[latestISO]){ paint(byIso[latestISO],'hl-latest'); tag(byIso[latestISO],'Latest Return','top', TYPE_COLOR.latest); }

      const selectFill={ issue:'hl-writ', ret:'hl-writ', notice:'hl-notice', nom:'hl-nomination', pubnom:'hl-pubnom', poll:'hl-poll' };
      const picks=[ ['issue','Issue of Writ','picked-issue',TYPE_COLOR.writ], ['ret','Return of Writ','picked-return',TYPE_COLOR.writ], ['notice','Public Notice of Election','picked-notice',TYPE_COLOR.notice], ['nom','Nomination','picked-nomination',TYPE_COLOR.nomination], ['pubnom','Public Notice of Nomination','picked-pubNom',TYPE_COLOR.pubNom], ['poll','Poll','picked-poll',TYPE_COLOR.poll] ];
      picks.forEach(([key,label,cls,color])=>{ const d=state[key]; if(!d) return; const c=byIso[fmt(d)]; if(c){ c.classList.add(cls); paint(c, selectFill[key]); tag(c,label,'bottom',color); }});

      if(state.issue){
        const reg=registerFromIssue(state.issue); const rISO=fmt(reg); if(byIso[rISO]){ paint(byIso[rISO],'hl-register'); tag(byIso[rISO],'Register (15)','top', TYPE_COLOR.register); }
        const adv=lastAdvance(state.issue); const aISO=fmt(adv); if(byIso[aISO]){ paint(byIso[aISO],'hl-advance'); tag(byIso[aISO],'Advance (≤14)','top', TYPE_COLOR.advance); }
        const ov=lastOverseas(state.issue); const oISO=fmt(ov); if(byIso[oISO]){ paint(byIso[oISO],'hl-overseas'); tag(byIso[oISO],'Overseas Reg (≤7)','top', TYPE_COLOR.overseas); }
      }

      if(state.showRanges){
        if(state.issue){
          const w=writWindow(state.issue,cfg.writMin,cfg.writMax); fill(byIso,w.earliest,w.latest,'hl-writ',true,'writ',cfg.writMin);
          const n=noticeWindow(state.issue); fill(byIso,n.earliest,n.latest,'hl-notice',true,'notice',1);
          const p=pollWindow(state.issue,isBye); fill(byIso,p.earliest,p.latest,'hl-poll',true,'poll',26); tag(byIso[fmt(p.earliest)],'Earliest Poll','top', TYPE_COLOR.poll); tag(byIso[fmt(p.latest)],'Latest Poll','top', TYPE_COLOR.poll);
        }
        if(state.notice){ const nm=nominationWindow(state.notice); fill(byIso,nm.earliest,nm.latest,'hl-nomination',true,'nomination',5); }
        if(state.nom){ const pn=pubNomWindow(state.nom); fill(byIso,pn.earliest,pn.latest,'hl-pubnom',true,'pubNom',1); }
      }

      if(state.showRanges && state.poll && !state.issue){ const iw=issueWindowFromPoll(state.poll,isBye); fill(byIso,iw.earliest,iw.latest,'hl-issue-suggest',true,'issueSuggest',isBye?30:31); }

      // Diagonal split for exactly two overlaps
      cells.forEach(c=>{
        if(!state.showRanges) return; const types=(c.dataset.rTypes||'').split('|').filter(Boolean);
        if(types.length===2){
          c.querySelectorAll('.paint').forEach(e=>e.remove());
          const tri1=document.createElement('div'); tri1.className='tri tl paint '+TYPE_TO_CLASS[types[0]]; c.appendChild(tri1);
          const tri2=document.createElement('div'); tri2.className='tri br paint '+TYPE_TO_CLASS[types[1]]; c.appendChild(tri2);
          c.querySelectorAll('.chip').forEach(n=>{
            const laneType=[...n.classList].find(x=> TYPE_LANE[x]);
            const isTop=(TYPE_LANE[laneType]||'top')==='top';
            n.remove(); (isTop?c.querySelector('.numTopRight'):c.querySelector('.numBottomRight')).appendChild(n);
          });
        }
      });

      renderSummary();
    }

    function renderSummary(){
      document.getElementById('which').textContent = isBye ? 'Bye-Election' : 'General';
      const s = document.getElementById('summary');
      const rows = [];

      // 3-column helper: label | range | selected
      const addRow = (label, range, sel) => {
        if (!range && !sel) return;
        rows.push(
          `<tr>
             <td style="width:42%;padding:3px 4px;vertical-align:top;word-wrap:break-word;white-space:normal;">
               <b>${label}</b>
             </td>
             <td style="width:32%;padding:3px 4px;vertical-align:top;white-space:normal;">
               ${range || ''}
             </td>
             <td style="padding:3px 4px;vertical-align:top;white-space:normal;">
               ${sel || ''}
             </td>
           </tr>`
        );
      };

      const latest = addDays(state.anchor, cfg.latestReturnDays);

      // Anchor & constitutional latest (single dates in "Selected")
      addRow(isBye ? 'Vacancy' : 'Dissolution', '', fmtHuman(state.anchor));
      addRow('Latest Return (Constitutional)', '', fmtHuman(latest));

      // Return of writ window & selection (when issue known)
      if (state.issue) {
        const w = writWindow(state.issue, cfg.writMin, cfg.writMax);
        const range = `${fmtHuman(w.earliest)} — ${fmtHuman(w.latest)}`;
        const sel = state.ret ? fmtHuman(state.ret) : '';
        addRow('Return Range', range, sel);
        // Show Issue date itself
        addRow('Issue of Writ', '', fmtHuman(state.issue));
      }

      // Public Notice of Election
      if (state.issue) {
        const n = noticeWindow(state.issue);
        const range = `${fmtHuman(n.earliest)} — ${fmtHuman(n.latest)}`;
        const sel = state.notice ? fmtHuman(state.notice) : '';
        addRow('Public Notice of Election', range, sel);
      } else if (state.notice) {
        // Only selected notice
        addRow('Public Notice of Election', '', fmtHuman(state.notice));
      }

      // Nomination
      if (state.notice) {
        const nm = nominationWindow(state.notice);
        const range = `${fmtHuman(nm.earliest)} — ${fmtHuman(nm.latest)}`;
        const sel = state.nom ? fmtHuman(state.nom) : '';
        addRow('Nomination', range, sel);
      } else if (state.nom) {
        addRow('Nomination', '', fmtHuman(state.nom));
      }

      // Public Notice of Nomination
      if (state.nom) {
        const pn = pubNomWindow(state.nom);
        const range = `${fmtHuman(pn.earliest)} — ${fmtHuman(pn.latest)}`;
        const sel = state.pubnom ? fmtHuman(state.pubnom) : '';
        addRow('Public Notice of Nomination', range, sel);
      } else if (state.pubnom) {
        addRow('Public Notice of Nomination', '', fmtHuman(state.pubnom));
      }

      // Polling
      if (state.issue) {
        const p = pollWindow(state.issue, isBye);
        const range = `${fmtHuman(p.earliest)} — ${fmtHuman(p.latest)}`;
        const sel = state.poll ? fmtHuman(state.poll) : '';
        addRow('Poll Range', range, sel);
        addRow('Earliest Poll', '', fmtHuman(p.earliest));
        addRow('Latest Poll', '', fmtHuman(p.latest));
      } else if (state.poll) {
        addRow('Polling Day', '', fmtHuman(state.poll));
      }

      // Fixed dates from issue (register, advance, overseas)
      if (state.issue) {
        addRow(
          'Register Publication',
          '',
          fmtHuman(registerFromIssue(state.issue))
        );
        addRow(
          'Advance Poll',
          '',
          fmtHuman(lastAdvance(state.issue))
        );
        addRow(
          'Overseas Registration',
          '',
          fmtHuman(lastOverseas(state.issue))
        );
      }

      // Reverse logic: issue suggestion from poll, where no issue is selected
      if (state.showRanges && state.poll && !state.issue) {
        const iw = issueWindowFromPoll(state.poll, isBye);
        const range = `${fmtHuman(iw.earliest)} — ${fmtHuman(iw.latest)}`;
        addRow(
          'Issue Suggestion Range',
          range,
          ''
        );
      }

      if (!rows.length) {
        s.innerHTML = '<em>No dates selected yet.</em>';
      } else {
        s.innerHTML = `
          <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
            <thead>
              <tr>
                <th style="text-align:left;padding:3px 4px;border-bottom:1px solid #d9e2ec">Item</th>
                <th style="text-align:left;padding:3px 4px;border-bottom:1px solid #d9e2ec">Range</th>
                <th style="text-align:left;padding:3px 4px;border-bottom:1px solid #d9e2ec">Selected</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        `;
      }
    }

    function onPick(date){
      const field=state.field; const limit=addDays(state.anchor,cfg.latestReturnDays);
      err.textContent='';
      if(field!=='anchor' && date<state.anchor){ err.textContent='Date is before anchor.'; return; }
      if(field!=='anchor' && date>limit){ err.textContent='Date is after the constitutional latest return window.'; return; }
      if(field==='poll' && !isBiz(date)){ err.textContent='Poll cannot be on a Sunday/holiday.'; return; }
      if(field==='ret' && state.issue){ const w=writWindow(state.issue,cfg.writMin,cfg.writMax); if(date<w.earliest||date>w.latest){ err.textContent='Return must be within the statutory window.'; return; }}
      if(field==='notice' && state.issue){ const n=noticeWindow(state.issue); if(date<n.earliest||date>n.latest){ err.textContent='Public Notice of Election must be ≤2 days after Issue.'; return; }}
      if(field==='nom' && state.notice){ const nm=nominationWindow(state.notice); if(date<nm.earliest||date>nm.latest){ err.textContent='Nomination must be 5–8 days after Public Notice of Election.'; return; }}
      if(field==='pubnom' && state.nom){ const pn=pubNomWindow(state.nom); if(date<pn.earliest||date>pn.latest){ err.textContent='Public Notice of Nomination must be ≤2 days after Nomination.'; return; }}

      state[field]=date; document.getElementById(field+'_'+id).value=fmt(date);
      render();
    }

    function keysForMonths(){
      const arr=[state.anchor,state.issue,state.notice,state.nom,state.pubnom,state.poll,state.ret];
      if(state.issue){arr.push(registerFromIssue(state.issue),lastAdvance(state.issue),lastOverseas(state.issue));}
      const set=new Map(); arr.filter(Boolean).forEach(d=> set.set(d.getFullYear()+"-"+d.getMonth(), {y:d.getFullYear(), m:d.getMonth()}));
      return [...set.values()].sort((a,b)=> a.y===b.y? a.m-b.m : a.y-b.y);
    }

    function snapshotMonth(Y,M){
      buildGrid(Y,M); render();
      const wrapper=document.createElement('div'); wrapper.className='monthBlock';
      const titleEl=document.createElement('h3'); titleEl.textContent=months[M]+" "+Y; wrapper.appendChild(titleEl);
      const clone=grid.cloneNode(true);
      const heads=[...clone.querySelectorAll('.day-head')];
      if(heads.length>7){ heads.slice(7).forEach(h=>h.remove()); }
      wrapper.appendChild(clone);
      return wrapper;
    }

    function buildMultiMonths(){
      const ks=keysForMonths(); const cont=multi; cont.innerHTML='';
      const prevY=y, prevM=m;
      const list = ks.length? ks : [{y, m}];
      list.forEach(({y:Y, m:M})=>{ const block=snapshotMonth(Y,M); cont.appendChild(block); });
      buildGrid(prevY,prevM); render();
    }

    function printViaIframe(html){
      const frame=document.createElement('iframe');
      frame.style.position='fixed'; frame.style.right='0'; frame.style.bottom='0';
      frame.style.width='0'; frame.style.height='0'; frame.style.border='0';
      document.body.appendChild(frame);
      const doc = frame.contentDocument || frame.contentWindow.document;
      doc.open(); doc.write(html); doc.close();
      frame.onload = () => {
        try{ frame.contentWindow.focus(); frame.contentWindow.print(); }catch(e){}
        setTimeout(()=> frame.remove(), 1200);
      };
    }

    function printCalendar(){
      buildMultiMonths();
      if(!multi.children.length){ alert('Nothing to print'); return; }
      const styles = `
        @page{size:A4 landscape;margin:10mm}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
        html,body{background:#fff;color:#000;font-family:Segoe UI,Arial,sans-serif}
        .monthBlock{page-break-after:always;break-after:page;border:1px solid #e5e7eb;border-radius:8px;padding:8px;margin:0 0 8px;page-break-inside:avoid;break-inside:avoid}
        .monthBlock h3{margin:0 0 8px;font-size:18px;break-after:avoid}
        .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
        .day-head{background:#eef3f7!important;font-weight:700;text-align:center;padding:4px;border:1px solid #d1d5db}
        .cell{min-height:96px;border:1px solid #e5e7eb;border-radius:4px;position:relative;background:#fff}
        .dateNum{position:absolute;top:2px;right:4px;font-size:12px;color:#333;z-index:3}
        .holiday{background:#f3f4f6;color:#999}
        .tagTop,.tagBottom{position:absolute;left:2px;right:2px;display:flex;flex-direction:column;gap:2px;z-index:4}
        .tagTop{top:16px;align-items:center}
        .tagBottom{bottom:2px;align-items:flex-start}
        .tag{font-size:10px;background:rgba(255,255,255,.92);padding:0 2px;border-radius:2px;font-weight:800;max-width:100%;white-space:normal;word-break:break-word}
        .paint{position:absolute;inset:0;border-radius:4px;opacity:.75;z-index:1}
        .tri{position:absolute;inset:0;z-index:1}
        .tri.tl{clip-path:polygon(0 0,100% 0,0 100%)}
        .tri.br{clip-path:polygon(100% 0,100% 100%,0 100%)}
        .numTopRight,.numBottomRight{position:absolute;right:4px;display:flex;flex-direction:column;gap:1px;z-index:5}
        .numTopRight{top:26px}
        .numBottomRight{bottom:18px}
        .chip{font-size:10px;padding:0 3px;border-radius:2px;border:1px solid rgba(0,0,0,.2);background:rgba(255,255,255,.9);font-weight:700}
        /* Explicit colors for print (no CSS variables in iframe) */
        .hl-anchor{background:#0f172a}
        .hl-register{background:#4f46e5}
        .hl-overseas{background:#eab308}
        .hl-latest{background:#f59e0b}
        .hl-writ{background:#1d4ed8}
        .hl-notice{background:#0f766e}
        .hl-nomination{background:#15803d}
        .hl-pubnom{background:#4ade80}
        .hl-poll{background:#38bdf8}
        .hl-advance{background:#14b8a6}
        .hl-issue-suggest{background:#fef3c7}
      `;
      const html = `<!doctype html><html><head><title>Calendar</title>
      <style>${styles}</style></head><body>${multi.innerHTML}</body></html>`;
      printViaIframe(html);
    }

    function printKeyDates(){
      const panel=document.querySelector('.sidebar .panel').cloneNode(true);
      const html = `<!doctype html><html><head><title>Key Dates</title>
      <style>@page{size:A4 portrait;margin:12mm} *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} body{font-family:Segoe UI,Arial,sans-serif}</style>
      </head><body>${panel.outerHTML}</body></html>`;
      printViaIframe(html);
    }

    function build(){ buildGrid(y,m); render(); }
    build();

    return {state, buildGrid, render, printCalendar, printKeyDates};
  }

  // Tabs
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const target=t.dataset.target;
      document.getElementById('gen').style.display= target==='gen'? 'block':'none';
      document.getElementById('bye').style.display= target==='bye'? 'block':'none';
      document.getElementById('which').textContent = target==='gen'? 'General':'Bye-Election';
    });
  });

  // Collapsible instructions
  document.getElementById('toggleInst').addEventListener('click',()=>{
    const b=document.getElementById('instBody'); const hide=b.style.display!=='none'; b.style.display=hide?'none':'block';
    document.getElementById('toggleInst').textContent= hide? 'Show' : 'Hide';
  });

  // Init both modes
  const GEN = init('gen', false);
  const BYE = init('bye', true);
})();
});


// ===== PWA: register service worker (GitHub Pages friendly) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

