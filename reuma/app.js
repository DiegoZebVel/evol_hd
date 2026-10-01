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
  control:'CONTROL POR CONSULTORIO EXTERNO DE REUMATOLOGÍA',servicio:'REUMATOLOGÍA',lastBackup:null}}}
function load(){try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r),b=blank();d.settings=Object.assign(b.settings,d.settings||{});d.settings.ex=Object.assign({...EXDEF},d.settings.ex||{});
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
function newEvol(h,fecha){
  const prev=evolsOf(h.id).find(e=>e.fecha<fecha);
  const e={id:uid(),hid:h.id,dni:h.dni,fecha,hora:nowHM(),estado:'borrador',dx:[],fv:{pas:'',pad:'',fc:'',fr:'',t:'',sat:'',o2:'AA'},S:'',ex:{},exChg:{},labSel:{},Aextra:'',Pextra:'',ind:[],prevId:prev?prev.id:null,texto:'',created:Date.now(),updated:Date.now()};
  if(prev){e.dx=clone(prev.dx).filter(d=>d.estado!=='RESUELTO').map(d=>({...d,a:''}));e.ex=clone(prev.ex);e.ind=clone(prev.ind);e.fv.o2=prev.fv.o2||'AA';e.Pextra=prev.Pextra||''}
  else{e.dx=probLines(h.ing.prob).map(t=>({t,estado:'ESTABLE',a:'',p:''}));e.ex=clone(h.ing.ex);e.ind=clone(h.ing.ind);e.fv.o2=h.ing.fv.o2||'AA';e.Pextra=lines(h.ing.plan).filter(l=>!pendType(l)).join('\n')}
  if(!e.dx.length)e.dx=[{t:'',estado:'ESTABLE',a:'',p:''}];
  return e;
}
function prevRef(e){const h=DB.hosps[e.hid];const p=e.prevId&&DB.evols[e.prevId];return p?p.fecha:h.ingreso}
function refTime(e){const h=DB.hosps[e.hid];const p=e.prevId&&DB.evols[e.prevId];return p?(p.closedAt||p.created):(h.ing.completedAt||0)}
function labSelected(e,l){if(e.labSel[l.id]!=null)return e.labSel[l.id];if(l.fecha>e.fecha)return false;const h=DB.hosps[e.hid];
  if(!e.prevId&&h.ing.estado==='previo')return days(l.fecha,e.fecha)<=1; // recibido: solo lo de ayer/hoy por defecto
  return l.fecha>prevRef(e)||(l.created||0)>refTime(e)}

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
  if(ing.servicio||ing.disp)s.push('INGRESA'+(ing.servicio?' PROCEDENTE '+(/^(DE|DEL)\s/i.test(ing.servicio)?'':/^SERVICIO/i.test(ing.servicio)?'DEL ':'DE ')+ing.servicio:'')+(ing.disp?(ing.servicio?', ':' ')+ing.disp:'')+'.');
  return up(s.join(' ').replace(/\.\./g,'.'));
}
function labsUpTo(h,f){return h.labs.filter(l=>l.fecha<=f)}
function ingText(h){
  const p=P(h.dni),g=h.ing,A=g.ant,L=['NOTA DE INGRESO'];if(DB.settings.autor)L.push(DB.settings.autor);L.push('',filiacion(p,g),'');
  L.push('ANTECEDENTES :');if(A.patol)L.push(A.patol);L.push('QUIRÚRGICOS: '+(A.quir||'NIEGA.'));if(A.hosp)L.push('HOSPITALIZACIONES: '+A.hosp);
  L.push('ALERGIAS: '+(A.alerg||'—'));L.push('MEDICACIÓN HABITUAL: '+(A.med||'—'),'');
  L.push('HISTORIA DE LA ENFERMEDAD','',g.hea||'—','');
  L.push('AL EXAMEN FÍSICO');const fv=fvText(g.fv);if(fv)L.push('FUNCIONES VITALES: '+fv);L.push(exText(g.ex),'');
  const lb=fmtLabsText(labsUpTo(h,h.ingreso));if(lb)L.push(lb,'');
  if(g.otros.trim())L.push(g.otros.trim(),'');
  if(g.img.trim())L.push('IMÁGENES',g.img.trim(),'');
  if(g.ic.trim())L.push('INTERCONSULTAS',g.ic.trim(),'');
  L.push('PROBLEMAS');lines(g.prob).forEach(x=>L.push(x));L.push('','PLAN');lines(g.plan).forEach(x=>L.push(x));
  L.push('','INDICACIONES');const it=indText(g.ind,false);if(it)L.push(it);
  return up(L.join('\n').replace(/\n{3,}/g,'\n\n'));
}
function pendResultsOn(h,f){return h.pend.filter(x=>x.estado===2&&x.fres===f&&String(x.res||'').trim())}
function pendLabel(x){const t=x.t.trim();return x.tipo==='IC'&&!/^IC\b/.test(deacc(t))?'IC '+t:t}
function pendActive(h){return h.pend.filter(x=>x.estado<2&&x.t.trim())}
function evolText(e){
  const h=DB.hosps[e.hid],L=['EVOLUCIÓN – '+DB.settings.servicio];if(DB.settings.autor)L.push(DB.settings.autor);
  L.push('FECHA: '+fmtD(e.fecha)+'  HORA: '+e.hora+'  DH: '+dh(h,e.fecha));
  const dx=e.dx.filter(d=>d.t.trim());if(dx.length){L.push('PROBLEMAS:');dx.forEach((d,i)=>L.push((i+1)+'. '+d.t.trim()))}
  const fv=fvText(e.fv);if(fv)L.push('FUNCIONES VITALES: '+fv);
  L.push('S: '+(e.S.trim()?dot(e.S):'PACIENTE SIN MOLESTIAS NUEVAS.'));
  L.push('O:',exText(e.ex));
  const labs=h.labs.filter(l=>labSelected(e,l));const lb=fmtLabsText(labs);
  const res=pendResultsOn(h,e.fecha);
  if(lb||res.length){L.push('EXÁMENES AUXILIARES:');if(lb)L.push(lb);if(res.length){L.push('RESULTADOS:');res.forEach(x=>L.push('• '+pendLabel(x)+': '+dot(x.res)))}}
  L.push('A:');dx.forEach((d,i)=>L.push((i+1)+'. '+d.t.trim()+': '+d.estado+(d.a.trim()?', '+dot(d.a):'.')));if(e.Aextra.trim())L.push(e.Aextra.trim());
  L.push('P:');dx.filter(d=>d.p.trim()).forEach(d=>L.push('- '+d.t.trim()+': '+dot(d.p)));if(e.Pextra.trim())lines(e.Pextra).forEach(x=>L.push(x));
  const pa=pendActive(h);if(pa.length)L.push('PENDIENTES: '+pa.map(pendLabel).join('; ')+'.');
  L.push('INDICACIONES:');
  if(h.alta&&h.alta.fecha===e.fecha){L.push('1. ALTA MÉDICA.','2. INDICACIONES PARA CASA:');altaInd(h).forEach(x=>L.push('   - '+dot(x.t)));altaExtra(h).forEach(x=>L.push('   - '+x))}
  else{const it=indText(e.ind,true,e.fecha);if(it)L.push(it)}
  return up(L.join('\n'));
}
/* ---------- alta ---------- */
const FLAG_RE=/(^|[^A-Z])(EV|IV|SC|IM|ENDOVENOS\w*|INTRAVENOS\w*|SUBCUTANE\w*|INFUSION|PERFUSION|NEBULIZ\w*|OXIGENO|O2|CONTROL DE|CFV|BHE|BALANCE|HGT|CABECERA|REPOSO|VVP|VIA VENOSA|DIETA|NPO|PULSO|DOSIS UNICA|CONDICIONAL)([^A-Z]|$)/;
function flagInd(t){return FLAG_RE.test(deacc(t))}
function altaInd(h){return (h.alta?.ind||[]).filter(x=>x.t.trim())}
function altaExtra(h){const a=h.alta,L=[];if(a.control.trim())L.push(dot(a.control));if(a.dm)L.push('DESCANSO MÉDICO HASTA EL '+fmtD(a.dm)+'.');return L}
function startAlta(h,fecha){
  const le=evolsOf(h.id)[0];
  const dx=le?le.dx.filter(d=>d.t.trim()&&d.estado!=='RESUELTO').map(d=>d.t.trim()):probLines(h.ing.prob);
  const src=le?le.ind:h.ing.ind;
  h.alta={fecha,dx:dx.join('\n'),ind:src.filter(x=>x.t.trim()).map(x=>({id:uid(),t:x.t,flag:flagInd(x.t)})),control:DB.settings.control,dm:'',citt:false,chk:{},confirmed:false};
}
function altaChecklist(h){const a=h.alta,L=DB.settings.chkAlta.slice();if(a.dm)L.push('DESCANSO MÉDICO');if(h.citt||a.citt)L.push('CITT EN ESSI');return L}
function ordenText(h){const p=P(h.dni),a=h.alta,L=['ORDEN DE ALTA '+DB.settings.servicio,'PACIENTE: '+p.nombre,'DNI: '+p.dni+'   CAMA: '+(h.cama||'—'),'DIAGNÓSTICO:'];
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
  if(ev.length){L.push('','EVOLUCIÓN POR DÍA:');ev.forEach(e=>L.push('- DH '+dh(h,e.fecha)+' ('+fmtD(e.fecha)+'): '+e.dx.filter(d=>d.t.trim()).map(d=>d.t.trim()+' '+d.estado+(d.a.trim()?' ('+d.a.trim()+')':'')).join('; ')+'.'))}
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
  const V={importEv:vImport,hosp:vHosp,censo:vCenso,nuevo:vNuevo,ingreso:vIngreso,evol:vEvol,labs:vLabs,alta:vAlta,pendientes:vPendientes,pacientes:vPacientes,paciente:vPaciente,ajustes:vAjustes}[R.v];
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
    if(/(BIOPSIA|PUNCION|PARACENTESIS|TORACOCENTESIS|ARTROCENTESIS|BRONCOSCOP|ENDOSCOP|COLONOSCOP|CAPILAROSCOP|ELECTROMIOGRAF|EMG)/.test(u))return'PROCEDIMIENTO';
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
    <div class="muted">DNI ${esc(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''} · DH ${dh(h,R.fecha)}${n?' · '+n+' pendiente(s)':''}</div></div></div>
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
   <div class="muted">DNI ${esc(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''} · Ingreso ${fmtD(h.ingreso)} · <b>DH ${dh(h,R.fecha)}</b></div></div></div></div>
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
const SECRE=[['dx',/^(PROBLEMAS?|DIAGNOSTICOS?( DE TRABAJO| PRESUNTIVOS?| ACTIVOS)?|DX|IMPRESION DIAGNOSTICA|I\.?D\.?)\b\s*:?/],['S',/^(S|SUBJETIVO)\s*:/],['fv',/^(FUNCIONES VITALES|SIGNOS VITALES|FV|SV)\b\s*:?/],
 ['O',/^(O|OBJETIVO|EXAMEN FISICO|AL EXAMEN( FISICO)?|EF)\b\s*:?/],['lab',/^(EXAMENES AUXILIARES|EXS? AUX\w*|LABORATORIO|LAB|RESULTADOS)\b\s*:?/],['A',/^(A|APRECIACION|ANALISIS|EVALUACION)\s*:/],
 ['P',/^(P|PLAN( DE TRABAJO)?|CONDUCTA)\b\s*:?/],['ind',/^(INDICACIONES\b\s*:?|(TRATAMIENTO|TTO|RP)\s*:)/],['pend',/^(PENDIENTES?)\b\s*:?/]];
const EXRE=[['gen',/^(GENERAL|ESTADO GENERAL|EG|EGRAL|APARIENCIA)\b/],['piel',/^(PIEL( Y (FANERAS|MUCOSAS))?|PYF)\b/],['tcsc',/^(TCSC|TEJIDO CELULAR( SUBCUTANEO)?)\b/],['osteo',/^(OSTEO\w*|ARTICULAR|LOCOMOTOR|SOMA|MUSCULOESQUELETICO|EXTREMIDADES)\b/],
 ['resp',/^(TORAX( Y PULMONES)?|TYP|T Y P|PULMONES|RESPIRATORIO|AP|APARATO RESPIRATORIO)\b/],['cv',/^(CV|CARDIOVASCULAR|CARDIO\w*|CORAZON|RCR|ACV)\b/],['abd',/^(ABD\w*)\b/],['gu',/^(GU|GENITOURINARIO|GENITO\w*|URINARIO|RENAL)\b/],['neuro',/^(NEURO\w*|SNC|SN)\b/]];
function stripNum(l){return l.replace(/^\s*(?:[-•·*]|\d+\s*[.)\-]|[a-z]\))\s*/i,'').trim()}
function parseEvol(text,fecha){
  const out={dx:[],S:[],O:[],lab:[],A:[],P:[],ind:[],pend:[],fv:[],ex:{}};let sec=null,exk=null;
  text.split(/\r?\n/).forEach(raw=>{let l=raw.replace(/\s+/g,' ').trim();if(!l)return;let u=deacc(l);
    for(const[k,re]of SECRE){const m=u.match(re);if(m&&(k!=='P'||!/^(PA|PCR|PCO|PO2|PLAQ|PROT|PH)\b/.test(u))&&(k!=='A'||/^A\s*:|^APRE|^ANALI|^EVALU/.test(u))&&(k!=='O'||!/^(OJOS|OIDOS|OSTEO)/.test(u))){sec=k;exk=null;l=l.slice(m[0].length).replace(/^[\s:.\-]+/,'').trim();u=deacc(l);break}}
    if(!l)return;
    if(sec==='O'||(!['ind','lab','P','dx','A','pend'].includes(sec)&&/^[^:]{2,30}:/.test(u)&&EXRE.some(([k,re])=>re.test(u)))){if(sec!=='O')sec='O';for(const[k,re]of EXRE){const m=u.match(re);if(m){const rest=l.slice(m[0].length).replace(/^[^:]*?:\s*/,'').replace(/^[\s:.\-]+/,'');exk=k;out.ex[k]=(out.ex[k]?out.ex[k]+' ':'')+rest;return}}
      if(/^(PA|FC|FR|T°|T |SAT|SATO2|PESO)\b/.test(u)){out.fv.push(l);return}if(exk){out.ex[exk]+=' '+l;return}out.O.push(l);return}
    if(sec)out[sec].push(l)});
  const r={};
  r.dx=out.dx.map(stripNum).map(x=>x.replace(/:\s*(ESTABLE|EN MEJORIA|EN MEJORÍA|ESTACIONARIO|EN DETERIORO)\b.*$/i,'')).filter(Boolean);
  if(!r.dx.length&&out.A.length)r.dx=out.A.map(stripNum).map(x=>x.split(/:|,/)[0].trim()).filter(x=>x.length>2);
  r.ind=out.ind.map(stripNum).filter(x=>x&&!/^(ALTA MEDICA|INDICACIONES PARA CASA)/i.test(deacc(x))).map(x=>{let fi='';const m=x.match(/\(?\bD(?:IA)?\s?(\d{1,3})\)?\.?\s*$/i);if(m&&fecha){const d=new Date(dUTC(fecha)-(+m[1]-1)*864e5);fi=d.toISOString().slice(0,10);x=x.replace(m[0],'').trim()}return {t:up(x.replace(/\.$/,'')),fi}});
  r.ex={};Object.keys(out.ex).forEach(k=>{if(out.ex[k].trim())r.ex[k]=up(out.ex[k].trim())});if(out.O.length&&!r.ex.gen)r.ex.gen=up(out.O.join(' '));
  const pl=out.P.map(stripNum).filter(Boolean);r.pend=[...out.pend.flatMap(x=>stripNum(x).split(/;\s*/)),...pl.filter(x=>/^PENDIENTE/i.test(deacc(x))).map(x=>x.replace(/^PENDIENTES?\s*:?\s*/i,''))].map(x=>x.trim()).filter(Boolean);
  r.plan=pl.filter(x=>!/^PENDIENTE/i.test(deacc(x))).map(up);
  r.labs=parseLabs(out.lab.join('\n'),fecha).rows;
  r.fv=out.fv.join(' ');r.S=out.S.join(' ');
  return r;
}
let IMP={text:'',r:null,fecha:null};
function vImport(){
  const h=DB.hosps[R.hid];if(!h){R.v='censo';return vCenso()}const p=P(h.dni);if(!IMP.fecha||IMP.hid!==h.id){IMP={text:'',r:null,fecha:addDays(R.fecha,-1),hid:h.id}}
  CUR={root:h,hid:h.id,dni:h.dni,mount(){LABSTATE.text=IMP.text;$('#lfotos').onchange=ev=>ocrFiles([...ev.target.files]).then(()=>{IMP.text=$('#ltext').value});$('#lpdf').onchange=ev=>pdfFiles([...ev.target.files]).then(()=>{IMP.text=$('#ltext').value});$('#ltext').oninput=e=>{IMP.text=e.target.value;LABSTATE.text=e.target.value}},async click(a){
    if(a==='manual'){IMP={text:'',r:null,fecha:null};LABSTATE.text='';return go('ingreso',{hid:h.id,tab:'prob'})}
    if(a==='parse'){IMP.text=$('#ltext').value;IMP.fecha=$('#ifecha').value||IMP.fecha;IMP.r=parseEvol(IMP.text,IMP.fecha);rerender();if(!IMP.r.dx.length&&!IMP.r.ind.length)toast('No encontré problemas ni indicaciones. Revisa o usa “Copiar para Claude”.')}
    else if(a==='claude'){const t='Reordena esta evolución médica SIN inventar datos, en MAYÚSCULAS y con estos encabezados exactos, cada uno en su línea:\nPROBLEMAS: (uno por línea, numerados)\nEXAMEN FÍSICO: (una línea por sistema: GENERAL:, PIEL:, TCSC:, OSTEOARTICULAR:, TÓRAX Y PULMONES:, CARDIOVASCULAR:, ABDOMEN:, GENITOURINARIO:, NEUROLÓGICO:)\nEXÁMENES AUXILIARES: (una línea por fecha: dd/mm/aaaa: EXAMEN valor, EXAMEN valor)\nPLAN: (uno por línea)\nPENDIENTES: (uno por línea)\nINDICACIONES: (una por línea, numeradas; conserva el (D3) si lo tiene)\n\n'+anonLabText($('#ltext').value);
      copyText(t).then(o=>toast(o?'Copiado sin nombre/DNI. Pega la respuesta de Claude en el cuadro y vuelve a Procesar':'No se pudo copiar'))}
    else if(a==='apply'){const r=IMP.r,f=IMP.fecha;if(!f)return toast('Pon la fecha de la evolución');if(f<h.ingreso)return toast('La fecha es anterior al ingreso ('+fmtD(h.ingreso)+')');
      r.dx=lines($('#idx').value).map(stripNum);r.ind=lines($('#iind').value).map(x=>{const o=r.ind.find(y=>y.t===up(stripNum(x)));return {t:up(stripNum(x)),fi:o?o.fi:''}});
      let e=evolOn(h.id,f);if(e&&!await ask('Ya hay una evolución del '+fmtD(f)+'. ¿Reemplazarla con la importada?'))return;
      if(!e){e={id:uid(),hid:h.id,dni:h.dni,fecha:f,hora:'08:00',labSel:{},exChg:{},created:Date.now()};DB.evols[e.id]=e}
      const prev=evolsOf(h.id).find(x=>x.fecha<f);
      Object.assign(e,{estado:'final',imported:true,dx:r.dx.map(t=>({t:up(t),estado:'ESTABLE',a:'',p:''})),fv:{pas:'',pad:'',fc:'',fr:'',t:'',sat:'',o2:'AA'},S:up(r.S||''),
        ex:Object.assign({},prev?prev.ex:h.ing.ex,r.ex),ind:r.ind.map(x=>({id:uid(),t:x.t,fi:x.fi||''})),Aextra:'',Pextra:r.plan.join('\n'),prevId:prev?prev.id:null,texto:up(IMP.text.trim()),updated:Date.now(),closedAt:Date.now()});
      Object.values(DB.evols).forEach(x=>{if(x.hid===h.id&&x.fecha>f&&(!x.prevId||(DB.evols[x.prevId]&&DB.evols[x.prevId].fecha<f)))x.prevId=e.id});
      let nl=0;if($('#ilabs')?.checked)r.labs.forEach(row=>{const area=LABMAP[row.k]?LABMAP[row.k].a:'OTROS';let L=h.labs.find(l=>l.fecha===row.fecha&&l.area===area);if(!L){L={id:uid(),fecha:row.fecha,area,items:[],created:0};h.labs.push(L)}if(!L.items.find(i=>i.k===row.k)){L.items.push({k:row.k,v:up(row.v)});nl++}});
      let np=0;if($('#ipend')?.checked)r.pend.forEach(t=>{if(!h.pend.some(x=>deacc(x.t)===deacc(t))){h.pend.push({id:uid(),tipo:pendType(t)||'OTRO',t:up(t),estado:0,res:'',fres:'',created:Date.now()});np++}});
      if(h.ing.estado==='previo'){if(!h.ing.prob.trim())h.ing.prob=r.dx.map(up).join('\n');if(!h.ing.ind.length)h.ing.ind=clone(e.ind)}
      const hoy=evolOn(h.id,R.fecha);
      if(hoy&&hoy.id!==e.id&&hoy.estado==='borrador'&&await ask('La evolución de hoy ya estaba creada (borrador). ¿Rellenarla con los problemas, examen e indicaciones importados?')){hoy.dx=e.dx.map(d=>({...d}));hoy.ex=clone(e.ex);hoy.ind=clone(e.ind);hoy.Pextra=e.Pextra;hoy.prevId=e.id}
      save();IMP={text:'',r:null,fecha:null};LABSTATE={text:'',rows:null,unk:[],fecha:null,busy:''};toast('Evolución del '+fmtD(f)+' importada'+(nl?' · '+nl+' labs':'')+(np?' · '+np+' pendientes':''));go('hosp',{hid:h.id})}}};
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
   <label>Problemas (uno por línea)</label><textarea id="idx" rows="${Math.max(3,r.dx.length+1)}">${esc(r.dx.join('\n'))}</textarea>
   <label style="margin-top:10px">Indicaciones (una por línea)</label><textarea id="iind" rows="${Math.max(3,r.ind.length+1)}">${esc(r.ind.map(x=>x.t).join('\n'))}</textarea>
   ${r.ind.some(x=>x.fi)?'<p class="muted">Las que traían (Dn) quedan con su fecha de inicio calculada.</p>':''}
   <h4>Examen físico (${Object.keys(r.ex).length} sistema(s); lo que falte se copia de la evolución anterior o del normal)</h4>${Object.keys(r.ex).map(k=>`<div class="muted"><b>${EXLBL[k]}:</b> ${esc(r.ex[k])}</div>`).join('')||'<div class="muted">Nada reconocido.</div>'}
   <h4>Plan general</h4><div class="muted">${esc(r.plan.join(' · ')||'—')}</div>
   <label class="chk" style="margin-top:10px"><input type="checkbox" id="ipend" checked> Agregar ${r.pend.length} pendiente(s): ${esc(r.pend.join('; ')||'—')}</label>
   <label class="chk" style="margin-top:6px"><input type="checkbox" id="ilabs" checked> Guardar ${r.labs.length} resultado(s) de laboratorio</label>
   <div class="row" style="margin-top:12px"><button class="btn pri" data-act="apply">Guardar como evolución del ${fmtD(IMP.fecha)}</button></div></div>`:''}`;
}
function addDays(iso,n){return new Date(dUTC(iso)+n*864e5).toISOString().slice(0,10)}

/* ---- Nuevo ingreso ---- */
function vNuevo(){
  const modo=R.modo;
  if(!modo)return `<div class="card"><h2>Agregar paciente</h2><p class="muted" style="margin-top:0">¿Cómo llega este paciente?</p>
   <div class="grid w2" style="margin-top:12px"><button class="btn pri" style="min-height:100px;font-size:18px" onclick="R.modo='nuevo';render()">🆕 Nuevo ingreso<br><span style="font-size:13px;font-weight:400">Hago la nota de ingreso completa</span></button>
   <button class="btn" style="min-height:100px;font-size:18px" onclick="R.modo='previo';render()">📋 Ya está evolucionado<br><span style="font-size:13px;font-weight:400">Lo recibo: subo su última evolución y sigo desde ahí</span></button></div></div>`;
  const q=R.q.trim(),ql=deacc(q);const res=q?Object.values(DB.patients).filter(p=>p.dni.includes(q)||deacc(p.nombre).includes(ql)).slice(0,15):[];
  const isDoc=/^[0-9A-Za-z]{6,12}$/.test(q)&&/\d/.test(q);
  CUR={mount(){const i=$('#q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}};
  return `<div class="card"><div class="pt"><h2 style="margin:0">${modo==='previo'?'📋 Ya está evolucionado':'🆕 Nuevo ingreso'}</h2><button class="btn sm" onclick="R.modo=null;render()">Cambiar</button></div>
   <p class="muted">${modo==='previo'?'Registra al paciente; luego subes su última evolución y la app llena problemas, examen, indicaciones, pendientes y labs.':'Registra al paciente; luego te pide la nota de ingreso completa.'}</p><label>Buscar por DNI o apellidos</label><input id="q" value="${esc(R.q)}" autocomplete="off" oninput="R.q=this.value;render()"></div>
  ${res.map(p=>{const hs=hospsOf(p.dni),act=hs.find(h=>!(h.alta&&h.alta.confirmed));return `<div class="card">
   <div class="alert a-info" style="margin-bottom:10px">${act?'Ya está en el censo (cama '+esc(act.cama)+').':'Paciente conocido: '+hs.length+' hospitalización(es) previa(s)'+(hs[0]?', la última del '+fmtD(hs[0].ingreso):'')+'. Se reutiliza su filiación y antecedentes.'}</div>
   <div class="pt"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''}</div></div>
   ${act?`<button class="btn pri" onclick="go('hosp',{hid:'${act.id}'})">Abrir</button>`:''}</div>
   ${act?'':`<div class="grid" style="margin-top:10px"><div><label>Cama</label><input id="c_${esc(p.dni)}" autocomplete="off"></div><div><label>${modo==='previo'?'Fecha real de ingreso':'Fecha de ingreso'}</label><input type="date" id="i_${esc(p.dni)}" value="${modo==='previo'?'':R.fecha}"></div></div>
   <div class="row" style="margin-top:10px"><button class="btn pri" onclick="reingreso('${esc(p.dni)}')">${modo==='previo'?'Registrar':'Ingresar'}</button></div>`}</div>`}).join('')}
  ${DB.patients[q]?'':`<div class="card"><h2>Paciente nuevo</h2><div class="grid w2"><div><label>DNI / CE</label><input id="nDni" value="${isDoc?esc(q):''}" inputmode="numeric" autocomplete="off"></div>
   <div><label>Apellidos y nombres</label><input id="nNom" value="${isDoc?'':esc(up(q))}" autocomplete="off" autocapitalize="characters"></div></div>
   <div class="grid" style="margin-top:10px"><div><label>Edad</label><input id="nEdad" inputmode="numeric"></div><div><label>Sexo</label><select id="nSexo"><option value="">—</option><option value="M">Varón</option><option value="F">Mujer</option></select></div>
   <div><label>Cama</label><input id="nCama" autocomplete="off"></div><div><label>${modo==='previo'?'Fecha real de ingreso':'Fecha de ingreso'}</label><input type="date" id="nIng" value="${modo==='previo'?'':R.fecha}"></div></div>
   <div class="row" style="margin-top:12px"><button class="btn pri" onclick="createPatient()">${modo==='previo'?'Registrar y subir evolución →':'Registrar y hacer nota de ingreso →'}</button><button class="btn" onclick="go('censo')">Cancelar</button></div></div>`}`;
}
function createPatient(){const dni=$('#nDni').value.trim().replace(/\s/g,''),nom=up($('#nNom').value).trim().replace(/\s+/g,' ');
  if(!/^[0-9A-Za-z]{6,12}$/.test(dni))return toast('Ingresa un DNI/CE válido');if(!nom)return toast('Ingresa apellidos y nombres');if(DB.patients[dni])return toast('Ese DNI ya existe; búscalo arriba');
  const ing=$('#nIng').value;if(!ing)return toast('Ingresa la fecha de ingreso');
  DB.patients[dni]={dni,nombre:nom,edad:$('#nEdad').value.trim(),sexo:$('#nSexo').value,natural:'',procedencia:'',instruccion:'',ocupacion:'',civil:'',religion:'',updated:Date.now()};
  if(ing>R.fecha)return toast('La fecha de ingreso no puede ser posterior a la fecha de trabajo');const pv=R.modo==='previo';const h=newHosp(dni,$('#nCama').value,ing,pv);save();if(pv)go('importEv',{hid:h.id,first:true});else go('ingreso',{hid:h.id})}
function reingreso(dni){const ing=$('#i_'+dni).value;if(!ing)return toast('Ingresa la fecha de ingreso');const prev=hospsOf(dni)[0];
  const pv=R.modo==='previo';const h=newHosp(dni,$('#c_'+dni).value,ing,pv);if(prev)h.ing.ant=clone(prev.ing.ant);
  save();if(pv)go('importEv',{hid:h.id,first:true});else go('ingreso',{hid:h.id})}

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
   <div class="muted">DNI ${esc(p.dni)} · Ingreso ${fmtD(h.ingreso)} · ${previo?'<b>Datos de recepción</b> (ya hospitalizado: sin nota de ingreso)':'Nota de ingreso '+(g.estado==='completa'?'completa':'en borrador')}</div></div></div></div></div>
   <div class="tabs" style="position:sticky;top:calc(env(safe-area-inset-top) + 58px);z-index:5;background:var(--bg);padding:6px 0">${TABS.filter(([k])=>k!=='chk').map(([k,l],i)=>`<button onclick="document.getElementById('s-${k}').scrollIntoView({behavior:'smooth'})">${i+1}. ${l}</button>`).join('')}</div>`;
  let body='';const S=k=>TABS.some(([t])=>t===k);const anc=k=>`<div id="s-${k}" style="scroll-margin-top:70px"></div>`;
  if(S('fil'))body+=anc('fil')+`<div class="card"><h3>Filiación</h3><div class="grid w2">${F('pat.nombre','Apellidos y nombres','data-up')}${F('h.cama','Cama','data-up')}</div>
   <div class="grid" style="margin-top:10px">${F('pat.edad','Edad',NUM)}<div><label>Sexo</label><select data-p="pat.sexo"><option value="">—</option><option value="M" ${p.sexo==='M'?'selected':''}>Varón</option><option value="F" ${p.sexo==='F'?'selected':''}>Mujer</option></select></div>
   ${F('pat.natural','Natural de','data-up')}${F('pat.procedencia','Procedente de','data-up')}${F('pat.instruccion','Grado de instrucción','data-up placeholder="SUPERIOR COMPLETO"')}${F('pat.ocupacion','Ocupación','data-up')}
   ${F('pat.civil','Estado civil','data-up')}${F('pat.religion','Religión','data-up')}</div>
   <div class="grid w2" style="margin-top:10px">${F('basal','Estado basal','data-up')}${F('servicio','Ingresa procedente de','data-up placeholder="SERVICIO DE MEDICINA INTERNA / EMERGENCIA"')}</div>
   <div style="margin-top:10px">${F('disp','Dispositivos / O2','data-up')}</div><div class="muted" style="margin-top:10px">Vista: <span id="filprev"></span></div></div>`;
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
const EV_TABS=[['cambio','¿Qué cambió?'],['visita','Visita'],['nota','Nota']];
function vEvol(){
  const e=DB.evols[R.eid];if(!e){R.v='censo';return vCenso()}const h=DB.hosps[e.hid],p=P(h.dni),prev=e.prevId&&DB.evols[e.prevId];
  const tab=R.tab||(e.estado==='borrador'?'cambio':e.estado==='visita'?'visita':'nota');
  CUR={root:e,hid:h.id,dni:h.dni,fecha:e.fecha,preview(){e.texto=evolText(e);const el=$('#prev');if(el)el.textContent=e.texto},
    async click(a,d){
      if(a==='exEdit'){e.exChg[d.k]=true;rerender()}
      else if(a==='exReset'){e.ex[d.k]=DB.settings.ex[d.k];e.exChg[d.k]=true;save();rerender()}
      else if(a==='dxAdd'){e.dx.push({t:'',estado:'ESTABLE',a:'',p:''});save();rerender()}
      else if(a==='dxDel'){const x=e.dx[+d.i];if(x.t&&!await ask('¿Quitar “'+x.t+'”? Si se resolvió, mejor marca RESUELTO.'))return;e.dx.splice(+d.i,1);save();rerender()}
      else if(a==='detect'){const n=detectPend(h,e.dx.map(x=>x.p).join('\n')+'\n'+e.Pextra);save();toast(n?n+' pendiente(s) agregado(s)':'Nada nuevo detectado');rerender()}
      else if(a==='copy'){copyText(evolText(e)).then(ok=>toast(ok?'Evolución copiada':'No se pudo copiar'))}
      else if(a==='estado'){e.estado=d.to;if(d.to==='final')e.closedAt=Date.now();e.texto=evolText(e);save();toast(d.to==='visita'?'Modo visita: ajusta plan, indicaciones y pendientes':'Evolución cerrada. Entra en el TXT del día');go('evol',{eid:e.id,hid:h.id,tab:d.to==='visita'?'visita':'nota'})}},
    mount(){bar(`<button class="btn" onclick="go('hosp',{hid:'${h.id}'})">← Paciente</button>`+(e.estado==='borrador'?`<button class="btn pri" data-act="estado" data-to="visita" onclick="CUR.click('estado',{to:'visita'})">Pasar a visita →</button>`:
      `<button class="btn pri" onclick="CUR.click('estado',{to:'final'})">${e.estado==='final'?'✓ Final (actualizar)':'Cerrar evolución'}</button>`))}};
  const head=`<div class="card"><div class="pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">${esc(p.nombre)}</div>
   <div class="muted">DNI ${esc(p.dni)} · <b>DH ${dh(h,e.fecha)}</b> · ${fmtD(e.fecha)} · ${{borrador:'Borrador',visita:'Post-visita',final:'Final'}[e.estado]}</div></div></div>
   <div style="width:120px"><label>Hora</label><input type="time" data-p="hora" value="${esc(e.hora)}"></div></div>
   ${prev&&prev.texto?`<details style="margin-top:10px"><summary>Evolución anterior (${fmtD(prev.fecha)})</summary><pre class="note">${esc(prev.texto)}</pre></details>`:''}</div>
   <div class="tabs">${EV_TABS.map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(tab==='cambio'){const labs=h.labs.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).filter(l=>l.fecha<=e.fecha);
    body=`<div class="card"><h3>Funciones vitales de hoy</h3>${fvFields('fv')}</div>
    <div class="card"><h3>S · Subjetivo</h3><textarea data-p="S" rows="3" placeholder="Vacío = “PACIENTE SIN MOLESTIAS NUEVAS.”">${esc(e.S)}</textarea></div>
    <div class="card"><h3>O · Examen físico</h3><p class="muted" style="margin-top:0">Viene de ayer. Toca “Cambió” solo en lo que sea distinto.</p>
     ${Object.keys(EXLBL).map(k=>`<div class="exrow ${e.exChg[k]?'chg':''}"><div class="hd"><b style="font-size:14px">${EXLBL[k]}</b><div class="row">${e.exChg[k]?`<button class="link" data-act="exReset" data-k="${k}">↺ Normal</button>`:`<button class="btn sm" data-act="exEdit" data-k="${k}">Cambió</button>`}</div></div>
      ${e.exChg[k]?`<textarea data-p="ex.${k}" rows="2">${esc(e.ex[k]||'')}</textarea>`:`<div class="tx">${esc(e.ex[k]||'—')}</div>`}</div>`).join('')}</div>
    <div class="card"><h3>Exámenes auxiliares</h3><p class="muted" style="margin-top:0">Marcados = entran en la nota de hoy (por defecto, los nuevos desde ${fmtD(prevRef(e))}).</p>
     ${labs.map(l=>`<label class="chkl"><input type="checkbox" data-labsel="${l.id}" ${labSelected(e,l)?'checked':''}><span><b>${fmtD(l.fecha)} · ${AREAS[l.area]}</b><br><span class="muted">${esc(sortItems(l.items).map(itemTxt).join(', '))}</span></span></label>`).join('')||'<div class="muted">Sin resultados.</div>'}
     <button class="btn pri" style="margin-top:10px" onclick="go('labs',{hid:'${h.id}',back:'evol'})">Importar análisis</button></div>`}
  if(tab==='visita')body=`<div class="card"><h3>Problemas · A y P</h3>${e.dx.map((x,i)=>`<div class="dx"><div class="hd"><span class="num">${i+1}.</span><input data-p="dx.${i}.t" data-up value="${esc(x.t)}" placeholder="Problema" autocomplete="off"><button class="btn sm bad" data-act="dxDel" data-i="${i}">✕</button></div>
     <div class="grid w2" style="margin-top:8px"><div><label>Evolución</label><select data-p="dx.${i}.estado">${DXEST.map(s=>`<option ${x.estado===s?'selected':''}>${s}</option>`).join('')}</select></div>${F('dx.'+i+'.a','Comentario (A)','data-up')}</div>
     <div style="margin-top:8px">${F('dx.'+i+'.p','Plan para este problema (P)','data-up')}</div></div>`).join('')}
     <button class="btn sm" data-act="dxAdd">+ Agregar problema</button>
     <div style="margin-top:12px">${TA('Aextra','A adicional (opcional)',2)}</div><div style="margin-top:8px">${TA('Pextra','Plan general',3)}</div>
     <div class="row" style="margin-top:8px"><button class="btn sm" data-act="detect">Detectar pendientes en el plan</button></div></div>
    <div class="card"><h3>Indicaciones</h3><p class="muted" style="margin-top:0">La fecha es el inicio: la nota muestra el día de tratamiento (D3).</p>${indEditor('ind')}</div>
    <div class="card"><h3>Pendientes del paciente</h3>${pendEditor(h)}</div>`;
  if(tab==='nota')body=`<div class="card"><h3>Evolución</h3><pre class="note" id="prev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" data-act="copy">Copiar</button><span class="sp"></span><button class="btn bad sm" onclick="delEvol('${e.id}')">Eliminar evolución</button></div></div>`;
  return head+body;
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
    else if(a==='saveLabs'){const rows=S.rows.filter(r=>r.on&&r.v.trim()&&r.fecha);if(!rows.length)return toast('Nada que guardar');
      rows.forEach(r=>{const area=LABMAP[r.k]?LABMAP[r.k].a:'OTROS';let L=h.labs.find(l=>l.fecha===r.fecha&&l.area===area);if(!L){L={id:uid(),fecha:r.fecha,area,items:[],created:Date.now()};h.labs.push(L)}
        const it=L.items.find(i=>i.k===r.k);if(it)it.v=up(r.v);else L.items.push({k:r.k,v:up(r.v)})});
      h.updated=Date.now();save();toast(rows.length+' resultados guardados');LABSTATE={text:'',rows:null,unk:[],fecha:S.fecha,busy:''};
      if(R.back==='evol'){const e=evolOn(h.id,R.fecha);if(e)return go('evol',{eid:e.id,hid:h.id,tab:'cambio'})}if(R.back==='ingreso')return go('ingreso',{hid:h.id,tab:'res'});go('hosp',{hid:h.id})}
    else if(a==='delLab'){if(!await ask('¿Eliminar estos resultados?'))return;h.labs=h.labs.filter(l=>l.id!==d.id);save();rerender()}
    else if(a==='back'){if(R.back==='evol'){const e=evolOn(h.id,R.fecha);if(e)return go('evol',{eid:e.id,hid:h.id,tab:'cambio'})}if(R.back==='ingreso')return go('ingreso',{hid:h.id,tab:'res'});go('hosp',{hid:h.id})}},
    mount(){$('#lfotos').onchange=ev=>ocrFiles([...ev.target.files]);$('#lpdf').onchange=ev=>pdfFiles([...ev.target.files]);
      const t=$('#ltext');t.oninput=()=>{S.text=t.value};const f=$('#lfecha');f.onchange=()=>{S.fecha=f.value}}};
  const opts=LABDEF.map(d=>`<option value="${d[0]}">${d[1]} · ${AREAS[d[2]]}</option>`).join('');
  const existing=h.labs.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return `<div class="card"><div class="pt"><div><div class="nm">Análisis · ${esc(p.nombre)}</div><div class="muted">Cama ${esc(h.cama||'—')} · DNI ${esc(p.dni)}</div></div><button class="btn" data-act="back">← Volver</button></div></div>
  <div class="card"><h3>1 · Traer el texto</h3>
   <div class="row"><label class="btn" style="margin:0;color:var(--ink);font-size:16px">📷 Leer fotos<input id="lfotos" type="file" accept="image/*" multiple style="display:none"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px">📄 Subir PDF<input id="lpdf" type="file" accept="application/pdf" multiple style="display:none"></label>
   <span class="muted">o pega el texto abajo</span></div>
   <div id="lbusy" class="muted" style="margin-top:8px">${esc(S.busy)}</div><div class="prog" ${S.busy?'':'hidden'}><i id="lprog"></i></div>
   <div class="grid" style="margin-top:10px"><div><label>Fecha si el texto no trae fecha</label><input id="lfecha" type="date" value="${S.fecha}"></div></div>
   <textarea id="ltext" rows="8" style="margin-top:10px" placeholder="Pega aquí los resultados (de Texto en vivo, PDF o la respuesta de Claude)…">${esc(S.text)}</textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-act="parse">Procesar</button><button class="btn" data-act="clear">Limpiar</button><span class="sp"></span><button class="btn sm" data-act="claude">Copiar para Claude (sin nombre/DNI)</button></div></div>
  ${S.rows?`<div class="card"><h3>2 · Revisar (${S.rows.length})</h3>${S.rows.length?`<table class="rev"><tr><th></th><th>Fecha</th><th>Examen</th><th>Valor</th></tr>
   ${S.rows.map((r,i)=>`<tr><td><input type="checkbox" ${r.on?'checked':''} onchange="LABSTATE.rows[${i}].on=this.checked"></td><td><input type="date" value="${r.fecha}" onchange="LABSTATE.rows[${i}].fecha=this.value"></td>
    <td><select onchange="LABSTATE.rows[${i}].k=this.value">${opts.replace(`value="${r.k}"`,`value="${r.k}" selected`)}</select></td><td><input value="${esc(r.v)}" oninput="LABSTATE.rows[${i}].v=this.value"></td></tr>`).join('')}</table>
   <div class="row" style="margin-top:10px"><button class="btn pri" data-act="saveLabs">Guardar resultados</button></div>`:'<div class="muted">Nada reconocido.</div>'}
   ${S.unk.length?`<details style="margin-top:10px"><summary>Líneas no reconocidas (${S.unk.length})</summary><pre class="note">${esc(S.unk.join('\n'))}</pre><p class="muted">Si ahí hay resultados, usa “Copiar para Claude” y pega su respuesta en el cuadro; luego Procesar.</p></details>`:''}</div>`:''}
  <div class="card"><h3>Resultados guardados</h3>${existing.map(l=>`<div class="pt" style="border-bottom:1px solid var(--line);padding:8px 0"><div><b>${fmtD(l.fecha)} · ${AREAS[l.area]}</b><div class="muted">${esc(sortItems(l.items).map(itemTxt).join(', '))}</div></div><button class="btn sm bad" data-act="delLab" data-id="${l.id}">✕</button></div>`).join('')||'<div class="muted">Ninguno.</div>'}</div>`;
}
function setBusy(msg,frac){LABSTATE.busy=msg;const b=$('#lbusy');if(b)b.textContent=msg;const pr=$('#lprog');if(pr){pr.parentNode.hidden=!msg;pr.style.width=Math.round((frac||0)*100)+'%'}}
function appendText(t){const ta=$('#ltext');LABSTATE.text=(LABSTATE.text?LABSTATE.text+'\n':'')+t;if(ta)ta.value=LABSTATE.text}
let OCRW=null;
async function ocrWorker(){if(OCRW)return OCRW;await loadScript('lib/tesseract.min.js');
  OCRW=await Tesseract.createWorker('spa',1,{workerPath:absURL('lib/worker.min.js'),corePath:absURL('lib/core'),langPath:absURL('lib/lang'),gzip:true,
    logger:m=>{if(m.status==='recognizing text')setBusy('Leyendo… '+Math.round(m.progress*100)+'%',m.progress)}});
  await OCRW.setParameters({preserve_interword_spaces:'1'});return OCRW}
