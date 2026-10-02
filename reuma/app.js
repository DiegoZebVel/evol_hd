'use strict';
/* =====================================================================
   Evol Reuma — ingresos, evoluciones, pendientes y altas (Reumatología)
   Datos solo en este dispositivo (localStorage).
   ===================================================================== */
const KEY='reumaEvo.v1';
const EXLBL={gen:'GENERAL',piel:'PIEL Y FANERAS',tcsc:'TCSC',osteo:'OSTEOARTICULAR',resp:'TÓRAX Y PULMONES',cv:'CARDIOVASCULAR',abd:'ABDOMEN',gu:'GENITOURINARIO',neuro:'NEUROLÓGICO'};
const EXDEF={gen:'AREG, AREN, AREH. DESPIERTO, LOTEP.',piel:'TIBIA, ELÁSTICA, HIDRATADA. LLENADO CAPILAR < 2 S. SIN LESIONES.',tcsc:'NO EDEMAS.',
  osteo:'NO SINOVITIS. ARTICULACIONES SIN DOLOR A LA MOVILIZACIÓN NI DEFORMIDADES.',resp:'MV PASA BIEN EN AMBOS HEMITÓRAX, NO RUIDOS AGREGADOS.',
  cv:'RCR DE BUENA INTENSIDAD, NO SOPLOS.',abd:'BLANDO, DEPRESIBLE, NO DOLOROSO A LA PALPACIÓN. RHA PRESENTES.',gu:'PPL NEGATIVO, PRU NEGATIVO.',neuro:'GLASGOW 15/15. SIN SIGNOS DE FOCALIZACIÓN NI MENÍNGEOS.'};
// Examen normal para EVOLUCIONES (modelo del servicio, en minúsculas). El de la nota de ingreso sigue siendo EXDEF.
const EXEV={gen:'REG, REH, REN.',piel:'No lesiones dérmicas.',tcsc:'',osteo:'No artritis.',resp:'MV pasa bien en ACP, no ruidos agregados.',cv:'RC rítmicos, no soplos.',
  abd:'Blando, depresible, no doloroso a la palpación.',gu:'',neuro:'Despierta, orientada.'};
const EVLBL={piel:'Piel',tcsc:'TCSC',resp:'Tórax',cv:'CV',abd:'Abdomen',gu:'GU',osteo:'SOMA',neuro:'Neurológico'};
const AEST=['estable','hemodinámicamente estable','en regular estado general','inestable'];
const AEVO=['estacionaria','favorable','desfavorable','tórpida'];
const CHK_ING=['NOTA DE INGRESO','ANÁLISIS DE INGRESO SOLICITADOS','INDICACIONES / MEDICACIÓN','INTERCONSULTAS QUE CORRESPONDAN','RECETA EN ESSI'];
const CHK_VIS=['RECETA EN ESSI'];
const CHK_ALTA=['EPICRISIS','INFORME DE ALTA','RECETA EN ESSI','LABORATORIOS AL ALTA','ORDEN DE ALTA','CITA PARA CONTROL'];
const CATALOG=['DIETA COMPLETA + LÍQUIDOS A VOLUNTAD','DIETA HIPOSÓDICA','DIETA POR NUTRICIÓN','CONTROL DE FUNCIONES VITALES + BHE','VÍA VENOSA PERIFÉRICA (VVP)',
 'NACL 0.9% 1000 ML EV A XX GOTAS/MIN','PREDNISONA 5 MG VO C/24H','PREDNISONA 20 MG VO C/24H','PREDNISONA 50 MG VO C/24H',
 'METILPREDNISOLONA 500 MG EV C/24H (PULSO)','METILPREDNISOLONA 1 G EV C/24H (PULSO)','HIDROCORTISONA 100 MG EV C/8H',
 'METOTREXATO 15 MG VO SEMANAL','ÁCIDO FÓLICO 5 MG VO SEMANAL (DÍA SIGUIENTE AL MTX)','ÁCIDO FÓLICO 0.5 MG VO C/24H','HIDROXICLOROQUINA 200 MG VO C/24H',
 'MICOFENOLATO MOFETILO 500 MG VO C/12H','ÁCIDO MICOFENÓLICO 360 MG VO C/12H','AZATIOPRINA 50 MG VO C/24H','LEFLUNOMIDA 20 MG VO C/24H','SULFASALAZINA 500 MG VO C/12H',
 'CICLOFOSFAMIDA 500 MG EV DOSIS ÚNICA','RITUXIMAB 1 G EV','TACROLIMUS 1 MG VO C/12H','CICLOSPORINA 50 MG VO C/12H','COLCHICINA 0.5 MG VO C/12H',
 'SULFAMETOXAZOL/TRIMETOPRIM 800/160 MG VO LUNES-MIÉRCOLES-VIERNES','OMEPRAZOL 20 MG VO C/24H EN AYUNAS','OMEPRAZOL 40 MG EV C/24H',
 'CARBONATO DE CALCIO 500 MG + VITAMINA D3 VO C/12H','ALENDRONATO 70 MG VO SEMANAL','ENOXAPARINA 40 MG SC C/24H','HEPARINA 5000 UI SC C/12H',
 'PARACETAMOL 1 G VO C/8H','PARACETAMOL 1 G EV CONDICIONAL A DOLOR O T° > 38 °C','METAMIZOL 1 G EV C/8H','TRAMADOL 50 MG EV C/8H',
 'AMLODIPINO 10 MG VO C/24H','LOSARTÁN 50 MG VO C/12H','NIFEDIPINO 30 MG VO C/12H','IRBESARTÁN 150 MG VO C/24H','FUROSEMIDA 40 MG VO C/24H','ATORVASTATINA 20 MG VO C/24H'];
const DXEST=['ESTABLE','EN MEJORÍA','ESTACIONARIO','EN DETERIORO','RESUELTO'];
const PTIPOS=['IC','IMAGEN','PROCEDIMIENTO','LABORATORIO','OTRO'];
const PEST=['POR SOLICITAR','SOLICITADO','RESULTADO'];

let DB=load();
function blank(){return {patients:{},hosps:{},evols:{},settings:{autor:'',ex:{...EXDEF},chkIng:CHK_ING.slice(),chkAlta:CHK_ALTA.slice(),chkVis:CHK_VIS.slice(),catalog:CATALOG.slice(),
  control:'CONTROL POR CONSULTORIO EXTERNO DE REUMATOLOGÍA',servicio:'REUMATOLOGÍA',sede:'Metropolitano',exEv:{...EXEV},evMayus:false,evInd:false,lastBackup:null}}}
function load(){try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r),b=blank();d.settings=Object.assign(b.settings,d.settings||{});d.settings.ex=Object.assign({...EXDEF},d.settings.ex||{});d.settings.exEv=Object.assign({...EXEV},d.settings.exEv||{});
  ['patients','hosps','evols'].forEach(k=>d[k]=d[k]||{});return d}}catch(e){}return blank()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('⚠️ No se pudo guardar: '+e.message)}}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});

/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const up=s=>String(s||'').toLocaleUpperCase('es');
function todayISO(){const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function nowHM(){const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())}
function fmtD(iso){if(!iso)return'';const[y,m,d]=iso.split('-');return d+'/'+m+'/'+y}
function fmtDot(iso){return fmtD(iso).replace(/\//g,'.')}
function dUTC(iso){const[y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)}
function days(a,b){return Math.round((dUTC(b)-dUTC(a))/864e5)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function dot(s){s=String(s||'').trim();return!s?'':/[.!?:]$/.test(s)?s:s+'.'}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2300)}
function getP(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o)}
function setP(o,p,v){const ks=p.split('.');let a=o;ks.slice(0,-1).forEach(k=>{a[k]=a[k]??{};a=a[k]});a[ks[ks.length-1]]=v}
const clone=o=>JSON.parse(JSON.stringify(o));
function lines(s){return String(s||'').split('\n').map(x=>x.trim()).filter(Boolean)}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();return ok}}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('No se pudo cargar '+src));document.head.appendChild(s)})}
const absURL=p=>new URL(p,location.href).href;

/* ---------- confirmación dentro de la app (no depende de los diálogos de Safari) ---------- */
function ask(msg,ok='Sí, continuar'){return new Promise(res=>{const o=document.createElement('div');o.className='modal';
  o.innerHTML=`<div class="mbox"><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-r="0">Cancelar</button><button class="btn pri" data-r="1">${esc(ok)}</button></div></div>`;
  o.addEventListener('click',e=>{const b=e.target.closest('button');if(b||e.target===o){o.remove();res(!!(b&&b.dataset.r==='1'))}});document.body.appendChild(o);o.querySelector('[data-r="1"]').focus()})}

/* ---------- consultas ---------- */
const P=dni=>DB.patients[dni]||{dni,nombre:'?'};
function hospsOf(dni){return Object.values(DB.hosps).filter(h=>h.dni===dni).sort((a,b)=>b.ingreso.localeCompare(a.ingreso))}
function activeH(){return Object.values(DB.hosps).filter(h=>!(h.alta&&h.alta.confirmed)).sort((a,b)=>String(a.cama).localeCompare(String(b.cama),'es',{numeric:true}))}
function evolsOf(hid){return Object.values(DB.evols).filter(e=>e.hid===hid).sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora))}
function evolOn(hid,f){return Object.values(DB.evols).find(e=>e.hid===hid&&e.fecha===f)}
function dh(h,f){return days(h.ingreso,f)+1}
function pLine(p){return [p.edad?p.edad+' A':'',p.sexo||''].filter(Boolean).join(' · ')}

/* ---------- modelos ---------- */
function newIng(){return {estado:'borrador',basal:'INDEPENDIENTE',servicio:'',disp:'CON VÍA VENOSA PERIFÉRICA Y SIN OXÍGENO SUPLEMENTARIO',
  ant:{patol:'',quir:'',hosp:'',alerg:'',med:''},hea:'',fv:{pas:'',pad:'',fc:'',fr:'',t:'',sat:'',o2:'AA'},ex:{...DB.settings.ex},otros:'',img:'',ic:'',prob:'',plan:'',ind:[]}}
function newHosp(dni,cama,ing,previo){const h={id:uid(),dni,cama:up(cama).trim(),ingreso:ing,ing:newIng(),labs:[],pend:[],chkIng:{},chkDia:{},citt:false,alta:null,created:Date.now(),updated:Date.now()};if(previo)h.ing.estado='previo';DB.hosps[h.id]=h;return h}
function probLines(s){return lines(s).map(x=>x.replace(/^[•·\-*\d.)\s]+/,'').trim()).filter(Boolean)}
const DEF_A='Paciente estable, con evolución clínica estacionaria.';
// O) como texto: primera línea general y luego "Piel: …", "Tórax: …"
function buildO(ex){ex=ex||{};const L=[String(ex.gen||'').trim()||'REG, REH, REN.'];Object.keys(EVLBL).forEach(k=>{const v=String(ex[k]||'').trim();if(v)L.push(EVLBL[k]+': '+v)});return L.join('\n')}
function defO(h){const ex={};Object.keys(EXLBL).forEach(k=>ex[k]=exEvDef(h,k));return buildO(ex)}
// Evoluciones guardadas con el formato anterior (dx/ex/Aextra/Pextra) → texto (probT, O, A, P)
function evNorm(e){if(!e||e.v===2)return e;const ex=e.ex;
  e.probT=(e.dx||[]).filter(d=>d.t&&d.t.trim()&&d.estado!=='RESUELTO').map(d=>d.t.trim()).join('\n');
  e.O=ex&&Object.values(ex).some(v=>String(v||'').trim())?buildO(ex):'';
  let a='Paciente '+(e.Aest||'estable')+', con evolución clínica '+(e.Aevo||'estacionaria')+'.';if(String(e.Aextra||'').trim())a+=' '+dot(e.Aextra.trim());(e.dx||[]).forEach(d=>{if(String(d.a||'').trim())a+=' '+dot(d.a.trim())});e.A=a;
  const P=[];(e.dx||[]).forEach(d=>lines(d.p).forEach(x=>P.push(x)));lines(e.Pextra).forEach(x=>P.push(x));e.P=P.join('\n');e.S=e.S||'';e.v=2;return e}
function pendLine(x){const lb=sc(pendLabel(x));return x.estado===0?(x.tipo==='IC'?lb:'SS '+lb):'Pendiente '+lb}
function addPendToPlan(h,P){const L=lines(P);pendActive(h).forEach(x=>{if(deacc(L.join(' ')).includes(deacc(pendLabel(x))))return;L.push(pendLine(x))});return L.join('\n')}
// líneas del P) que son pendientes: "Pendiente X" (solicitado), "SS X" / "IC X" (por pedir)
function pendFromPlan(Ls){const out=[];Ls.forEach(x=>{x=String(x).trim().replace(/\.$/,'');const u=deacc(x);let m;
  if((m=x.match(/^pendientes?\s*:?\s*/i))&&x.length>m[0].length)x.slice(m[0].length).split(/,\s*pendientes?\s+/i).forEach(t=>out.push({t:t.trim(),estado:1}));
  else if(/^SS\b/.test(u))out.push({t:x.replace(/^ss\s*/i,''),estado:0});else if(/^IC\b/.test(u))out.push({t:x,estado:0})});return out.filter(q=>q.t)}
function syncPendFromPlan(h,P){let n=0;pendFromPlan(lines(P)).forEach(q=>{const k=deacc(q.t);if(h.pend.some(x=>deacc(x.t)===k||deacc(pendLabel(x))===k))return;h.pend.push({id:uid(),tipo:pendType(q.t)||'OTRO',t:q.t,estado:q.estado,res:'',fres:'',created:Date.now()});n++});return n}
function newEvol(h,fecha){
  const prev=evolsOf(h.id).find(e=>e.fecha<fecha);
  const e={id:uid(),v:2,hid:h.id,dni:h.dni,fecha,hora:nowHM(),estado:'borrador',probT:'',S:'',O:'',A:DEF_A,P:'',fv:{pas:'',pad:'',fc:'',fr:'',t:'',sat:'',o2:'AA'},labSel:{},ind:[],prevId:prev?prev.id:null,texto:'',created:Date.now(),updated:Date.now()};
  if(prev){evNorm(prev);e.probT=lines(prev.probT).filter(l=>!/\(RESUELTO\)/i.test(l)).join('\n');e.O=prev.O||defO(h);e.ind=clone(prev.ind||[]);e.P=carryPlan(h,prev.P);
    const a1=(String(prev.A||'').match(/^Paciente[^.]*\./i)||[])[0];if(a1)e.A=a1}
  else{const g=h.ing;e.probT=probLines(g.prob).join('\n');const ex={};Object.keys(EXLBL).forEach(k=>{const iv=String((g.ex||{})[k]||'');ex[k]=(!iv.trim()||iv===DB.settings.ex[k]||iv===EXDEF[k])?exEvDef(h,k):iv});
    e.O=String(g.exT||'').trim()?lines(g.exT).map(x=>sc(x)).join('\n'):buildO(ex);e.ind=clone(g.ind);e.P=lines(g.plan).join('\n')}
  e.P=addPendToPlan(h,e.P);return e;
}
function exEvDef(h,k){let v=(DB.settings.exEv||EXEV)[k]||'';if(P(h.dni).sexo==='M')v=v.replace('Despierta','Despierto').replace('orientada','orientado');return v}
// el plan se arrastra al día siguiente sin lo que era "Hoy …" ni pendientes ya resueltos
function carryPlan(h,t){t=String(t||'');const res=h.pend.filter(x=>x.estado===2).map(x=>deacc(x.t)).filter(Boolean);
  return lines(t).filter(l=>{const u=deacc(l);if(/^HOY\b/.test(u))return false;if(/^(PENDIENTE|SS)\b/.test(u)&&res.some(r=>u.includes(r)))return false;return true}).join('\n')}
function prevRef(e){const h=DB.hosps[e.hid];const p=e.prevId&&DB.evols[e.prevId];return p?p.fecha:h.ingreso}
function refTime(e){const h=DB.hosps[e.hid];const p=e.prevId&&DB.evols[e.prevId];return p?(p.closedAt||p.created):(h.ing.completedAt||0)}
// como en el modelo del servicio: por defecto entran todos los resultados de la hospitalización (se pueden desmarcar)
function labSelected(e,l){if(e.labSel[l.id]!=null)return e.labSel[l.id];return l.fecha<=e.fecha}

/* ---------- textos ---------- */
function fvText(fv){const L=[];if(fv.pas||fv.pad)L.push('PA '+(fv.pas||'?')+'/'+(fv.pad||'?')+' MMHG');if(fv.fc)L.push('FC '+fv.fc+' LPM');if(fv.fr)L.push('FR '+fv.fr+' RPM');
  if(fv.t)L.push('T° '+fv.t+' °C');if(fv.sat)L.push('SATO2 '+fv.sat+'%'+(fv.o2?' ('+fv.o2+')':''));return L.length?L.join(', ')+'.':''}
function exText(ex){return Object.keys(EXLBL).filter(k=>String(ex[k]||'').trim()).map(k=>EXLBL[k]+': '+dot(ex[k])).join('\n')}
function indText(list,withDays,fecha){return list.filter(x=>x.t.trim()).map((x,i)=>(i+1)+'. '+dot(x.t.trim().replace(/\.$/,'')+(withDays&&x.fi&&fecha&&fecha>=x.fi?' (D'+(days(x.fi,fecha)+1)+')':''))).join('\n')}
function filiacion(p,ing){
  const s=[];const sx=p.sexo==='F'?'MUJER':p.sexo==='M'?'VARÓN':'';
  let a='PACIENTE'+(sx?' '+sx:'')+(p.edad?' DE '+p.edad+' AÑOS':'');
  if(p.natural||p.procedencia)a+=', '+[p.natural&&'NATURAL DE '+p.natural,p.procedencia&&'PROCEDENTE DE '+p.procedencia].filter(Boolean).join(' Y ');
  if(p.instruccion)a+=', CON GRADO DE INSTRUCCIÓN '+p.instruccion;if(p.ocupacion)a+=', OCUPACIÓN '+p.ocupacion;if(p.civil)a+=', ESTADO CIVIL '+p.civil;if(p.religion)a+=', RELIGIÓN '+p.religion;
  s.push(a+'.');if(ing.basal)s.push('ESTADO BASAL '+dot(ing.basal));
  if(ing.servicio||ing.disp)s.push('INGRESA'+(ing.servicio?' PROCEDENTE '+(/^(DE|DEL)\s/i.test(ing.servicio)?'':/^SERVICIO/i.test(ing.servicio)?'DEL ':/^(EMERGENCIA|UCI|UCIN|UVI|SHOCK|TRAUMA|CONSULTA|CONSULTORIO|OTRO HOSPITAL|HOSPITAL|CLINICA|CLÍNICA|DOMICILIO)/i.test(ing.servicio)?'DE ':'DEL SERVICIO DE ')+ing.servicio:'')+(ing.disp?(ing.servicio?', ':' ')+ing.disp:'')+'.');
  return up(s.join(' ').replace(/\.\./g,'.'));
}
function labsUpTo(h,f){return h.labs.filter(l=>l.fecha<=f)}
// Formato del modelo "nota de ingreso para llenar" del servicio (bloques separados por dos líneas en blanco)
function ingText(h){
  const p=P(h.dni),g=h.ing,A=g.ant,L=['NOTA DE INGRESO'];if(DB.settings.autor)L.push(DB.settings.autor);
  L.push('',filiacion(p,g),'','');
  L.push('ANTECEDENTES : ');if(A.patol.trim())L.push(A.patol.trim());L.push('QUIRÚRGICOS: '+dot(A.quir.trim()||'NIEGA'));if(A.hosp.trim())L.push('HOSPITALIZACIONES: '+dot(A.hosp.trim()));
  L.push('ALERGIAS: '+dot(A.alerg.trim()||'NIEGA'));L.push('MEDICACIÓN HABITUAL: '+dot(A.med.trim()||'NINGUNA'),'','');
  L.push('HISTORIA DE LA ENFERMEDAD ','',g.hea.trim()||'—','','');
  L.push('AL EXAMEN FISICO');const fv=fvText(g.fv);if(fv)L.push('FUNCIONES VITALES: '+fv);const ex=exText(g.ex);if(ex)L.push(ex);L.push('');
  const labs=labsUpTo(h,h.ingreso),num=labs.map(l=>({...l,items:l.items.filter(it=>!/^TXT_/.test(it.k))})).filter(l=>l.items.length),tx=[];
  labs.forEach(l=>l.items.filter(it=>/^TXT_/.test(it.k)).forEach(it=>tx.push({f:l.fecha,n:it.n,v:it.v,kd:txtKind(it.n)})));tx.sort((a,b)=>b.f.localeCompare(a.f));
  const lb=fmtLabsText(num,{ORINA:'FUNCION RENAL'});if(lb)L.push(lb);
  const ot=tx.filter(t=>t.kd!=='img').map(t=>'• '+fmtD(t.f)+': '+t.n+': '+dot(t.v));
  if(ot.length||g.otros.trim()){L.push('');ot.forEach(x=>L.push(x));if(g.otros.trim())L.push(g.otros.trim())}
  const im=tx.filter(t=>t.kd==='img').map(t=>fmtD(t.f)+', '+t.n+': '+dot(t.v));
  if(im.length||g.img.trim()){L.push('','IMÁGENES');im.forEach(x=>L.push(x));if(g.img.trim())L.push(g.img.trim())}
  if(g.ic.trim())L.push('','INTERCONSULTAS',g.ic.trim());
  L.push('','','PROBLEMAS ');lines(g.prob).forEach(x=>L.push(x));L.push('','','PLAN');lines(g.plan).forEach(x=>L.push(x));
  L.push('','INDICACIONES ');const it=indText(g.ind,false);if(it)L.push(it);
  return up(L.join('\n').replace(/\n{4,}/g,'\n\n\n'));
}
function pendResultsOn(h,f){return h.pend.filter(x=>x.estado===2&&x.fres===f&&String(x.res||'').trim())}
function pendLabel(x){const t=x.t.trim();return x.tipo==='IC'&&!/^IC\b/.test(deacc(t))?'IC '+t:t}
function pendActive(h){return h.pend.filter(x=>x.estado<2&&x.t.trim())}
function fvEv(fv){const L=[];if(fv.pas||fv.pad)L.push('PA '+(fv.pas||'?')+'/'+(fv.pad||'?')+' mmHg');if(fv.fc)L.push('FC '+fv.fc+' lpm');if(fv.fr)L.push('FR '+fv.fr+' rpm');
  if(fv.t)L.push('T° '+fv.t+' °C');if(fv.sat)L.push('SatO2 '+fv.sat+'%'+(fv.o2?' ('+fv.o2+')':''));return L.length?L.join(', ')+'.':''}
