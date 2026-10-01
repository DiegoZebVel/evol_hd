'use strict';
/* =====================================================================
   HC Nefro — Historias clínicas de Nefrología (general / pulsos)
   Datos solo en este dispositivo (localStorage).
   ===================================================================== */
const KEY='hcNefro.v1';
const HOSP='HOSPITAL NACIONAL CARLOS ALBERTO SEGUIN ESCOBEDO';
const EXSEG=[['piel','PIEL Y FANERAS'],['cabeza','CABEZA'],['ojos','OJOS'],['oidos','OÍDOS'],['nariz','NARIZ'],['boca','BOCA'],['faringe','FARINGE'],['cuello','CUELLO'],['torax','TÓRAX'],['corazon','CORAZÓN'],['abdomen','ABDOMEN'],['gu','GENITOURINARIO'],['ext','COLUMNA Y EXTREMIDADES'],['neuro','NEUROLÓGICO']];
const EXDEF={piel:'PIEL TIBIA, TURGOR Y ELASTICIDAD CONSERVADOS, LLENADO CAPILAR < 2 SEG, TEJIDO CELULAR SUBCUTÁNEO EN REGULAR CANTIDAD, SIGNO DEL PLIEGUE NEGATIVO, UÑAS CONVEXAS, EN REGULAR ESTADO DE CONSERVACIÓN E HIGIENE.',
 cabeza:'NORMOCÉFALO, NO SOLUCIONES DE CONTINUIDAD NI TUMORACIONES.',ojos:'SIMÉTRICOS, MÓVILES, CONJUNTIVAS ROSADAS, ESCLERAS LIMPIAS, PUPILAS ISOCÓRICAS FOTORREACTIVAS.',
 oidos:'PABELLONES AURICULARES DE ADECUADA IMPLANTACIÓN. CAE PERMEABLE.',nariz:'FOSAS NASALES PERMEABLES, TABIQUE CENTRAL, MUCOSA ROSADA. SENOS PARANASALES NO DOLOROSOS.',
 boca:'LABIOS HÚMEDOS, MUCOSA ORAL HÚMEDA, LENGUA CENTRAL, ENCÍAS ROSADAS, PIEZAS DENTALES EN REGULAR ESTADO DE CONSERVACIÓN E HIGIENE.',faringe:'NO CONGESTIVA, SIN PLACAS NI DESCARGA POSTERIOR.',
 cuello:'CILÍNDRICO, SIMÉTRICO, NO SE PALPAN NÓDULOS NI ADENOPATÍAS.',torax:'SIMÉTRICO, MÓVIL CON LA RESPIRACIÓN, MV PASA BIEN EN ACP, NO RUIDOS AGREGADOS.',
 corazon:'RUIDOS CARDIACOS RÍTMICOS Y NORMOFONÉTICOS, NO SOPLOS. PULSOS PERIFÉRICOS CONSERVADOS EN 4 EXTREMIDADES.',abdomen:'BLANDO, DEPRESIBLE, RHA PRESENTES, NO DOLOROSO, NO SIGNOS DE REACCIÓN PERITONEAL.',
 gu:'PUÑO PERCUSIÓN LUMBAR BILATERAL NO DOLOROSA, PUNTOS RENOURETERALES NEGATIVOS.',ext:'DANDY NEGATIVO, EXTREMIDADES MÓVILES Y SIMÉTRICAS. NO EDEMAS.',
 neuro:'LOTEP, GLASGOW 15/15. NO SIGNOS MENÍNGEOS NI DE FOCALIZACIÓN.'};
const EXGEN='PACIENTE EN REG, REN, REH, DESPIERTO, LOTEP, DECÚBITO DORSAL ACTIVO, COLABORA CON EL INTERROGATORIO.';
const FBK=[['orinas','ORINAS'],['heces','HECES'],['sed','SED'],['apetito','APETITO'],['sueno','SUEÑO']];
const ENFS=['DM','HTA','TBC','ASMA','LES'];
const TAMIZ=['HBSAG','ANTI-HBC TOTAL','ANTI-HBS','ANTI-VHC','VIH','VDRL / RPR','PPD / IGRA','BK EN ESPUTO','RX DE TÓRAX','PARASITOLÓGICO (STRONGYLOIDES)'];
// columnas de la tabla de laboratorio: id → {l: encabezado, k: claves del lector}
const COLDEF={LEU:{l:'LEUCO',k:['LEU']},HB:{l:'HB',k:['HB']},PLAQ:{l:'PLAQ',k:['PLAQ']},CREA:{l:'CREA',k:['CREA']},UREA:{l:'UREA',k:['UREA']},K:{l:'K',k:['K']},NA:{l:'NA',k:['NA']},
 KNA:{l:'K/NA',k:['K','NA']},RC:{l:'RECUENTO CELULAR',k:['RC']},PCR:{l:'PCR',k:['PCR']},COLEST:{l:'COLEST',k:['COLEST']},TRIG:{l:'TRIG',k:['TRIG']},PROT24:{l:'PROTEINURIA 24 H',k:['PROT24']},
 PGA:{l:'PROT/G/ALB',k:['PT','GLOB','ALB']},T4TSH:{l:'T4/TSH',k:['T4L','TSH']},PTHPCA:{l:'PTH/P/CA',k:['PTH','P','CA']},GLU:{l:'GLUCOSA',k:['GLU']},ALB:{l:'ALB',k:['ALB']},
 SEG:{l:'SEG',k:['SEG']},ABS:{l:'ABAST',k:['ABS']},AU:{l:'ÁC. ÚRICO',k:['AU']},MG:{l:'MG',k:['MG']},PCT:{l:'PCT',k:['PCT']},HBA1C:{l:'HBA1C',k:['HBA1C']},VSG:{l:'VSG',k:['VSG']},DHL:{l:'DHL',k:['DHL']},
 TGO:{l:'TGO/TGP',k:['TGO','TGP']},INR:{l:'INR',k:['INR']},MALB:{l:'MICROALB 24 H',k:['MALB']},DEPCR:{l:'DEP. CREAT',k:['DEPCR']},OHEM:{l:'HEMATÍES ORINA',k:['OHEM']},RPC:{l:'PROT/CREAT',k:['RPC']},FERR:{l:'FERRITINA',k:['FERR']}};
const PRESET={general:['LEU','HB','PLAQ','CREA','UREA','K','NA','RC','PCR'],pulso:['CREA','UREA','HB','LEU','KNA','COLEST','TRIG','PROT24','PGA','T4TSH','PTHPCA']};
const ORD=['PRIMER','SEGUNDO','TERCER','CUARTO','QUINTO','SEXTO','SÉPTIMO','OCTAVO','NOVENO','DÉCIMO','UNDÉCIMO','DUODÉCIMO'];
const MESES=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SETIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const PROC_CHIPS=['BIOPSIA RENAL','CVC PARA HEMODIÁLISIS','FAV','CATÉTER TENCKHOFF','HEMODIÁLISIS','DIÁLISIS PERITONEAL','PLASMAFÉRESIS','TRASPLANTE RENAL','BIOPSIA DE PIEL','ENDOSCOPÍA'];
const ESQ_CHIPS=['METILPREDNISOLONA 500 MG EV C/24H X 3 DÍAS','METILPREDNISOLONA 1 G EV C/24H X 3 DÍAS','+ CICLOFOSFAMIDA 500 MG EV','+ CICLOFOSFAMIDA 1 G EV','RITUXIMAB 1 G EV'];

let DB=load();
function blank(){return {patients:{},hcs:{},settings:{autor:'',ex:{...EXDEF},exGen:EXGEN,lastBackup:null}}}
function load(){try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r),b=blank();d.settings=Object.assign(b.settings,d.settings||{});d.settings.ex=Object.assign({...EXDEF},d.settings.ex||{});d.patients=d.patients||{};d.hcs=d.hcs||{};return d}}catch(e){}return blank()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('⚠️ No se pudo guardar: '+e.message)}}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});

/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const up=s=>String(s||'').toLocaleUpperCase('es');
function todayISO(){const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function fmtD(iso){if(!iso)return'';const[y,m,d]=iso.split('-');return d+'/'+m+'/'+y}
function dUTC(iso){const[y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)}
function days(a,b){return Math.round((dUTC(b)-dUTC(a))/864e5)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function dot(s){s=String(s||'').trim();return!s?'':/[.!?:]$/.test(s)?s:s+'.'}
function lines(s){return String(s||'').split('\n').map(x=>x.trim()).filter(Boolean)}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2300)}
function getP(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o)}
function setP(o,p,v){const ks=p.split('.');let a=o;ks.slice(0,-1).forEach(k=>{a[k]=a[k]??{};a=a[k]});a[ks[ks.length-1]]=v}
const clone=o=>JSON.parse(JSON.stringify(o));
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();return ok}}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('No se pudo cargar '+src));document.head.appendChild(s)})}
const absURL=p=>new URL(p,location.href).href;
function edad(fnac,ref){if(!fnac)return'';const[a,b,c]=fnac.split('-').map(Number),[x,y,z]=(ref||todayISO()).split('-').map(Number);let e=x-a;if(y<b||(y===b&&z<c))e--;return e>=0&&e<130?String(e):''}
function fechasPalabras(fi,ff){if(!fi)return'';const[a,b,c]=fi.split('-').map(Number);if(!ff||ff===fi)return pad(c)+' DE '+MESES[b-1]+' DEL '+a;const[x,y,z]=ff.split('-').map(Number);
  if(a===x&&b===y)return pad(c)+' AL '+pad(z)+' DE '+MESES[b-1]+' DEL '+a;return pad(c)+' DE '+MESES[b-1]+(a!==x?' DEL '+a:'')+' AL '+pad(z)+' DE '+MESES[y-1]+' DEL '+x}