async function ocrFiles(files){if(!files.length)return;try{setBusy('Preparando lector de fotos (la primera vez tarda un poco)…',0.02);const w=await ocrWorker();
  for(let i=0;i<files.length;i++){setBusy('Leyendo foto '+(i+1)+' de '+files.length+'…',i/files.length);const r=await w.recognize(files[i]);appendText(r.data.text)}
  setBusy('',0);toast('Texto leído. Revisa y toca Procesar');$('#ltext')?.focus()}catch(e){setBusy('',0);toast('No se pudo leer la foto: '+e.message)}}
async function pdfFiles(files){if(!files.length)return;try{setBusy('Abriendo PDF…',0.05);await loadScript('lib/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc=absURL('lib/pdf.worker.min.js');
  for(const f of files){const doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
    for(let i=1;i<=doc.numPages;i++){setBusy('Leyendo '+f.name+' · página '+i+'/'+doc.numPages,i/doc.numPages);const pg=await doc.getPage(i);const tc=await pg.getTextContent();
      if(tc.items.filter(x=>x.str.trim()).length<5){const vp=pg.getViewport({scale:2});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
        const w=await ocrWorker();const r=await w.recognize(cv);appendText(r.data.text);continue}
      const rows={};tc.items.forEach(it=>{if(!it.str.trim())return;const y=Math.round(it.transform[5]/3);(rows[y]=rows[y]||[]).push(it)});
      appendText(Object.keys(rows).map(Number).sort((a,b)=>b-a).map(y=>rows[y].sort((a,b)=>a.transform[4]-b.transform[4]).map(it=>it.str).join(' ')).join('\n'))}}
  setBusy('',0);toast('PDF leído. Revisa y toca Procesar')}catch(e){setBusy('',0);toast('No se pudo leer el PDF: '+e.message)}}

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
  CUR={root:a,hid:h.id,dni:h.dni,fecha:a.fecha,preview(){const o=$('#oprev');if(o)o.textContent=ordenText(h);const ep=$('#eprev');if(ep)ep.textContent=epicrisisData(h)},
    onField(path){if(path==='dm'||path==='h.citt')rerender()},
    async click(act){
      if(act==='confirm'){const fl=a.ind.filter(x=>x.flag).length;if(fl&&!await ask(fl+' indicación(es) en amarillo sin revisar. ¿Confirmar el alta igual?'))return;a.confirmed=true;save();toast('Alta confirmada. El paciente sale del censo');go('censo')}
      else if(act==='cancel'){if(!await ask('¿Anular el alta? Se borran los datos de alta de este paciente.'))return;h.alta=null;save();go('hosp',{hid:h.id})}
      else if(act==='reopen'){a.confirmed=false;save();rerender();toast('De vuelta en el censo')}
      else if(act==='word'){a.chk['ORDEN DE ALTA']=true;save();exportOrdenes(null,[h]);rerender()}
      else if(act==='copyO'){copyText(ordenText(h)).then(o=>toast(o?'Orden copiada':'No se pudo copiar'))}
      else if(act==='copyE'){copyText(epicrisisData(h)).then(o=>toast(o?'Datos copiados':'No se pudo copiar'))}
      else if(act==='claudeE'){copyText('Con estos datos redacta en MAYÚSCULAS un resumen breve de la evolución durante la hospitalización para una epicrisis (no inventes datos):\n\n'+epicrisisData(h)).then(o=>toast(o?'Copiado sin nombre/DNI. Pégalo en Claude':'No se pudo copiar'))}
      else if(act==='reimport'){if(!await ask('¿Reemplazar las indicaciones para casa por las de la última evolución?'))return;const f=a.fecha;const keep={control:a.control,dm:a.dm,citt:a.citt,chk:a.chk};startAlta(h,f);Object.assign(h.alta,keep);save();rerender()}},
    mount(){bar(`<button class="btn" onclick="go('hosp',{hid:'${h.id}'})">← Paciente</button>`+(a.confirmed?`<button class="btn" onclick="CUR.click('reopen')">Volver al censo</button>`:`<button class="btn pri" onclick="CUR.click('confirm')">Confirmar alta</button>`))}};
  const chk=altaChecklist(h);
  return `<div class="card"><div class="pt"><div style="display:flex;align-items:center"><span class="cama">${esc(h.cama||'—')}</span><div><div class="nm">Alta · ${esc(p.nombre)}</div>
   <div class="muted">DNI ${esc(p.dni)} · Ingreso ${fmtD(h.ingreso)} · ${a.confirmed?'<b>Alta confirmada</b>':'Alta en proceso'}</div></div></div><button class="btn bad sm" data-act="cancel">Anular alta</button></div>
   <div class="grid" style="margin-top:10px"><div><label>Fecha de egreso</label><input type="date" data-p="fecha" value="${a.fecha}"></div></div></div>
  <div class="card"><h3>Checklist de alta</h3>${chk.map(c=>`<label class="chkl ${a.chk[c]?'done':''}"><input type="checkbox" data-chk="${esc(c)}" data-scope="alta" data-hid="${h.id}" ${a.chk[c]?'checked':''}><span>${esc(c)}</span></label>`).join('')}
   <div class="grid w2" style="margin-top:10px"><div><label>Descanso médico hasta</label><input type="date" data-p="dm" value="${esc(a.dm)}"></div><div style="align-self:end"><label class="chk"><input type="checkbox" data-p="h.citt" ${h.citt?'checked':''}> Requiere CITT</label></div></div></div>
  <div class="card"><h3>Diagnósticos de egreso</h3>${TA('dx','Uno por línea (se numeran solos)',5)}</div>
  <div class="card"><h3>Indicaciones para casa</h3>${indEditor('h.alta.ind',{fi:false,alta:true})}
   <div class="row" style="margin-top:8px"><button class="btn sm" data-act="reimport">Volver a traer de la última evolución</button></div>
   <div style="margin-top:12px">${F('control','Control')}</div></div>
  <div class="card"><h3>Orden de alta</h3><pre class="note" id="oprev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" data-act="word">Word (formato del servicio)</button><button class="btn" data-act="copyO">Copiar texto</button></div></div>
  <div class="card"><details><summary>Datos para epicrisis</summary><pre class="note" id="eprev"></pre>
   <div class="row" style="margin-top:10px"><button class="btn" data-act="copyE">Copiar</button><button class="btn" data-act="claudeE">Copiar para resumir con Claude</button></div>
   <p class="muted">No incluye nombre ni DNI. Cuando tengas el modelo de epicrisis e informe de alta, se genera el documento completo.</p></details></div>`;
}