function autorTxt(a){a=String(a||'').trim();return /[a-z]/.test(a)?a:a.split(/\s+/).map(w=>w.length<=2?w:w[0]+w.slice(1).toLowerCase()).join(' ')}
function labBlock(e){const h=DB.hosps[e.hid];const B=fmtLabsEvol(h.labs.filter(l=>labSelected(e,l))),ic=[];
  const have=deacc(B.img.concat(B.proc,B.lab).join(' '));
  h.pend.filter(x=>x.estado===2&&x.fres&&x.fres<=e.fecha&&String(x.res||'').trim()).forEach(x=>{const r=sc(x.res.trim());if(x.tipo!=='IC'&&have.includes(deacc(r.slice(0,30))))return;
    const t=dm(x.fres)+' '+sc(pendLabel(x))+': '+dot(r);(x.tipo==='IMAGEN'?B.img:x.tipo==='PROCEDIMIENTO'?B.proc:x.tipo==='IC'?ic:B.lab).push(t)});
  const L=[];if(B.lab.length)L.push('','LAB',...B.lab);if(B.img.length)L.push('','Imágenes',...B.img);if(B.proc.length)L.push('','Procedimientos',...B.proc);if(ic.length)L.push('','Interconsultas',...ic);return L}
function evHeader(e){const h=DB.hosps[e.hid],S=DB.settings,L=[[sc(S.servicio||'Reumatología'),h.cama,S.sede].map(x=>String(x||'').trim()).filter(Boolean).join(' ')];if(S.autor)L.push(autorTxt(S.autor));return L}
// Formato del servicio: encabezado, problemas, S) O) LAB / Imágenes / Procedimientos, A) y P), todo en texto
function evolText(e){evNorm(e);
  const h=DB.hosps[e.hid],p=P(h.dni),S=DB.settings,L=evHeader(e);
  const pr=lines(e.probT);
  L.push('','Paciente'+(p.edad?' de '+p.edad+' años':'')+(pr.length?' con los siguientes problemas:':'.'));
  pr.forEach(l=>{const sub=/^(--|•|·)/.test(l);const t=l.replace(/^[-•·*\d.)\s]+/,'').trim();if(t)L.push((sub?'   -- ':'- ')+dot(sc(t)))});
  L.push('','S) '+(String(e.S||'').trim()?dot(sc(e.S.trim())):'Paciente sin molestias nuevas.'));
  const O=lines(e.O).map(x=>sc(x));L.push('','O) '+(O[0]||'REG, REH, REN.'),...O.slice(1));
  const fv=fvEv(e.fv||{});if(fv)L.push('FV: '+fv);
  L.push(...labBlock(e));
  L.push('','A) '+(sc(String(e.A||'').trim())||DEF_A));
  const Pl=lines(e.P).map(x=>dot(sc(x)));if(h.alta&&h.alta.fecha===e.fecha&&!Pl.some(x=>/^alta/i.test(x)))Pl.push('Alta.');if(!Pl.length)Pl.push('Continuar manejo actual.');
  L.push('','P) '+Pl[0],...Pl.slice(1));
  if(S.evInd){L.push('','Indicaciones');
    if(h.alta&&h.alta.fecha===e.fecha){L.push('1. Alta médica.','2. Indicaciones para casa:');altaInd(h).forEach(x=>L.push('   - '+dot(x.t)));altaExtra(h).forEach(x=>L.push('   - '+x))}
    else{const it=indText(e.ind||[],true,e.fecha);if(it)L.push(it)}}
  const t=L.join('\n');return S.evMayus?up(t):t;
}
/* ---------- alta ---------- */
const FLAG_RE=/(^|[^A-Z])(EV|IV|SC|IM|ENDOVENOS\w*|INTRAVENOS\w*|SUBCUTANE\w*|INFUSION|PERFUSION|NEBULIZ\w*|OXIGENO|O2|CONTROL DE|CFV|BHE|BALANCE|HGT|CABECERA|REPOSO|VVP|VIA VENOSA|DIETA|NPO|PULSO|DOSIS UNICA|CONDICIONAL)([^A-Z]|$)/;
function flagInd(t){return FLAG_RE.test(deacc(t))}
function altaInd(h){return (h.alta?.ind||[]).filter(x=>x.t.trim())}
function altaExtra(h){const a=h.alta,L=[];if(a.control.trim())L.push(dot(a.control));if(a.dm)L.push('DESCANSO MÉDICO HASTA EL '+fmtD(a.dm)+'.');return L}
function startAlta(h,fecha){
  const le=evolsOf(h.id)[0];
  const dx=le?probLines(evNorm(le).probT).filter(x=>!/\(RESUELTO\)/i.test(x)):probLines(h.ing.prob);
  const src=le?le.ind:h.ing.ind;
  h.alta={fecha,dx:dx.join('\n'),ind:src.filter(x=>x.t.trim()).map(x=>({id:uid(),t:x.t,flag:flagInd(x.t)})),control:DB.settings.control,dm:'',citt:false,chk:{},confirmed:false};
}
function altaChecklist(h){const a=h.alta,L=DB.settings.chkAlta.slice();if(a.dm)L.push('DESCANSO MÉDICO');if(h.citt||a.citt)L.push('CITT EN ESSI');return L}
function ordenText(h){const p=P(h.dni),a=h.alta,L=['ORDEN DE ALTA '+DB.settings.servicio,'PACIENTE: '+p.nombre,'DNI: '+(isTmp(p.dni)?'':p.dni)+'   CAMA: '+(h.cama||'—'),'DIAGNÓSTICO:'];
  lines(a.dx).forEach((x,i)=>L.push((i+1)+'. '+x));L.push('FECHA DE INGRESO: '+fmtDot(h.ingreso)+'   FECHA DE EGRESO: '+fmtDot(a.fecha),'INDICACIONES DE ALTA:');
  altaInd(h).forEach(x=>L.push(x.t.trim()));altaExtra(h).forEach(x=>L.push('• '+x));return up(L.join('\n'))}
function epicrisisData(h){
  const a=h.alta,L=['DATOS PARA EPICRISIS'],f2=a?a.fecha:todayISO();
  L.push('FECHA DE INGRESO: '+fmtD(h.ingreso)+'   FECHA DE EGRESO: '+(a?fmtD(a.fecha):'—')+'   ESTANCIA: '+days(h.ingreso,f2)+' DÍAS','');
  L.push('DIAGNÓSTICOS DE INGRESO:');probLines(h.ing.prob).forEach((x,i)=>L.push((i+1)+'. '+x));
  L.push('','DIAGNÓSTICOS DE EGRESO:');lines(a?a.dx:'').forEach((x,i)=>L.push((i+1)+'. '+x));
  const fs=[...new Set(h.labs.map(l=>l.fecha))].sort();
  if(fs.length){const fi=fs.find(f=>f>=h.ingreso)||fs[0],ff=fs[fs.length-1];
    L.push('','LABORATORIO AL INGRESO:',fmtLabsText(h.labs.filter(l=>l.fecha===fi)));if(ff!==fi)L.push('','LABORATORIO AL ALTA:',fmtLabsText(h.labs.filter(l=>l.fecha===ff)))}
  // tratamiento recibido
  const tr=new Map(),add=(t,f)=>{const k=deacc(t).replace(/\s+/g,' ').trim();if(!k||/^(DIETA|CONTROL|CFV|BHE|VIA VENOSA|VVP)/.test(k))return;const c=tr.get(k)||{t:up(t.trim()),a:f,b:f};if(f<c.a)c.a=f;if(f>c.b)c.b=f;tr.set(k,c)};
  h.ing.ind.forEach(x=>add(x.t,x.fi||h.ingreso));evolsOf(h.id).forEach(e=>e.ind.forEach(x=>add(x.t,e.fecha)));
  if(tr.size){L.push('','TRATAMIENTO RECIBIDO:');[...tr.values()].sort((x,y)=>x.a.localeCompare(y.a)).forEach(c=>L.push('- '+c.t+' ('+fmtD(c.a).slice(0,5)+(c.b!==c.a?' – '+fmtD(c.b).slice(0,5):'')+')'))}
  PTIPOS.forEach(t=>{const r=h.pend.filter(x=>x.tipo===t&&x.estado===2);if(r.length){L.push('',{IC:'INTERCONSULTAS',IMAGEN:'IMÁGENES',PROCEDIMIENTO:'PROCEDIMIENTOS',LABORATORIO:'OTROS EXÁMENES',OTRO:'OTROS'}[t]+':');r.forEach(x=>L.push('- '+(x.fres?fmtD(x.fres)+' ':'')+x.t.trim()+(x.res?': '+dot(x.res):'')))}});
  const ev=evolsOf(h.id).slice().reverse();
  if(ev.length){L.push('','EVOLUCIÓN POR DÍA:');ev.forEach(e=>{evNorm(e);L.push('- DH '+dh(h,e.fecha)+' ('+fmtD(e.fecha)+'): '+String(e.A||'').replace(/\s+/g,' ').trim())})}
  return up(L.join('\n'));
}

/* ---------- navegación ---------- */
let R={v:'censo',fecha:todayISO(),hid:null,eid:null,dni:null,q:'',tab:null,back:null};
let CUR=null,saveT=null;
function go(v,extra){Object.assign(R,{v,tab:null},extra||{});render();window.scrollTo(0,0)}
function render(){
  const nav={censo:['censo','nuevo','hosp','importEv','ingreso','evol','labs','alta'],pend:['pendientes'],pac:['pacientes','paciente'],aj:['ajustes']};
  Object.keys(nav).forEach(k=>$('#nav-'+k).classList.toggle('on',nav[k].includes(R.v)));
  CUR=null;document.querySelector('.bar')?.remove();
  const V={recibir:vRecibir,importEv:vImport,hosp:vHosp,censo:vCenso,nuevo:vNuevo,ingreso:vIngreso,evol:vEvol,labs:vLabs,alta:vAlta,pendientes:vPendientes,pacientes:vPacientes,paciente:vPaciente,ajustes:vAjustes}[R.v];
  $('#app').innerHTML=V();
  if(CUR&&CUR.mount)CUR.mount();
  if(CUR&&CUR.preview)CUR.preview();
}
function touch(){if(CUR&&CUR.root)CUR.root.updated=Date.now();if(CUR&&CUR.hid&&DB.hosps[CUR.hid])DB.hosps[CUR.hid].updated=Date.now();clearTimeout(saveT);saveT=setTimeout(save,350);if(CUR&&CUR.preview)CUR.preview()}
function resolve(path){if(path.startsWith('pat.'))return[DB.patients[CUR.dni],path.slice(4)];if(path.startsWith('h.'))return[DB.hosps[CUR.hid],path.slice(2)];return[CUR.root,path]}
function bar(html){const b=document.createElement('div');b.className='bar';b.innerHTML=html;document.body.appendChild(b)}

/* ---------- componentes ---------- */
function F(path,label,attrs=''){const[o,p]=resolve(path);return `<div><label>${label}</label><input data-p="${path}" value="${esc(getP(o,p)??'')}" autocomplete="off" ${attrs}></div>`}
function TA(path,label,rows=3,ph=''){const[o,p]=resolve(path);return `<div><label>${label}</label><textarea data-p="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(getP(o,p)??'')}</textarea></div>`}
const NUM='inputmode="decimal"';
function fvFields(pre){return `<div class="grid">${F(pre+'.pas','PAS (mmHg)',NUM)}${F(pre+'.pad','PAD (mmHg)',NUM)}${F(pre+'.fc','FC (lpm)',NUM)}${F(pre+'.fr','FR (rpm)',NUM)}${F(pre+'.t','T° (°C)',NUM)}${F(pre+'.sat','SatO2 (%)',NUM)}${F(pre+'.o2','Oxígeno','placeholder="AA / CBN 2 L"')}</div>`}
function indEditor(path,opts={}){const[o,p]=resolve(path);const list=getP(o,p);const withFi=opts.fi!==false,alta=!!opts.alta;
  return `<div data-indl="${path}">${list.map((x,i)=>`<div class="ind ${alta&&x.flag?'flag':''}"><span class="n">${i+1}.</span><input class="t" data-ind="${path}" data-i="${i}" value="${esc(x.t)}" autocomplete="off">
   ${withFi?`<input class="fi" type="date" data-indfi="${path}" data-i="${i}" value="${esc(x.fi||'')}" title="Fecha de inicio">`:''}
   ${alta&&x.flag?`<button class="btn sm" data-act="indOk" data-l="${path}" data-i="${i}" title="Dejar">✓</button>`:''}
   <button class="btn sm" data-act="indUp" data-l="${path}" data-i="${i}" ${i?'':'disabled'}>↑</button><button class="btn sm bad" data-act="indDel" data-l="${path}" data-i="${i}">✕</button></div>`).join('')||'<div class="muted">Sin indicaciones.</div>'}
   <div style="margin-top:8px"><input data-indnew="${path}" placeholder="Agregar indicación (escribe para buscar en el catálogo)…" autocomplete="off" autocapitalize="characters"><div class="sug" hidden></div></div>
   ${alta?'<p class="muted" style="margin:6px 0 0">En amarillo: EV/SC, infusiones, controles, dieta o condicionales. Revisa: ✓ para dejar, ✕ para quitar, o edita (p. ej. pasar a VO).</p>':''}</div>`}
function refreshInd(path){const box=document.querySelector(`[data-indl="${path}"]`);if(!box)return;const alta=path.startsWith('h.alta');box.outerHTML=indEditor(path,{fi:!alta,alta})}
function pendEditor(h){return `<div id="pendBox">${h.pend.map(x=>pendRow(h,x,false)).join('')||'<div class="muted">Sin pendientes.</div>'}
  <div class="row" style="margin-top:8px"><select id="pNewT" style="width:150px">${PTIPOS.map(t=>`<option>${t}</option>`).join('')}</select><input id="pNew" placeholder="p. ej. OFTALMOLOGÍA / TEM DE TÓRAX / BIOPSIA RENAL" style="flex:1;min-width:180px" autocomplete="off">
  <button class="btn sm pri" data-act="pAdd" data-hid="${h.id}">+ Agregar</button></div></div>`}
function pendRow(h,x,showPat){const p=P(h.dni);return `<div class="pd" data-pdrow="${x.id}">${showPat?`<div style="grid-column:1/-1" class="muted"><b>${esc(h.cama||'—')}</b> · ${esc(p.nombre)}</div>`:''}
  <select data-pd="${x.id}" data-hid="${h.id}" data-f="tipo">${PTIPOS.map(t=>`<option ${x.tipo===t?'selected':''}>${t}</option>`).join('')}</select>
  <input data-pd="${x.id}" data-hid="${h.id}" data-f="t" value="${esc(x.t)}" autocomplete="off">
  <button class="est e${x.estado}" data-act="pEst" data-hid="${h.id}" data-id="${x.id}">${PEST[x.estado]}</button>
  <button class="btn sm bad" data-act="pDel" data-hid="${h.id}" data-id="${x.id}">✕</button>
  ${x.estado===2?`<div class="res grid w2"><div><label>Resultado / conclusión</label><input data-pd="${x.id}" data-hid="${h.id}" data-f="res" value="${esc(x.res||'')}" autocomplete="off"></div><div><label>Fecha del resultado</label><input type="date" data-pd="${x.id}" data-hid="${h.id}" data-f="fres" value="${esc(x.fres||'')}"></div></div>`:''}</div>`}
function pendType(l){const u=deacc(l);
    if(/\b(IC|INTERCONSULTA)\b/.test(u))return'IC';if(/\b(TEM|TAC|RX|RADIOGRAF|ECOGRAF|ECO|RMN|RESONANCIA|ANGIOTEM|DOPPLER|ECOCARDIO|GAMMAGRAF|DENSITOMETR)/.test(u))return'IMAGEN';
    if(/(\bBX\b|\bEDA\b|MANOMETR|BIOPSIA|PUNCION|PARACENTESIS|TORACOCENTESIS|ARTROCENTESIS|BRONCOSCOP|ENDOSCOP|COLONOSCOP|CAPILAROSCOP|ELECTROMIOGRAF|EMG)/.test(u))return'PROCEDIMIENTO';
    if(/\b(SS|SOLICITAR|DOSAJE|HEMOGRAMA|PERFIL|ANCA|ANA|ANTI|CULTIVO|HEMOCULTIVO|UROCULTIVO|ORINA|COMPLEMENTO|C3|C4|PCR|VSG|SEROLOG)/.test(u))return'LABORATORIO';return null}
function detectPend(h,text){
  const add=[];lines(text).forEach(l=>{const t=pendType(l);
    if(t){const clean=up(l.replace(/^[•·\-*\d.)\s]+/,'').replace(/^(SS|SOLICITAR|SE SOLICITA|PENDIENTE)\s*:?\s*/i,'').trim());
      if(!h.pend.some(x=>deacc(x.t)===deacc(clean)))add.push({id:uid(),tipo:t,t:clean,estado:0,res:'',fres:'',created:Date.now()})}});
  h.pend.push(...add);return add.length;
}

/* ---------- eventos globales ---------- */
const APP=document.getElementById('app');
APP.addEventListener('input',onInput);APP.addEventListener('change',onInput);APP.addEventListener('click',onClick);
function onInput(ev){const t=ev.target;if(!CUR)return;
  if(ev.type==='change'&&t.tagName==='INPUT'&&t.type!=='checkbox'&&t.type!=='date'&&t.type!=='file')return; // ya manejado en input
  const d=t.dataset;
  if(d.p){const[o,p]=resolve(d.p);setP(o,p,t.type==='checkbox'?t.checked:(t.dataset.up!=null?up(t.value):t.value));CUR.onField&&CUR.onField(d.p,t);return touch()}
  if(d.ind){const[o,p]=resolve(d.ind);getP(o,p)[+d.i].t=up(t.value);if(t.selectionStart!=null){const c=t.selectionStart;t.value=up(t.value);t.setSelectionRange(c,c)}return touch()}
  if(d.indfi){const[o,p]=resolve(d.indfi);getP(o,p)[+d.i].fi=t.value;return touch()}
  if(d.indnew!=null&&ev.type==='input'){return suggest(t)}
  if(d.pd){const h=DB.hosps[d.hid],x=h.pend.find(y=>y.id===d.pd);x[d.f]=d.f==='t'||d.f==='res'?up(t.value):t.value;if(d.f==='t'||d.f==='res'){const c=t.selectionStart;t.value=up(t.value);try{t.setSelectionRange(c,c)}catch(_){}}x.updated=Date.now();h.updated=Date.now();clearTimeout(saveT);saveT=setTimeout(save,350);CUR.preview&&CUR.preview();return}
  if(d.chk){const h=DB.hosps[d.hid];h.chkDia=h.chkDia||{};const obj=d.scope==='alta'?h.alta.chk:d.scope==='dia'?(h.chkDia[d.f]=h.chkDia[d.f]||{}):h.chkIng;obj[d.chk]=t.checked;t.closest('.chkl').classList.toggle('done',t.checked);return touch()}
  if(d.labsel){const e=CUR.root;e.labSel[d.labsel]=t.checked;return touch()}
}
function suggest(inp){const box=inp.nextElementSibling,q=deacc(inp.value).trim();if(q.length<2){box.hidden=true;return}
  const w=q.split(/\s+/);const res=DB.settings.catalog.filter(c=>{const u=deacc(c);return w.every(x=>u.includes(x))}).slice(0,7);
  box.innerHTML=res.map(r=>`<button data-act="sugPick" data-v="${esc(r)}">${esc(r)}</button>`).join('')+`<button data-act="sugPick" data-v="${esc(up(inp.value.trim()))}"><b>+ Usar “${esc(up(inp.value.trim()))}”</b></button>`;box.hidden=false}