/* ---------- modelos ---------- */
function newPatient(dni,nombre){return {dni,nombre,fnac:'',edad:'',sexo:'',natural:'',procedencia:'',ocupacion:'',civil:'',familiar:'',telefono:'',religion:'',grupo:'',
  ant:{parto:'NACIDO DE PARTO VAGINAL',inmun:'REFIERE INMUNIZACIONES COMPLETAS',covid:'',enf:{DM:'NO',HTA:'NO',TBC:'NO',ASMA:'NO',LES:'NO'},otras:'',quir:'',med:'',alerg:'NIEGA',transf:'',proc:[]},
  labs:[],pulsos:[],inmuno:[],tamiz:{},biopsia:{fecha:'',texto:''},informes:[],cols:{general:PRESET.general.slice(),pulso:PRESET.pulso.slice()},updated:Date.now()}}
function lastHC(dni,exceptId){return Object.values(DB.hcs).filter(h=>h.dni===dni&&h.id!==exceptId).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.created-a.created)[0]}
function newHC(dni,tipo){const prev=lastHC(dni);const f=todayISO();
  const hc={id:uid(),dni,tipo,fechaIng:f,fecha:f,ingresaPor:tipo==='pulso'?'CONSULTORIO EXTERNO':'EMERGENCIA',informante:'PACIENTE',elaborado:DB.settings.autor,
    tiempo:'',sintomas:'',hea:'',fb:{orinas:'CONSERVADAS',heces:'CONSERVADAS',sed:'CONSERVADA',apetito:'CONSERVADO',sueno:'CONSERVADO'},
    fv:{pa:'',fc:'',fr:'',sat:'',fio2:'0.21',t:'',peso:''},exGen:DB.settings.exGen,ex:{...DB.settings.ex},dx:'',pulsoId:null,created:Date.now(),updated:Date.now()};
  if(prev){hc.fb=clone(prev.fb);hc.ex=clone(prev.ex);hc.exGen=prev.exGen;hc.dx=prev.dx;hc.tiempo=prev.tiempo;hc.sintomas=tipo==='pulso'?'':prev.sintomas;hc.prevId=prev.id}
  if(tipo==='pulso'){const p=DB.patients[dni];const last=p.pulsos.slice().sort((a,b)=>(a.fi||'').localeCompare(b.fi||'')).pop();
    const np={id:uid(),fi:f,ff:'',esquema:last?last.esquema:'',cfm:last?last.cfm:'',nota:'',created:Date.now()};p.pulsos.push(np);hc.pulsoId=np.id}
  return hc}
function pulsosSorted(p){return p.pulsos.slice().sort((a,b)=>(a.fi||'9').localeCompare(b.fi||'9')||a.created-b.created)}
function ordinalOf(p,x){const i=pulsosSorted(p).findIndex(y=>y.id===x.id);return ORD[i]||((i+1)+'°')}
function pulsoTitle(p,x){return ordinalOf(p,x)+' PULSO'+(x.esquema.trim()?' DE '+up(x.esquema.trim()):'')}
function cfmTotal(p,hasta,incl){return pulsosSorted(p).filter(x=>x.fi&&(incl?x.fi<=hasta:x.fi<hasta)).reduce((s,x)=>s+(parseFloat(String(x.cfm).replace(',','.'))||0),0)}

/* ---------- tabla de labs ---------- */
function cellVal(L,col){return COLDEF[col].k.map(k=>L.items[k]||'').every(v=>!v)?'':COLDEF[col].k.map(k=>L.items[k]||'').join('/').replace(/^\/+|\/+$/g,'')}
function labRows(p,hc){const cols=p.cols[hc.tipo];const asc=hc.tipo==='pulso';
  const R=[];p.labs.filter(l=>l.fecha<=hc.fecha).forEach(l=>{const cells=cols.map(c=>cellVal(l,c));if(cells.some(Boolean)||(l.nota||'').trim())R.push({t:'lab',fecha:l.fecha,cells,nota:(l.nota||'').trim(),ord:l.fecha+'0'})});
  p.pulsos.filter(x=>x.fi&&x.fi<=hc.fecha).forEach(x=>{const act=x.id===hc.pulsoId;R.push({t:'pulso',fecha:x.ff||x.fi,txt:pulsoTitle(p,x)+(act?' (ACTUAL)':''),sub:fechasPalabras(x.fi,x.ff)+(x.cfm?' · CFM '+x.cfm+' MG':'')+(x.nota.trim()?' · '+up(x.nota.trim()):''),ord:(x.ff||x.fi)+'1'})});
  R.sort((a,b)=>a.ord.localeCompare(b.ord));if(!asc)R.reverse();return {cols:cols.map(c=>COLDEF[c].l),rows:R}}
function outOfCols(p,hc){const ks=new Set(p.cols[hc.tipo].flatMap(c=>COLDEF[c].k));const o=new Set();p.labs.forEach(l=>Object.keys(l.items).forEach(k=>{if(l.items[k]&&!ks.has(k)&&LABMAP[k]&&LABMAP[k].a!=='INMUNO')o.add(k)}));return [...o]}
function suggestCol(k){return Object.keys(COLDEF).find(c=>COLDEF[c].k.includes(k))}

/* ---------- documento (bloques → Word y TXT) ---------- */
function docBlocks(hc){
  const p=DB.patients[hc.dni],A=p.ant,B=[];const T=(t)=>B.push({t:'h',x:t});
  B.push({t:'title',x:'HISTORIA CLÍNICA'});T('FILIACIÓN:');
  B.push({t:'kv',rows:[['Apellidos y Nombres',p.nombre],['DNI',p.dni],['Edad',(p.edad||edad(p.fnac,hc.fecha))?((p.edad||edad(p.fnac,hc.fecha))+' AÑOS'):''],['Sexo',p.sexo],['Fecha de Nacimiento',fmtD(p.fnac)],['Natural de',p.natural],['Procedente de',p.procedencia],
    ['Ocupación',p.ocupacion],['Estado Civil',p.civil],['Familiar responsable',p.familiar],['Teléfono familiar',p.telefono],['Religión',p.religion],['Ingresa por',hc.ingresaPor],['Fecha de Ingreso',fmtD(hc.fechaIng)],
    ['Fecha de elaboración',fmtD(hc.fecha)],['Informante',hc.informante],['Elaborado por',hc.elaborado]]});
  T('ANAMNESIS:');B.push({t:'kp',k:'Tiempo de enfermedad: ',x:hc.tiempo},{t:'kp',k:'Síntomas principales: ',x:hc.sintomas||(hc.tipo==='pulso'&&p.pulsos.find(x=>x.id===hc.pulsoId)?'INGRESA PARA '+ordinalOf(p,p.pulsos.find(x=>x.id===hc.pulsoId))+' PULSO':'')},{t:'kp',k:'Historia de la enfermedad:',x:''},{t:'box',x:hc.hea||' '});
  T('FUNCIONES BIOLÓGICAS:');B.push({t:'bul',items:FBK.map(([k,l])=>l+': '+(hc.fb[k]||''))});
  T('ANTECEDENTES');B.push({t:'sub',x:'- Antecedentes personales:'},{t:'bul',items:[A.parto,A.inmun,A.covid&&('VACUNAS COVID: '+A.covid)].filter(Boolean)});
  B.push({t:'sub',x:'- Enfermedades médicas previas:'},{t:'p',x:ENFS.map(e=>e+' ('+(A.enf[e]||'NO')+')').join(', ')});if(lines(A.otras).length)B.push({t:'bul',items:lines(A.otras)});
  B.push({t:'sub',x:'- Cirugías previas:'},lines(A.quir).length?{t:'bul',items:lines(A.quir)}:{t:'p',x:'NIEGA'});
  const PR=(A.proc||[]).filter(x=>x.n.trim());if(PR.length)B.push({t:'sub',x:'- Procedimientos previos:'},{t:'bul',items:PR.map(x=>(x.f.trim()?x.f.trim()+': ':'')+x.n.trim()+(x.d.trim()?' — '+x.d.trim():''))});
  B.push({t:'sub',x:'- Medicación habitual:'},lines(A.med).length?{t:'bul',items:lines(A.med)}:{t:'p',x:'NIEGA'});
  B.push({t:'kp',k:'- Alergias: ',x:A.alerg||'NIEGA'});if(A.transf.trim())B.push({t:'kp',k:'- Transfusiones: ',x:A.transf});
  T('EXÁMENES AUXILIARES');if(p.grupo)B.push({t:'kp',k:'GRUPO SANGUÍNEO: ',x:p.grupo});
  const lt=labRows(p,hc);if(lt.rows.length){B.push({t:'sub',x:'LABORATORIO'},{t:'lab',...lt})}
  if(hc.tipo==='pulso'||p.pulsos.some(x=>x.fi&&x.fi<=hc.fecha)){const act=p.pulsos.find(x=>x.id===hc.pulsoId);const prev=cfmTotal(p,act?act.fi:hc.fecha,false),tot=cfmTotal(p,hc.fecha,true);
    const L=[];if(act)L.push('PULSO ACTUAL: '+pulsoTitle(p,act)+' ('+fechasPalabras(act.fi,act.ff)+').');if(tot)L.push('DOSIS ACUMULADA DE CICLOFOSFAMIDA: '+fmtG(prev)+' PREVIA'+(act&&act.cfm?' / '+fmtG(tot)+' INCLUYENDO EL PULSO ACTUAL':'')+'.');if(L.length)B.push({t:'note',items:L})}
  const im=inmunoTable(p,hc);if(im){B.push({t:'sub',x:'PERFIL INMUNOLÓGICO'},{t:'grid',...im})}
  const tz=TAMIZ.filter(k=>(p.tamiz[k]||{}).r);if(tz.length){B.push({t:'sub',x:'TAMIZAJE PRE-INMUNOSUPRESIÓN'},{t:'grid',cols:['EXAMEN','RESULTADO','FECHA'],rows:tz.map(k=>[k,up(p.tamiz[k].r),fmtD(p.tamiz[k].f)])})}
  if(p.biopsia.texto.trim()){B.push({t:'sub',x:'BIOPSIA RENAL'+(p.biopsia.fecha?' '+fmtD(p.biopsia.fecha):'')+':'});lines(p.biopsia.texto).forEach(l=>B.push({t:'p',x:l}))}
  p.informes.filter(r=>r.titulo.trim()||r.texto.trim()).filter(r=>!r.fecha||r.fecha<=hc.fecha).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).forEach(r=>{B.push({t:'sub',x:up(r.titulo)+(r.fecha?' '+fmtD(r.fecha):'')+':'});lines(r.texto).forEach(l=>B.push({t:'p',x:l}))});
  T('EXAMEN FÍSICO GENERAL');B.push({t:'box',x:hc.exGen});const fv=hc.fv;
  B.push({t:'p',x:['PA: '+(fv.pa||'—')+' MMHG','FC: '+(fv.fc||'—')+' LPM','FR: '+(fv.fr||'—'),'SATO2: '+(fv.sat||'—')+'%','FIO2: '+(fv.fio2||'—'),fv.t&&('T°: '+fv.t+' °C'),fv.peso&&('PESO: '+fv.peso+' KG')].filter(Boolean).join('    '),b:true});
  T('EXAMEN FÍSICO REGIONAL');B.push({t:'kv',rows:EXSEG.map(([k,l])=>[l,hc.ex[k]||'']),wide:true});
  T('IMPRESIÓN DIAGNÓSTICA');B.push({t:'num',items:lines(hc.dx).map(x=>x.replace(/^\s*\d+\s*[.)\-]*\s*/,''))});
  return B;
}
function fmtG(mg){return (mg>=1000?(Math.round(mg/100)/10)+' G':mg+' MG')}
function inmunoTable(p,hc){const rows=p.inmuno.filter(r=>r.fecha<=hc.fecha&&Object.values(r.items).some(Boolean)).sort((a,b)=>a.fecha.localeCompare(b.fecha));if(!rows.length)return null;
  const keys=[];rows.forEach(r=>Object.keys(r.items).forEach(k=>{if(r.items[k]&&!keys.includes(k))keys.push(k)}));keys.sort((a,b)=>LABORDER.indexOf(a)-LABORDER.indexOf(b));
  return {cols:['FECHA',...keys.map(k=>LABMAP[k]?LABMAP[k].n:k)],rows:rows.map(r=>[fmtD(r.fecha),...keys.map(k=>up(r.items[k]||''))])}}