/* ---- Pacientes ---- */
function vPacientes(){const q=deacc(R.q||'');CUR={root:null};
  const ps=Object.values(DB.patients).filter(p=>!q||p.dni.includes(q)||deacc(p.nombre).includes(q)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return `<div class="card"><h2>Pacientes (${Object.keys(DB.patients).length})</h2><input id="pq" placeholder="Buscar por DNI o apellidos" value="${esc(R.q||'')}" oninput="R.q=this.value;const c=this.selectionStart;render();const i=$('#pq');i.focus();i.setSelectionRange(c,c)"></div>
  ${ps.map(p=>{const hs=hospsOf(p.dni),act=hs.find(h=>!(h.alta&&h.alta.confirmed));return `<div class="card pt" style="cursor:pointer" onclick="go('paciente',{dni:'${esc(p.dni)}'})"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)} · ${hs.length} hospitalización(es)</div></div>${act?'<span class="badge b-ok">En censo · '+esc(act.cama)+'</span>':'<span class="badge b-alta">De alta</span>'}</div>`}).join('')||'<div class="card muted">Sin resultados.</div>'}`}
function vPaciente(){const p=DB.patients[R.dni];if(!p){R.v='pacientes';return vPacientes()}const hs=hospsOf(p.dni);CUR={root:p,dni:p.dni};
  return `<div class="card"><h2>${esc(p.nombre)}</h2><div class="muted">DNI ${esc(p.dni)}${pLine(p)?' · '+esc(pLine(p)):''}</div>
   <div class="row" style="margin-top:10px"><span class="sp"></span><button class="btn bad sm" onclick="delPatient('${esc(p.dni)}')">Eliminar paciente</button></div></div>
   ${hs.map(h=>{const ev=evolsOf(h.id);return `<div class="card"><div class="pt"><div><b>Hospitalización ${fmtD(h.ingreso)}${h.alta?' – '+fmtD(h.alta.fecha):''}</b> · cama ${esc(h.cama||'—')}</div>
    <div class="row"><button class="btn sm pri" onclick="go('hosp',{hid:'${h.id}'})">Abrir</button><button class="btn sm" onclick="go('ingreso',{hid:'${h.id}'})">Ingreso</button>${h.alta?`<button class="btn sm" onclick="go('alta',{hid:'${h.id}'})">Alta</button>`:''}<button class="btn sm bad" onclick="delHosp('${h.id}')">Eliminar</button></div></div>
    ${ev.map(e=>`<details style="margin-top:8px"><summary>${fmtD(e.fecha)} · DH ${dh(h,e.fecha)} · ${e.estado}</summary><pre class="note">${esc(e.texto||evolText(e))}</pre>
     <div class="row" style="margin-top:8px"><button class="btn sm" onclick="R.fecha='${e.fecha}';go('evol',{eid:'${e.id}',hid:'${h.id}'})">Abrir</button><button class="btn sm" onclick="copyText(DB.evols['${e.id}'].texto||evolText(DB.evols['${e.id}'])).then(o=>toast(o?'Copiada':'Error'))">Copiar</button></div></details>`).join('')||'<div class="muted" style="margin-top:6px">Sin evoluciones.</div>'}</div>`}).join('')}`}