function addInd(path,text){text=up(text).trim().replace(/\s+/g,' ');if(!text)return;const[o,p]=resolve(path);const l=getP(o,p);
  const item={id:uid(),t:text,fi:path.includes('alta')?undefined:(CUR.fecha||todayISO())};if(path.includes('alta'))item.flag=flagInd(text)&&false;l.push(item);
  if(!DB.settings.catalog.some(c=>deacc(c)===deacc(text)))DB.settings.catalog.push(text);refreshInd(path);touch();const n=document.querySelector(`[data-indnew="${path}"]`);n&&n.focus()}
APP.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.indnew!=null){e.preventDefault();addInd(e.target.dataset.indnew,e.target.value)}});
async function onClick(ev){const b=ev.target.closest('button');if(!b)return;const d=b.dataset,a=d.act;if(!a)return;
  if(a==='tab'){R.tab=d.tab;render();return}
  if(a==='sugPick'){const inp=b.closest('.sug').previousElementSibling;addInd(inp.dataset.indnew,d.v);return}
  if(a==='indDel'||a==='indUp'||a==='indOk'){const[o,p]=resolve(d.l);const l=getP(o,p),i=+d.i;
    if(a==='indDel')l.splice(i,1);else if(a==='indUp')[l[i-1],l[i]]=[l[i],l[i-1]];else l[i].flag=false;refreshInd(d.l);return touch()}
  if(a==='pAdd'){const h=DB.hosps[d.hid],t=up($('#pNew').value).trim();if(!t)return toast('Escribe el pendiente');h.pend.push({id:uid(),tipo:$('#pNewT').value,t,estado:0,res:'',fres:'',created:Date.now()});save();R.keepTab=true;return rerender()}
  if(a==='pEst'){const h=DB.hosps[d.hid],x=h.pend.find(y=>y.id===d.id);x.estado=(x.estado+1)%3;if(x.estado===2&&!x.fres)x.fres=R.fecha;x.updated=Date.now();h.updated=Date.now();save();return rerender()}
  if(a==='pDel'){const h=DB.hosps[d.hid],x=h.pend.find(y=>y.id===d.id);if(x.t&&!await ask('¿Quitar “'+x.t+'”?'))return;h.pend=h.pend.filter(y=>y.id!==d.id);save();return rerender()}
  if(CUR&&CUR.click)return CUR.click(a,d,b);
}
function rerender(){const y=window.scrollY;render();window.scrollTo(0,y)}

/* =====================================================================
   VISTAS
   ===================================================================== */
function backupBanner(){if(!Object.keys(DB.hosps).length)return'';const lb=DB.settings.lastBackup,d=lb?Math.floor((Date.now()-lb)/864e5):null;if(d!==null&&d<7)return'';
  return `<div class="alert a-warn">${lb?'Tu último respaldo fue hace '+d+' días.':'Aún no has hecho un respaldo.'} <button class="btn sm" onclick="exportBackup()">Respaldar ahora</button></div>`}
function vCenso(){
  const hs=activeH();
  const altasHoy=Object.values(DB.hosps).filter(h=>h.alta&&h.alta.fecha===R.fecha);
  const cards=hs.map(h=>{const p=P(h.dni),e=evolOn(h.id,R.fecha),n=pendActive(h).length,m=momento(h);
    const eb=e?{borrador:'<span class="badge b-pend">Evol: borrador</span>',visita:'<span class="badge b-ok">Evol: post-visita</span>',final:'<span class="badge b-copy">Evol: final</span>'}[e.estado]:(m==='evol'?'<span class="badge b-alta">Sin evolución hoy</span>':'');
    const ib=h.ing.estado==='borrador'?'<span class="badge b-pend">Ingreso incompleto</span>':'';
    return `<div class="card" style="cursor:pointer" onclick="go('hosp',{hid:'${h.id}'})"><div class="pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">${esc(p.nombre)}</div>
    <div class="muted">${dniTag(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''} · DH ${dh(h,R.fecha)}${n?' · '+n+' pendiente(s)':''}</div></div></div>
    <div class="row">${ib}${eb}${h.alta?'<span class="badge b-ok">Alta en proceso</span>':''}<span class="muted" style="font-size:22px">›</span></div></div></div>`}).join('');
  return backupBanner()+`<div class="card"><div class="row"><div style="flex:1;min-width:180px"><label>Fecha de trabajo</label><input type="date" value="${R.fecha}" onchange="R.fecha=this.value||todayISO();render()"></div>
   <div class="muted" style="align-self:flex-end;padding-bottom:10px">${hs.length} en censo</div></div></div>
   <div class="row" style="margin-bottom:12px"><button class="btn pri" onclick="go('nuevo',{q:'',modo:null})">+ Agregar paciente</button><span class="sp"></span>
   <button class="btn" onclick="exportTxtDia()">TXT del día</button>
   <button class="btn" ${altasHoy.length?'':'disabled'} onclick="exportOrdenes(R.fecha)">Órdenes de alta (Word)</button></div>
   ${cards||'<div class="card muted">No hay pacientes en el censo. Toca “Agregar paciente”.</div>'}`;
}
function openEvol(hid){const h=DB.hosps[hid];let e=evolOn(hid,R.fecha);if(R.fecha<h.ingreso)return toast('La fecha es anterior al ingreso');
  if(!e){e=newEvol(h,R.fecha);DB.evols[e.id]=e;save()}go('evol',{eid:e.id,hid})}
function openAlta(hid){const h=DB.hosps[hid];if(!h.alta){startAlta(h,R.fecha);save()}go('alta',{hid})}


/* ---- Hospitalización (hub: ingreso → evoluciones → alta) ---- */
function momento(h){if(h.alta)return'alta';if(h.ing.estado!=='previo'&&R.fecha<=h.ingreso)return'ingreso';return'evol'}
function indChanged(h,f){const e=evolOn(h.id,f);if(!e)return false;const pv=e.prevId&&DB.evols[e.prevId];const k=l=>l.filter(x=>x.t.trim()).map(x=>deacc(x.t).trim()).sort().join('|');return k(pv?pv.ind:h.ing.ind)!==k(e.ind)}
function chkRow(label,checked,attrs,cls=''){return `<label class="chkl ${checked?'done':''} ${cls}"><input type="checkbox" ${attrs} ${checked?'checked':''}><span>${esc(label)}</span></label>`}
function infoRow(icon,label,cls=''){return `<div class="chkl ${cls}"><span>${icon}</span><span>${esc(label)}</span></div>`}
function chkIngHTML(h){const M=h.ing.estado==='previo'?[]:ingMissing(h),ic=h.pend.filter(x=>x.tipo==='IC');
  return DB.settings.chkIng.concat(h.citt?['CITT EN ESSI']:[]).filter(c=>!(h.ing.estado==='previo'&&c==='NOTA DE INGRESO')).map(c=>chkRow(c,h.chkIng[c],`data-chk="${esc(c)}" data-scope="ing" data-hid="${h.id}"`)).join('')
   +M.map(m=>infoRow('⚠️','FALTA EN LA NOTA: '+m,'auto')).join('')+ic.map(x=>infoRow(x.estado===2?'✅':x.estado===1?'📨':'⬜',pendLabel(x)+' — '+PEST[x.estado],x.estado===2?'done':'')).join('')}
function chkDiaHTML(h,f){const e=evolOn(h.id,f),c=(h.chkDia||{})[f]||{},pa=pendActive(h);
  const items=DB.settings.chkVis.concat(h.citt?['CITT EN ESSI']:[]);const chg=indChanged(h,f);
  return infoRow(e&&e.estado==='final'?'✅':e?'📝':'⬜','EVOLUCIÓN DEL DÍA — '+(e?{borrador:'BORRADOR',visita:'POST-VISITA',final:'CERRADA'}[e.estado]:'NO INICIADA'),e&&e.estado==='final'?'done':'')
   +items.map(it=>chkRow(it+(it.startsWith('RECETA')&&chg?' (CAMBIARON LAS INDICACIONES)':''),c[it],`data-chk="${esc(it)}" data-scope="dia" data-f="${f}" data-hid="${h.id}"`,it.startsWith('RECETA')&&chg&&!c[it]?'auto':'')).join('')
   +infoRow(pa.length?'📋':'✅',pa.length?'PENDIENTES ACTIVOS: '+pa.length+' ('+pa.map(pendLabel).join('; ')+')':'SIN PENDIENTES ACTIVOS',pa.length?'':'done')}
function vHosp(){
  const h=DB.hosps[R.hid];if(!h){R.v='censo';return vCenso()}const p=P(h.dni),g=h.ing,m=momento(h),ev=evolsOf(h.id),eHoy=evolOn(h.id,R.fecha),a=h.alta;
  CUR={root:h,hid:h.id,dni:h.dni,onField(path){if(path==='h.citt')rerender()}};
  const sIng=g.estado==='previo'?'Recibido (ya evolucionado)':g.estado==='completa'?'✓ Nota completa':'Nota en borrador';
  const sEv=(ev.length?ev.length+' evolución(es)':'Sin evoluciones')+(eHoy?' · hoy: '+{borrador:'borrador',visita:'post-visita',final:'cerrada'}[eHoy.estado]:'');
  const sAl=!a?'—':a.confirmed?'✓ Confirmada ('+fmtD(a.fecha)+')':'En proceso ('+fmtD(a.fecha)+')';
  const step=(k,n,title,status,onclick,label)=>`<div class="card" style="flex:1;min-width:190px;margin:0;${m===k?'border:2px solid var(--pri)':''}"><div class="muted" style="font-size:12px;letter-spacing:.05em">${n} · ${title}${m===k?' · AHORA':''}</div><div style="font-weight:600;margin:4px 0 10px">${status}</div><button class="btn sm ${m===k?'pri':''}" onclick="${onclick}">${label}</button></div>`;
  const needImport=g.estado==='previo'&&!ev.length&&!probLines(g.prob).length;
  const labs=h.labs.slice().sort((x,y)=>y.fecha.localeCompare(x.fecha)).slice(0,3);
  return `<div class="card pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">${esc(p.nombre)}</div>
   <div class="muted">${dniTag(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''} · Ingreso ${fmtD(h.ingreso)} · <b>DH ${dh(h,R.fecha)}</b></div></div></div></div>
  ${isTmp(h.dni)?`<div class="alert a-warn"><div class="grid w2" style="align-items:end"><div><label>Falta el DNI (se toma solo al subir un PDF del ESSI en Labs)</label><input inputmode="numeric" placeholder="DNI / CE" onchange="setDniUI('${h.id}',this.value)"></div>${F('pat.nombre','Apellidos y nombres','data-up')}</div></div>`:''}
  ${needImport?`<div class="alert a-warn">Falta su evolución previa. <button class="btn sm pri" onclick="go('importEv',{hid:'${h.id}',first:true})">Subir evolución previa</button></div>`:''}
  <div class="row" style="align-items:stretch;margin-bottom:12px">
   ${step('ingreso',1,'INGRESO',sIng,`go('ingreso',{hid:'${h.id}'})`,g.estado==='previo'?'Ver datos':'Nota de ingreso')}
   ${step('evol',2,'EVOLUCIÓN',sEv,`openEvol('${h.id}')`,eHoy?'Evolución de hoy':'Evolucionar hoy')}
   ${step('alta',3,'ALTA',sAl,`openAlta('${h.id}')`,a?'Abrir alta':'Dar de alta')}</div>
  <div class="card"><div class="pt"><h3 style="margin:0">Checklist · ${m==='ingreso'?'ingreso':m==='alta'?'alta':'hoy '+fmtD(R.fecha)}</h3><label class="chk"><input type="checkbox" data-p="h.citt" ${h.citt?'checked':''}> Requiere CITT</label></div>
   <div style="margin-top:6px">${m==='ingreso'?chkIngHTML(h):m==='alta'?altaChecklist(h).map(c=>chkRow(c,a.chk[c],`data-chk="${esc(c)}" data-scope="alta" data-hid="${h.id}"`)).join(''):chkDiaHTML(h,R.fecha)}
   ${m!=='ingreso'&&g.estado==='borrador'?infoRow('⚠️','LA NOTA DE INGRESO SIGUE EN BORRADOR','auto'):''}</div></div>
  <div class="card"><h3>Pendientes</h3>${pendEditor(h)}</div>
  <div class="card"><div class="pt"><h3 style="margin:0">Laboratorio</h3><button class="btn sm pri" onclick="go('labs',{hid:'${h.id}',back:'hosp'})">Importar / ver</button></div>
   ${labs.map(l=>`<div style="margin-top:8px"><b>${fmtD(l.fecha)} · ${AREAS[l.area]}</b><div class="muted">${esc(sortItems(l.items).map(itemTxt).join(', '))}</div></div>`).join('')||'<div class="muted" style="margin-top:8px">Sin resultados.</div>'}</div>
  ${ev.length?`<div class="card"><h3>Evoluciones</h3>${ev.map(e=>`<div class="pt" style="border-bottom:1px solid var(--line);padding:6px 0"><span>${fmtD(e.fecha)} · DH ${dh(h,e.fecha)} · ${e.imported?'importada':e.estado}</span><button class="btn sm" onclick="R.fecha='${e.fecha}';go('evol',{eid:'${e.id}',hid:'${h.id}'})">Abrir</button></div>`).join('')}</div>`:''}
  <div class="card"><details><summary>Más opciones</summary><div class="row" style="margin-top:10px">
   <button class="btn sm" onclick="go('importEv',{hid:'${h.id}',first:false})">Importar otra evolución previa</button>
   <button class="btn bad sm" onclick="delHosp('${h.id}',true)">Eliminar esta hospitalización</button><button class="btn bad sm" onclick="delPatient('${esc(h.dni)}')">Eliminar paciente (todo)</button></div>
   <p class="muted">Eliminar es para pacientes de prueba o registrados por error. No se puede deshacer.</p></details></div>`;
}

/* ---- Importar evolución previa (texto) ---- */
const SECRE=[['dx',/^(PACIENTE\b[^:]{0,80}\bCON\b[^:]{0,40}?(PROBLEMAS|DX|DIAGNOSTICOS?)\s*:|PROBLEMAS?\b\s*:?|DIAGNOSTICOS?( DE TRABAJO| PRESUNTIVOS?| ACTIVOS)?\b\s*:?|DX\b\s*:?|IMPRESION DIAGNOSTICA\b\s*:?|I\.?D\.?\s*:)/],
 ['S',/^(S|SUBJETIVO)\s*[:)}\].-]|^SUBJETIVO\b/],['fv',/^(FUNCIONES VITALES|SIGNOS VITALES)\b\s*:?/],
 ['O',/^(O|OBJETIVO|EXAMEN FISICO|AL EXAMEN( FISICO)?|EF)\b\s*[:)}\].-]?|^[0Q]\s*[)}\]]/],['lab',/^(EXAMENES AUXILIARES|EXS? AUX\w*|LABORATORIO|LAB|RESULTADOS|PERFIL INMUNOLOGICO)\b\s*:?/],
 ['txt',/^(IMAGENES|PROCEDIMIENTOS|INTERCONSULTAS)\s*:?\s*$/],['A',/^(A|APRECIACION|ANALISIS|EVALUACION)\s*[:)}\].-]|^(APRECIACION|ANALISIS|EVALUACION)\b/],
 ['P',/^(P|PLAN( DE TRABAJO)?|CONDUCTA)\b\s*[:)}\].-]?/],['ind',/^(INDICACIONES\b\s*:?|(TRATAMIENTO|TTO|RP)\s*:)/],['pend',/^PENDIENTES?\s*:\s*$|^PENDIENTES\s*:/]];
const EXRE=[['gen',/^(GENERAL|ESTADO GENERAL|EG|EGRAL|APARIENCIA)\b/],['piel',/^(PIEL( Y (FANERAS|MUCOSAS))?|PYF)\b/],['tcsc',/^(TCSC|TEJIDO CELULAR( SUBCUTANEO)?)\b/],['osteo',/^(OSTEO\w*|ARTICULAR|LOCOMOTOR|SOMA|MUSCULO-? ?ESQUELETICO|EXTREMIDADES|FUERZA MUSCULAR)\b/],
 ['resp',/^(TORAX( Y PULMONES)?|TYP|T Y P|PULMONES|RESPIRATORIO|AP|APARATO RESPIRATORIO)\b/],['cv',/^(CV|CARDIOVASCULAR|CARDIO\w*|CORAZON|RCR|ACV)\b/],['abd',/^(ABD\w*)\b/],['gu',/^(GU|GENITOURINARIO|GENITO\w*|URINARIO|RENAL)\b/],['neuro',/^((SISTEMA )?NEURO\w*|SNC|SN)\b/]];