function docText(hc){const out=[];docBlocks(hc).forEach(b=>{switch(b.t){
  case'title':out.push(b.x,'');break;case'h':out.push('',b.x);break;case'sub':out.push(b.x);break;case'p':out.push(b.x);break;case'kp':out.push(b.k+(b.x||''));break;
  case'box':out.push(b.x);break;case'bul':b.items.forEach(i=>out.push('  - '+i));break;case'num':b.items.forEach((i,n)=>out.push((n+1)+'. '+i));break;case'note':b.items.forEach(i=>out.push(i));break;
  case'kv':b.rows.forEach(([k,v])=>out.push(up(k)+': '+(v||'')));break;
  case'lab':b.rows.forEach(r=>{if(r.t==='pulso')out.push('*** '+r.txt+' — '+r.sub+' ***');else{const v=b.cols.map((c,i)=>r.cells[i]?c+' '+r.cells[i]:'').filter(Boolean);out.push(fmtD(r.fecha)+': '+v.join(', ')+(r.nota?(v.length?'. ':'')+up(r.nota):'')+(v.length||r.nota?'.':''))}});break;
  case'grid':b.rows.forEach(r=>out.push(r.map((v,i)=>i?(b.cols[i]+': '+(v||'—')):v).join(' · ')));break}});
  return up(out.join('\n').replace(/\n{3,}/g,'\n\n'))}

/* ---------- navegación / estado ---------- */
let R={v:'inicio',hid:null,tab:null,q:'',modo:null};let CUR=null,saveT=null;
function go(v,extra){Object.assign(R,{v,tab:null},extra||{});render();window.scrollTo(0,0)}
function render(){const nav={inicio:['inicio','nueva','hc'],pac:['pacientes'],aj:['ajustes']};Object.keys(nav).forEach(k=>$('#nav-'+k).classList.toggle('on',nav[k].includes(R.v)));
  CUR=null;document.querySelector('.bar')?.remove();$('#app').innerHTML={inicio:vInicio,nueva:vNueva,hc:vHC,pacientes:vPacientes,ajustes:vAjustes}[R.v]();if(CUR&&CUR.mount)CUR.mount();if(CUR&&CUR.preview)CUR.preview()}
function rerender(){const y=window.scrollY;render();window.scrollTo(0,y)}
function touch(){if(CUR&&CUR.hc){CUR.hc.updated=Date.now();const p=DB.patients[CUR.hc.dni];if(p)p.updated=Date.now()}clearTimeout(saveT);saveT=setTimeout(save,350);if(CUR&&CUR.preview)CUR.preview()}
function resolve(path){if(path.startsWith('p.'))return[DB.patients[CUR.hc.dni],path.slice(2)];return[CUR.hc,path]}
function bar(html){const b=document.createElement('div');b.className='bar';b.innerHTML=html;document.body.appendChild(b)}
function F(path,label,attrs=''){const[o,p]=resolve(path);return `<div><label>${label}</label><input data-p="${path}" value="${esc(getP(o,p)??'')}" autocomplete="off" ${attrs}></div>`}
function TA(path,label,rows=3,ph=''){const[o,p]=resolve(path);return `<div><label>${label}</label><textarea data-p="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(getP(o,p)??'')}</textarea></div>`}
const NUM='inputmode="decimal"';

const APP=document.getElementById('app');
APP.addEventListener('input',onInput);APP.addEventListener('change',onInput);APP.addEventListener('click',onClick);
function onInput(ev){const t=ev.target;if(!CUR||!CUR.hc)return;if(ev.type==='change'&&t.tagName!=='SELECT'&&t.type!=='checkbox'&&t.type!=='date'&&t.type!=='file')return;const d=t.dataset;
  if(d.p){const[o,p]=resolve(d.p);setP(o,p,t.type==='checkbox'?t.checked:(d.up!=null?up(t.value):t.value));if(d.p==='p.fnac'){const e=edad(t.value,CUR.hc.fecha);DB.patients[CUR.hc.dni].edad=e;const ei=$('[data-p="p.edad"]');if(ei)ei.value=e}return touch()}
  const p=DB.patients[CUR.hc.dni];
  if(d.lab){const L=p.labs.find(l=>l.id===d.lab);if(d.k==='fecha')L.fecha=t.value;else if(d.k==='nota')L.nota=up(t.value);else L.items[d.k]=up(t.value).trim();return touch()}
  if(d.pul){const x=p.pulsos.find(y=>y.id===d.pul);x[d.k]=d.k==='esquema'||d.k==='nota'?up(t.value):t.value;return touch()}
  if(d.inm){const r=p.inmuno.find(y=>y.id===d.inm);if(d.k==='fecha')r.fecha=t.value;else r.items[d.k]=up(t.value);return touch()}
  if(d.tz){p.tamiz[d.tz]=p.tamiz[d.tz]||{r:'',f:''};p.tamiz[d.tz][d.k]=d.k==='r'?up(t.value):t.value;return touch()}
  if(d.proc){const x=(p.ant.proc||[]).find(y=>y.id===d.proc);x[d.k]=up(t.value);return touch()}
  if(d.inf){const r=p.informes.find(y=>y.id===d.inf);r[d.k]=d.k==='fecha'?t.value:up(t.value);return touch()}
}
async function onClick(ev){const b=ev.target.closest('button');if(!b||!b.dataset.act)return;const d=b.dataset,a=d.act;
  if(a==='tab'){R.tab=d.tab;return render()}if(CUR&&CUR.click)return CUR.click(a,d,b)}

/* =====================================================================
   VISTAS
   ===================================================================== */
function backupBanner(){if(!Object.keys(DB.hcs).length)return'';const lb=DB.settings.lastBackup,d=lb?Math.floor((Date.now()-lb)/864e5):null;if(d!==null&&d<7)return'';
  return `<div class="alert a-warn">${lb?'Tu último respaldo fue hace '+d+' días.':'Aún no has hecho un respaldo.'} <button class="btn sm" onclick="exportBackup()">Respaldar ahora</button></div>`}
