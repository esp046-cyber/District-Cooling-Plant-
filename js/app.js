"use strict";
const $=s=>document.querySelector(s),V=$("#view");
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const dl=(n,t,m)=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:m||"text/plain"}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)};
const N=id=>+$(id).value;
/* ---------- Stepper ---------- */
const PH=[
["Design",["Review P&IDs, I/O list and control narrative","Freeze tag naming convention (area-equipment-signal)","Approve network architecture (PLC, SCADA, BMS, Modbus/BACnet)","Define interlock and emergency matrix with client/consultant","Define alarm philosophy (priorities, deadbands, delays)","Issue FAT procedure and test sheets for approval"]],
["FAT",["Verify hardware vs BOQ and panel drawings","Power-up, memory backup and time sync test","I/O loop check with simulator (100% DI/DO/AI/AO)","Chiller staging and lead/lag rotation simulation","Anti-recycle, minimum-flow and safety interlock tests","Alarm, trend, report and user-role verification","Sign FAT certificate and punch list"]],
["Site integration",["Inspect field wiring, shields, earthing and surge protection","Point-to-point check with MEP/BMS vendor","Chiller, pump, valve, BTU meter comms (Modbus) online","Verify scaling, units and instrument ranges vs datasheets","Dry-run sequences with equipment locked out","Live loop tuning: CHW ΔP, VFD PID, valve stroke","Power-fail and auto-restart tests"]],
["SAT and handover",["Execute SAT sheets with client witness","Verify BTU/energy totals against meter","Performance test at ≥3 load points (kW/TR)","Backup SCADA/PLC projects and record checksums","Train operators and issue O&M manuals","As-built drawings, tag DB and punch-list closure","Handover certificate signed"]]];
let ph=get("ph",0);
function stepper(){const st=get("chk",{}),tot=PH.reduce((a,p)=>a+p[1].length,0),dn=Object.values(st).filter(Boolean).length;
const p=PH[ph],pd=p[1].filter((_,i)=>st[ph+"-"+i]).length;
V.innerHTML=`<section><h2>Project progress: ${Math.round(dn/tot*100)}%</h2><div class="bar"><i style="width:${dn/tot*100}%"></i></div>
<div class="steps" role="group" aria-label="Phases">${PH.map((x,i)=>`<button class="${i==ph?"on":""}" data-p="${i}">${i+1}. ${x[0]}</button>`).join("")}</div>
<h2>${p[0]} (${pd}/${p[1].length})</h2>${p[1].map((t,i)=>`<label class="chk" style="color:var(--ink);font-size:1rem"><input type="checkbox" data-c="${ph}-${i}" ${st[ph+"-"+i]?"checked":""}>${t}</label>`).join("")}
<p><button id="ex">Export JSON</button> <button class="g" id="exc">Export CSV</button> <button class="g" id="rs">Reset</button></p></section>`;
V.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ph=+b.dataset.p;put("ph",ph);stepper()});
V.querySelectorAll("[data-c]").forEach(c=>c.onchange=()=>{st[c.dataset.c]=c.checked;put("chk",st);stepper()});
$("#ex").onclick=()=>dl("dcp-progress.json",JSON.stringify({exported:new Date().toISOString(),state:st},null,1),"application/json");
$("#exc").onclick=()=>dl("dcp-progress.csv","Phase,Task,Done\n"+PH.flatMap((x,a)=>x[1].map((t,i)=>`"${x[0]}","${t}",${!!st[a+"-"+i]}`)).join("\n"),"text/csv");
$("#rs").onclick=()=>{if(confirm("Clear all checklist progress?")){put("chk",{});stepper()}}}
/* ---------- Calculators ---------- */
function calc(){V.innerHTML=`<section><h2>Plant load and efficiency</h2><div class="row">
<div><label>CHW flow (L/s)</label><input id="q" type="number" value="120"></div>
<div><label>Return temp (°C)</label><input id="tr" type="number" value="13.5" step=".1"></div>
<div><label>Supply temp (°C)</label><input id="ts" type="number" value="5.5" step=".1"></div>
<div><label>Plant power (kW)</label><input id="kw" type="number" value="600"></div></div><div id="o1" class="out"></div></section>
<section><h2>Pump affinity laws (VFD)</h2><div class="row">
<div><label>Rated flow (L/s)</label><input id="q1" type="number" value="100"></div>
<div><label>Rated speed (Hz)</label><input id="n1" type="number" value="50"></div>
<div><label>Rated power (kW)</label><input id="p1" type="number" value="45"></div>
<div><label>Target flow (L/s)</label><input id="q2" type="number" value="70"></div></div><div id="o2" class="out"></div></section>
<section><h2>Cooling tower approach</h2><div class="row"><div><label>CW leaving tower (°C)</label><input id="cw" type="number" value="32" step=".1"></div>
<div><label>Wet-bulb (°C)</label><input id="wb" type="number" value="28" step=".1"></div></div><div id="o3" class="out"></div></section>`;
const f=()=>{const q=N("#q"),dt=N("#tr")-N("#ts"),k=4.186*q*dt,tr=k/3.517,e=k>0?N("#kw")/tr:0;
$("#o1").textContent=`ΔT: ${dt.toFixed(2)} °C   ${dt<6?"(LOW ΔT syndrome risk)":""}\nCooling: ${k.toFixed(0)} kWt = ${tr.toFixed(0)} TR = ${(k*3412/1000).toFixed(0)} MBH\nEfficiency: ${e.toFixed(3)} kW/TR   COP ${(e?3.517/e:0).toFixed(2)}\nflow per TR: ${(q/tr*3600/1000*1000/1000).toFixed(2)} L/s ×3.6 = ${(q/tr*3.6).toFixed(2)} m³/h/TR`;
const r=N("#q2")/N("#q1");$("#o2").textContent=`Speed: ${(N("#n1")*r).toFixed(1)} Hz (${(r*100).toFixed(0)}%)\nHead: ${(r*r*100).toFixed(0)}% of rated\nPower: ${(N("#p1")*r**3).toFixed(1)} kW  (saving ${((1-r**3)*100).toFixed(0)}%)\nNote: valid for system curve through origin; min speed typically ≥ 30 Hz.`;
const ap=N("#cw")-N("#wb");$("#o3").textContent=`Approach: ${ap.toFixed(1)} K ${ap<3?"→ tower near limit, fans at max":ap>6?"→ reduce fan speed review / check fill":"→ normal"}`};
V.querySelectorAll("input").forEach(i=>i.oninput=f);f()}
/* ---------- Staging state machine ---------- */
const AR=600;let ch=get("ch",[0,1,2].map(i=>({n:"CH-0"+(i+1),on:!!(i==0),hrs:[1200,800,950][i],lock:0})));
let tm;
function staging(){V.innerHTML=`<section><h2>Chiller staging simulator</h2><div class="row">
<div><label>Load (TR)</label><input id="ld" type="number" value="900"></div>
<div><label>Capacity per chiller (TR)</label><input id="cp" type="number" value="500"></div>
<div><label>Stage-up at % of running cap.</label><input id="su" type="number" value="90"></div></div><div id="so" class="out"></div></section>
<section><h2>Units</h2><div class="wrap"><table id="tb"></table></div>
<p><button id="rot">Rotate lead (lowest run-hours)</button> <button class="g" id="sv">Save state</button></p>
<p style="color:var(--mut)">Rules: lead = lowest run-hours; lag stages up when load exceeds the stage-up % for the confirm delay; any stop starts a ${AR}s anti-recycle lockout; stage-down only if load &lt; (n-1) × capacity × 85%.</p></section>`;
const draw=()=>{const ld=N("#ld"),c=N("#cp"),su=N("#su")/100,run=ch.filter(x=>x.on).length,need=Math.max(1,Math.ceil(ld/(c*su))),
dn=run>1&&ld<(run-1)*c*.85;
$("#so").textContent=`Running: ${run}   Required: ${need}   Action: ${run<need?"STAGE UP → start next available (lowest hrs, no lockout)":dn?"STAGE DOWN → stop highest-hours unit":"HOLD"}`;
const ord=[...ch].sort((a,b)=>a.hrs-b.hrs);
$("#tb").innerHTML="<tr><th>Unit</th><th>State</th><th>Run hrs</th><th>Role</th><th>Anti-recycle</th><th></th></tr>"+ch.map((x,i)=>`<tr><td>${x.n}</td><td><span class="pill ${x.on?"ok":"wt"}">${x.on?"RUN":"STOP"}</span></td><td>${x.hrs}</td><td>${ord[0]===x?"Lead":ord[1]===x?"Lag 1":"Lag 2"}</td><td>${x.lock>0?`<span class="pill no">${x.lock}s</span>`:"clear"}</td><td><button data-i="${i}">${x.on?"Stop":"Start"}</button></td></tr>`).join("");
$("#tb").querySelectorAll("button").forEach(b=>b.onclick=()=>{const x=ch[+b.dataset.i];if(x.on){x.on=false;x.lock=AR}else if(x.lock>0)alert("Start blocked: anti-recycle timer active ("+x.lock+" s)");else x.on=true;draw()})};
$("#rot").onclick=()=>{ch.forEach(x=>{if(x.on)x.hrs+=1});draw()};
$("#sv").onclick=()=>put("ch",ch);
V.querySelectorAll("input").forEach(i=>i.oninput=draw);draw();
clearInterval(tm);tm=setInterval(()=>{if(!$("#tb"))return clearInterval(tm);let ch2=0;ch.forEach(x=>{if(x.lock>0){x.lock--;ch2=1}});if(ch2)draw()},1e3)}
/* ---------- Tag generator ---------- */
function tags(){V.innerHTML=`<section><h2>SCADA tag database generator</h2><div class="row">
<div><label>Plant prefix</label><input id="pf" value="DCP1"></div>
<div><label>Chillers</label><input id="nc" type="number" value="4" min="0"></div>
<div><label>CHW pumps</label><input id="np" type="number" value="4" min="0"></div>
<div><label>Cooling towers</label><input id="nt" type="number" value="4" min="0"></div></div>
<p><button id="gn">Generate</button> <button class="g" id="dc">Download CSV</button></p><div class="wrap"><table id="tt"></table></div></section>`;
let rows=[];
const T={CH:[["RUN_STS","DI","BOOL",""],["START_CMD","DO","BOOL",""],["FAULT","DI","BOOL",""],["CHWS_TEMP","AI","REAL","°C"],["CHWR_TEMP","AI","REAL","°C"],["LOAD_PCT","AI","REAL","%"],["KW","AI","REAL","kW"]],
PU:[["RUN_STS","DI","BOOL",""],["START_CMD","DO","BOOL",""],["FAULT","DI","BOOL",""],["VFD_SPD_CMD","AO","REAL","%"],["VFD_SPD_FB","AI","REAL","%"],["KW","AI","REAL","kW"]],
CT:[["FAN_RUN","DI","BOOL",""],["FAN_CMD","DO","BOOL",""],["FAN_SPD_CMD","AO","REAL","%"],["BASIN_TEMP","AI","REAL","°C"],["VIB_TRIP","DI","BOOL",""]]};
$("#gn").onclick=()=>{rows=[];const p=$("#pf").value.trim()||"DCP";
[["CH","CHL",N("#nc")],["PU","CHWP",N("#np")],["CT","CT",N("#nt")]].forEach(([k,n,c])=>{for(let i=1;i<=c;i++)T[k].forEach(s=>rows.push([`${p}_${n}${String(i).padStart(2,"0")}_${s[0]}`,s[1],s[2],s[3],`${n} ${i} ${s[0].replace(/_/g," ").toLowerCase()}`]))});
["CHWS_HDR_TEMP","CHWR_HDR_TEMP","CHW_HDR_DP","CHW_FLOW","BTU_TOTAL"].forEach(s=>rows.push([`${p}_PLANT_${s}`,"AI","REAL",s.includes("TEMP")?"°C":s.includes("DP")?"kPa":"",s]));
$("#tt").innerHTML="<tr><th>Tag</th><th>I/O</th><th>Type</th><th>Unit</th></tr>"+rows.slice(0,60).map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")+(rows.length>60?`<tr><td colspan=4>… ${rows.length-60} more in CSV</td></tr>`:"")};
$("#dc").onclick=()=>{if(!rows.length)$("#gn").click();dl("scada-tags.csv","Tag,IO,Type,Unit,Description\n"+rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n"),"text/csv")};$("#gn").click()}
/* ---------- Modbus TCP builder ---------- */
function modbus(){V.innerHTML=`<section><h2>Modbus TCP packet builder</h2><div class="row">
<div><label>Transaction ID</label><input id="tx" type="number" value="1"></div>
<div><label>Unit ID</label><input id="u" type="number" value="1"></div>
<div><label>Function</label><select id="f"><option value="1">01 Read coils</option><option value="2">02 Read discrete inputs</option><option value="3" selected>03 Read holding regs</option><option value="4">04 Read input regs</option><option value="5">05 Write single coil</option><option value="6">06 Write single reg</option></select></div>
<div><label>Address (0-based)</label><input id="a" type="number" value="0"></div>
<div><label>Quantity / value</label><input id="v" type="number" value="10"></div></div><div id="mo" class="out"></div>
<p><button id="cp">Copy hex</button></p><p style="color:var(--mut)">MBAP: txid(2) proto=0000 length(2) unit(1) + PDU. Port 502. Docs often show 1-based registers (40001 = address 0).</p></section>`;
const h=n=>n.toString(16).padStart(2,"0").toUpperCase();
const g=()=>{const t=N("#tx"),u=N("#u"),f=N("#f"),a=N("#a");let v=N("#v");if(f==5)v=v?0xFF00:0;
const pdu=[f,a>>8&255,a&255,v>>8&255,v&255],l=pdu.length+1,adu=[t>>8&255,t&255,0,0,l>>8,l&255,u,...pdu];
$("#mo").textContent=adu.map(h).join(" ")+`\n\nTxID ${t} | Len ${l} | Unit ${u} | FC ${h(f)} | Addr ${a} (0x${a.toString(16).toUpperCase()}) | ${f<5?"Qty":"Value"} ${v}`};
V.querySelectorAll("input,select").forEach(i=>i.oninput=g);g();
$("#cp").onclick=()=>navigator.clipboard?.writeText($("#mo").textContent.split("\n")[0])}
/* ---------- Interlocks ---------- */
function inter(){const R=[["Chiller start","CHWP running + flow proven; CWP running + flow proven; anti-recycle elapsed; no latched fault; E-stop healthy","Stop sequence; hold lockout"],
["Chiller min flow (VPF)","CHW flow ≥ manufacturer minimum (e.g. 50% of design)","Open bypass valve; stage pumps up; alarm if not restored in 30 s"],
["Chilled water pump","Suction valve open; no VFD fault; low-low suction pressure healthy","Trip pump; start standby"],
["Condenser water","Tower basin level OK; fan not in vibration trip","Trip fan; rely on remaining cells"],
["Refrigerant leak","Gas detector high alarm","Start emergency exhaust; stop chillers on high-high; announce evacuation"],
["Fire alarm","Fire signal from FACP","Per consultant: shutdown plant, close fire dampers"],
["Power failure","Loss of mains / generator on","Stagger restart: pumps → towers → chillers with 30–60 s gaps"],
["Emergency stop","Hardwired E-stop pressed","Hardwired trip of all chillers; software never overrides"]];
V.innerHTML=`<section><h2>Safety interlock & emergency matrix</h2><p style="color:var(--mut)">Template values: replace with project-approved limits.</p><div class="wrap"><table><tr><th>Equipment / event</th><th>Permissive / trigger</th><th>Action</th></tr>${R.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table></div>
<p><button id="ec">Export CSV</button></p></section>`;
$("#ec").onclick=()=>dl("interlock-matrix.csv","Item,Trigger,Action\n"+R.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n"),"text/csv")}
/* ---------- Router, share, install, SW ---------- */
const TABS=[["Stepper",stepper],["Calculators",calc],["Staging",staging],["Tags",tags],["Modbus",modbus],["Interlocks",inter]];
let cur=get("tab",0);
function show(i){cur=i;put("tab",i);$("#tabs").innerHTML=TABS.map((t,j)=>`<button role="tab" aria-selected="${j==i}" data-t="${j}">${t[0]}</button>`).join("");
$("#tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>show(+b.dataset.t));TABS[i][1]()}
show(cur);
$("#share").onclick=async()=>{const d={title:document.title,text:"DCP Field Companion – offline SCADA commissioning guide",url:location.href};
try{if(navigator.share)await navigator.share(d);else{await navigator.clipboard.writeText(d.url);alert("Link copied")}}catch{}};
let dp;addEventListener("beforeinstallprompt",e=>{e.preventDefault();dp=e;$("#install").hidden=false});
$("#install").onclick=async()=>{if(!dp)return;dp.prompt();await dp.userChoice;dp=null;$("#install").hidden=true};
const net=()=>$("#net").textContent=navigator.onLine?"online":"offline";addEventListener("online",net);addEventListener("offline",net);net();
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