function stripNum(l){return l.replace(/^\s*(?:[-•·*]|\d+\s*[.)\-]|[a-z]\))\s*/i,'').trim()}
// Evolución en texto (TXT, ESSI, PDF o foto) → bloques de texto tal cual (problemas, S, O, A, P) + labs, informes y pendientes
function parseEvol(text,fecha){
  text=String(text||'').replace(/\r/g,'').replace(/[ \t]+([SOAP])\s*\)\s+/g,'\n$1) ').replace(/[ \t]+(LAB|Imágenes|IMÁGENES|Procedimientos|PROCEDIMIENTOS|Plan|PLAN)\s*\n/g,'\n$1\n');
  const out={dx:[],S:[],O:[],lab:[],txt:[],A:[],P:[],ind:[],pend:[],fv:[]};let sec=null,cama='',edad='';
  text.split('\n').forEach(raw=>{let l=raw.replace(/\s+/g,' ').trim();if(!l)return;let u=deacc(l);
    if(!sec){const hm=u.match(/^REUMATOLOG\w*\s*-?\s*(\d{2,4}\s*-?\s*[A-Z]?)\b/);if(hm){cama=hm[1].replace(/\s+/g,'');return}if(/^M[RC]\s+\S+$/.test(u))return}
    const em=u.match(/^PACIENTE\b.*?\bDE (\d{1,3}) ANOS/);if(em)edad=em[1];
    for(const[k,re]of SECRE){const m=u.match(re);if(m&&(k!=='pend'||sec!=='P')&&(k!=='P'||!/^(PA|PCR|PCO|PO2|PLAQ|PLA|PROT|PH|PT|PCT)\b/.test(u))&&(k!=='A'||!/^(AL|ALB|ANA|ANCA|AREG)\b/.test(u))&&(k!=='O'||!/^(OJOS|OIDOS|OSTEO)/.test(u))&&(k!=='dx'||!sec||!/^PACIENTE/.test(u)||sec==='dx'||!['S','O','A','P'].includes(sec))){sec=k;l=l.slice(m[0].length).replace(/^[\s:.)}\]\-]+/,'').trim();u=deacc(l);break}}
    if(!l)return;
    // líneas de examen sueltas ("Piel: …") fuera de una sección → O
    if(!sec&&/^[^:]{2,30}:/.test(u)&&EXRE.some(([k,re])=>re.test(u)))sec='O';
    if(sec)out[sec].push(l)});
  const r={cama,edad};
  r.dx=out.dx.map(stripNum).map(x=>x.replace(/:\s*(ESTABLE|EN MEJORIA|EN MEJORÍA|ESTACIONARIO|EN DETERIORO)\b.*$/i,'').replace(/\.$/,'')).filter(Boolean);
  r.probT=r.dx.join('\n');
  r.ind=out.ind.map(stripNum).filter(x=>x&&!/^(ALTA MEDICA|INDICACIONES PARA CASA)/i.test(deacc(x))).map(x=>{let fi='';const m=x.match(/\(?\bD(?:IA)?\s?(\d{1,3})\)?\.?\s*$/i);if(m&&fecha){const d=new Date(dUTC(fecha)-(+m[1]-1)*864e5);fi=d.toISOString().slice(0,10);x=x.replace(m[0],'').trim()}return {t:up(x.replace(/\.$/,'')),fi}});
  r.O=out.fv.map(x=>'FV: '+x).concat(out.O.map(x=>x.replace(/^[-•·*]\s*/,''))).join('\n');
  r.S=out.S.join(' ');r.A=out.A.join(' ');
  const pl=out.P.map(x=>x.replace(/^[-•·*]\s*/,'').trim()).filter(Boolean);r.P=pl.join('\n');
  r.pend=out.pend.flatMap(x=>stripNum(x).split(/;\s*/)).map(x=>x.trim()).filter(Boolean).map(t=>({t,estado:1})).concat(pendFromPlan(pl));
  r.plan=pl;
  const lr=parseEvLabs(out.lab,fecha);r.labs=lr.rows.length?lr.rows:parseLabs(out.lab.join('\n'),fecha).rows;
  r.txt=parseEvTexts(out.txt,fecha);r.fv='';
  r.found=['dx','S','O','A','P'].filter(k=>out[k].length);
  return r;
}
// guarda una evolución importada (ya parseada) en la hospitalización; devuelve la evolución
function importEvolInto(h,r,f,text){
  let e=evolOn(h.id,f);if(!e){e={id:uid(),hid:h.id,dni:h.dni,fecha:f,hora:'08:00',labSel:{},created:Date.now()};DB.evols[e.id]=e}
  const prev=evolsOf(h.id).find(x=>x.fecha<f);if(prev)evNorm(prev);
  Object.assign(e,{v:2,estado:'final',imported:true,probT:r.probT||(prev?prev.probT:probLines(h.ing.prob).join('\n')),S:r.S||'',O:r.O||(prev&&prev.O)||defO(h),A:r.A||DEF_A,P:r.P||'',fv:{pas:'',pad:'',fc:'',fr:'',t:'',sat:'',o2:'AA'},
    ind:r.ind&&r.ind.length?r.ind.map(x=>({id:uid(),t:x.t,fi:x.fi||''})):clone((prev&&prev.ind)||h.ing.ind||[]),prevId:prev?prev.id:null,texto:String(text||'').trim(),updated:Date.now(),closedAt:Date.now()});
  ['dx','ex','Aextra','Pextra','Aest','Aevo','exChg'].forEach(k=>delete e[k]);
  Object.values(DB.evols).forEach(x=>{if(x.hid===h.id&&x.fecha>f&&(!x.prevId||(DB.evols[x.prevId]&&DB.evols[x.prevId].fecha<f)))x.prevId=e.id});
  const p=DB.patients[h.dni];if(p&&r.edad&&!p.edad)p.edad=r.edad;if(r.cama&&!h.cama)h.cama=up(r.cama);
  r.labs.forEach(row=>addRowLab(h,row,false));(r.txt||[]).forEach(t=>addTxtLab(h,t));
  r.pend.forEach(q=>{const k=deacc(q.t);if(!h.pend.some(x=>deacc(x.t)===k||deacc(pendLabel(x))===k))h.pend.push({id:uid(),tipo:pendType(q.t)||'OTRO',t:q.t,estado:q.estado,res:'',fres:'',created:Date.now()})});
  if(h.ing.estado==='previo'&&!h.ing.prob.trim())h.ing.prob=e.probT;
  return e}
let IMP={text:'',r:null,fecha:null};
function vImport(){
  const h=DB.hosps[R.hid];if(!h){R.v='censo';return vCenso()}const p=P(h.dni);if(!IMP.fecha||IMP.hid!==h.id){IMP={text:'',r:null,fecha:addDays(R.fecha,-1),hid:h.id}}
  CUR={root:h,hid:h.id,dni:h.dni,mount(){LABSTATE.text=IMP.text;$('#lfotos').onchange=ev=>ocrFiles([...ev.target.files]).then(()=>{IMP.text=$('#ltext').value});$('#lpdf').onchange=ev=>pdfFiles([...ev.target.files]).then(()=>{IMP.text=$('#ltext').value});$('#ltext').oninput=e=>{IMP.text=e.target.value;LABSTATE.text=e.target.value}},async click(a){
    if(a==='manual'){IMP={text:'',r:null,fecha:null};LABSTATE.text='';return go('ingreso',{hid:h.id,tab:'prob'})}
    if(a==='parse'){IMP.text=$('#ltext').value;IMP.fecha=$('#ifecha').value||IMP.fecha;IMP.r=parseEvol(IMP.text,IMP.fecha);rerender();const miss=['dx','S','O','A','P'].filter(k=>!IMP.r.found.includes(k));if(miss.length)toast('No encontré: '+miss.map(k=>({dx:'problemas',S:'S)',O:'O)',A:'A)',P:'P)'})[k]).join(', ')+'. Revisa abajo')}
    else if(a==='claude'){const t='Reordena esta evolución médica SIN inventar datos, con estos encabezados exactos, cada uno en su línea:\nPROBLEMAS: (uno por línea, numerados)\nEXAMEN FÍSICO: (una línea por sistema: GENERAL:, PIEL:, TCSC:, OSTEOARTICULAR:, TÓRAX Y PULMONES:, CARDIOVASCULAR:, ABDOMEN:, GENITOURINARIO:, NEUROLÓGICO:)\nEXÁMENES AUXILIARES: (una línea por fecha: dd/mm/aaaa: EXAMEN valor, EXAMEN valor)\nPLAN: (uno por línea)\nPENDIENTES: (uno por línea)\nINDICACIONES: (una por línea, numeradas; conserva el (D3) si lo tiene)\n\n'+anonLabText($('#ltext').value);
      copyText(t).then(o=>toast(o?'Copiado sin nombre/DNI. Pega la respuesta de Claude en el cuadro y vuelve a Procesar':'No se pudo copiar'))}
    else if(a==='apply'){const r=IMP.r,f=IMP.fecha;if(!f)return toast('Pon la fecha de la evolución');if(f<h.ingreso)return toast('La fecha es anterior al ingreso ('+fmtD(h.ingreso)+')');
      r.probT=$('#idx').value.trim();r.O=$('#iO').value.trim();r.P=$('#iP').value.trim();
      if(evolOn(h.id,f)&&!await ask('Ya hay una evolución del '+fmtD(f)+'. ¿Reemplazarla con la importada?'))return;
      const e=importEvolInto(h,r,f,IMP.text);if(IMP.essi){IMP.essi.rows.forEach(x=>{if(x.fecha)addRowLab(h,x,true)});IMP.essi.texts.forEach(t=>{resolvePendImg(h,t);addTxtLab(h,{fecha:t.fecha,titulo:t.titulo,texto:t.concl||t.texto})})}
      let hoy=evolOn(h.id,R.fecha);if(hoy&&hoy.id!==e.id&&hoy.estado!=='final'&&await ask('La evolución de hoy ya estaba creada (borrador). ¿Rehacerla a partir de la importada?')){delete DB.evols[hoy.id];hoy=null}
      if(!hoy&&f<R.fecha){hoy=newEvol(h,R.fecha);DB.evols[hoy.id]=hoy}
      save();IMP={text:'',r:null,fecha:null};LABSTATE={text:'',rows:null,unk:[],fecha:null,busy:''};toast('Evolución del '+fmtD(f)+' importada');
      if(hoy)go('evol',{eid:hoy.id,hid:h.id});else go('hosp',{hid:h.id})}}};
  const r=IMP.r;
  return `<div class="card"><div class="pt"><div><div class="nm">${R.first?'Paso 2 · Sube su última evolución':'Importar evolución previa'} · ${esc(p.nombre)}</div><div class="muted">Cama ${esc(h.cama||'—')} · Ingreso ${fmtD(h.ingreso)}</div></div><button class="btn" onclick="go('hosp',{hid:'${h.id}'})">${R.first?'Hacerlo después':'← Volver'}</button></div>
   ${R.first?'<div class="row" style="margin-top:10px"><span class="muted">¿No tienes su evolución a la mano?</span><button class="btn sm" data-act="manual">Cargar problemas e indicaciones a mano</button></div>':''}</div>
  <div class="card"><h3>1 · Pega la evolución</h3><p class="muted" style="margin-top:0">Cópiala del ESSI, de un TXT o de la foto (Texto en vivo / lector). La app saca problemas, examen, plan, pendientes, indicaciones y labs; mañana solo evolucionas lo nuevo.</p>
   <div class="grid"><div><label>Fecha de esa evolución</label><input type="date" id="ifecha" value="${IMP.fecha}"></div></div>
   <div class="row" style="margin-top:10px"><label class="btn" style="margin:0;color:var(--ink);font-size:16px">📷 Leer foto(s)<input id="lfotos" type="file" accept="image/*" multiple style="display:none"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px">📄 PDF<input id="lpdf" type="file" accept="application/pdf" multiple style="display:none"></label><span class="muted">o pega el texto</span></div>
   <div id="lbusy" class="muted" style="margin-top:6px"></div><div class="prog" hidden><i id="lprog"></i></div>
   <textarea id="ltext" rows="12" style="margin-top:8px" placeholder="Pega aquí la evolución completa…">${esc(IMP.text)}</textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-act="parse">Procesar</button><span class="sp"></span><button class="btn sm" data-act="claude">Copiar para Claude (sin nombre/DNI)</button></div></div>
  ${r?`<div class="card"><h3>2 · Revisa lo encontrado</h3>
   <label>Problemas</label><textarea id="idx" rows="${Math.max(3,lines(r.probT).length+1)}">${esc(r.probT)}</textarea>
   <label style="margin-top:10px">O) Examen</label><textarea id="iO" rows="${Math.max(3,lines(r.O).length+1)}">${esc(r.O)}</textarea>
   <label style="margin-top:10px">P) Plan</label><textarea id="iP" rows="${Math.max(3,lines(r.P).length+1)}">${esc(r.P)}</textarea>
   <div class="muted" style="margin-top:6px">S): ${esc(r.S||'—')}<br>A): ${esc(r.A||'—')}</div>
   <label class="chk" style="margin-top:10px"><input type="checkbox" id="ipend" checked disabled> Se agregan ${r.pend.length} pendiente(s): ${esc(r.pend.map(q=>(q.estado?'Pendiente ':'Por pedir: ')+q.t).join('; ')||'—')}</label>
   <label class="chk" style="margin-top:6px"><input type="checkbox" id="ilabs" checked disabled> Se guardan ${r.labs.length} resultado(s) de laboratorio${(r.txt||[]).length?' y '+r.txt.length+' informe(s) (imágenes/procedimientos)':''}</label>
   ${r.edad||r.cama?`<div class="muted" style="margin-top:6px">${r.cama?'Cama '+esc(r.cama)+' · ':''}${r.edad?esc(r.edad)+' años':''} (se usan si faltan)</div>`:''}
   <div class="row" style="margin-top:12px"><button class="btn pri" data-act="apply">Guardar como evolución del ${fmtD(IMP.fecha)}</button></div></div>`:''}`;
}
function addDays(iso,n){return new Date(dUTC(iso)+n*864e5).toISOString().slice(0,10)}

/* ---- Agregar paciente: sin registro previo. DNI y nombre se completan después (o solos desde el ESSI) ---- */
const isTmp=d=>/^TMP-/.test(String(d||''));
function dniTag(d){return isTmp(d)?'<span style="color:var(--bad)">sin DNI</span>':'DNI '+esc(d)}
function tmpPatient(nombre){const dni='TMP-'+uid();DB.patients[dni]={dni,nombre:nombre||'SIN NOMBRE',edad:'',sexo:'',natural:'',procedencia:'',instruccion:'',ocupacion:'',civil:'',religion:'',updated:Date.now()};return dni}
// Asigna DNI real a una hospitalización; si el DNI ya existe (paciente conocido) une los datos y reutiliza sus antecedentes
function assignDni(hid,dni,ex){ex=ex||{};dni=String(dni||'').trim().replace(/\s/g,'').toUpperCase();const h=DB.hosps[hid];if(!h)return false;
  if(!/^[0-9A-Z]{6,12}$/.test(dni)||!/\d/.test(dni)){toast('DNI/CE no válido');return false}
  const old=h.dni,op=DB.patients[old];
  if(old!==dni){const other=Object.values(DB.hosps).find(x=>x.id!==h.id&&x.dni===dni&&!(x.alta&&x.alta.confirmed));if(other){toast('Ese DNI ya está en el censo (cama '+(other.cama||'—')+')');return false}
    let p=DB.patients[dni];
    if(p){if(op)Object.keys(op).forEach(k=>{if(!['dni','nombre'].includes(k)&&op[k]&&!p[k])p[k]=op[k]});if(op&&op.nombre&&!/^(SIN NOMBRE|CAMA )/.test(op.nombre)&&(!p.nombre||/^(SIN NOMBRE|CAMA )/.test(p.nombre)))p.nombre=op.nombre;
      const prev=hospsOf(dni).find(x=>x.id!==h.id);if(prev&&!Object.values(h.ing.ant).some(v=>String(v||'').trim()))h.ing.ant=clone(prev.ing.ant);toast('Paciente conocido: se unieron sus datos')}
    else{p=Object.assign({},op||{},{dni});DB.patients[dni]=p}
    h.dni=dni;Object.values(DB.evols).forEach(e=>{if(e.hid===h.id)e.dni=dni});
    if(isTmp(old)&&!Object.values(DB.hosps).some(x=>x.dni===old))delete DB.patients[old]}
  const p=DB.patients[dni];if(ex.nombre&&(!p.nombre||/^(SIN NOMBRE|CAMA )/.test(p.nombre)))p.nombre=up(ex.nombre);if(ex.sexo&&!p.sexo)p.sexo=ex.sexo;if(ex.edad&&!p.edad)p.edad=String(ex.edad);
  p.updated=Date.now();h.updated=Date.now();save();return true}
function setDniUI(hid,v){if(assignDni(hid,v)){rerender();toast('DNI guardado')}}
function vNuevo(){
  return `<div class="card"><h2>Agregar paciente</h2><p class="muted" style="margin-top:0">¿Cómo llega este paciente? (DNI y nombre se completan después o salen solos de los PDF del ESSI)</p>
   <div class="grid w2" style="margin-top:12px"><button class="btn pri" style="min-height:110px;font-size:18px" onclick="startNuevo()">🆕 Nuevo ingreso<br><span style="font-size:13px;font-weight:400">Abre la nota de ingreso directamente</span></button>
   <button class="btn" style="min-height:110px;font-size:18px" onclick="REC=null;go('recibir')">📋 Ya está evolucionado<br><span style="font-size:13px;font-weight:400">Subo su nota de ingreso, última evolución y análisis → la app arma la evolución de hoy</span></button></div></div>`}
function startNuevo(){const dni=tmpPatient();const h=newHosp(dni,'',R.fecha,false);save();go('ingreso',{hid:h.id})}

/* ---- Recibir paciente ya evolucionado ---- */
let REC=null;
function recBlank(){return {ing:'',ev:'',lab:'',evFecha:addDays(R.fecha,-1),essi:null,cama:'',dni:'',nombre:'',edad:'',sexo:'',fing:'',pLab:[]}}
// Nota de ingreso en el formato del servicio → campos
const ING_SEC=[['ant',/^ANTECEDENTES\b\s*:?/],['hea',/^HISTORIA (DE LA )?ENFERMEDAD( ACTUAL)?\b\s*:?/],['ex',/^(AL )?EXAMEN FISICO\b\s*:?/],['lab',/^(LAB|LABORATORIO|EXAMENES AUXILIARES|FUNCION RENAL|PERFIL INMUNOLOGICO)\b\s*:?/],
 ['img',/^IMAGENES\b\s*:?/],['ic',/^INTERCONSULTAS\b\s*:?/],['prob',/^(PROBLEMAS|DIAGNOSTICOS?)\b\s*:?/],['plan',/^PLAN\b\s*:?/],['ind',/^INDICACIONES\b\s*:?/]];