function vInicio(){const hs=Object.values(DB.hcs).sort((a,b)=>b.updated-a.updated).slice(0,30);
  return backupBanner()+`<div class="row" style="margin-bottom:12px"><button class="btn pri" onclick="go('nueva',{q:'',modo:null})">+ Nueva historia clínica</button></div>
  ${hs.map(h=>{const p=DB.patients[h.dni]||{nombre:'?'};const pu=h.pulsoId&&p.pulsos?p.pulsos.find(x=>x.id===h.pulsoId):null;
    return `<div class="card pt" style="cursor:pointer" onclick="go('hc',{hid:'${h.id}'})"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(h.dni)} · ${fmtD(h.fecha)} · ${h.tipo==='pulso'?(pu?esc(ordinalOf(p,pu))+' PULSO':'PULSO'):'GENERAL'}</div></div><span class="badge ${h.tipo==='pulso'?'b-ok':'b-alta'}">${h.tipo==='pulso'?'Pulso':'General'}</span></div>`}).join('')||'<div class="card muted">Aún no hay historias. Toca “Nueva historia clínica”.</div>'}`}
function vNueva(){const modo=R.modo;
  if(!modo)return `<div class="card"><h2>¿A qué viene el paciente?</h2><p class="muted">Según esto la app te pide lo que corresponde, sobre todo los análisis previos.</p>
   <div class="grid w2" style="margin-top:12px"><button class="btn pri" style="min-height:90px;font-size:18px" onclick="R.modo='pulso';render()">💉 Pulso<br><span style="font-size:13px;font-weight:400">MTP / ciclofosfamida / rituximab…</span></button>
   <button class="btn" style="min-height:90px;font-size:18px" onclick="R.modo='general';render()">🩺 Estudio / otro<br><span style="font-size:13px;font-weight:400">GMN, ERC descompensada, etc.</span></button></div></div>`;
  const q=R.q.trim(),ql=deacc(q);const res=q?Object.values(DB.patients).filter(p=>p.dni.includes(q)||deacc(p.nombre).includes(ql)).slice(0,15):[];const isDoc=/^[0-9A-Za-z]{6,12}$/.test(q)&&/\d/.test(q);
  CUR={mount(){const i=$('#q');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}};
  return `<div class="card"><div class="pt"><h2 style="margin:0">Nueva HC · ${modo==='pulso'?'💉 Pulso':'🩺 Estudio / otro'}</h2><button class="btn sm" onclick="R.modo=null;render()">Cambiar</button></div>
   <label style="margin-top:12px">Buscar por DNI o apellidos</label><input id="q" value="${esc(R.q)}" autocomplete="off" oninput="R.q=this.value;render()"></div>
  ${res.map(p=>{const n=Object.values(DB.hcs).filter(h=>h.dni===p.dni).length,ps=pulsosSorted(p).filter(x=>x.fi),lp=ps[ps.length-1];
   return `<div class="card"><div class="alert a-info" style="margin-bottom:10px">Paciente conocido: ${n} HC previa(s)${ps.length?' · '+ps.length+' pulso(s), el último: '+esc(pulsoTitle(p,lp))+' ('+fechasPalabras(lp.fi,lp.ff)+')':''}. Se precarga filiación, antecedentes, labs${ps.length?', pulsos':''} y examen previo.</div>
   <div class="pt"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)}</div></div><button class="btn pri" onclick="startHC('${esc(p.dni)}')">Crear HC</button></div></div>`}).join('')}
  ${DB.patients[q]?'':`<div class="card"><h2>Paciente nuevo</h2><div class="grid w2"><div><label>DNI / CE</label><input id="nDni" value="${isDoc?esc(q):''}" inputmode="numeric" autocomplete="off"></div>
   <div><label>Apellidos y nombres</label><input id="nNom" value="${isDoc?'':esc(up(q))}" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase"></div></div>
   <div class="row" style="margin-top:12px"><button class="btn pri" onclick="createPatient()">Crear HC</button></div></div>`}`}
function createPatient(){const dni=$('#nDni').value.trim().replace(/\s/g,''),nom=up($('#nNom').value).trim().replace(/\s+/g,' ');
  if(!/^[0-9A-Za-z]{6,12}$/.test(dni))return toast('Ingresa un DNI/CE válido');if(!nom)return toast('Ingresa apellidos y nombres');if(DB.patients[dni])return toast('Ese DNI ya existe; búscalo arriba');
  DB.patients[dni]=newPatient(dni,nom);startHC(dni)}
function startHC(dni){const hc=newHC(dni,R.modo);DB.hcs[hc.id]=hc;save();go('hc',{hid:hc.id,tab:hc.prevId?(hc.tipo==='pulso'?'pulsos':'anam'):'fil'})}

/* ---- Editor de HC ---- */
function tabsFor(hc){return [['fil','Filiación'],['anam','Anamnesis'],['ant','Antecedentes'],['labs','Laboratorio'],...(hc.tipo==='pulso'?[['pulsos','Pulsos']]:[]),['inm','Inmuno y tamizaje'],['inf','Biopsia e informes'],['ex','Examen'],['dx','Diagnóstico'],['doc','Documento']]}
function missing(hc){const p=DB.patients[hc.dni],M=[];if(!hc.hea.trim())M.push('Historia de la enfermedad');if(!hc.fv.pa)M.push('Funciones vitales');if(!lines(hc.dx).length)M.push('Impresión diagnóstica');
  if(!p.labs.length)M.push('Laboratorio');if(hc.tipo==='pulso'){const act=p.pulsos.find(x=>x.id===hc.pulsoId);if(act&&!act.esquema.trim())M.push('Esquema del pulso actual');
    const tz=TAMIZ.slice(0,5).filter(k=>!(p.tamiz[k]||{}).r);if(tz.length)M.push('Tamizaje: '+tz.join(', '))}return M}