async function delHosp(hid,toCenso){const n=evolsOf(hid).length;if(!await ask('¿Eliminar esta hospitalización con su ingreso, '+n+' evolución(es), labs, pendientes y alta?'))return;evolsOf(hid).forEach(e=>delete DB.evols[e.id]);delete DB.hosps[hid];save();if(toCenso)go('censo');else rerender();toast('Hospitalización eliminada')}
async function delPatient(dni){if(!await ask('¿Eliminar a '+P(dni).nombre+' con TODAS sus hospitalizaciones? No se puede deshacer.'))return;hospsOf(dni).forEach(h=>{evolsOf(h.id).forEach(e=>delete DB.evols[e.id]);delete DB.hosps[h.id]});delete DB.patients[dni];save();go('pacientes',{q:''});toast('Paciente eliminado')}

/* ---- Ajustes ---- */
function vAjustes(){const s=DB.settings;CUR={root:s,click(a){
    if(a==='saveAll'){s.autor=up($('#sAutor').value.trim());s.control=up($('#sCtrl').value.trim());Object.keys(EXLBL).forEach(k=>s.ex[k]=up($('#sx_'+k).value.trim()));
      s.chkIng=lines(up($('#sChkI').value));s.chkAlta=lines(up($('#sChkA').value));s.chkVis=lines(up($('#sChkV').value));s.catalog=[...new Set(lines(up($('#sCat').value)))];save();toast('Ajustes guardados')}
    else if(a==='resetEx'){Object.keys(EXDEF).forEach(k=>$('#sx_'+k).value=EXDEF[k])}}};
  let bytes=0;try{bytes=(localStorage.getItem(KEY)||'').length*2}catch(e){}
  return `<div class="card"><h3>Datos del médico y servicio</h3><div class="grid w2"><div><label>Autor (va bajo el título de la nota)</label><input id="sAutor" value="${esc(s.autor)}" placeholder="MR APELLIDO"></div><div><label>Control al alta (por defecto)</label><input id="sCtrl" value="${esc(s.control)}"></div></div></div>
  <div class="card"><h3>Examen físico normal</h3>${Object.keys(EXLBL).map(k=>`<label style="margin-top:8px">${EXLBL[k]}</label><textarea id="sx_${k}" rows="2">${esc(s.ex[k])}</textarea>`).join('')}<button class="btn sm" style="margin-top:8px" data-act="resetEx">Restaurar por defecto</button></div>
  <div class="card"><h3>Checklists</h3><div class="grid w2"><div><label>Ingreso (uno por línea)</label><textarea id="sChkI" rows="5">${esc(s.chkIng.join('\n'))}</textarea></div><div><label>Alta (uno por línea; DM y CITT se agregan solos si aplican)</label><textarea id="sChkA" rows="6">${esc(s.chkAlta.join('\n'))}</textarea></div>
   <div><label>Cada visita / día (uno por línea; CITT se agrega si el paciente lo requiere)</label><textarea id="sChkV" rows="3">${esc((s.chkVis||[]).join('\n'))}</textarea></div></div></div>
  <div class="card"><h3>Catálogo de indicaciones (${s.catalog.length})</h3><p class="muted" style="margin-top:0">Una por línea. Lo nuevo que escribes en las indicaciones se agrega solo.</p><textarea id="sCat" rows="10">${esc(s.catalog.join('\n'))}</textarea></div>
  <div class="row" style="margin-bottom:12px"><button class="btn pri" data-act="saveAll">Guardar ajustes</button></div>
  <div class="card"><h3>Respaldo</h3><p class="muted" style="margin-top:0">Todo vive solo en este iPad. Último respaldo: ${s.lastBackup?new Date(s.lastBackup).toLocaleString('es-PE'):'nunca'} · ${(bytes/1024).toFixed(0)} KB</p>
   <div class="row"><button class="btn pri" onclick="exportBackup()">Exportar respaldo</button><label class="btn" style="margin:0;color:var(--ink);font-size:16px">Importar respaldo<input type="file" accept=".json,application/json" style="display:none" onchange="importBackup(this.files[0])"></label></div></div>
  <div class="card"><h3>Zona de riesgo</h3><button class="btn bad" onclick="wipe()">Borrar todos los datos</button></div>
  <p class="muted">Evol Reuma v1.3 · Lector de fotos: Tesseract.js · Lector de PDF: pdf.js (ambos funcionan sin internet una vez usados). Las plantillas son editables: valídalas con el servicio.</p>`}
async function wipe(){if(!await ask('¿Borrar TODOS los datos de Evol Reuma en este iPad?')||!await ask('Confirma de nuevo: no se puede deshacer.'))return;const s=DB.settings;DB=blank();DB.settings=Object.assign(s,{lastBackup:null});save();go('censo')}

/* =====================================================================
   EXPORTAR
   ===================================================================== */
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
    if(h.alta&&h.alta.fecha===f)S.push('──── ORDEN DE ALTA ────',ordenText(h),'');S.push('')});
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