function parseIngNote(text,ref){const out={pre:[],ant:[],hea:[],ex:[],lab:[],img:[],ic:[],prob:[],plan:[],ind:[]};let sec='pre';
  String(text||'').split(/\r?\n/).forEach(raw=>{let l=raw.replace(/\t/g,' ').replace(/[ ]+/g,' ').trim();const u=deacc(l);
    for(const[k,re]of ING_SEC){const m=u.match(re);if(m&&(k!=='lab'||!/\d/.test(u.slice(m[0].length,m[0].length+3)))&&(k!=='plan'||u.length<40)){sec=k;l=l.slice(m[0].length).replace(/^[\s:]+/,'').trim();break}}
    out[sec].push(l)});
  const r={fil:{},ant:{patol:'',quir:'',hosp:'',alerg:'',med:''},ex:{},fv:{}};const U=up(out.pre.join(' ')),g=re=>{const m=U.match(re);return m?m[1].trim():''};
  r.fil.edad=g(/DE (\d{1,3}) AÑOS/);const sx=g(/PACIENTE (VAR[ÓO]N|MUJER)/);r.fil.sexo=sx?(/^M/.test(sx)?'F':'M'):'';
  r.fil.natural=g(/NATURAL DE ([^,.]+?)(?= Y PROCEDENTE|,|\.)/);r.fil.procedencia=g(/(?:Y |, )PROCEDENTE DE ([^,.]+)/);r.fil.instruccion=g(/GRADO DE INSTRUCCI[ÓO]N ([^,.]+)/);
  r.fil.ocupacion=g(/OCUPACI[ÓO]N ([^,.]+)/);r.fil.civil=g(/ESTADO CIVIL ([^,.]+)/);r.fil.religion=g(/RELIGI[ÓO]N ([^,.]+)/);
  r.basal=g(/ESTADO BASAL ([^.]+)/);r.servicio=g(/INGRESA PROCEDENTE (?:DEL SERVICIO DE |DE |DEL )?([^,.]+)/);r.disp=g(/INGRESA PROCEDENTE [^,.]+,\s*([^.]+)/);
  r.autor=(out.pre.find(x=>/^M[RC]\s/i.test(x))||'');
  let k='patol';const pat=[];out.ant.filter(Boolean).forEach(l=>{const u=deacc(l);const m=u.match(/^(?:ANTECEDENTES?\s+)?(PATOLOGICOS?|PERSONALES|QUIRURGICOS?|HOSPITALIZACIONES( PREVIAS)?|ALERGIC[OA]S?|ALERGIAS?|FARMACOLOGICOS?( RECIENTES)?|MEDICACION HABITUAL|MEDICAMENTOS?( HABITUALES?)?)\s*:\s*/);
    if(m){k=/^(P)/.test(m[1])?'patol':/^Q/.test(m[1])?'quir':/^H/.test(m[1])?'hosp':/^A/.test(m[1])?'alerg':'med';l=l.slice(m[0].length);if(!l.trim())return}if(k==='patol')pat.push(l);else r.ant[k]=(r.ant[k]?r.ant[k]+'\n':'')+l});
  r.ant.patol=pat.join('\n');Object.keys(r.ant).forEach(x=>r.ant[x]=up(r.ant[x].trim()));
  r.hea=up(out.hea.join('\n').replace(/^\n+|\n+$/g,'').replace(/\n{3,}/g,'\n\n'));
  r.exT=up(out.ex.filter(Boolean).join('\n'));let lastK=null;
  out.ex.filter(Boolean).forEach(l=>{const u=deacc(l);if(/^(FUNCIONES VITALES|FV|SIGNOS VITALES)\b/.test(u)){const n=re=>{const m=u.match(re);return m?m[1]:''};r.fv={pas:n(/PA\s*:?\s*(\d{2,3})\s*\//),pad:n(/PA\s*:?\s*\d{2,3}\s*\/\s*(\d{2,3})/),fc:n(/FC\s*:?\s*(\d{2,3})/),fr:n(/FR\s*:?\s*(\d{1,2})/),t:n(/T°?\s*:?\s*(\d{2}(?:[.,]\d)?)\s*°?C/),sat:n(/SAT\s*O?2?\s*:?\s*(\d{2,3})\s*%/)};return}
    for(const[kk,re]of EXRE){const m=u.match(re);if(m&&/:/.test(u.slice(0,40))){r.ex[kk]=up(l.slice(l.indexOf(':')+1).trim());lastK=kk;return}}
    if(lastK)r.ex[lastK]+=' '+up(l)});
  const labTxt=out.lab.filter(Boolean);r.labs=parseLabs(labTxt.join('\n'),ref).rows;r.txt=[];const ot=[];
  labTxt.forEach(l=>{const c=l.replace(/^[•·\-*]\s*/,'');if(parseLabs(c,ref).rows.length)return;if(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*[:,]/.test(c)&&/:/.test(c.replace(/^[\d\/]+\s*[:,]/,'')))r.txt.push(...parseEvTexts([c],ref));else if(c&&!/^(LAB|FUNCION RENAL|PERFIL)/i.test(deacc(c)))ot.push(l)});
  r.otros=up(ot.join('\n'));r.txt.push(...parseEvTexts(out.img.filter(Boolean),ref));
  r.ic=up(out.ic.filter(Boolean).join('\n'));r.prob=up(out.prob.filter(Boolean).join('\n'));r.plan=up(out.plan.filter(Boolean).join('\n'));
  r.ind=out.ind.filter(Boolean).map(stripNum).filter(Boolean).map(t=>({id:uid(),t:up(t.replace(/\.$/,'')),fi:''}));
  return r}
function addTxtLab(h,t){const T=String(t.texto||'').trim();if(!T)return false;if(h.labs.some(l=>l.items.some(i=>/^TXT_/.test(i.k)&&deacc(i.n||'')===deacc(t.titulo)&&deacc(i.v||'').slice(0,40)===deacc(T).slice(0,40))))return false;
  let L=h.labs.find(l=>l.fecha===t.fecha&&l.area==='OTROS');if(!L){L={id:uid(),fecha:t.fecha,area:'OTROS',items:[],created:0};h.labs.push(L)}L.items.push({k:'TXT_'+uid(),n:t.titulo,v:T});return true}
function addRowLab(h,row,over){const area=LABMAP[row.k]?LABMAP[row.k].a:'OTROS';let L=h.labs.find(l=>l.fecha===row.fecha&&l.area===area);if(!L){L={id:uid(),fecha:row.fecha,area,items:[],created:0};h.labs.push(L)}
  const it=L.items.find(i=>i.k===row.k);if(it){if(over)it.v=up(row.v);return false}L.items.push({k:row.k,v:up(row.v)});return true}
function recParse(){const S=REC;const ref=S.fing||R.fecha;
  S.pIng=S.ing.trim()?parseIngNote(S.ing,ref):null;S.pEv=S.ev.trim()?parseEvol(S.ev,S.evFecha):null;S.pLab=S.lab.trim()?parseLabs(S.lab,R.fecha).rows:[];
  const E=S.essi||{},u=S.u||(S.u={}),set=(k,v)=>{if(!u[k]&&v)S[k]=v};
  set('dni',E.dnis&&E.dnis.length===1?E.dnis[0]:'');set('nombre',E.nombre);set('edad',E.edad||(S.pEv&&S.pEv.edad)||(S.pIng&&S.pIng.fil.edad));
  set('sexo',E.sexo||(S.pIng&&S.pIng.fil.sexo));set('cama',S.pEv&&S.pEv.cama);set('fing',E.fing)}
function vRecibir(){if(!REC)REC=recBlank();const S=REC;
  const box=(k,title,hint)=>`<div class="card"><h3>${title}</h3><p class="muted" style="margin-top:0">${hint}</p>
   <div class="row"><label class="btn" style="margin:0;color:var(--ink);font-size:16px" onclick="TXT_TARGET='${k}'">📷 Foto(s)<input type="file" accept="image/*" multiple style="display:none" onchange="TXT_TARGET='${k}';ocrFiles([...this.files])"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px" onclick="TXT_TARGET='${k}'">📄 PDF<input type="file" accept="application/pdf" multiple style="display:none" onchange="TXT_TARGET='${k}';pdfFiles([...this.files])"></label><span class="muted">o pega el texto</span></div>
   <textarea id="rec_${k}" rows="6" style="margin-top:8px" oninput="REC.${k}=this.value" placeholder="Pega aquí…">${esc(S[k])}</textarea></div>`;
  CUR={root:null,click(a){if(a==='parse'){recParse();rerender();toast('Listo: revisa los datos y arma la evolución')}else if(a==='build')recBuild();else if(a==='clear'){REC=recBlank();rerender()}else if(a==='clrEssi'){S.essi=null;rerender()}},mount(){TXT_TARGET=null}};
  const E=S.essi;
  return `<div class="card"><div class="pt"><h2 style="margin:0">📋 Paciente ya evolucionado</h2><button class="btn sm" onclick="go('nuevo')">← Cambiar</button></div>
   <p class="muted">Sube lo que tengas (todo es opcional). Con eso la app llena su ficha, problemas, examen, labs, imágenes y pendientes, y arma la evolución de hoy en el formato del servicio.</p>
   <div id="lbusy" class="muted"></div><div class="prog" hidden><i id="lprog"></i></div></div>
  ${box('ing','1 · Nota de ingreso','Filiación, antecedentes, historia, examen, labs e imágenes del ingreso, problemas y plan.')}
  ${box('ev','2 · Última evolución','Problemas, S/O, labs “dd/mm”, imágenes, procedimientos, A) y P).').replace('</textarea></div>',`</textarea><div class="grid" style="margin-top:8px"><div><label>Fecha de esa evolución</label><input type="date" value="${S.evFecha}" onchange="REC.evFecha=this.value"></div></div></div>`)}
  <div class="card"><h3>3 · Últimos análisis e imágenes</h3><p class="muted" style="margin-top:0">PDF del ESSI (laboratorio, TEM, ecografías…). De ahí salen también el DNI, nombre, edad y sexo.</p>
   <div class="row"><label class="btn pri" style="margin:0;font-size:16px" onclick="TXT_TARGET='lab'">📄 PDF del ESSI<input type="file" accept="application/pdf" multiple style="display:none" onchange="TXT_TARGET='lab';pdfFiles([...this.files])"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px" onclick="TXT_TARGET='lab'">📷 Foto(s)<input type="file" accept="image/*" multiple style="display:none" onchange="TXT_TARGET='lab';ocrFiles([...this.files])"></label></div>
   ${E?`<div class="alert a-info" style="margin-top:10px">ESSI: ${E.rows.length} valores · ${E.texts.length} informe(s) · ${E.pend.length} sin resultado${E.nombre?' · '+esc(E.nombre):''}${E.dnis.length>1?' · ⚠️ '+E.dnis.length+' DNI distintos':''} <button class="link" data-act="clrEssi">quitar</button></div>`:''}
   <textarea id="rec_lab" rows="3" style="margin-top:8px" oninput="REC.lab=this.value" placeholder="(opcional) texto de análisis que no sea PDF del ESSI">${esc(S.lab)}</textarea></div>
  <div class="row" style="margin-bottom:12px"><button class="btn pri" data-act="parse">Procesar</button><button class="btn" data-act="clear">Limpiar todo</button></div>
  ${S.pIng||S.pEv||E||S.pLab.length?`<div class="card"><h3>4 · Datos del paciente</h3><p class="muted" style="margin-top:0">Se llenaron solos; corrige lo que haga falta. DNI y nombre pueden quedar vacíos y completarse después.</p>
   <div class="grid w2"><div><label>DNI / CE</label><input value="${esc(S.dni)}" inputmode="numeric" oninput="REC.dni=this.value;(REC.u=REC.u||{}).dni=1"></div><div><label>Apellidos y nombres</label><input value="${esc(S.nombre)}" oninput="REC.nombre=this.value.toUpperCase();(REC.u=REC.u||{}).nombre=1"></div></div>
   <div class="grid" style="margin-top:10px"><div><label>Cama</label><input value="${esc(S.cama)}" oninput="REC.cama=this.value;(REC.u=REC.u||{}).cama=1"></div><div><label>Edad</label><input value="${esc(S.edad)}" inputmode="numeric" oninput="REC.edad=this.value;(REC.u=REC.u||{}).edad=1"></div>
    <div><label>Sexo</label><select onchange="REC.sexo=this.value;(REC.u=REC.u||{}).sexo=1"><option value="">—</option><option value="M" ${S.sexo==='M'?'selected':''}>Varón</option><option value="F" ${S.sexo==='F'?'selected':''}>Mujer</option></select></div>
    <div><label>Fecha de ingreso al servicio</label><input type="date" value="${esc(S.fing)}" onchange="REC.fing=this.value;(REC.u=REC.u||{}).fing=1"></div></div>
   <div class="muted" style="margin-top:10px">${[S.pIng?'Nota de ingreso: '+lines(S.pIng.prob).length+' problema(s), '+S.pIng.labs.length+' labs, '+S.pIng.txt.length+' informe(s)':'',S.pEv?'Evolución del '+fmtD(S.evFecha)+': '+S.pEv.dx.length+' problema(s), '+S.pEv.labs.length+' labs, '+(S.pEv.txt||[]).length+' informe(s), '+S.pEv.pend.length+' pendiente(s)':'',E?'ESSI: '+E.rows.length+' valores, '+E.texts.length+' informe(s)':'',S.pLab.length?'Texto: '+S.pLab.length+' valores':''].filter(Boolean).join('<br>')}</div>
   <div class="row" style="margin-top:12px"><button class="btn pri" data-act="build">Armar evolución de hoy →</button></div></div>`:''}`}
function recBuild(){const S=REC;if(!S.fing)return toast('Pon la fecha de ingreso al servicio (para el DH)');if(S.fing>R.fecha)return toast('La fecha de ingreso es posterior a hoy');
  if(S.pEv&&S.evFecha&&S.evFecha<S.fing)return toast('La evolución es anterior a la fecha de ingreso');
  const dniOk=/^[0-9A-Za-z]{6,12}$/.test(S.dni.trim())&&/\d/.test(S.dni);
  if(dniOk){const act=Object.values(DB.hosps).find(x=>x.dni===S.dni.trim()&&!(x.alta&&x.alta.confirmed));if(act)return toast('Ese DNI ya está en el censo (cama '+(act.cama||'—')+')')}
  const tmp=tmpPatient(up(S.nombre.trim())||('CAMA '+up(S.cama.trim()||'?')));const h=newHosp(tmp,S.cama,S.fing,true);
  if(dniOk)assignDni(h.id,S.dni,{nombre:S.nombre,sexo:S.sexo,edad:S.edad});const p=DB.patients[h.dni];if(S.edad&&!p.edad)p.edad=S.edad;if(S.sexo&&!p.sexo)p.sexo=S.sexo;
  const g=h.ing,I=S.ing.trim()?parseIngNote(S.ing,S.fing):null;
  if(I){Object.keys(I.fil).forEach(k=>{if(I.fil[k]&&!p[k])p[k]=k==='edad'||k==='sexo'?I.fil[k]:up(I.fil[k])});if(I.basal)g.basal=up(I.basal);if(I.servicio)g.servicio=up(I.servicio);if(I.disp)g.disp=up(I.disp);
    if(Object.values(I.ant).some(Boolean))g.ant=I.ant;g.exT=I.exT||'';g.hea=I.hea;Object.assign(g.ex,I.ex);Object.assign(g.fv,I.fv);g.otros=I.otros;g.ic=I.ic;g.prob=I.prob;g.plan=I.plan;g.ind=I.ind;g.texto=S.ing.trim();
    I.labs.forEach(r=>addRowLab(h,r,false));I.txt.forEach(t=>addTxtLab(h,t))}
  const E=S.essi;if(E){E.rows.forEach(r=>{if(r.fecha)addRowLab(h,r,true)});E.texts.forEach(t=>{const T=t.concl||t.texto;resolvePendImg(h,t);addTxtLab(h,{fecha:t.fecha,titulo:t.titulo,texto:T})});
    E.pend.forEach(q=>{const t=up(q.titulo);if(!h.pend.some(x=>deacc(x.t)===deacc(t)&&x.estado<2))h.pend.push({id:uid(),tipo:'LABORATORIO',t,estado:1,res:'',fres:'',created:Date.now()})})}
  S.pLab.forEach(r=>addRowLab(h,r,false));
  let last=null;const V=S.pEv;
  if(V){last=importEvolInto(h,V,S.evFecha||addDays(R.fecha,-1),S.ev)}
  let e=null;if(!last||last.fecha<R.fecha){e=newEvol(h,R.fecha);DB.evols[e.id]=e}
  save();REC=null;toast('Paciente recibido'+(e?': evolución de hoy armada':''));
  if(e)go('evol',{eid:e.id,hid:h.id,tab:'cambio'});else go('hosp',{hid:h.id})}

/* ---- Ingreso ---- */
const ING_TABS=[['fil','Filiación'],['ant','Antecedentes'],['hea','Enfermedad'],['ex','Examen'],['res','Resultados'],['prob','Problemas y plan'],['ind','Indicaciones'],['chk','Checklist'],['nota','Nota']];
function ingMissing(h){const g=h.ing,M=[];if(!g.ant.alerg.trim())M.push('ALERGIAS');if(!g.ant.med.trim())M.push('MEDICACIÓN HABITUAL');if(!g.hea.trim())M.push('HISTORIA DE LA ENFERMEDAD');
  if(!fvText(g.fv))M.push('FUNCIONES VITALES');if(!g.prob.trim())M.push('PROBLEMAS');if(!g.plan.trim())M.push('PLAN');if(!g.ind.length)M.push('INDICACIONES');if(!h.labs.length)M.push('LABORATORIO (NINGUNO REGISTRADO)');return M}
function vIngreso(){
  const h=DB.hosps[R.hid];if(!h){R.v='censo';return vCenso()}const p=P(h.dni),g=h.ing;const previo=g.estado==='previo',TABS=previo?ING_TABS.filter(([k])=>['fil','ant','res','prob','ind'].includes(k)):ING_TABS;const tab=R.tab||(previo?'prob':'fil');
  CUR={root:g,hid:h.id,dni:h.dni,fecha:h.ingreso,preview(){const el=$('#prev');if(el)el.textContent=ingText(h)},
    click(a){if(a==='detect'){const n=detectPend(h,g.plan);save();toast(n?n+' pendiente(s) agregado(s)':'No encontré IC, imágenes, procedimientos ni labs nuevos en el plan');rerender()}
      else if(a==='done'){g.estado='completa';g.completedAt=Date.now();h.chkIng['NOTA DE INGRESO']=true;save();toast('Nota de ingreso marcada como completa');rerender()}
      else if(a==='copy'){copyText(ingText(h)).then(ok=>toast(ok?'Nota copiada':'No se pudo copiar'))}
      else if(a==='mayus'){g.hea=up(g.hea);save();rerender()}},
    mount(){if(R.tab){const el=document.getElementById('s-'+R.tab);if(el)setTimeout(()=>el.scrollIntoView(),30)}bar(`<button class="btn" onclick="go('hosp',{hid:'${h.id}'})">← Paciente</button>`+(g.estado==='previo'?`<button class="btn pri" onclick="go('hosp',{hid:'${h.id}'})">Listo</button>`:`<button class="btn pri" data-act2="done" onclick="CUR.click('done')">${g.estado==='completa'?'✓ Nota completa':'Marcar nota completa'}</button>`))}};
  const head=`<div class="card"><div class="pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">${esc(p.nombre)}</div>
   <div class="muted">${dniTag(p.dni)} · Ingreso ${fmtD(h.ingreso)} · ${previo?'<b>Datos de recepción</b> (ya hospitalizado: sin nota de ingreso)':'Nota de ingreso '+(g.estado==='completa'?'completa':'en borrador')}</div></div></div></div></div>
   <div class="tabs" style="position:sticky;top:calc(env(safe-area-inset-top) + 58px);z-index:5;background:var(--bg);padding:6px 0">${TABS.filter(([k])=>k!=='chk').map(([k,l],i)=>`<button onclick="document.getElementById('s-${k}').scrollIntoView({behavior:'smooth'})">${i+1}. ${l}</button>`).join('')}</div>`;
  let body='';const S=k=>TABS.some(([t])=>t===k);const anc=k=>`<div id="s-${k}" style="scroll-margin-top:70px"></div>`;
  if(S('fil'))body+=anc('fil')+`<div class="card"><h3>Filiación</h3><div class="grid w2"><div><label>DNI / CE ${isTmp(h.dni)?'<span style="color:var(--bad)">(pendiente; o súbelo con un PDF del ESSI en Labs)</span>':''}</label><input value="${isTmp(h.dni)?'':esc(h.dni)}" inputmode="numeric" autocomplete="off" onchange="setDniUI('${h.id}',this.value)"></div>${F('pat.nombre','Apellidos y nombres','data-up')}${F('h.cama','Cama','data-up')}<div><label>Fecha de ingreso</label><input type="date" data-p="h.ingreso" value="${esc(h.ingreso)}"></div></div>
   <div class="grid" style="margin-top:10px">${F('pat.edad','Edad',NUM)}<div><label>Sexo</label><select data-p="pat.sexo"><option value="">—</option><option value="M" ${p.sexo==='M'?'selected':''}>Varón</option><option value="F" ${p.sexo==='F'?'selected':''}>Mujer</option></select></div>
   ${F('pat.natural','Natural de','data-up')}${F('pat.procedencia','Procedente de','data-up')}${F('pat.instruccion','Grado de instrucción','data-up placeholder="SUPERIOR COMPLETO"')}${F('pat.ocupacion','Ocupación','data-up')}
   ${F('pat.civil','Estado civil','data-up')}${F('pat.religion','Religión','data-up')}</div>
   <div class="grid w2" style="margin-top:10px">${F('basal','Estado basal','data-up')}${F('servicio','Ingresa procedente de','data-up placeholder="SERVICIO DE MEDICINA INTERNA / EMERGENCIA"')}</div>
   <div style="margin-top:10px">${F('disp','Dispositivos / O2','data-up placeholder="CON VÍA VENOSA PERIFÉRICA Y SIN OXÍGENO SUPLEMENTARIO"')}</div><div class="muted" style="margin-top:10px">Vista: <span id="filprev"></span></div></div>`;
  if(S('ant'))body+=anc('ant')+`<div class="card"><h3>Antecedentes</h3>${TA('ant.patol','Patológicos (separados por ;)',4)}<div style="height:8px"></div>${TA('ant.quir','Quirúrgicos',2)}<div style="height:8px"></div>${TA('ant.hosp','Hospitalizaciones',3)}
   <div class="grid w2" style="margin-top:8px">${F('ant.alerg','Alergias','data-up placeholder="NIEGA"')}</div><div style="height:8px"></div>${TA('ant.med','Medicación habitual',3)}</div>`;
  if(S('hea'))body+=anc('hea')+`<div class="card"><h3>Historia de la enfermedad</h3><p class="muted" style="margin-top:0">Puedes dictar con el micrófono del teclado. Luego “MAYÚSCULAS” lo convierte al formato del servicio.</p>
   <textarea data-p="hea" rows="16">${esc(g.hea)}</textarea><div class="row" style="margin-top:8px"><button class="btn sm" data-act="mayus">MAYÚSCULAS</button><span class="sp"></span>
   <button class="btn sm" onclick="copyText('Redacta en prosa clínica, cronológica y en MAYÚSCULAS esta historia de la enfermedad (no inventes datos):\\n\\n'+DB.hosps['${h.id}'].ing.hea).then(o=>toast(o?'Copiado. Pégalo en Claude':'No se pudo copiar'))">Copiar para ordenar con Claude</button></div></div>`;
  if(S('ex'))body+=anc('ex')+`<div class="card"><h3>Funciones vitales</h3>${fvFields('fv')}</div><div class="card"><h3>Examen físico</h3>${Object.keys(EXLBL).map(k=>`<div style="margin-bottom:8px">${TA('ex.'+k,EXLBL[k],2)}</div>`).join('')}</div>`;
  if(S('res')){const lb=fmtLabsText(labsUpTo(h,h.ingreso));
    body+=anc('res')+`<div class="card"><h3>Laboratorio</h3><p class="muted" style="margin-top:0">${previo?'Resultados previos (marca en la evolución los que quieras reportar).':'Entran en la nota los resultados con fecha hasta el día del ingreso ('+fmtD(h.ingreso)+').'}</p>${lb?`<pre class="note">${esc(lb)}</pre>`:'<div class="muted">Sin resultados.</div>'}
    <button class="btn pri" style="margin-top:10px" onclick="go('labs',{hid:'${h.id}',back:'ingreso'})">Importar / editar análisis</button></div>
    <div class="card">${TA('otros','Otros resultados (perfil mineral, hepático, biopsias, TFG…) — texto libre',4)}<div style="height:8px"></div>${TA('img','Imágenes',3)}<div style="height:8px"></div>${TA('ic','Interconsultas previas',4)}</div>`}
  if(S('prob'))body+=anc('prob')+`<div class="card"><h3>${previo?'Problemas activos':'Problemas'}</h3><p class="muted" style="margin-top:0">Uno por línea. Empieza con “•” o “-” para subproblemas. Pasan a las evoluciones como problemas.</p>${TA('prob','',6)}</div>
   <div class="card"><h3>Plan</h3>${TA('plan','',5,'PULSOTERAPIA CON METILPREDNISOLONA\nIC OFTALMOLOGÍA\nSS ANCA, C3, C4')}
   <div class="row" style="margin-top:8px"><button class="btn sm" data-act="detect">Detectar pendientes en el plan</button></div></div>
   <div class="card"><h3>Pendientes</h3>${pendEditor(h)}</div>`;
  if(S('ind'))body+=anc('ind')+`<div class="card"><h3>${previo?'Indicaciones actuales':'Indicaciones de ingreso'}</h3>${previo?'<p class="muted" style="margin-top:0">Pon como fecha de inicio la real (si la sabes) para que el día de tratamiento salga bien.</p>':''}${indEditor('ind')}</div>`;
  if(S('nota'))body+=anc('nota')+`<div class="card"><h3>Nota de ingreso</h3><pre class="note" id="prev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" data-act="copy">Copiar</button></div></div>`;
  const oldPrev=CUR.preview;CUR.preview=()=>{oldPrev();const fp=$('#filprev');if(fp)fp.textContent=filiacion(p,g)};
  return head+body;
}

/* ---- Evolución ---- */
/* ---- Evolución: una sola hoja, como en el ESSI. Viene armada de la anterior; solo cambias lo nuevo ---- */
const rowsFor=(t,min)=>Math.max(min||2,String(t||'').split('\n').reduce((n,l)=>n+Math.max(1,Math.ceil(l.length/75)),0)+1);
function vEvol(){
  const e=DB.evols[R.eid];if(!e){R.v='censo';return vCenso()}evNorm(e);if(e.estado==='visita')e.estado='borrador';
  const h=DB.hosps[e.hid],p=P(h.dni),prev=e.prevId&&DB.evols[e.prevId],fin=e.estado==='final';
  CUR={root:e,hid:h.id,dni:h.dni,fecha:e.fecha,
    preview(){e.texto=evolText(e);const el=$('#prev');if(el)el.textContent=e.texto;const lb=$('#labprev');if(lb)lb.textContent=labBlock(e).filter(Boolean).join('\n')||'(sin resultados marcados)';
      const hd=$('#evhd');if(hd)hd.textContent=evHeader(e).join('\n')+'\n\nPaciente'+(p.edad?' de '+p.edad+' años':'')+' con los siguientes problemas:'},
    async click(a,d){
      if(a==='copy'){copyText(evolText(e)).then(ok=>toast(ok?'Evolución copiada':'No se pudo copiar'))}
      else if(a==='normO'){if(!await ask('¿Reemplazar el O) por el examen normal?'))return;e.O=defO(h);save();rerender()}
      else if(a==='addPend'){e.P=addPendToPlan(h,e.P);save();rerender()}
      else if(a==='close'){const n=syncPendFromPlan(h,e.P);e.estado='final';e.closedAt=Date.now();e.texto=evolText(e);save();toast('Evolución cerrada'+(n?' · '+n+' pendiente(s) nuevo(s)':'')+'. Entra en el TXT del día');rerender()}
      else if(a==='reopen'){e.estado='borrador';save();rerender()}},
    mount(){bar(`<button class="btn" onclick="go('hosp',{hid:'${h.id}'})">← Paciente</button><button class="btn" onclick="CUR.click('copy')">Copiar</button>`+(fin?`<button class="btn" onclick="CUR.click('reopen')">✓ Cerrada · reabrir</button>`:`<button class="btn pri" onclick="CUR.click('close')">Cerrar evolución</button>`));CUR.preview()}};
  const labs=h.labs.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).filter(l=>l.fecha<=e.fecha);
  const faltan=pendActive(h).filter(x=>!deacc(String(e.P||'')).includes(deacc(pendLabel(x))));
  return `<div class="card"><div class="pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">${esc(p.nombre)}</div>
   <div class="muted">${dniTag(p.dni)} · <b>DH ${dh(h,e.fecha)}</b> · ${fmtD(e.fecha)} · ${fin?'Cerrada':'Borrador'}</div></div></div>
   <div style="width:120px"><label>Hora</label><input type="time" data-p="hora" value="${esc(e.hora)}"></div></div>
   ${prev&&prev.texto?`<details style="margin-top:10px"><summary>Evolución anterior (${fmtD(prev.fecha)})</summary><pre class="note">${esc(prev.texto)}</pre></details>`:''}</div>
  <div class="card ev"><p class="muted" style="margin-top:0">Viene armada de la evolución anterior. Cambia solo lo nuevo; abajo ves la nota completa.</p>
   <pre class="note" id="evhd" style="margin:0 0 6px"></pre>
   <textarea data-p="probT" rows="${rowsFor(e.probT,3)}" placeholder="Un problema por línea (empieza con -- para subproblema)">${esc(e.probT)}</textarea>
   <label style="margin-top:12px">S)</label><textarea data-p="S" rows="2" placeholder="Paciente sin molestias nuevas.">${esc(e.S)}</textarea>
   <div class="pt" style="margin-top:12px"><label style="margin:0">O)</label><button class="link" data-act="normO">↺ Examen normal</button></div><textarea data-p="O" rows="${rowsFor(e.O,6)}">${esc(e.O)}</textarea>
   <div class="pt" style="margin-top:12px"><label style="margin:0">LAB · Imágenes · Procedimientos <span class="muted">(automático, de los PDF/labs)</span></label><button class="btn sm" onclick="go('labs',{hid:'${h.id}',back:'evol'})">+ Análisis</button></div>
   <pre class="note" id="labprev" style="margin:6px 0 0"></pre>
   ${labs.length?`<details style="margin-top:6px"><summary>Elegir qué resultados van (${labs.length})</summary>${labs.map(l=>`<label class="chkl"><input type="checkbox" data-labsel="${l.id}" ${labSelected(e,l)?'checked':''}><span><b>${fmtD(l.fecha)} · ${AREAS[l.area]}</b><br><span class="muted">${esc(sortItems(l.items).map(it=>/^TXT_/.test(it.k)?it.n:itemTxt(it)).join(', ').slice(0,180))}</span></span></label>`).join('')}</details>`:''}
   <label style="margin-top:12px">A)</label><textarea data-p="A" rows="${rowsFor(e.A,3)}">${esc(e.A)}</textarea>
   <label style="margin-top:12px">P) <span class="muted">— una línea por ítem; “Pendiente …”, “SS …” e “IC …” pasan a Pendientes al cerrar</span></label><textarea data-p="P" rows="${rowsFor(e.P,4)}">${esc(e.P)}</textarea>
   ${faltan.length?`<div class="row" style="margin-top:6px"><span class="muted">${faltan.length} pendiente(s) activos no están en el P): ${esc(faltan.map(pendLabel).join('; '))}</span><button class="btn sm" data-act="addPend">Agregar al P)</button></div>`:''}</div>
  <div class="card"><h3>Nota completa</h3><pre class="note" id="prev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" data-act="copy">Copiar</button><span class="sp"></span><button class="btn bad sm" onclick="delEvol('${e.id}')">Eliminar evolución</button></div></div>
  <div class="card"><details><summary><b>Pendientes del paciente</b> (${pendActive(h).length} activos)</summary><div style="margin-top:10px">${pendEditor(h)}</div></details></div>
  <div class="card"><details><summary><b>Indicaciones</b> (opcional: sirven para el alta)</summary><div style="margin-top:10px">${indEditor('ind')}</div></details></div>`;
}
async function delEvol(id){const e=DB.evols[id];if(!await ask('¿Eliminar la evolución del '+fmtD(e.fecha)+'?'))return;Object.values(DB.evols).forEach(x=>{if(x.prevId===id)x.prevId=e.prevId});delete DB.evols[id];save();go('hosp',{hid:e.hid});toast('Evolución eliminada')}