function vHC(){const hc=DB.hcs[R.hid];if(!hc){R.v='inicio';return vInicio()}const p=DB.patients[hc.dni];const tab=R.tab||'fil';
  CUR={hc,preview(){const el=$('#prev');if(el)el.textContent=docText(hc)},click:hcClick,mount(){bar(`<button class="btn" onclick="go('inicio')">← Inicio</button><button class="btn pri" onclick="exportWord('${hc.id}')">Word</button><button class="btn" onclick="exportTxt('${hc.id}')">TXT</button>`);if(tab==='labs')mountLabImport()}};
  const M=missing(hc);
  const head=`<div class="card"><div class="pt"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)} · HC ${hc.tipo==='pulso'?'💉 PULSO':'🩺 GENERAL'} · ${fmtD(hc.fecha)}</div></div>
   <span class="badge ${M.length?'b-pend':'b-copy'}" title="${esc(M.join(', '))}">${M.length?'Faltan '+M.length:'Completa'}</span></div>${M.length?`<div class="muted" style="margin-top:6px">Falta: ${esc(M.join(' · '))}</div>`:''}</div>
   <div class="tabs">${tabsFor(hc).map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(tab==='fil')body=`<div class="card"><h3>Paciente</h3><div class="grid w2">${F('p.nombre','Apellidos y nombres','data-up')}${F('p.dni','DNI','disabled')}</div>
   <div class="grid" style="margin-top:10px"><div><label>Fecha de nacimiento</label><input type="date" data-p="p.fnac" value="${esc(p.fnac)}"></div>${F('p.edad','Edad (años)',NUM)}
   <div><label>Sexo</label><select data-p="p.sexo"><option value="">—</option>${['MASCULINO','FEMENINO'].map(s=>`<option ${p.sexo===s?'selected':''}>${s}</option>`).join('')}</select></div>
   ${F('p.natural','Natural de','data-up')}${F('p.procedencia','Procedente de','data-up')}${F('p.ocupacion','Ocupación','data-up')}${F('p.civil','Estado civil','data-up')}${F('p.religion','Religión','data-up')}
   ${F('p.familiar','Familiar responsable','data-up placeholder="NOMBRE (PARENTESCO)"')}${F('p.telefono','Teléfono familiar','inputmode="tel"')}${F('p.grupo','Grupo sanguíneo','data-up placeholder="O +"')}</div></div>
   <div class="card"><h3>Esta hospitalización</h3><div class="grid">${F('ingresaPor','Ingresa por','data-up')}<div><label>Fecha de ingreso</label><input type="date" data-p="fechaIng" value="${esc(hc.fechaIng)}"></div>
   <div><label>Fecha de elaboración</label><input type="date" data-p="fecha" value="${esc(hc.fecha)}"></div>${F('informante','Informante','data-up')}</div><div style="margin-top:10px">${F('elaborado','Elaborado por','data-up placeholder="MR1 NEFROLOGÍA NOMBRE APELLIDO"')}</div></div>`;
  if(tab==='anam')body=`<div class="card"><h3>Anamnesis</h3><div class="grid w2">${F('tiempo','Tiempo de enfermedad','data-up')}${F('sintomas','Síntomas principales','data-up'+(hc.tipo==='pulso'?' placeholder="VACÍO = INGRESA PARA (N°) PULSO"':''))}</div>
   <div style="margin-top:10px">${TA('hea','Historia de la enfermedad (puedes dictar)',12)}</div>${hc.prevId?`<details style="margin-top:8px"><summary>Historia de la HC anterior</summary><pre class="note">${esc(DB.hcs[hc.prevId]?.hea||'')}</pre></details>`:''}
   <div class="row" style="margin-top:8px"><button class="btn sm" data-act="mayus">MAYÚSCULAS</button></div></div>
   <div class="card"><h3>Funciones biológicas</h3><div class="grid w2">${FBK.map(([k,l])=>F('fb.'+k,l,'data-up')).join('')}</div></div>`;
  if(tab==='ant'){const A=p.ant;body=`<div class="card"><h3>Antecedentes personales</h3><div class="grid w2">${F('p.ant.parto','Parto','data-up')}${F('p.ant.inmun','Inmunizaciones','data-up')}${F('p.ant.covid','Vacunas COVID','data-up placeholder="2 DOSIS"')}</div></div>
   <div class="card"><h3>Enfermedades médicas previas</h3><div class="row">${ENFS.map(e=>`<div class="seg"><span style="padding:10px 10px;font-weight:600">${e}</span>${['NO','SÍ'].map(v=>`<button class="${(A.enf[e]||'NO')===v?'on':''}" data-act="enf" data-e="${e}" data-v="${v}">${v}</button>`).join('')}</div>`).join('')}</div>
   <div style="margin-top:10px">${TA('p.ant.otras','Otras (una por línea)',4,'HIPERPLASIA BENIGNA DE PRÓSTATA\nLITIASIS RENAL')}</div></div>
   <div class="card"><h3>Procedimientos previos</h3>${(A.proc||[]).map(x=>`<div class="grid" style="grid-template-columns:150px 1fr 1fr auto;align-items:end;margin-bottom:6px"><div><label>Fecha / tiempo</label><input data-proc="${x.id}" data-k="f" value="${esc(x.f)}" placeholder="03/2024 · HACE 5 AÑOS" style="text-transform:uppercase"></div>
     <div><label>Procedimiento</label><input data-proc="${x.id}" data-k="n" value="${esc(x.n)}" style="text-transform:uppercase"></div><div><label>Detalle / resultado</label><input data-proc="${x.id}" data-k="d" value="${esc(x.d)}" placeholder="YUGULAR DER. / RETIRADO / GMN MEMBRANOSA" style="text-transform:uppercase"></div>
     <button class="btn sm bad" data-act="procDel" data-id="${x.id}">✕</button></div>`).join('')||'<div class="muted">Ninguno registrado.</div>'}
    <div class="chips" style="margin-top:8px">${PROC_CHIPS.map(c=>`<button class="chip" data-act="procAdd" data-v="${esc(c)}">+ ${esc(c)}</button>`).join('')}<button class="chip" data-act="procAdd" data-v="">+ Otro</button></div></div>
   <div class="card">${TA('p.ant.quir','Cirugías previas (una por línea)',3)}<div style="height:8px"></div>${TA('p.ant.med','Medicación habitual (una por línea)',5)}
   <div class="grid w2" style="margin-top:8px">${F('p.ant.alerg','Alergias','data-up')}${F('p.ant.transf','Transfusiones','data-up')}</div></div>`}
  if(tab==='labs')body=labsTab(hc,p);
  if(tab==='pulsos')body=pulsosTab(hc,p);
  if(tab==='inm')body=inmTab(hc,p);
  if(tab==='inf')body=`<div class="card"><h3>Biopsia renal</h3><div class="grid"><div><label>Fecha</label><input type="date" data-p="p.biopsia.fecha" value="${esc(p.biopsia.fecha)}"></div></div>
   <div style="margin-top:8px">${TA('p.biopsia.texto','Informe (pégalo completo: diagnóstico, microscopía, histoquímica, IF, nota)',10)}</div></div>
   <div class="card"><h3>Imágenes y otros informes</h3>${p.informes.map(r=>`<div class="dx"><div class="grid w2"><div><label>Título</label><input data-inf="${r.id}" data-k="titulo" value="${esc(r.titulo)}" style="text-transform:uppercase" placeholder="ECOGRAFÍA RENAL"></div><div><label>Fecha</label><input type="date" data-inf="${r.id}" data-k="fecha" value="${esc(r.fecha)}"></div></div>
     <label style="margin-top:8px">Resultado</label><textarea data-inf="${r.id}" data-k="texto" rows="4">${esc(r.texto)}</textarea><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm bad" data-act="infDel" data-id="${r.id}">Quitar</button></div></div>`).join('')||'<div class="muted">Sin informes.</div>'}
   <button class="btn sm" style="margin-top:8px" data-act="infAdd">+ Agregar informe</button></div>`;
  if(tab==='ex')body=`<div class="card"><h3>Examen físico general</h3>${TA('exGen','',3)}<div class="grid" style="margin-top:10px">${F('fv.pa','PA (mmHg)','placeholder="120/80"')}${F('fv.fc','FC (lpm)',NUM)}${F('fv.fr','FR (rpm)',NUM)}${F('fv.sat','SatO2 (%)',NUM)}${F('fv.fio2','FiO2',NUM)}${F('fv.t','T° (°C)',NUM)}${F('fv.peso','Peso (kg)',NUM)}</div></div>
   <div class="card"><h3>Examen físico regional</h3><p class="muted" style="margin-top:0">${hc.prevId?'Viene de la HC anterior.':'Viene con el texto normal.'} Edita solo lo anormal.</p>
   ${EXSEG.map(([k,l])=>`<div class="ex-lbl"><label>${l}</label><button class="link" data-act="exReset" data-k="${k}">↺ Normal</button></div><textarea data-p="ex.${k}" rows="2">${esc(hc.ex[k]||'')}</textarea>`).join('')}</div>`;
  if(tab==='dx')body=`<div class="card"><h3>Impresión diagnóstica</h3><p class="muted" style="margin-top:0">Una por línea (se numeran solas).</p>${TA('dx','',8,'SÍNDROME NEFRÓTICO\nGLOMERULONEFRITIS MEMBRANOSA')}</div>`;
  if(tab==='doc')body=`<div class="card"><h3>Vista previa (texto)</h3><pre class="note" id="prev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" onclick="exportWord('${hc.id}')">Word</button><button class="btn" onclick="exportTxt('${hc.id}')">TXT</button><button class="btn" data-act="copy">Copiar</button><span class="sp"></span><button class="btn bad sm" data-act="delHC">Eliminar esta HC</button></div></div>`;
  return head+body}
function hcClick(a,d){const hc=CUR.hc,p=DB.patients[hc.dni];
  const done=()=>{p.updated=Date.now();hc.updated=Date.now();save();rerender()};
  if(a==='mayus'){hc.hea=up(hc.hea);return done()}
  if(a==='enf'){p.ant.enf[d.e]=d.v;return done()}
  if(a==='exReset'){hc.ex[d.k]=DB.settings.ex[d.k];return done()}
  if(a==='copy')return copyText(docText(hc)).then(o=>toast(o?'HC copiada':'No se pudo copiar'));
  if(a==='delHC'){if(!confirm('¿Eliminar esta HC? Los datos del paciente (labs, pulsos, antecedentes) se conservan.'))return;if(hc.pulsoId&&confirm('¿Eliminar también el pulso registrado para esta HC?'))p.pulsos=p.pulsos.filter(x=>x.id!==hc.pulsoId);delete DB.hcs[hc.id];save();return go('inicio')}
  if(a==='labAdd'){p.labs.push({id:uid(),fecha:hc.fecha,items:{},nota:'',created:Date.now()});return done()}
  if(a==='labDel'){if(!confirm('¿Eliminar esta fila?'))return;p.labs=p.labs.filter(l=>l.id!==d.id);return done()}
  if(a==='colAdd'){const c=$('#colSel').value;if(c&&!p.cols[hc.tipo].includes(c))p.cols[hc.tipo].push(c);return done()}
  if(a==='colDel'){p.cols[hc.tipo]=p.cols[hc.tipo].filter(c=>c!==d.c);return done()}
  if(a==='colReset'){p.cols[hc.tipo]=PRESET[hc.tipo].slice();return done()}
  if(a==='colUp'){const L=p.cols[hc.tipo],i=L.indexOf(d.c);if(i>0)[L[i-1],L[i]]=[L[i],L[i-1]];return done()}
  if(a==='pulAdd'){p.pulsos.push({id:uid(),fi:'',ff:'',esquema:'',cfm:'',nota:'',created:Date.now()});return done()}
  if(a==='pulDel'){if(d.id===hc.pulsoId)return toast('Es el pulso de esta HC; no se puede quitar aquí');if(!confirm('¿Eliminar este pulso?'))return;p.pulsos=p.pulsos.filter(x=>x.id!==d.id);return done()}
  if(a==='esq'){const x=p.pulsos.find(y=>y.id===d.id);const v=d.v;x.esquema=up((v.startsWith('+')?(x.esquema.trim()+' '+v):(x.esquema.trim()?x.esquema.trim()+' + '+v:v)).trim());const m=v.match(/CICLOFOSFAMIDA (\d+(?:\.\d+)?) ?(G|MG)/);if(m&&!x.cfm)x.cfm=String(m[2]==='G'?parseFloat(m[1])*1000:m[1]);return done()}
  if(a==='inmAdd'){p.inmuno.push({id:uid(),fecha:hc.fecha,items:{},created:Date.now()});return done()}
  if(a==='inmDel'){p.inmuno=p.inmuno.filter(r=>r.id!==d.id);return done()}
  if(a==='inmKey'){const r=p.inmuno.find(y=>y.id===d.id),k=$('#ik_'+d.id).value;if(k&&r.items[k]==null)r.items[k]='';return done()}
  if(a==='procAdd'){p.ant.proc=p.ant.proc||[];p.ant.proc.push({id:uid(),f:'',n:d.v||'',d:''});return done()}
  if(a==='procDel'){p.ant.proc=(p.ant.proc||[]).filter(x=>x.id!==d.id);return done()}
  if(a==='infAdd'){p.informes.push({id:uid(),titulo:'',fecha:'',texto:'',created:Date.now()});return done()}
  if(a==='infDel'){if(!confirm('¿Quitar este informe?'))return;p.informes=p.informes.filter(r=>r.id!==d.id);return done()}
  if(a==='parse'){LS.text=$('#ltext').value;const r=parseLabs(LS.text,LS.fecha||hc.fecha);LS.rows=r.rows.map(x=>({...x,on:true}));LS.unk=r.unk;rerender();if(!LS.rows.length)toast('No reconocí resultados');return}
  if(a==='lclear'){LS={text:'',rows:null,unk:[],fecha:hc.fecha,busy:''};return rerender()}
  if(a==='lclaude'){return copyText(CLAUDE_PROMPT+anonLabText($('#ltext').value)).then(o=>toast(o?'Copiado sin nombre/DNI. Pega la respuesta de Claude en el cuadro':'No se pudo copiar'))}
  if(a==='lsave'){const rows=LS.rows.filter(r=>r.on&&r.v.trim()&&r.fecha);if(!rows.length)return toast('Nada que guardar');let n=0;
    rows.forEach(r=>{const area=LABMAP[r.k]?LABMAP[r.k].a:'OTROS';if(area==='INMUNO'){let I=p.inmuno.find(x=>x.fecha===r.fecha);if(!I){I={id:uid(),fecha:r.fecha,items:{},created:Date.now()};p.inmuno.push(I)}I.items[r.k]=up(r.v);n++;return}
      let L=p.labs.find(x=>x.fecha===r.fecha);if(!L){L={id:uid(),fecha:r.fecha,items:{},nota:'',created:Date.now()};p.labs.push(L)}L.items[r.k]=up(r.v);n++});
    LS={text:'',rows:null,unk:[],fecha:LS.fecha,busy:''};toast(n+' resultados guardados');const o=outOfCols(p,hc);if(o.length)setTimeout(()=>toast('Hay valores sin columna: '+o.map(k=>LABMAP[k].n).join(', ')),2400);return done()}
}

/* ---- pestaña Laboratorio ---- */
let LS={text:'',rows:null,unk:[],fecha:null,busy:''};
function labsTab(hc,p){if(!LS.fecha)LS.fecha=hc.fecha;const cols=p.cols[hc.tipo];const keys=cols.flatMap(c=>COLDEF[c].k.map(k=>({c,k})));
  const labs=p.labs.slice().sort((a,b)=>hc.tipo==='pulso'?a.fecha.localeCompare(b.fecha):b.fecha.localeCompare(a.fecha));const oc=outOfCols(p,hc);
  const opts=LABDEF.map(d=>`<option value="${d[0]}">${d[1]} · ${AREAS[d[2]]}</option>`).join('');
  return `<div class="card"><h3>Importar análisis</h3><div class="row"><label class="btn" style="margin:0;color:var(--ink);font-size:16px">📷 Leer fotos<input id="lfotos" type="file" accept="image/*" multiple style="display:none"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px">📄 Subir PDF<input id="lpdf" type="file" accept="application/pdf" multiple style="display:none"></label><span class="muted">o pega el texto</span></div>
   <div id="lbusy" class="muted" style="margin-top:8px">${esc(LS.busy)}</div><div class="prog" ${LS.busy?'':'hidden'}><i id="lprog"></i></div>
   <div class="grid" style="margin-top:8px"><div><label>Fecha si el texto no trae</label><input id="lfecha" type="date" value="${LS.fecha}"></div></div>
   <textarea id="ltext" rows="6" style="margin-top:8px" placeholder="Pega aquí los resultados…">${esc(LS.text)}</textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-act="parse">Procesar</button><button class="btn" data-act="lclear">Limpiar</button><span class="sp"></span><button class="btn sm" data-act="lclaude">Copiar para Claude (sin nombre/DNI)</button></div>
   ${LS.rows?`<h4>Revisar (${LS.rows.length})</h4><table class="rev"><tr><th></th><th>Fecha</th><th>Examen</th><th>Valor</th></tr>${LS.rows.map((r,i)=>`<tr><td><input type="checkbox" ${r.on?'checked':''} onchange="LS.rows[${i}].on=this.checked"></td><td><input type="date" value="${r.fecha}" onchange="LS.rows[${i}].fecha=this.value"></td>
    <td><select onchange="LS.rows[${i}].k=this.value">${opts.replace(`value="${r.k}"`,`value="${r.k}" selected`)}</select></td><td><input value="${esc(r.v)}" oninput="LS.rows[${i}].v=this.value"></td></tr>`).join('')}</table>
    <div class="row" style="margin-top:8px"><button class="btn pri" data-act="lsave">Guardar en la tabla</button></div>${LS.unk.length?`<details style="margin-top:8px"><summary>No reconocidas (${LS.unk.length})</summary><pre class="note">${esc(LS.unk.join('\n'))}</pre></details>`:''}`:''}</div>
  <div class="card"><div class="pt"><h3 style="margin:0">Tabla · ${hc.tipo==='pulso'?'Pulsos (cronológico)':'General (más reciente primero)'}</h3><button class="btn sm pri" data-act="labAdd">+ Fila</button></div>
   <div class="row" style="margin:10px 0">${cols.map(c=>`<span class="badge b-ok" style="font-size:13px">${COLDEF[c].l} <button class="link" data-act="colUp" data-c="${c}">◀</button><button class="link" data-act="colDel" data-c="${c}">✕</button></span>`).join('')}</div>
   <div class="row"><select id="colSel" style="width:220px"><option value="">+ Agregar columna…</option>${Object.keys(COLDEF).filter(c=>!cols.includes(c)).map(c=>`<option value="${c}">${COLDEF[c].l}</option>`).join('')}</select><button class="btn sm" data-act="colAdd">Agregar</button><button class="btn sm" data-act="colReset">Columnas del modelo</button></div>
   ${oc.length?`<div class="alert a-warn" style="margin-top:10px">Valores guardados sin columna: ${esc(oc.map(k=>LABMAP[k].n+(suggestCol(k)?' (columna '+COLDEF[suggestCol(k)].l+')':'')).join(', '))}. Agrégalas si quieres que salgan.</div>`:''}
   <div style="overflow-x:auto;margin-top:10px"><table class="rev"><tr><th>Fecha</th>${keys.map(o=>`<th>${COLDEF[o.c].k.length>1?(LABMAP[o.k]?LABMAP[o.k].n:o.k):COLDEF[o.c].l}</th>`).join('')}<th>Nota</th><th></th></tr>
   ${labs.map(l=>`<tr><td><input type="date" data-lab="${l.id}" data-k="fecha" value="${l.fecha}" style="min-width:130px"></td>${keys.map(o=>`<td><input data-lab="${l.id}" data-k="${o.k}" value="${esc(l.items[o.k]||'')}" style="min-width:64px;text-transform:uppercase"></td>`).join('')}
    <td><input data-lab="${l.id}" data-k="nota" value="${esc(l.nota||'')}" style="min-width:180px;text-transform:uppercase" placeholder="p. ej. 6.9 G/24H / DEP. CREAT 106"></td><td><button class="btn sm bad" data-act="labDel" data-id="${l.id}">✕</button></td></tr>`).join('')}</table></div>
   ${labs.length?'':'<div class="muted">Sin filas. Importa o agrega una.</div>'}<p class="muted">La nota sale como fila completa debajo de esa fecha (como “MICROALBUMINURIA…” en el modelo).</p></div>`}
function mountLabImport(){const f=$('#lfotos'),pd=$('#lpdf'),t=$('#ltext'),fe=$('#lfecha');if(f)f.onchange=ev=>ocrFiles([...ev.target.files]);if(pd)pd.onchange=ev=>pdfFiles([...ev.target.files]);if(t)t.oninput=()=>{LS.text=t.value};if(fe)fe.onchange=()=>{LS.fecha=fe.value}}
function setBusy(msg,frac){LS.busy=msg;const b=$('#lbusy');if(b)b.textContent=msg;const pr=$('#lprog');if(pr){pr.parentNode.hidden=!msg;pr.style.width=Math.round((frac||0)*100)+'%'}}
function appendText(t){LS.text=(LS.text?LS.text+'\n':'')+t;const ta=$('#ltext');if(ta)ta.value=LS.text}
let OCRW=null;
async function ocrWorker(){if(OCRW)return OCRW;await loadScript('lib/tesseract.min.js');OCRW=await Tesseract.createWorker('spa',1,{workerPath:absURL('lib/worker.min.js'),corePath:absURL('lib/core'),langPath:absURL('lib/lang'),gzip:true,
  logger:m=>{if(m.status==='recognizing text')setBusy('Leyendo… '+Math.round(m.progress*100)+'%',m.progress)}});await OCRW.setParameters({preserve_interword_spaces:'1'});return OCRW}
async function ocrFiles(files){if(!files.length)return;try{setBusy('Preparando lector de fotos (la primera vez tarda un poco)…',0.02);const w=await ocrWorker();
  for(let i=0;i<files.length;i++){setBusy('Leyendo foto '+(i+1)+' de '+files.length+'…',i/files.length);const r=await w.recognize(files[i]);appendText(r.data.text)}setBusy('',0);toast('Texto leído. Revisa y toca Procesar')}catch(e){setBusy('',0);toast('No se pudo leer la foto: '+e.message)}}
async function pdfFiles(files){if(!files.length)return;try{setBusy('Abriendo PDF…',0.05);await loadScript('lib/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc=absURL('lib/pdf.worker.min.js');
  for(const f of files){const doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;for(let i=1;i<=doc.numPages;i++){setBusy('Leyendo '+f.name+' · pág. '+i+'/'+doc.numPages,i/doc.numPages);const pg=await doc.getPage(i);const tc=await pg.getTextContent();
    if(tc.items.filter(x=>x.str.trim()).length<5){const vp=pg.getViewport({scale:2});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;const w=await ocrWorker();appendText((await w.recognize(cv)).data.text);continue}
    const rows={};tc.items.forEach(it=>{if(!it.str.trim())return;const y=Math.round(it.transform[5]/3);(rows[y]=rows[y]||[]).push(it)});appendText(Object.keys(rows).map(Number).sort((a,b)=>b-a).map(y=>rows[y].sort((a,b)=>a.transform[4]-b.transform[4]).map(it=>it.str).join(' ')).join('\n'))}}
  setBusy('',0);toast('PDF leído. Revisa y toca Procesar')}catch(e){setBusy('',0);toast('No se pudo leer el PDF: '+e.message)}}

/* ---- pestaña Pulsos ---- */
function pulsosTab(hc,p){const ps=pulsosSorted(p);const act=p.pulsos.find(x=>x.id===hc.pulsoId);const prev=cfmTotal(p,act&&act.fi?act.fi:hc.fecha,false),tot=cfmTotal(p,'9999-12-31',true);
  return `<div class="card"><h3>Registro de pulsos</h3><p class="muted" style="margin-top:0">El número (PRIMER, SEGUNDO…) sale solo por orden de fecha. Cada pulso aparece resaltado en su lugar de la tabla de labs.</p>
   <div class="alert a-info">CFM acumulada previa: <b>${fmtG(prev)}</b>${act&&act.cfm?` · con el pulso actual: <b>${fmtG(prev+(parseFloat(act.cfm)||0))}</b>`:''} · total registrado: ${fmtG(tot)}</div>
   ${ps.map(x=>{const isA=x.id===hc.pulsoId;return `<div class="dx" style="${isA?'border:2px solid var(--pri)':''}"><div class="pt"><b>${esc(ordinalOf(p,x))} PULSO${isA?' · ACTUAL (esta HC)':''}</b>${isA?'':`<button class="btn sm bad" data-act="pulDel" data-id="${x.id}">✕</button>`}</div>
    <div class="grid" style="margin-top:8px"><div><label>Inicio</label><input type="date" data-pul="${x.id}" data-k="fi" value="${esc(x.fi)}"></div><div><label>Fin</label><input type="date" data-pul="${x.id}" data-k="ff" value="${esc(x.ff)}"></div><div><label>Ciclofosfamida (mg)</label><input data-pul="${x.id}" data-k="cfm" value="${esc(x.cfm)}" ${NUM}></div></div>
    <label style="margin-top:8px">Esquema / fármacos</label><input data-pul="${x.id}" data-k="esquema" value="${esc(x.esquema)}" style="text-transform:uppercase" placeholder="MTP 500 MG EV X 3 DÍAS + CICLOFOSFAMIDA 500 MG">
    <div class="chips" style="margin-top:6px">${ESQ_CHIPS.map(c=>`<button class="chip" data-act="esq" data-id="${x.id}" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <label style="margin-top:8px">Nota (opcional)</label><input data-pul="${x.id}" data-k="nota" value="${esc(x.nota)}" style="text-transform:uppercase" placeholder="TOLERÓ BIEN / REACCIÓN…">
    <div class="muted" style="margin-top:6px">En la tabla: ${esc(pulsoTitle(p,x))} — ${esc(fechasPalabras(x.fi,x.ff)||'sin fechas')}</div></div>`}).join('')}
   <button class="btn sm" data-act="pulAdd">+ Registrar pulso previo</button></div>`}

/* ---- pestaña Inmuno y tamizaje ---- */
const INMKEYS=LABDEF.filter(d=>d[2]==='INMUNO').map(d=>d[0]);
function inmTab(hc,p){const rows=p.inmuno.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha));
  return `<div class="card"><div class="pt"><h3 style="margin:0">Perfil inmunológico</h3><button class="btn sm pri" data-act="inmAdd">+ Fecha</button></div><p class="muted">También se llena solo al importar análisis (ANA, ANCA, C3/C4, IgG/IgA/IgM, anti-PLA2R…).</p>
   ${rows.map(r=>`<div class="dx"><div class="pt"><input type="date" data-inm="${r.id}" data-k="fecha" value="${r.fecha}" style="width:170px"><button class="btn sm bad" data-act="inmDel" data-id="${r.id}">✕</button></div>
    <div class="grid" style="margin-top:8px">${Object.keys(r.items).map(k=>`<div><label>${LABMAP[k]?LABMAP[k].n:k}</label><input data-inm="${r.id}" data-k="${k}" value="${esc(r.items[k])}" style="text-transform:uppercase"></div>`).join('')}</div>
    <div class="row" style="margin-top:8px"><select id="ik_${r.id}" style="width:200px">${INMKEYS.filter(k=>r.items[k]==null).map(k=>`<option value="${k}">${LABMAP[k].n}</option>`).join('')}</select><button class="btn sm" data-act="inmKey" data-id="${r.id}">+ Examen</button></div></div>`).join('')||'<div class="muted">Sin datos.</div>'}</div>
  <div class="card"><h3>Tamizaje pre-inmunosupresión</h3>${hc.tipo==='pulso'?'<p class="muted" style="margin-top:0">Los 5 primeros salen como “falta” en una HC de pulso si están vacíos.</p>':''}
   ${TAMIZ.map(k=>`<div class="grid" style="grid-template-columns:1.3fr 1fr 150px;align-items:end;margin-bottom:6px"><div style="font-weight:600;font-size:14px">${k}</div><input data-tz="${k}" data-k="r" value="${esc((p.tamiz[k]||{}).r||'')}" placeholder="NO REACTIVO" style="text-transform:uppercase"><input type="date" data-tz="${k}" data-k="f" value="${esc((p.tamiz[k]||{}).f||'')}"></div>`).join('')}</div>`}

/* ---- Pacientes y ajustes ---- */
function vPacientes(){const q=deacc(R.q||'');const ps=Object.values(DB.patients).filter(p=>!q||p.dni.includes(q)||deacc(p.nombre).includes(q)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return `<div class="card"><h2>Pacientes (${Object.keys(DB.patients).length})</h2><input id="pq" placeholder="Buscar" value="${esc(R.q||'')}" oninput="R.q=this.value;const c=this.selectionStart;render();const i=$('#pq');i.focus();i.setSelectionRange(c,c)"></div>
  ${ps.map(p=>{const hs=Object.values(DB.hcs).filter(h=>h.dni===p.dni).sort((a,b)=>b.fecha.localeCompare(a.fecha));return `<div class="card"><div class="pt"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)} · ${hs.length} HC · ${p.pulsos.filter(x=>x.fi).length} pulso(s) · ${p.labs.length} fecha(s) de labs</div></div><button class="btn sm bad" onclick="delPatient('${esc(p.dni)}')">Eliminar</button></div>
   ${hs.map(h=>`<div class="pt" style="border-top:1px solid var(--line);padding:6px 0;margin-top:6px"><span>${fmtD(h.fecha)} · ${h.tipo==='pulso'?'Pulso':'General'}</span><button class="btn sm" onclick="go('hc',{hid:'${h.id}'})">Abrir</button></div>`).join('')}</div>`}).join('')||'<div class="card muted">Sin pacientes.</div>'}`}