/* ---- Labs (importar) ---- */
let LABSTATE={text:'',rows:null,unk:[],fecha:null,busy:''};
function vLabs(){
  const h=DB.hosps[R.hid];if(!h){R.v='censo';return vCenso()}const p=P(h.dni);const S=LABSTATE;if(!S.fecha)S.fecha=R.fecha;
  CUR={hid:h.id,dni:h.dni,root:h,async click(a,d){
    if(a==='parse'){S.text=$('#ltext').value;const r=parseLabs(S.text,S.fecha);S.rows=r.rows.map(x=>({...x,on:true}));S.unk=r.unk;rerender();if(!S.rows.length)toast('No reconocí resultados. Revisa el texto o usa “Copiar para Claude”.')}
    else if(a==='clear'){LABSTATE={text:'',rows:null,unk:[],fecha:R.fecha,busy:''};rerender()}
    else if(a==='claude'){const t=CLAUDE_PROMPT+anonLabText($('#ltext').value);copyText(t).then(ok=>toast(ok?'Copiado sin nombre/DNI. Pégalo en Claude y pega aquí su respuesta':'No se pudo copiar'))}
    else if(a==='saveLabs'){const rows=(S.rows||[]).filter(r=>r.on&&r.v.trim()&&r.fecha),tx=(S.texts||[]).filter(t=>t.on),pd=(S.pend||[]).filter(p=>p.on);if(!rows.length&&!tx.length&&!pd.length)return toast('Nada que guardar');
      tx.forEach(t=>{const T=t.onlyC&&t.concl?t.concl:t.texto;resolvePendImg(h,t);let L=h.labs.find(l=>l.fecha===t.fecha&&l.area==='OTROS');if(!L){L={id:uid(),fecha:t.fecha,area:'OTROS',items:[],created:Date.now()};h.labs.push(L)}const ex=L.items.find(i=>i.n===t.titulo);if(ex)ex.v=T;else L.items.push({k:'TXT_'+uid(),n:t.titulo,v:T})});
      pd.forEach(q=>{const t=up(q.titulo);if(!h.pend.some(x=>deacc(x.t)===deacc(t)&&x.estado<2))h.pend.push({id:uid(),tipo:'LABORATORIO',t,estado:1,res:'',fres:'',created:Date.now()})});
      rows.forEach(r=>{const area=LABMAP[r.k]?LABMAP[r.k].a:'OTROS';let L=h.labs.find(l=>l.fecha===r.fecha&&l.area===area);if(!L){L={id:uid(),fecha:r.fecha,area,items:[],created:Date.now()};h.labs.push(L)}
        const it=L.items.find(i=>i.k===r.k);if(it)it.v=up(r.v);else L.items.push({k:r.k,v:up(r.v)})});
      h.updated=Date.now();save();toast(rows.length+' valores'+(tx.length?', '+tx.length+' informe(s)':'')+(pd.length?', '+pd.length+' pendiente(s)':'')+' guardados');LABSTATE={text:'',rows:null,unk:[],fecha:S.fecha,busy:''};
      if(R.back==='evol'){const e=evolOn(h.id,R.fecha);if(e)return go('evol',{eid:e.id,hid:h.id,tab:'cambio'})}if(R.back==='ingreso')return go('ingreso',{hid:h.id,tab:'res'});go('hosp',{hid:h.id})}
    else if(a==='delLab'){if(!await ask('¿Eliminar estos resultados?'))return;h.labs=h.labs.filter(l=>l.id!==d.id);save();rerender()}
    else if(a==='back'){if(R.back==='evol'){const e=evolOn(h.id,R.fecha);if(e)return go('evol',{eid:e.id,hid:h.id,tab:'cambio'})}if(R.back==='ingreso')return go('ingreso',{hid:h.id,tab:'res'});go('hosp',{hid:h.id})}},
    mount(){$('#lfotos').onchange=ev=>ocrFiles([...ev.target.files]);$('#lpdf').onchange=ev=>pdfFiles([...ev.target.files]);
      const t=$('#ltext');t.oninput=()=>{S.text=t.value};const f=$('#lfecha');f.onchange=()=>{S.fecha=f.value}}};
  const opts=LABDEF.map(d=>`<option value="${d[0]}">${d[1]} · ${AREAS[d[2]]}</option>`).join('');
  const existing=h.labs.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return `<div class="card"><div class="pt"><div><div class="nm">Análisis · ${esc(p.nombre)}</div><div class="muted">Cama ${esc(h.cama||'—')} · ${dniTag(p.dni)}</div></div><button class="btn" data-act="back">← Volver</button></div></div>
  <div class="card"><h3>1 · Traer el texto</h3>
   <div class="row"><label class="btn" style="margin:0;color:var(--ink);font-size:16px">📷 Leer fotos<input id="lfotos" type="file" accept="image/*" multiple style="display:none"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px">📄 Subir PDF<input id="lpdf" type="file" accept="application/pdf" multiple style="display:none"></label>
   <span class="muted">o pega el texto abajo</span></div>
   <div id="lbusy" class="muted" style="margin-top:8px">${esc(S.busy)}</div><div class="prog" ${S.busy?'':'hidden'}><i id="lprog"></i></div>
   <div class="grid" style="margin-top:10px"><div><label>Fecha si el texto no trae fecha</label><input id="lfecha" type="date" value="${S.fecha}"></div></div>
   <textarea id="ltext" rows="8" style="margin-top:10px" placeholder="Pega aquí los resultados (de Texto en vivo, PDF o la respuesta de Claude)…">${esc(S.text)}</textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-act="parse">Procesar</button><button class="btn" data-act="clear">Limpiar</button><span class="sp"></span><button class="btn sm" data-act="claude">Copiar para Claude (sin nombre/DNI)</button></div></div>
  ${S.rows||S.texts?`<div class="card"><h3>2 · Revisar (${(S.rows||[]).length} valores)</h3>${(S.rows||[]).length?`<table class="rev"><tr><th></th><th>Fecha</th><th>Examen</th><th>Valor</th></tr>
   ${S.rows.map((r,i)=>`<tr><td><input type="checkbox" ${r.on?'checked':''} onchange="LABSTATE.rows[${i}].on=this.checked"></td><td><input type="date" value="${r.fecha}" onchange="LABSTATE.rows[${i}].fecha=this.value"></td>
    <td><select onchange="LABSTATE.rows[${i}].k=this.value">${opts.replace(`value="${r.k}"`,`value="${r.k}" selected`)}</select></td><td><input value="${esc(r.v)}" oninput="LABSTATE.rows[${i}].v=this.value"></td></tr>`).join('')}</table>
`:(S.texts||[]).length?'':'<div class="muted">Nada reconocido.</div>'}${revExtraHTML(S,'LABSTATE','Marcados = se agregan a Pendientes como “solicitado”.')}
   ${(S.rows||[]).length||(S.texts||[]).length||(S.pend||[]).length?'<div class="row" style="margin-top:10px"><button class="btn pri" data-act="saveLabs">Guardar resultados</button></div>':''}
   ${(S.unk||[]).length?`<details style="margin-top:10px"><summary>Líneas no reconocidas (${S.unk.length})</summary><pre class="note">${esc(S.unk.join('\n'))}</pre><p class="muted">Si ahí hay resultados, usa “Copiar para Claude” y pega su respuesta en el cuadro; luego Procesar.</p></details>`:''}</div>`:''}
  <div class="card"><h3>Resultados guardados</h3>${existing.map(l=>`<div class="pt" style="border-bottom:1px solid var(--line);padding:8px 0"><div><b>${fmtD(l.fecha)} · ${AREAS[l.area]}</b><div class="muted">${esc(sortItems(l.items).map(itemTxt).join(', '))}</div></div><button class="btn sm bad" data-act="delLab" data-id="${l.id}">✕</button></div>`).join('')||'<div class="muted">Ninguno.</div>'}</div>`;
}
/* un informe de imagen que llega resuelve el pendiente de imagen equivalente (TEM de tórax ↔ TEM DE TORAX CON CONTRASTE) */
function resolvePendImg(h,t){if(!t.img)return;const mod=s=>/\b(TEM|TAC|TOMOGRAF)/.test(s)?'TEM':/\b(RMN|RESONANCIA)/.test(s)?'RMN':/\bECO(GRAF|CARDIO)?/.test(s)?'ECO':/\bRX|RADIOGRAF/.test(s)?'RX':/MAMOGRAF/.test(s)?'MAMO':'';
  const T=deacc(t.titulo),m=mod(T),words=T.split(/\s+/).filter(w=>w.length>3&&!/^(CON|SIN|CONTRASTE|TOMOGRAFIA|ECOGRAFIA)$/.test(w));
  const pd=h.pend.find(x=>x.estado<2&&(x.tipo==='IMAGEN'||mod(deacc(x.t)))&&mod(deacc(x.t))===m&&words.some(w=>deacc(x.t).includes(w.slice(0,5))));
  if(pd){pd.estado=2;pd.res=up((t.concl||t.texto).slice(0,400));pd.fres=t.fecha;pd.updated=Date.now()}}
function curDni(){if(R.v==='recibir'&&REC)return /^\d{8}$/.test(REC.dni||'')?REC.dni:'';const h=R.hid&&DB.hosps[R.hid];return h&&/^\d{8}$/.test(h.dni)?h.dni:''}
function onEssi(r,ne){if(R.v==='recibir'&&REC){const q=REC.essi;REC.essi=q?{rows:q.rows.concat(r.rows),texts:q.texts.concat(r.texts),pend:q.pend.concat(r.pend),unk:q.unk.concat(r.unk),dnis:[...new Set((q.dnis||[]).concat(r.dnis||[]))],nombre:q.nombre||r.nombre,sexo:q.sexo||r.sexo,edad:q.edad||r.edad,fing:[q.fing,r.fing].filter(Boolean).sort()[0]||''}:r;recParse();rerender();toast(essiMsg(r,ne).replace(' Revisa y guarda.',''));return}
  {const h=R.hid&&DB.hosps[R.hid];if(h&&isTmp(h.dni)&&r.dnis&&r.dnis.length===1&&assignDni(h.id,r.dnis[0],{nombre:r.nombre,sexo:r.sexo,edad:r.edad}))setTimeout(()=>toast('DNI y nombre tomados del ESSI'),2600)}
  if(R.v==='importEv'){IMP.essi=r;return}const S=LABSTATE;
  S.rows=sortRev((S.rows||[]).concat(r.rows.map(x=>({...x,on:true}))));S.texts=(S.texts||[]).concat(r.texts.map(t=>({...t,on:true})));S.pend=(S.pend||[]).concat(r.pend.map(p=>({...p,on:true})));S.unk=(S.unk||[]).concat(r.unk);
  rerender();toast(essiMsg(r,ne))}
function setBusy(msg,frac){LABSTATE.busy=msg;const b=$('#lbusy');if(b)b.textContent=msg;const pr=$('#lprog');if(pr){pr.parentNode.hidden=!msg;pr.style.width=Math.round((frac||0)*100)+'%'}}
let TXT_TARGET=null;
/* PDF "Visualiza Atenciones del Acto médico" del ESSI → solo el texto del médico (Anamnesis, Examen clínico, Plan de trabajo) + Indicaciones.
   Quita encabezados de página, rótulos del ESSI y todo lo de enfermería; une las líneas cortadas por el ancho de la página. */
function essiClinical(text){const L=String(text||'').split('\n');
  if(!L.some(l=>/^Anamnesis\b/.test(l.trim()))||!L.some(l=>/^(Examen Cl[ií]nico|Plan de Trabajo|Diagnostico)\b/.test(l.trim())))return null;
  const LBL=/^(Anamnesis|Examen Cl[ií]nico|Signos Vitales|Informe UCI|Diagnostico|Plan de Trabajo|Indicaciones|Resultado de la Atenci[oó]n|Notas de Enfermeria|Solicitudes Interconsulta|Examenes Auxiliares|Medicamentos Recetados|Procedimientos de la Secuencia|N[uú]mero de Atencion)\b/;
  let mode=null,started=false;const body=[],ind=[];
  for(const raw of L){const l=raw.trim();
    if(/Visualiza Atenciones del Acto/i.test(l)||/^sgss\.essalud/i.test(l)||/^No existen atenciones/i.test(l))continue;
    const m=l.match(LBL);
    if(m&&(/\(\s*[\d#]/.test(l)||l===m[1]||!/^(Anamnesis|Examen Cl|Diagnostico|Plan de Trabajo|Indicaciones)/.test(m[1]))){const k=deacc(m[1]);
      if(/^(ANAMNESIS|EXAMEN CL|PLAN DE TRABAJO)/.test(k)){if(mode==='done')break;mode='body';started=true;continue}
      if(/^(SIGNOS VITALES|INFORME UCI)/.test(k))continue;
      if(/^NUMERO DE ATENCION/.test(k)){if(started)break;continue}
      if(/^DIAGNOSTICO/.test(k)){mode='dx';continue}
      if(/^INDICACIONES/.test(k)){if(mode!=='done')mode='ind';continue}
      if(started){mode='done';if(/^(NOTAS DE ENFERMERIA)/.test(k))break}continue}
    if(mode==='body')body.push(raw.replace(/\s+$/,''));else if(mode==='ind'&&l)ind.push(l)}
  if(!body.length&&!ind.length)return null;
  const B=body.map(x=>x.trim()),max=Math.max(...B.map(x=>x.length),1),out=[];
  B.forEach(l=>{const prev=out.length?out[out.length-1]:'';
    const isNew=!l||/^([-•·*]|\d{1,2}\/\d{1,2}|[SOAP]\)|[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ \-]{2,40}:|[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+:)/.test(l);
    if(prev&&!isNew&&!/[.:]$/.test(prev)&&(/^[a-záéíóúñ(0-9]/.test(l)||prev.length>=0.8*max))out[out.length-1]=prev+' '+l;else out.push(l)});
  let t=out.join('\n').replace(/\n{3,}/g,'\n\n').trim();if(ind.length)t+='\n\nIndicaciones\n'+ind.join('\n');return t}
function appendText(t){if(TXT_TARGET&&REC&&R.v==='recibir'){const k=TXT_TARGET;REC[k]=(REC[k]?REC[k]+'\n':'')+t;const ta=document.getElementById('rec_'+k);if(ta)ta.value=REC[k];return}
  const ta=$('#ltext');LABSTATE.text=(LABSTATE.text?LABSTATE.text+'\n':'')+t;if(ta)ta.value=LABSTATE.text}
let OCRW=null;
async function ocrWorker(){if(OCRW)return OCRW;await loadScript('lib/tesseract.min.js');
  OCRW=await Tesseract.createWorker('spa',1,{workerPath:absURL('lib/worker.min.js'),corePath:absURL('lib/core'),langPath:absURL('lib/lang'),gzip:true,
    logger:m=>{if(m.status==='recognizing text')setBusy('Leyendo… '+Math.round(m.progress*100)+'%',m.progress)}});
  await OCRW.setParameters({preserve_interword_spaces:'1'});return OCRW}
async function ocrFiles(files){if(!files.length)return;try{setBusy('Preparando lector de fotos (la primera vez tarda un poco)…',0.02);const w=await ocrWorker();
  for(let i=0;i<files.length;i++){setBusy('Leyendo foto '+(i+1)+' de '+files.length+'…',i/files.length);const r=await w.recognize(files[i]);appendText(r.data.text)}
  setBusy('',0);toast('Texto leído. Revisa y toca Procesar');$('#ltext')?.focus()}catch(e){setBusy('',0);toast('No se pudo leer la foto: '+e.message)}}
async function pdfFiles(files){if(!files.length)return;try{setBusy('Abriendo PDF…',0.05);await loadScript('lib/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc=absURL('lib/pdf.worker.min.js');
  const ess=[];let n=0;
  for(const f of files){n++;setBusy('Leyendo '+f.name+' ('+n+'/'+files.length+')…',n/files.length);const {rows}=await pdfRows(f);
    const wantText=R.v==='importEv'||(R.v==='recibir'&&['ing','ev'].includes(TXT_TARGET));
    const raw=rows.map(r=>r.map(i=>i.s).join(' ')).join('\n'),cl=wantText?essiClinical(raw):null;
    if(essiDetect(rows)){const r=essiParse(rows);if(r.rows.length||r.texts.length||r.pend.length)ess.push(r);if(!wantText)continue}
    if(cl){appendText(cl);continue}
    if(rows.length>=5){appendText(raw.split('\n').filter(t=>!ESSI_NOISE.test(t)).join('\n'));continue}
    await pdfOCR(f)}
  setBusy('',0);if(ess.length){const dni=curDni();const ok=ess.filter(r=>!dni||!r.dni||r.dni===dni),bad=ess.length-ok.length;
    if(bad)setTimeout(()=>toast('⚠️ '+bad+' PDF de OTRO paciente (DNI distinto) no se importaron'),2600);if(ok.length)onEssi(combineEssi(ok),ok.length);else toast('⚠️ Ninguno de esos PDF es de este paciente (DNI distinto)')}else toast('PDF leído. Revisa y toca Procesar')}catch(e){setBusy('',0);toast('No se pudo leer el PDF: '+e.message)}}
async function pdfOCR(f){const doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const vp=pg.getViewport({scale:2});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;const w=await ocrWorker();appendText((await w.recognize(cv)).data.text)}}
function essiMsg(r,ne){return ne+' reporte(s) del ESSI: '+r.rows.length+' valores'+(r.texts.length?', '+r.texts.length+' informe(s)':'')+(r.pend.length?', '+r.pend.length+' sin resultado':'')+'. Revisa y guarda.'}
function sortRev(rows){return rows.sort((a,b)=>b.fecha.localeCompare(a.fecha)||LABORDER.indexOf(a.k)-LABORDER.indexOf(b.k))}
function revExtraHTML(S,stateName,pendLabel){return `${(S.texts||[]).length?`<h4>Informes de texto (${S.texts.length})</h4>${S.texts.map((t,i)=>`<label class="chkl"><input type="checkbox" ${t.on?'checked':''} onchange="${stateName}.texts[${i}].on=this.checked"><span><b>${fmtD(t.fecha)} · ${esc(t.titulo)}</b><br><span class="muted">${esc(t.onlyC&&t.concl?t.concl:t.texto)}</span>${t.concl?`<br><label class="chk" style="margin-top:4px" onclick="event.stopPropagation()"><input type="checkbox" ${t.onlyC?'checked':''} onchange="${stateName}.texts[${i}].onlyC=this.checked;rerender()"> Solo la conclusión</label>`:''}</span></label>`).join('')}`:''}
  ${(S.pend||[]).length?`<h4>Aún sin resultado en el ESSI (${S.pend.length})</h4>${S.pend.map((p,i)=>`<label class="chkl"><input type="checkbox" ${p.on?'checked':''} onchange="${stateName}.pend[${i}].on=this.checked"><span>${esc(p.titulo)} <span class="muted">(solicitado ${fmtD(p.solic)})</span></span></label>`).join('')}<p class="muted">${pendLabel}</p>`:''}`}

/* ---- Pendientes (turno) ---- */
function vPendientes(){
  const hs=R.hid?[DB.hosps[R.hid]].filter(Boolean):activeH();CUR={root:null,click(){}};
  if(R.hid){const h=hs[0];if(!h){R.hid=null;return vPendientes()}const p=P(h.dni);
    return `<div class="card"><div class="pt"><div><div class="nm">Pendientes · ${esc(p.nombre)}</div><div class="muted">Cama ${esc(h.cama||'—')}</div></div><div class="row"><button class="btn" onclick="go('hosp',{hid:'${h.id}'})">← Paciente</button><button class="btn" onclick="go('pendientes',{hid:null})">Ver todos</button></div></div></div><div class="card">${pendEditor(h)}</div>`}
  const all=hs.flatMap(h=>h.pend.filter(x=>x.estado<2||(x.fres===R.fecha)).map(x=>({h,x})));
  return `<div class="card"><div class="pt"><h2 style="margin:0">Pendientes del turno</h2><button class="btn sm" onclick="copyPendList()">Copiar lista</button></div><p class="muted" style="margin:6px 0 0">Toca el estado para avanzar: por solicitar → solicitado → resultado.</p></div>
   ${PTIPOS.map(t=>{const L=all.filter(o=>o.x.tipo===t).sort((a,b)=>String(a.h.cama).localeCompare(String(b.h.cama),'es',{numeric:true}));return L.length?`<div class="card"><h3>${t==='IC'?'Interconsultas':t==='IMAGEN'?'Imágenes':t==='PROCEDIMIENTO'?'Procedimientos':t==='LABORATORIO'?'Laboratorio':'Otros'} (${L.length})</h3>${L.map(o=>pendRow(o.h,o.x,true)).join('')}</div>`:''}).join('')||'<div class="card muted">No hay pendientes activos.</div>'}`;
}
function copyPendList(){const hs=activeH();const L=['PENDIENTES '+fmtD(R.fecha)];PTIPOS.forEach(t=>{const it=hs.flatMap(h=>h.pend.filter(x=>x.tipo===t&&x.estado<2).map(x=>'- '+(h.cama||'—')+': '+x.t+' ['+PEST[x.estado]+']'));if(it.length)L.push('',t+':',...it)});
  copyText(L.join('\n')).then(ok=>toast(ok?'Lista copiada':'No se pudo copiar'))}

/* ---- Alta ---- */
function vAlta(){
  const h=DB.hosps[R.hid];if(!h||!h.alta){R.v='censo';return vCenso()}const p=P(h.dni),a=h.alta;
  CUR={root:a,hid:h.id,dni:h.dni,fecha:a.fecha,preview(){const o=$('#oprev');if(o)o.textContent=ordenText(h);altaBlocks(h).forEach(b=>{const t=document.querySelector(`[data-blk="${b[0]}"]`);if(t&&a.ov[b[0]]==null&&document.activeElement!==t)t.value=b[3]})},
    onField(path){if(path==='dm'||path==='h.citt')rerender()},
    async click(act,d){
      if(act==='confirm'){const fl=a.ind.filter(x=>x.flag).length;if(fl&&!await ask(fl+' indicación(es) en amarillo sin revisar. ¿Confirmar el alta igual?'))return;a.confirmed=true;save();toast('Alta confirmada. El paciente sale del censo');go('censo')}
      else if(act==='cancel'){if(!await ask('¿Anular el alta? Se borran los datos de alta de este paciente.'))return;h.alta=null;save();go('hosp',{hid:h.id})}
      else if(act==='reopen'){a.confirmed=false;save();rerender();toast('De vuelta en el censo')}
      else if(act==='word'){a.chk['ORDEN DE ALTA']=true;save();exportOrdenes(null,[h]);rerender()}
      else if(act==='copyO'){copyText(ordenText(h)).then(o=>toast(o?'Orden copiada':'No se pudo copiar'))}
      else if(act==='blkCopy'){const b=altaBlocks(h).find(x=>x[0]===d.k);copyText(altaVal(h,b)).then(o=>toast(o?'Copiado: '+b[2].split(' (')[0]:'No se pudo copiar'))}
      else if(act==='blkReset'){delete a.ov[d.k];save();rerender()}
      else if(act==='copyE'){copyText(epicrisisData(h)).then(o=>toast(o?'Datos copiados':'No se pudo copiar'))}
      else if(act==='claudeE'){copyText('Con estos datos redacta en MAYÚSCULAS, en un solo párrafo y en tercera persona, la EVOLUCIÓN durante la hospitalización para una epicrisis de Reumatología (estilo: "PACIENTE DE 65 AÑOS. ES HOSPITALIZADO POR REUMATOLOGÍA DESDE EL 16/09, ESE MISMO DÍA SE INICIA PULSOTERAPIA CON METILPREDNISOLONA (500 MG) POR 03 DÍAS… PRESENTA UNA EVOLUCIÓN FAVORABLE… PACIENTE EN CONDICIONES DE ALTA."). No inventes datos:\n\n'+epicrisisData(h)).then(o=>toast(o?'Copiado sin nombre/DNI. Pégalo en Claude':'No se pudo copiar'))}
      else if(act==='reimport'){if(!await ask('¿Reemplazar las indicaciones para casa por las de la última evolución?'))return;const f=a.fecha;const keep={control:a.control,dm:a.dm,citt:a.citt,chk:a.chk};startAlta(h,f);Object.assign(h.alta,keep);save();rerender()}},
    mount(){bar(`<button class="btn" onclick="go('hosp',{hid:'${h.id}'})">← Paciente</button>`+(a.confirmed?`<button class="btn" onclick="CUR.click('reopen')">Volver al censo</button>`:`<button class="btn pri" onclick="CUR.click('confirm')">Confirmar alta</button>`))}};
  const chk=altaChecklist(h);
  return `<div class="card"><div class="pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">Alta · ${esc(p.nombre)}</div>
   <div class="muted">${dniTag(p.dni)} · Ingreso ${fmtD(h.ingreso)} · ${a.confirmed?'<b>Alta confirmada</b>':'Alta en proceso'}</div></div></div><button class="btn bad sm" data-act="cancel">Anular alta</button></div>
   <div class="grid" style="margin-top:10px"><div><label>Fecha de egreso</label><input type="date" data-p="fecha" value="${a.fecha}"></div></div></div>
  <div class="card"><h3>Checklist de alta</h3>${chk.map(c=>`<label class="chkl ${a.chk[c]?'done':''}"><input type="checkbox" data-chk="${esc(c)}" data-scope="alta" data-hid="${h.id}" ${a.chk[c]?'checked':''}><span>${esc(c)}</span></label>`).join('')}
   <div class="grid w2" style="margin-top:10px"><div><label>Descanso médico hasta</label><input type="date" data-p="dm" value="${esc(a.dm)}"></div><div style="align-self:end"><label class="chk"><input type="checkbox" data-p="h.citt" ${h.citt?'checked':''}> Requiere CITT</label></div></div></div>
  <div class="card"><h3>Diagnósticos de egreso</h3>${TA('dx','Uno por línea (se numeran solos)',5)}</div>
  <div class="card"><h3>Indicaciones para casa</h3>${indEditor('h.alta.ind',{fi:false,alta:true})}
   <div class="row" style="margin-top:8px"><button class="btn sm" data-act="reimport">Volver a traer de la última evolución</button></div>
   <div style="margin-top:12px">${F('control','Control')}</div></div>
  <div class="card"><h3>Orden de alta</h3><pre class="note" id="oprev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" data-act="word">Word (formato del servicio)</button><button class="btn" data-act="copyO">Copiar texto</button></div></div>
  <div class="card"><h3>Para pegar en el ESSI · Epicrisis e Informe de alta</h3><p class="muted" style="margin-top:0">Cada cuadro es un campo del ESSI. Se arman solos con lo registrado; si editas uno queda tu versión (↺ vuelve a la automática). También salen en el <b>TXT del día</b> de la fecha de egreso, para copiarlos en la PC del hospital.</p>
   ${altaBlocks(h).map(b=>`<div style="margin-top:14px"><div class="pt"><div><span class="badge ${b[1]==='OPCIONAL'?'':'b-ok'}">${b[1]}</span> <b style="font-size:14px">${esc(b[2])}</b></div><div class="row">${a.ov[b[0]]!=null?`<button class="link" data-act="blkReset" data-k="${b[0]}">↺ Automático</button>`:''}<button class="btn sm pri" data-act="blkCopy" data-k="${b[0]}">Copiar</button></div></div>
    <textarea data-p="ov.${b[0]}" data-blk="${b[0]}" rows="${Math.min(14,Math.max(3,altaVal(h,b).split('\n').length+1))}" placeholder="${b[0]==='hist'?'Sin historia registrada (paciente recibido ya hospitalizado): escríbela o pégala aquí':''}">${esc(altaVal(h,b))}</textarea></div>`).join('')}
   <div class="row" style="margin-top:12px"><button class="btn sm" data-act="claudeE">Copiar datos para redactar la evolución con Claude (sin nombre/DNI)</button></div></div>`;
}

/* ---- Pacientes ---- */
function vPacientes(){const q=deacc(R.q||'');CUR={root:null};
  const ps=Object.values(DB.patients).filter(p=>!q||p.dni.includes(q)||deacc(p.nombre).includes(q)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return `<div class="card"><h2>Pacientes (${Object.keys(DB.patients).length})</h2><input id="pq" placeholder="Buscar por DNI o apellidos" value="${esc(R.q||'')}" oninput="R.q=this.value;const c=this.selectionStart;render();const i=$('#pq');i.focus();i.setSelectionRange(c,c)"></div>
  ${ps.map(p=>{const hs=hospsOf(p.dni),act=hs.find(h=>!(h.alta&&h.alta.confirmed));return `<div class="card pt" style="cursor:pointer" onclick="go('paciente',{dni:'${esc(p.dni)}'})"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">${dniTag(p.dni)} · ${hs.length} hospitalización(es)</div></div>${act?'<span class="badge b-ok">En censo · '+esc(act.cama)+'</span>':'<span class="badge b-alta">De alta</span>'}</div>`}).join('')||'<div class="card muted">Sin resultados.</div>'}`}
function vPaciente(){const p=DB.patients[R.dni];if(!p){R.v='pacientes';return vPacientes()}const hs=hospsOf(p.dni);CUR={root:p,dni:p.dni};
  return `<div class="card"><h2>${esc(p.nombre)}</h2><div class="muted">${dniTag(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''}</div>
   <div class="row" style="margin-top:10px"><span class="sp"></span><button class="btn bad sm" onclick="delPatient('${esc(p.dni)}')">Eliminar paciente</button></div></div>
   ${hs.map(h=>{const ev=evolsOf(h.id);return `<div class="card"><div class="pt"><div><b>Hospitalización ${fmtD(h.ingreso)}${h.alta?' – '+fmtD(h.alta.fecha):''}</b> · cama ${esc(h.cama||'—')}</div>
    <div class="row"><button class="btn sm pri" onclick="go('hosp',{hid:'${h.id}'})">Abrir</button><button class="btn sm" onclick="go('ingreso',{hid:'${h.id}'})">Ingreso</button>${h.alta?`<button class="btn sm" onclick="go('alta',{hid:'${h.id}'})">Alta</button>`:''}<button class="btn sm bad" onclick="delHosp('${h.id}')">Eliminar</button></div></div>
    ${ev.map(e=>`<details style="margin-top:8px"><summary>${fmtD(e.fecha)} · DH ${dh(h,e.fecha)} · ${e.estado}</summary><pre class="note">${esc(e.texto||evolText(e))}</pre>
     <div class="row" style="margin-top:8px"><button class="btn sm" onclick="R.fecha='${e.fecha}';go('evol',{eid:'${e.id}',hid:'${h.id}'})">Abrir</button><button class="btn sm" onclick="copyText(DB.evols['${e.id}'].texto||evolText(DB.evols['${e.id}'])).then(o=>toast(o?'Copiada':'Error'))">Copiar</button></div></details>`).join('')||'<div class="muted" style="margin-top:6px">Sin evoluciones.</div>'}</div>`}).join('')}`}
async function delHosp(hid,toCenso){const n=evolsOf(hid).length;if(!await ask('¿Eliminar esta hospitalización con su ingreso, '+n+' evolución(es), labs, pendientes y alta?'))return;evolsOf(hid).forEach(e=>delete DB.evols[e.id]);delete DB.hosps[hid];save();if(toCenso)go('censo');else rerender();toast('Hospitalización eliminada')}
async function delPatient(dni){if(!await ask('¿Eliminar a '+P(dni).nombre+' con TODAS sus hospitalizaciones? No se puede deshacer.'))return;hospsOf(dni).forEach(h=>{evolsOf(h.id).forEach(e=>delete DB.evols[e.id]);delete DB.hosps[h.id]});delete DB.patients[dni];save();go('pacientes',{q:''});toast('Paciente eliminado')}

/* ---- Ajustes ---- */
function vAjustes(){const s=DB.settings;CUR={root:s,click(a){
    if(a==='saveAll'){s.autor=$('#sAutor').value.trim();s.sede=$('#sSede').value.trim();s.evMayus=$('#sMay').checked;s.evInd=$('#sInd').checked;Object.keys(EXLBL).forEach(k=>s.exEv[k]=$('#se_'+k).value.trim());s.control=up($('#sCtrl').value.trim());Object.keys(EXLBL).forEach(k=>s.ex[k]=up($('#sx_'+k).value.trim()));
      s.chkIng=lines(up($('#sChkI').value));s.chkAlta=lines(up($('#sChkA').value));s.chkVis=lines(up($('#sChkV').value));s.catalog=[...new Set(lines(up($('#sCat').value)))];save();toast('Ajustes guardados')}
    else if(a==='resetEx'){Object.keys(EXDEF).forEach(k=>$('#sx_'+k).value=EXDEF[k])}
    else if(a==='resetEv'){Object.keys(EXEV).forEach(k=>$('#se_'+k).value=EXEV[k])}}};
  let bytes=0;try{bytes=(localStorage.getItem(KEY)||'').length*2}catch(e){}
  return `<div class="card"><h3>Datos del médico y servicio</h3><div class="grid w2"><div><label>Autor (va bajo el título)</label><input id="sAutor" value="${esc(s.autor)}" placeholder="MR Apellido"></div><div><label>Sede (encabezado de la evolución: “Reumatología 301-C <sede>”)</label><input id="sSede" value="${esc(s.sede||'')}" placeholder="Metropolitano"></div><div><label>Control al alta (por defecto)</label><input id="sCtrl" value="${esc(s.control)}"></div></div></div>
  <div class="card"><h3>Formato de la evolución</h3><p class="muted" style="margin-top:0">Sigue el modelo del servicio: minúsculas, S) O) LAB / Imágenes / Procedimientos, A) y P).</p>
   <label class="chk"><input type="checkbox" id="sMay" ${s.evMayus?'checked':''}> Evolución en MAYÚSCULAS</label>
   <label class="chk" style="margin-top:6px"><input type="checkbox" id="sInd" ${s.evInd?'checked':''}> Agregar bloque de indicaciones al final</label>
   <h4>Examen normal de la evolución</h4>${Object.keys(EXLBL).map(k=>`<label style="margin-top:8px">${k==='gen'?'O) (general)':EVLBL[k]}</label><textarea id="se_${k}" rows="1">${esc(s.exEv[k]||'')}</textarea>`).join('')}
   <p class="muted">Vacío = no se escribe esa línea. En varones “Despierta, orientada” cambia solo a masculino.</p><button class="btn sm" data-act="resetEv">Restaurar modelo</button></div>
  <div class="card"><h3>Examen físico normal (nota de ingreso)</h3>${Object.keys(EXLBL).map(k=>`<label style="margin-top:8px">${EXLBL[k]}</label><textarea id="sx_${k}" rows="2">${esc(s.ex[k])}</textarea>`).join('')}<button class="btn sm" style="margin-top:8px" data-act="resetEx">Restaurar por defecto</button></div>
  <div class="card"><h3>Checklists</h3><div class="grid w2"><div><label>Ingreso (uno por línea)</label><textarea id="sChkI" rows="5">${esc(s.chkIng.join('\n'))}</textarea></div><div><label>Alta (uno por línea; DM y CITT se agregan solos si aplican)</label><textarea id="sChkA" rows="6">${esc(s.chkAlta.join('\n'))}</textarea></div>
   <div><label>Cada visita / día (uno por línea; CITT se agrega si el paciente lo requiere)</label><textarea id="sChkV" rows="3">${esc((s.chkVis||[]).join('\n'))}</textarea></div></div></div>
  <div class="card"><h3>Catálogo de indicaciones (${s.catalog.length})</h3><p class="muted" style="margin-top:0">Una por línea. Lo nuevo que escribes en las indicaciones se agrega solo.</p><textarea id="sCat" rows="10">${esc(s.catalog.join('\n'))}</textarea></div>
  <div class="row" style="margin-bottom:12px"><button class="btn pri" data-act="saveAll">Guardar ajustes</button></div>
  <div class="card"><h3>Respaldo</h3><p class="muted" style="margin-top:0">Todo vive solo en este iPad. Último respaldo: ${s.lastBackup?new Date(s.lastBackup).toLocaleString('es-PE'):'nunca'} · ${(bytes/1024).toFixed(0)} KB</p>
   <div class="row"><button class="btn pri" onclick="exportBackup()">Exportar respaldo</button><label class="btn" style="margin:0;color:var(--ink);font-size:16px">Importar respaldo<input type="file" accept=".json,application/json" style="display:none" onchange="importBackup(this.files[0])"></label></div></div>
  <div class="card"><h3>Zona de riesgo</h3><button class="btn bad" onclick="wipe()">Borrar todos los datos</button></div>
  <p class="muted">Evol Reuma v2.2 · Lector de fotos: Tesseract.js · Lector de PDF: pdf.js (ambos funcionan sin internet una vez usados). Las plantillas son editables: valídalas con el servicio.</p>`}
async function wipe(){if(!await ask('¿Borrar TODOS los datos de Evol Reuma en este iPad?')||!await ask('Confirma de nuevo: no se puede deshacer.'))return;const s=DB.settings;DB=blank();DB.settings=Object.assign(s,{lastBackup:null});save();go('censo')}

/* =====================================================================
   EXPORTAR
   ===================================================================== */
/* ---------- Textos del alta para pegar en los campos del ESSI (Epicrisis e Informe de alta) ---------- */
function tratRecibido(h){const tr=new Map(),add=(t,f)=>{const k=deacc(t).replace(/\s+/g,' ').trim();if(!k||/^(DIETA|CONTROL|CFV|BHE|VIA VENOSA|VVP|NACL|CLNA|DEXTROSA|CABECERA|REPOSO|O2|OXIGENO|HGT)/.test(k))return;const c=tr.get(k)||{t:up(t.trim()).replace(/\.$/,''),a:f,b:f};if(f<c.a)c.a=f;if(f>c.b)c.b=f;tr.set(k,c)};
  h.ing.ind.forEach(x=>add(x.t,x.fi||h.ingreso));evolsOf(h.id).forEach(e=>e.ind.forEach(x=>{if(x.fi&&x.fi<e.fecha)add(x.t,x.fi);add(x.t,e.fecha)}));
  return [...tr.values()].sort((x,y)=>x.a.localeCompare(y.a))}
const dd=iso=>fmtD(iso).slice(0,5);
const rango=c=>c.b!==c.a?'DEL '+dd(c.a)+' AL '+dd(c.b)+' ('+(days(c.a,c.b)+1)+' DÍAS)':'EL '+dd(c.a);
function resumenAlta(h){const a=h.alta,p=P(h.dni),S=[];const sx=p.sexo==='F'?'MUJER ':p.sexo==='M'?'VARÓN ':'';
  const le=evolsOf(h.id).find(e=>e.fecha<=a.fecha);
  S.push('PACIENTE '+sx+(p.edad?'DE '+p.edad+' AÑOS':'').trim()+', HOSPITALIZADO EN REUMATOLOGÍA DESDE EL '+dd(h.ingreso)+(probLines(h.ing.prob).length?' POR '+probLines(h.ing.prob).slice(0,2).join(' Y '):'')+'.');
  const ev=tratRecibido(h).filter(c=>/\b(EV|IV|SC)\b|PULSO|METILPREDNISOLONA|CICLOFOSFAMIDA|RITUXIMAB|INMUNOGLOBULINA|TOCILIZUMAB|BELIMUMAB/.test(deacc(c.t))&&!/ENOXAPARINA|HEPARINA|OMEPRAZOL|METAMIZOL|PARACETAMOL|TRAMADOL|ONDANSETRON|METOCLOPRAMIDA|INSULINA/.test(deacc(c.t)));
  if(ev.length)S.push('RECIBE '+ev.map(c=>c.t+' '+rango(c)).join('; ')+'.');
  const ic=h.pend.filter(x=>x.tipo==='IC'&&x.estado===2);if(ic.length)S.push(ic.map(x=>'ES EVALUADO POR '+up(pendLabel(x).replace(/^IC\s*/i,''))+(x.res?', QUIEN INDICA '+up(x.res).replace(/\.$/,''):'')).join('. ')+'.');
  const pr=h.pend.filter(x=>x.tipo==='PROCEDIMIENTO'&&x.estado===2);if(pr.length)S.push(pr.map(x=>'SE REALIZA '+up(x.t)+(x.fres?' EL DÍA '+dd(x.fres):'')+(x.res?': '+up(x.res).replace(/\.$/,''):'')).join('. ')+'.');
  const am=le?(String(evNorm(le).A||'').match(/^Paciente ([^,.]+),[^.]*?evoluci[oó]n cl[ií]nica ([^,.]+)/i)||[]):[];
  S.push('PACIENTE '+up(am[1]||'estable')+', CON EVOLUCIÓN CLÍNICA '+up(am[2]&&!/estacionaria/i.test(am[2])?am[2]:'favorable')+', SE INDICA SU ALTA MÉDICA'+(a.control.trim()?' CON '+up(a.control).replace(/\.$/,''):'')+'.');
  pendActive(h).forEach(x=>S.push('PENDIENTE '+up(pendLabel(x))+'.'));
  return S.join(' ').replace(/\s+\./g,'.')}
function antAlta(h){const A=h.ing.ant,L=['ANTECEDENTES :'];L.push('ENFERMEDADES: '+(A.patol.trim()?A.patol.trim():'NIEGA.'));if(A.quir.trim())L.push('QUIRÚRGICOS: '+A.quir.trim());if(A.hosp.trim())L.push('HOSPITALIZACIONES: '+A.hosp.trim());
  if(A.alerg.trim())L.push('ALERGIAS: '+A.alerg.trim());if(A.med.trim())L.push('MEDICACIÓN HABITUAL: '+A.med.trim());return up(L.join('\n'))}
function estudiosAlta(h){const B=fmtLabsEvol(h.labs.filter(l=>l.fecha<=h.alta.fecha)),L=[];
  h.pend.filter(x=>x.estado===2&&String(x.res||'').trim()&&(x.tipo==='IMAGEN'||x.tipo==='LABORATORIO')).forEach(x=>{const t=dm(x.fres||h.alta.fecha)+' '+pendLabel(x)+': '+dot(x.res);if(!deacc(B.img.concat(B.lab).join(' ')).includes(deacc(x.res.slice(0,30))))(x.tipo==='IMAGEN'?B.img:B.lab).push(t)});
  if(B.lab.length)L.push('LAB',...B.lab.map(x=>x.replace(/^(\d\d\/\d\d):/,'$1')));if(B.img.length)L.push('IMÁGENES',...B.img);return up(L.join('\n'))}
function procAlta(h){const B=fmtLabsEvol(h.labs.filter(l=>l.fecha<=h.alta.fecha)),L=B.proc.slice();
  h.pend.filter(x=>x.tipo==='PROCEDIMIENTO'&&x.estado===2).forEach(x=>{if(!deacc(L.join(' ')).includes(deacc(String(x.res||x.t).slice(0,25))))L.push(up(x.t)+(x.fres?' EL DÍA '+dd(x.fres):'')+(x.res?': '+dot(x.res):''))});return up(L.join('\n'))}
function tratAltaTxt(h){return up(altaInd(h).map(x=>x.t.trim().replace(/\.$/,'')).join('\n'))}
function tratRecTxt(h){return tratRecibido(h).map(c=>'- '+c.t+' '+rango(c)).join('\n')}
function bloqueAlta(h,res){const a=h.alta,A=h.ing.ant,L=['EPICRISIS','FECHA DE INGRESO: '+fmtDot(h.ingreso),'FECHA DE EGRESO: '+fmtDot(a.fecha)];
  const an=[A.patol,A.quir&&'QX: '+A.quir].map(x=>String(x||'').trim()).filter(Boolean);if(an.length)L.push('ANTECEDENTES:',...an);
  L.push('DIAGNOSTICO:',...lines(a.dx));
  L.push('HISTORIA DE LA ENFERMEDAD:');if(h.ing.hea.trim())L.push(h.ing.hea.trim());L.push(res);
  const lb=fmtLabsEvol(h.labs.filter(l=>l.fecha<=a.fecha)).lab;if(lb.length)L.push('LABORATORIO',...lb.map(x=>x.replace(/^(\d\d\/\d\d):/,'$1')));
  L.push('PLAN:','ALTA MEDICA');if(a.control.trim())L.push(a.control.trim());pendActive(h).forEach(x=>L.push('PENDIENTE '+pendLabel(x)));
  const t=tratAltaTxt(h);if(t)L.push('TRATAMIENTO',t);return up(L.join('\n'))}
// [clave, documento, campo del ESSI, texto generado]
function altaBlocks(h){const a=h.alta;a.ov=a.ov||{};const res=a.ov.resumen??resumenAlta(h);
  return [['resumen','EPICRISIS + INFORME DE ALTA','EVOLUCIÓN (epicrisis) · EVOLUCIONÓ (informe de alta)',resumenAlta(h)],
   ['ant','EPICRISIS','ANTECEDENTES',antAlta(h)],
   ['hist','EPICRISIS','HISTORIA MÉDICA ACTUAL',up(h.ing.hea.trim()?'HISTORIA DE LA ENFERMEDAD\n'+h.ing.hea.trim():'')],
   ['trat','EPICRISIS','TRATAMIENTO (recibido en la hospitalización)',tratRecTxt(h)],
   ['est','INFORME DE ALTA','SE REALIZARON LOS SIGUIENTES ESTUDIOS COMPLEMENTARIOS',estudiosAlta(h)],
   ['proc','INFORME DE ALTA','PROCEDIMIENTOS ESPECIALES',procAlta(h)],
   ['tratA','INFORME DE ALTA','TRATAMIENTO FARMACOLÓGICO (al alta)',tratAltaTxt(h)],
   ['bloque','OPCIONAL','TODO EN UN SOLO CAMPO (como “EPICRISIS: FECHA DE INGRESO… PLAN… TRATAMIENTO”)',bloqueAlta(h,res)]]}
const altaVal=(h,b)=>{const o=(h.alta.ov||{})[b[0]];return o!=null?o:b[3]};
function altaEssiText(h){return altaBlocks(h).filter(b=>b[0]!=='bloque'&&altaVal(h,b).trim()).map(b=>'['+b[1]+' · '+b[2]+']\n'+altaVal(h,b).trim()).join('\n\n')}
async function saveFile(blob,name){
  try{const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})&&/iPad|iPhone|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document){await navigator.share({files:[f],title:name});return true}}
  catch(e){if(e.name==='AbortError')return false}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);return true}
async function exportTxtDia(){
  const f=R.fecha,hs=Object.values(DB.hosps).filter(h=>(h.ingreso===f&&h.ing.estado!=='previo')||evolOn(h.id,f)||(h.alta&&h.alta.fecha===f)).sort((a,b)=>String(a.cama).localeCompare(String(b.cama),'es',{numeric:true}));
  if(!hs.length)return toast('No hay documentos para '+fmtD(f));
  const bor=hs.map(h=>evolOn(h.id,f)).filter(e=>e&&e.estado!=='final').length;if(bor&&!await ask(bor+' evolución(es) aún no están cerradas. ¿Exportar igual?'))return;
  const S=[];hs.forEach(h=>{const p=P(h.dni);S.push('════════ CAMA '+(h.cama||'—')+' · '+p.nombre+' · DNI '+p.dni+' ════════');
    if(h.ingreso===f&&h.ing.estado!=='previo')S.push('──── NOTA DE INGRESO ────',ingText(h),'');
    const e=evolOn(h.id,f);if(e)S.push('──── EVOLUCIÓN ────',evolText(e),'');
    if(h.alta&&h.alta.fecha===f)S.push('──── ORDEN DE ALTA ────',ordenText(h),'','──── EPICRISIS / INFORME DE ALTA (campo por campo) ────',altaEssiText(h),'');S.push('')});
  const txt='﻿'+('REUMATOLOGÍA · '+fmtD(f)+'\n\n'+S.join('\n')).replace(/\r?\n/g,'\r\n');
  saveFile(new Blob([txt],{type:'text/plain;charset=utf-8'}),'reuma-'+f+'.txt');
}
function exportBackup(){const blob=new Blob([JSON.stringify({app:'evol-reuma',version:1,exported:new Date().toISOString(),data:DB})],{type:'application/json'});
  saveFile(blob,'respaldo-evol-reuma-'+todayISO()+'.json').then(ok=>{if(ok){DB.settings.lastBackup=Date.now();save();render();toast('Respaldo exportado')}})}
function importBackup(file){if(!file)return;const r=new FileReader();r.onload=async()=>{try{const j=JSON.parse(r.result);if(j.app&&j.app!=='evol-reuma')throw new Error('app');const d=j.data||j;if(!d.patients||!d.hosps||!d.evols)throw new Error('f');
  if(!await ask('Aceptar = COMBINAR con los datos actuales (gana la versión más reciente de cada registro).'))return;let c=0;
  [['patients','dni'],['hosps','id'],['evols','id']].forEach(([k,id])=>Object.values(d[k]).forEach(x=>{const cur=DB[k][x[id]];if(!cur||(x.updated||0)>(cur.updated||0)){DB[k][x[id]]=x;c++}}));
  if(d.settings&&d.settings.catalog)DB.settings.catalog=[...new Set([...DB.settings.catalog,...d.settings.catalog])];save();render();toast('Importados '+c+' registros')}catch(e){toast(e.message==='app'?'Ese respaldo es de otra app':'Archivo no válido')}};r.readAsText(file)}

/* ---- Orden de alta en Word (plantilla del servicio, 2 por hoja A4 horizontal) ---- */
function xe(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
function wP(text,o={}){const rpr=o.b?'<w:rPr><w:b/></w:rPr>':'';const ppr=(o.jc?`<w:jc w:val="${o.jc}"/>`:'')+(o.bul?'<w:pStyle w:val="Prrafodelista"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="7"/></w:numPr><w:ind w:left="447" w:hanging="283"/>':'')+(o.num?'<w:ind w:left="447" w:hanging="283"/>':'');
  return `<w:p>${ppr?'<w:pPr>'+ppr+'</w:pPr>':''}${text===''?'':`<w:r>${rpr}<w:t xml:space="preserve">${xe(text)}</w:t></w:r>`}</w:p>`}
function wTc(w,span,content,extra=''){return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span>1?`<w:gridSpan w:val="${span}"/>`:''}${extra}</w:tcPr>${content}</w:tc>`}
function ordenTable(h){const p=P(h.dni),a=h.alta,T=up('ORDEN DE ALTA '+DB.settings.servicio);
  const dx=lines(a.dx).map((x,i)=>wP((i+1)+'. '+up(x),{num:true})).join('')||wP('');
  const ind=altaInd(h).map(x=>wP(up(x.t))).join('')||wP('');
  const ex=altaExtra(h).map(x=>wP(up(x),{bul:true})).join('')||wP('');
  return `<w:tbl><w:tblPr><w:tblStyle w:val="Tablaconcuadrcula"/><w:tblW w:w="6638" w:type="dxa"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>
<w:tblGrid><w:gridCol w:w="1381"/><w:gridCol w:w="716"/><w:gridCol w:w="1220"/><w:gridCol w:w="268"/><w:gridCol w:w="1362"/><w:gridCol w:w="297"/><w:gridCol w:w="1394"/></w:tblGrid>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${wTc(6638,7,wP(T,{b:true,jc:'center'}))}</w:tr>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${wTc(1381,1,wP(' PACIENTE'))}${wTc(5257,6,wP(up(p.nombre),{b:true}))}</w:tr>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${wTc(1381,1,wP('DNI'))}${wTc(1936,2,wP(' '+p.dni))}${wTc(1630,2,wP('CAMA'))}${wTc(1691,2,wP(up(h.cama||'')))}</w:tr>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${wTc(6638,7,wP('DIAGNOSTICO',{b:true}))}</w:tr>
<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="547"/></w:trPr>${wTc(6638,7,dx)}</w:tr>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${wTc(2097,2,wP('FECHA DE INGRESO'))}${wTc(1220,1,wP(fmtDot(h.ingreso)))}${wTc(1927,3,wP('FECHA DE EGRESO'))}${wTc(1394,1,wP(fmtDot(a.fecha)))}</w:tr>
<w:tr><w:trPr><w:cantSplit/></w:trPr>${wTc(6638,7,wP('INDICACIONES DE ALTA',{b:true}))}</w:tr>
<w:tr><w:trPr><w:trHeight w:val="121"/></w:trPr>${wTc(6638,7,ind)}</w:tr>
<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="709"/></w:trPr>${wTc(6638,7,ex)}</w:tr>
<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="355"/></w:trPr>${wTc(3585,4,wP('Firma del medico'))}${wTc(3053,3,wP('')+wP('')+wP(''))}</w:tr></w:tbl>`}
function exportOrdenes(fecha,list){
  const hs=list||Object.values(DB.hosps).filter(h=>h.alta&&h.alta.fecha===fecha).sort((a,b)=>String(a.cama).localeCompare(String(b.cama),'es',{numeric:true}));if(!hs.length)return toast('No hay altas');
  const body=hs.map((h,i)=>ordenTable(h)+(i<hs.length-1?'<w:p><w:r><w:br w:type="column"/></w:r></w:p>':'<w:p/>')).join('');
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="993" w:right="1417" w:bottom="1135" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:num="2" w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>`;
  const files=Object.entries(OA_PARTS).map(([k,v])=>[k,v]);files.push(['word/document.xml',doc]);
  hs.forEach(h=>{h.alta.chk['ORDEN DE ALTA']=true});save();
  saveFile(new Blob([zip(files)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),'ordenes-alta-'+(fecha||hs[0].alta.fecha)+(list&&list.length===1?'-'+P(hs[0].dni).dni:'')+'.docx');
}
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;const d=new Date(),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  files.forEach(([name,txt])=>{const n=enc.encode(name),data=enc.encode(txt),c=crc32(data);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,n.length,true);parts.push(new Uint8Array(h.buffer),n,data);
    const e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(12,tm,true);e.setUint16(14,dt,true);e.setUint32(16,c,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,n.length,true);e.setUint32(42,off,true);cen.push(new Uint8Array(e.buffer),n);off+=30+n.length+data.length});
  const cs=cen.reduce((a,b)=>a+b.length,0),end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cs,true);end.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(end.buffer)])}

/* ---------- arranque ---------- */
render();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