function delPatient(dni){if(!confirm('¿Eliminar a '+DB.patients[dni].nombre+' con todas sus HC, labs y pulsos?'))return;Object.values(DB.hcs).filter(h=>h.dni===dni).forEach(h=>delete DB.hcs[h.id]);delete DB.patients[dni];save();render()}
function vAjustes(){const s=DB.settings;
  CUR={click(a){if(a==='saveAj'){s.autor=up($('#sAut').value.trim());s.exGen=up($('#sGen').value.trim());EXSEG.forEach(([k])=>s.ex[k]=up($('#sx_'+k).value.trim()));save();toast('Ajustes guardados')}else if(a==='resetEx'){EXSEG.forEach(([k])=>$('#sx_'+k).value=EXDEF[k]);$('#sGen').value=EXGEN}}};
  let bytes=0;try{bytes=(localStorage.getItem(KEY)||'').length*2}catch(e){}
  return `<div class="card"><h3>Elaborado por (por defecto)</h3><input id="sAut" value="${esc(s.autor)}" placeholder="MR1 NEFROLOGÍA NOMBRE APELLIDO" style="text-transform:uppercase"></div>
  <div class="card"><h3>Plantilla del examen físico</h3><label>General</label><textarea id="sGen" rows="2">${esc(s.exGen)}</textarea>${EXSEG.map(([k,l])=>`<label style="margin-top:8px">${l}</label><textarea id="sx_${k}" rows="2">${esc(s.ex[k])}</textarea>`).join('')}
   <div class="row" style="margin-top:8px"><button class="btn pri" onclick="CUR.click('saveAj')">Guardar ajustes</button><button class="btn" onclick="CUR.click('resetEx')">Restaurar examen</button></div></div>
  <div class="card"><h3>Respaldo</h3><p class="muted" style="margin-top:0">Último: ${s.lastBackup?new Date(s.lastBackup).toLocaleString('es-PE'):'nunca'} · ${(bytes/1024).toFixed(0)} KB</p>
   <div class="row"><button class="btn pri" onclick="exportBackup()">Exportar respaldo</button><label class="btn" style="margin:0;color:var(--ink);font-size:16px">Importar<input type="file" accept=".json,application/json" style="display:none" onchange="importBackup(this.files[0])"></label></div></div>
  <div class="card"><h3>Zona de riesgo</h3><button class="btn bad" onclick="if(confirm('¿Borrar TODO?')&&confirm('¿Seguro? No se puede deshacer.')){const s=DB.settings;DB=blank();DB.settings=s;save();go('inicio')}">Borrar todos los datos</button></div>
  <p class="muted">HC Nefro v1.1 · Plantillas editables: valídalas con el servicio.</p>`}

/* =====================================================================
   EXPORTAR
   ===================================================================== */
async function saveFile(blob,name){try{const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})&&/iPad|iPhone|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document){await navigator.share({files:[f],title:name});return true}}catch(e){if(e.name==='AbortError')return false}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);return true}
function fname(hc){const p=DB.patients[hc.dni];return 'HC '+p.nombre.replace(/[^A-ZÑÁÉÍÓÚ ]/gi,'').trim()+' '+hc.fecha}
function exportTxt(id){const hc=DB.hcs[id];const t='﻿'+docText(hc).replace(/\r?\n/g,'\r\n');saveFile(new Blob([t],{type:'text/plain;charset=utf-8'}),fname(hc)+'.txt')}
function exportBackup(){saveFile(new Blob([JSON.stringify({app:'hc-nefro',version:1,exported:new Date().toISOString(),data:DB})],{type:'application/json'}),'respaldo-hc-nefro-'+todayISO()+'.json').then(ok=>{if(ok){DB.settings.lastBackup=Date.now();save();render();toast('Respaldo exportado')}})}
function importBackup(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(j.app&&j.app!=='hc-nefro')throw new Error('app');const d=j.data||j;if(!d.patients||!d.hcs)throw new Error('f');
  if(!confirm('Aceptar = COMBINAR (gana la versión más reciente de cada registro).'))return;let c=0;[['patients','dni'],['hcs','id']].forEach(([k,id])=>Object.values(d[k]).forEach(x=>{const cur=DB[k][x[id]];if(!cur||(x.updated||0)>(cur.updated||0)){DB[k][x[id]]=x;c++}}));save();render();toast('Importados '+c+' registros')}catch(e){toast(e.message==='app'?'Ese respaldo es de otra app':'Archivo no válido')}};r.readAsText(file)}

/* ---- Word ---- */
function xe(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
const FONT='<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>';
function run(t,o={}){return `<w:r><w:rPr>${FONT}${o.b?'<w:b/>':''}${o.u?'<w:u w:val="single"/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}<w:sz w:val="${o.sz||19}"/></w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`}
function par(runs,o={}){return `<w:p><w:pPr><w:spacing w:before="${o.before||0}" w:after="${o.after??40}"/>${o.jc?`<w:jc w:val="${o.jc}"/>`:''}${o.ind?`<w:ind w:left="${o.ind}" w:hanging="${o.hang||0}"/>`:''}</w:pPr>${runs}</w:p>`}
const BORD='<w:tblBorders><w:top w:val="single" w:sz="4" w:color="808080"/><w:left w:val="single" w:sz="4" w:color="808080"/><w:bottom w:val="single" w:sz="4" w:color="808080"/><w:right w:val="single" w:sz="4" w:color="808080"/><w:insideH w:val="single" w:sz="4" w:color="808080"/><w:insideV w:val="single" w:sz="4" w:color="808080"/></w:tblBorders>';
function tbl(widths,rows){return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a,b)=>a+b,0)}" w:type="dxa"/>${BORD}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>${par('',{after:60})}`}
function cell(w,content,o={}){return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.span?`<w:gridSpan w:val="${o.span}"/>`:''}${o.fill?`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`:''}<w:vAlign w:val="center"/></w:tcPr>${content}</w:tc>`}
function cp(t,o={}){return par(run(t,o),{after:0,jc:o.jc})}
const W=9638; // ancho útil A4 con márgenes de 2 cm
function docXML(hc){const parts=[];docBlocks(hc).forEach(b=>{switch(b.t){
  case'title':parts.push(par(run(b.x,{b:true,u:true,sz:22}),{jc:'center',after:160}));break;
  case'h':parts.push(par(run(b.x,{b:true,sz:20}),{before:160,after:60}));break;
  case'sub':parts.push(par(run(b.x,{b:true}),{before:80,after:40}));break;
  case'p':parts.push(par(run(up(b.x),{b:b.b})));break;
  case'kp':parts.push(par(run(b.k,{b:true})+run(up(b.x||''))));break;
  case'box':parts.push(tbl([W],[`<w:tr>${cell(W,lines(b.x).map(l=>cp(up(l),{jc:'both'})).join('')||cp(''))}</w:tr>`]));break;
  case'bul':b.items.forEach(i=>parts.push(par(run('•  '+up(i)),{ind:360,hang:200,after:20})));break;
  case'num':b.items.forEach((i,n)=>parts.push(par(run((n+1)+'.  ',{b:true})+run(up(i)),{ind:360,hang:300,after:20})));break;
  case'note':b.items.forEach(i=>parts.push(par(run(up(i),{b:true,color:'1F5F8B'}))));break;
  case'kv':{const w1=b.wide?2300:3000,w2=W-w1;parts.push(tbl([w1,w2],b.rows.map(([k,v])=>`<w:tr>${cell(w1,cp(b.wide?k:k,{b:true,jc:b.wide?'center':undefined}),{fill:b.wide?'F2F2F2':undefined})}${cell(w2,cp(up(v||''),{jc:b.wide?'both':undefined}))}</w:tr>`)));break}
  case'lab':{const n=b.cols.length,fw=1000,cw=Math.floor((W-fw)/n);const ws=[fw,...Array(n).fill(cw)];
    const head=`<w:tr><w:trPr><w:tblHeader/></w:trPr>${cell(fw,cp('FECHA',{b:true,sz:16,jc:'center'}),{fill:'D9E2F3'})}${b.cols.map(c=>cell(cw,cp(c,{b:true,sz:16,jc:'center'}),{fill:'D9E2F3'})).join('')}</w:tr>`;
    const rows=b.rows.flatMap(r=>{if(r.t==='pulso')return [`<w:tr>${cell(W,cp(r.txt,{b:true,u:true,sz:17,jc:'center',color:'1F3864'})+cp(r.sub,{b:true,sz:16,jc:'center',color:'1F3864'}),{span:n+1,fill:'FFF2CC'})}</w:tr>`];
      const out=[];if(r.cells.some(Boolean))out.push(`<w:tr>${cell(fw,cp(fmtD(r.fecha),{sz:16}))}${r.cells.map(v=>cell(cw,cp(v,{sz:16,jc:'center'}))).join('')}</w:tr>`);
      if(r.nota)out.push(`<w:tr>${r.cells.some(Boolean)?cell(fw,cp('',{sz:16})):cell(fw,cp(fmtD(r.fecha),{sz:16}))}${cell(W-fw,cp(up(r.nota),{b:true,sz:16,jc:'center'}),{span:n})}</w:tr>`);return out});
    parts.push(tbl(ws,[head,...rows]));break}
  case'grid':{const n=b.cols.length,cw=Math.floor(W/n);parts.push(tbl(Array(n).fill(cw),[`<w:tr>${b.cols.map(c=>cell(cw,cp(c,{b:true,sz:16,jc:'center'}),{fill:'D9E2F3'})).join('')}</w:tr>`,...b.rows.map(r=>`<w:tr>${r.map(v=>cell(cw,cp(v||'',{sz:16,jc:'center'}))).join('')}</w:tr>`)]));break}}});
  return parts.join('')}
function exportWord(id){const hc=DB.hcs[id],p=DB.patients[hc.dni];
  const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${docXML(hc)}<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const hdr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${par(run(HOSP,{b:true,sz:22}),{jc:'center',after:0})}${par(run('SERVICIO DE NEFROLOGÍA',{b:true,sz:22}),{jc:'center',after:120})}</w:hdr>`;
  const ftr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:tbl><w:tblPr><w:tblW w:w="${W}" w:type="dxa"/>${BORD}</w:tblPr><w:tblGrid><w:gridCol w:w="7200"/><w:gridCol w:w="${W-7200}"/></w:tblGrid><w:tr>${cell(7200,cp(up(p.nombre),{b:true,sz:20,color:'595959'}))}${cell(W-7200,cp('NEFROLOGÍA',{b:true,sz:20,jc:'center'}))}</w:tr></w:tbl>${par('')}</w:ftr>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const drels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`;
  saveFile(new Blob([zip([['[Content_Types].xml',ct],['_rels/.rels',rels],['word/_rels/document.xml.rels',drels],['word/document.xml',doc],['word/header1.xml',hdr],['word/footer1.xml',ftr]])],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),fname(hc)+'.docx')}
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;const d=new Date(),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  files.forEach(([name,txt])=>{const n=enc.encode(name),data=enc.encode(txt),c=crc32(data);const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,n.length,true);parts.push(new Uint8Array(h.buffer),n,data);
    const e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(12,tm,true);e.setUint16(14,dt,true);e.setUint32(16,c,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,n.length,true);e.setUint32(42,off,true);cen.push(new Uint8Array(e.buffer),n);off+=30+n.length+data.length});
  const cs=cen.reduce((a,b)=>a+b.length,0),end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cs,true);end.setUint32(16,off,true);return new Blob([...parts,...cen,new Uint8Array(end.buffer)])}

render();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
