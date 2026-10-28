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
const ORD=['PRIMER','SEGUNDO','TERCER','CUARTO','QUINTO','SEXTO','SÉPTIMO','OCTAVO','NOVENO','DÉCIMO','UNDÉCIMO','DUODÉCIMO'];
const MESES=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SETIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const PROC_CHIPS=['BIOPSIA RENAL','CVC PARA HEMODIÁLISIS','FAV','CATÉTER TENCKHOFF','HEMODIÁLISIS','DIÁLISIS PERITONEAL','PLASMAFÉRESIS','TRASPLANTE RENAL','BIOPSIA DE PIEL','ENDOSCOPÍA'];
const ESQ_CHIPS=['METILPREDNISOLONA 500 MG EV C/24H X 3 DÍAS','METILPREDNISOLONA 1 G EV C/24H X 3 DÍAS','+ CICLOFOSFAMIDA 500 MG EV','+ CICLOFOSFAMIDA 1 G EV','RITUXIMAB 1 G EV'];

let DB;
function blank(){return {patients:{},hcs:{},settings:{autor:'',ex:{...EXDEF},exGen:EXGEN,lastBackup:null}}}
function load(){try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r),b=blank();d.settings=Object.assign(b.settings,d.settings||{});d.settings.ex=Object.assign({...EXDEF},d.settings.ex||{});d.patients=d.patients||{};d.hcs=d.hcs||{};return migrate(d)}}catch(e){}return blank()}
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

async function wipe(){if(!await ask('¿Borrar TODOS los datos de HC Nefro en este iPad?')||!await ask('¿Seguro? No se puede deshacer.'))return;const st=DB.settings;DB=blank();DB.settings=st;save();go('inicio')}
async function delHC(id){const hc=DB.hcs[id];if(!hc)return;const p=DB.patients[hc.dni];if(!await ask('¿Eliminar la HC del '+fmtD(hc.fecha)+' de '+(p?p.nombre:'')+'? Los datos del paciente (labs, pulsos, antecedentes) se conservan.'))return;
  if(hc.pulsoId&&p&&await ask('¿Eliminar también el pulso que se registró con esta HC?','Sí, eliminar el pulso'))p.pulsos=p.pulsos.filter(x=>x.id!==hc.pulsoId);delete DB.hcs[id];save();if(R.v==='hc')go('inicio');else rerender();toast('HC eliminada')}
function ask(msg,ok='Sí, continuar'){return new Promise(res=>{const o=document.createElement('div');o.className='modal';
  o.innerHTML=`<div class="mbox"><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-r="0">No</button><button class="btn pri" data-r="1">${esc(ok)}</button></div></div>`;
  o.addEventListener('click',e=>{const b=e.target.closest('button');if(b||e.target===o){o.remove();res(!!(b&&b.dataset.r==='1'))}});document.body.appendChild(o)})}

/* ---------- modelos ---------- */
function newPatient(dni,nombre){return {dni,nombre,fnac:'',edad:'',sexo:'',natural:'',procedencia:'',ocupacion:'',civil:'',familiar:'',telefono:'',religion:'',grupo:'',
  ant:{parto:'NACIDO DE PARTO VAGINAL',inmun:'REFIERE INMUNIZACIONES COMPLETAS',covid:'',enf:{DM:'NO',HTA:'NO',TBC:'NO',ASMA:'NO',LES:'NO'},otras:'',quir:'',med:'',alerg:'NIEGA',transf:'',proc:[],hosp:''},
  labs:[],pulsos:[],inmuno:[],tamiz:{},biopsia:{fecha:'',texto:''},informes:[],updated:Date.now()}}
function lastHC(dni,exceptId){return Object.values(DB.hcs).filter(h=>h.dni===dni&&h.id!==exceptId).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.created-a.created)[0]}
function newHC(dni,tipo){const prev=lastHC(dni);const f=todayISO();
  const hc={id:uid(),dni,tipo,fechaIng:f,fecha:f,ingresaPor:tipo==='pulso'?'CONSULTORIO EXTERNO':'EMERGENCIA',informante:'PACIENTE',elaborado:DB.settings.autor,
    tiempo:'',sintomas:'',hea:'',fb:{orinas:'CONSERVADAS',heces:'CONSERVADAS',sed:'CONSERVADA',apetito:'CONSERVADO',sueno:'CONSERVADO'},
    fv:{pa:'',fc:'',fr:'',sat:'',fio2:'0.21',t:'',peso:''},exGen:DB.settings.exGen,ex:{...DB.settings.ex},dx:'',pulsoId:null,ni:{basal:'',plan:'',ind:''},created:Date.now(),updated:Date.now()};
  if(prev){hc.fb=clone(prev.fb);hc.ex=clone(prev.ex);hc.exGen=prev.exGen;hc.dx=prev.dx;hc.tiempo=prev.tiempo;hc.sintomas=tipo==='pulso'?'':prev.sintomas;hc.prevId=prev.id}
  if(tipo==='pulso'){const p=DB.patients[dni];const last=p.pulsos.slice().sort((a,b)=>(a.fi||'').localeCompare(b.fi||'')).pop();
    const ln=last?parseInt(last.num):0;const np={id:uid(),num:ln>0?String(ln+1):'',fi:f,ff:'',esquema:last?last.esquema:'',cfm:last?last.cfm:'',nota:'',created:Date.now()};p.pulsos.push(np);hc.pulsoId=np.id}
  return hc}
function pulsosSorted(p){return p.pulsos.slice().sort((a,b)=>(a.fi||'9').localeCompare(b.fi||'9')||a.created-b.created)}
function ordinalOf(p,x){const n=parseInt(x.num);const i=n>0?n-1:pulsosSorted(p).findIndex(y=>y.id===x.id);return ORD[i]||((i+1)+'°')}
function pulsoTitle(p,x){return ordinalOf(p,x)+' PULSO'+(x.esquema.trim()?' DE '+up(x.esquema.trim()):'')}
function cfmTotal(p,hasta,incl){return pulsosSorted(p).filter(x=>x.fi&&(incl?x.fi<=hasta:x.fi<hasta)).reduce((s,x)=>s+(parseFloat(String(x.cfm).replace(',','.'))||0),0)}

/* ---------- laboratorio: categorías, selección y tablas verticales ---------- */
const CATS=[['hem','Hemograma',['LEU','SEG','ABS','LINF','MONO','EOS','HB','HTO','VCM','PLAQ']],['coag','Coagulación',['INR','TP','TTP','FIB']],
 ['ren','Función renal y electrolitos',['CREA','UREA','NA','K','CL','CA','CAI','P','MG','AU','B2M']],['r24','Orina de 24 h',['PROT24','MALB','DEPCR','CREA24','RPC']],
 ['ori','Examen de orina',OKEYS],['hep','Perfil hepático',['TGO','TGP','FA','GGT','BT','BD','BI','PT','ALB','GLOB','DHL','CPK']],['lip','Lípidos',['COLEST','TRIG','HDL','LDL']],
 ['met','Metabólico / endocrino',['GLU','HBA1C','TSH','T4L','T3','PTH','VITD','BNP']],['inf','Inflamación',['PCR','PCT','VSG']],['anem','Perfil de anemia',['FE','TRANSF','FERR','B12','FOL']],
 ['inm','Inmunología',[]],['sero','Serologías',['HBSAG','HBC','HBS','VHC','VIH','VDRL','TREP','HAVIGM','CMVG','CMVM','TOXG','TOXM','RUBG','RUBM','HTLV','CHAGAS']],
 ['tum','Marcadores tumorales',['CYFRA','CA125','CA199','CA153','AFP','CEA','PSA']],['aga','Gases arteriales',[]],['otr','Otros',[]]];
const RLAB={LEU:'Leucocitos (/mm³)',SEG:'Segmentados (%)',ABS:'Abastonados (%)',LINF:'Linfocitos (%)',MONO:'Monocitos (%)',EOS:'Eosinófilos (%)',HB:'Hemoglobina (g/dL)',HTO:'Hematocrito (%)',VCM:'VCM (fL)',PLAQ:'Plaquetas (/mm³)',VSG:'VSG (mm/h)',
 INR:'INR',TP:'TP (s)',TTP:'TTPa (s)',FIB:'Fibrinógeno (mg/dL)',GLU:'Glucosa (mg/dL)',UREA:'Urea (mg/dL)',CREA:'Creatinina (mg/dL)',AU:'Ácido úrico (mg/dL)',NA:'Sodio (mEq/L)',K:'Potasio (mEq/L)',CL:'Cloro (mEq/L)',
 CA:'Calcio (mg/dL)',CAI:'Calcio iónico (mmol/L)',P:'Fósforo (mg/dL)',MG:'Magnesio (mg/dL)',B2M:'β2-microglobulina (mg/L)',PCR:'PCR (mg/dL)',PCT:'Procalcitonina (ng/mL)',DHL:'DHL (U/L)',CPK:'CPK (U/L)',
 FERR:'Ferritina (ng/mL)',HBA1C:'HbA1c (%)',VITD:'Vitamina D (ng/mL)',TGO:'TGO (U/L)',TGP:'TGP (U/L)',FA:'Fosfatasa alcalina (U/L)',GGT:'GGT (U/L)',BT:'Bilirrubina total (mg/dL)',BD:'Bilirrubina directa (mg/dL)',
 BI:'Bilirrubina indirecta (mg/dL)',PT:'Proteínas totales (g/dL)',ALB:'Albúmina (g/dL)',GLOB:'Globulinas (g/dL)',PH:'pH',PCO2:'pCO₂ (mmHg)',PO2:'pO₂ (mmHg)',HCO3:'HCO₃ (mmol/L)',BE:'Exceso de base',
 LAC:'Lactato (mmol/L)',SAT:'SatO₂ (%)',FIO2:'FiO₂ (%)',PAFI:'PaO₂/FiO₂',AG:'Anión gap',KAGA:'K⁺ (AGA)',NAAGA:'Na⁺ (AGA)',CLAGA:'Cl⁻ (AGA)',PROT24:'Proteinuria 24 h (g/24 h)',CREA24:'Creatinuria 24 h (g/24 h)',
 MALB:'Microalbuminuria (mg/24 h)',DEPCR:'Dep. de creatinina (mL/min)',RPC:'Índice prot/creat',COLEST:'Colesterol total (mg/dL)',TRIG:'Triglicéridos (mg/dL)',HDL:'HDL (mg/dL)',LDL:'LDL (mg/dL)',
 T4L:'T4 libre (ng/dL)',TSH:'TSH (µUI/mL)',T3:'T3 (ng/dL)',PTH:'PTH (pg/mL)',BNP:'NT-proBNP (pg/mL)',FE:'Hierro sérico (µg/dL)',TRANSF:'Transferrina (mg/dL)',B12:'Vitamina B12 (pg/mL)',FOL:'Ácido fólico (ng/mL)',
 C3:'C3 (mg/dL)',C4:'C4 (mg/dL)',IGG:'IgG (mg/dL)',IGA:'IgA (mg/dL)',IGM:'IgM (mg/dL)',IGE:'IgE (UI/mL)',OLEU:'Leucocitos (x campo)',OHEM:'Hematíes (x campo)',OPROT:'Proteínas',ODENS:'Densidad',OPH:'pH',
 OBACT:'Bacterias',OCIL:'Cilindros',OCEL:'Células epiteliales',OCOLOR:'Color',OASP:'Aspecto',OTHEV:'Thevenon',OCRIS:'Cristales'};
const NIAB={CREA:'CREA',GLU:'GLU',AU:'AU',CA:'CA',CAI:'CAI',P:'P',MG:'MG',FIB:'FIB',FERR:'FERRITINA',FA:'FA',PT:'PT',ALB:'ALB',LAC:'LAC',PROT24:'PROT 24H',CREA24:'CREAT 24H',MALB:'MICROALB 24H',
 DEPCR:'DEP CREAT',RPC:'IPC',OLEU:'LEU',OHEM:'HEM',OPROT:'PROT',ODENS:'DENS',OPH:'PH',OBACT:'BACT',OCIL:'CIL',OCEL:'CEL EPIT',OCOLOR:'COLOR',OASP:'ASPECTO',OTHEV:'THEVENON',OCRIS:'CRISTALES',
 COLEST:'COL',TRIG:'TG',FE:'FE',TRANSF:'TRANSF',B12:'B12',FOL:'FOLATO',B2M:'B2M',PCO2:'PCO2',PO2:'PO2',HCO3:'HCO3',SAT:'SAT',FIO2:'FIO2',PAFI:'PAFI',AG:'AG',KAGA:'K',NAAGA:'NA',CLAGA:'CL'};
const PCT_K=['SEG','ABS','LINF','MONO','EOS'];
function abbr(k){return NIAB[k]||(LABMAP[k]?LABMAP[k].n:k)}
function rlab(k){if(RLAB[k])return RLAB[k];const d=LABMAP[k];if(!d)return k;const n=/^[A-Z0-9\-\/ .]{1,8}$/.test(d.n)?d.n:d.n.charAt(0)+d.n.slice(1).toLocaleLowerCase('es');return n+(d.u?' ('+d.u.toLowerCase()+')':'')}
function catOf(k){for(const c of CATS)if(c[2].includes(k))return c[0];const a=LABMAP[k]&&LABMAP[k].a;return a==='INMUNO'?'inm':a==='AGA'?'aga':'otr'}
const CATI={};CATS.forEach((c,i)=>CATI[c[0]]=i);
function keyCmp(a,b){return CATI[catOf(a)]-CATI[catOf(b)]||(LABORDER.indexOf(a)-LABORDER.indexOf(b))}
function tblOf(k){const c=catOf(k);return c==='ori'?'ori':(c==='inm'||c==='sero')?'inm':'main'}
const TBLT={main:'LABORATORIO',ori:'EXAMEN DE ORINA',inm:'INMUNOLOGÍA Y SEROLOGÍAS'};
/* todas las filas de labs agrupadas por fecha (misma fecha en varias filas → se juntan) */
function labMap(p,hasta){const M={};p.labs.forEach(l=>{if(!l.fecha||(hasta&&l.fecha>hasta))return;const m=M[l.fecha]=M[l.fecha]||{items:{},fl:{},nota:[]};
  Object.keys(l.items||{}).forEach(k=>{const v=String(l.items[k]??'').trim();if(v){m.items[k]=v;if(l.fl&&l.fl[k])m.fl[k]=l.fl[k]}});if((l.nota||'').trim())m.nota.push(l.nota.trim())});return M}
const PRESETS={pulso:{n:'💉 Pulso',d:'Creatinina, proteinuria 24 h y albúmina, con las columnas de los pulsos',keys:['CREA','PROT24','ALB'],infs:false},
  estudio:{n:'🩺 Estudio',d:'Todo lo que hay en esas fechas, con imágenes e informes',keys:null,infs:true}};
function selOf(hc){if(!hc.sel)hc.sel={preset:hc.tipo==='pulso'?'pulso':'estudio',keys:null,off:[],infs:null,desde:'',pul:true};return hc.sel}
function presentKeys(p,hc){const S=selOf(hc),M=labMap(p,hc.fecha),s=new Set();Object.keys(M).forEach(f=>{if(S.desde&&f<S.desde)return;Object.keys(M[f].items).forEach(k=>s.add(k))});return [...s].sort(keyCmp)}
function selKeys(p,hc){const S=selOf(hc);if(S.keys)return S.keys.slice();const pk=presentKeys(p,hc),P=PRESETS[S.preset]||PRESETS.estudio;return P.keys?P.keys.filter(k=>pk.includes(k)):pk}
function infsIn(p,hc){const S=selOf(hc);return p.informes.filter(r=>(r.titulo||'').trim()||(r.texto||'').trim()).filter(r=>(!r.fecha||r.fecha<=hc.fecha)&&(!S.desde||!r.fecha||r.fecha>=S.desde)).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''))}
function selInfs(p,hc){const S=selOf(hc);if(S.infs)return S.infs.slice();const P=PRESETS[S.preset]||PRESETS.estudio;return P.infs?infsIn(p,hc).map(r=>r.id):[]}
function selDates(p,hc,keys){const S=selOf(hc),M=labMap(p,hc.fecha);return Object.keys(M).filter(f=>(!S.desde||f>=S.desde)&&!S.off.includes(f)&&keys.some(k=>M[f].items[k])).sort()}
function pulAbbr(x){const u=deacc(x.esquema||'');const a=[];if(/METILPRED|MTP|BOLO/.test(u))a.push('MTP');if(/CICLOFOSF|CFM|CYC/.test(u))a.push('CFM');if(/RITUX|RTX/.test(u))a.push('RTX');return a.join('+')||'PULSO'}
function pulNum(p,x){const n=parseInt(x.num);if(n>0)return String(n);return String(pulsosSorted(p).findIndex(y=>y.id===x.id)+1)}
function d6(iso){const[y,m,d]=iso.split('-');return d+'-'+m+'-'+y.slice(2)}
function pulLabel(p,x){return pulNum(p,x)+'° '+pulAbbr(x)+' · '+d6(x.fi)}
function labBuild(p,hc){const S=selOf(hc),keys=selKeys(p,hc),M=labMap(p,hc.fecha);
  const G={main:[],ori:[],inm:[]};keys.slice().sort(keyCmp).forEach(k=>G[tblOf(k)].push(k));const tables=[];
  ['main','ori','inm'].forEach(g=>{const ks=G[g];if(!ks.length)return;const ds=selDates(p,hc,ks);
    const cols=ds.map(f=>({t:'d',f,ord:f+'0'}));
    if(g==='main'&&S.pul)p.pulsos.filter(x=>x.fi&&(x.id===hc.pulsoId||(x.fi<=hc.fecha&&(!S.desde||x.fi>=S.desde)))).forEach(x=>cols.push({t:'p',f:x.fi,txt:pulLabel(p,x),ord:x.fi+'1'}));
    if(!ds.length)return;cols.sort((a,b)=>a.ord.localeCompare(b.ord));
    tables.push({g,title:TBLT[g],keys:ks.filter(k=>ds.some(f=>M[f].items[k])),cols,val:(k,f)=>M[f]?{v:M[f].items[k]||'',b:!!M[f].fl[k]}:{v:'',b:false}})});
  const notas=Object.keys(M).filter(f=>(!S.desde||f>=S.desde)&&!S.off.includes(f)&&M[f].nota.length).sort().map(f=>fmtD(f)+': '+M[f].nota.join(' / '));
  return {tables,notas}}
/* vista previa HTML de las tablas (igual que en el Word) */
function labPreviewHTML(p,hc){const lb=labBuild(p,hc);if(!lb.tables.length)return '<div class="muted">Nada elegido todavía.</div>';
  return lb.tables.map(t=>{const n=t.keys.length;
    const head=`<tr><th>Parámetro</th>${t.cols.map(c=>c.t==='p'?`<th class="pu" rowspan="${n+1}"><span>${esc(c.txt)}</span></th>`:`<th>${c.f.slice(8)}-${c.f.slice(5,7)}<br>${c.f.slice(2,4)}</th>`).join('')}</tr>`;
    const rows=t.keys.map(k=>`<tr><td>${esc(rlab(k))}</td>${t.cols.filter(c=>c.t==='d').map(c=>{const x=t.val(k,c.f);return `<td>${x.b?'<b>'+esc(x.v)+'</b>':esc(x.v)}</td>`}).join('')}</tr>`).join('');
    return `<h4>${t.title}</h4><div class="ltw"><table class="lt">${head}${rows}</table></div>`}).join('')+(lb.notas.length?`<h4>Notas</h4><pre class="note">${esc(lb.notas.join('\n'))}</pre>`:'')}
/* guarda filas leídas en p.labs (+ tamizaje e informes) */
const TZK={HBSAG:'HBSAG',HBC:'ANTI-HBC TOTAL',HBS:'ANTI-HBS',VHC:'ANTI-VHC',VIH:'VIH',VDRL:'VDRL / RPR'};
const IMG_RE=/ECOGRAF|RADIOGRAF|\bRX\b|TOMOGRAF|\bTEM\b|\bTAC\b|RESONANCIA|\bRMN?\b|GAMMAGRAF|DOPPLER|ECOCARDIO|ANGIO|UROGRAF|ELASTOGRAF|DENSITOMETR/;
function saveLabRows(p,rows,texts){let n=0;const fs=new Set();
  rows.forEach(r=>{const v=String(r.v||'').trim();if(!r.fecha||!v||!r.k)return;fs.add(r.fecha);
    if(TZK[r.k]){const c=p.tamiz[TZK[r.k]];if(!c||!c.r||!c.f||c.f<=r.fecha)p.tamiz[TZK[r.k]]={r:up(v),f:r.fecha}}
    let L=p.labs.find(x=>x.fecha===r.fecha);if(!L){L={id:uid(),fecha:r.fecha,items:{},fl:{},nota:'',created:Date.now()};p.labs.push(L)}L.fl=L.fl||{};
    L.items[r.k]=up(v);if(r.fl)L.fl[r.k]=r.fl;else delete L.fl[r.k];n++});
  (texts||[]).forEach(t=>{const T=t.onlyC&&t.concl?t.concl:t.texto;const ex=p.informes.find(i=>i.fecha===t.fecha&&deacc(i.titulo)===deacc(t.titulo));
    if(ex){ex.texto=T;if(!ex.res)ex.res=t.concl||''}else p.informes.push({id:uid(),titulo:t.titulo,fecha:t.fecha,texto:T,res:t.concl||'',img:t.img!=null?!!t.img:IMG_RE.test(deacc(t.titulo)),created:Date.now()})});
  return {n,fechas:[...fs].sort()}}
function migrate(d){Object.values(d.patients||{}).forEach(p=>{p.labs=p.labs||[];p.labs.forEach(l=>{l.items=l.items||{};l.fl=l.fl||{}});
    (p.inmuno||[]).forEach(r=>{if(!r.fecha)return;let L=p.labs.find(x=>x.fecha===r.fecha);if(!L){L={id:r.id||uid(),fecha:r.fecha,items:{},fl:{},nota:'',created:r.created||Date.now()};p.labs.push(L)}
      Object.keys(r.items||{}).forEach(k=>{if(String(r.items[k]||'').trim()&&!L.items[k])L.items[k]=r.items[k]})});p.inmuno=[];
    p.ant=p.ant||{};if(p.ant.hosp==null)p.ant.hosp='';p.pulsos=p.pulsos||[];p.pulsos.forEach(x=>{if(x.num==null)x.num=''});p.tamiz=p.tamiz||{};
    p.informes=p.informes||[];p.informes.forEach(r=>{if(r.res==null)r.res='';if(r.img==null)r.img=IMG_RE.test(deacc(r.titulo||''))});delete p.cols});
  Object.values(d.hcs||{}).forEach(h=>{if(!h.ni)h.ni={basal:'',plan:'',ind:''}});d.ver=2;return d}

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
  B.push({t:'sub',x:'- Hospitalizaciones previas:'},lines(A.hosp).length?{t:'bul',items:lines(A.hosp)}:{t:'p',x:'NIEGA'});
  B.push({t:'sub',x:'- Cirugías previas:'},lines(A.quir).length?{t:'bul',items:lines(A.quir)}:{t:'p',x:'NIEGA'});
  const PR=(A.proc||[]).filter(x=>x.n.trim());if(PR.length)B.push({t:'sub',x:'- Procedimientos previos:'},{t:'bul',items:PR.map(x=>(x.f.trim()?x.f.trim()+': ':'')+x.n.trim()+(x.d.trim()?' — '+x.d.trim():''))});
  B.push({t:'sub',x:'- Medicación habitual:'},lines(A.med).length?{t:'bul',items:lines(A.med)}:{t:'p',x:'NIEGA'});
  B.push({t:'kp',k:'- Alergias: ',x:A.alerg||'NIEGA'});if(A.transf.trim())B.push({t:'kp',k:'- Transfusiones: ',x:A.transf});
  T('EXÁMENES AUXILIARES');if(p.grupo)B.push({t:'kp',k:'GRUPO SANGUÍNEO: ',x:p.grupo});
  const lb=labBuild(p,hc);lb.tables.forEach(t=>B.push({t:'sub',x:t.title},{t:'vtab',tb:t}));if(lb.notas.length)B.push({t:'bul',items:lb.notas});
  if(hc.tipo==='pulso'||p.pulsos.some(x=>x.fi&&x.fi<=hc.fecha)){const act=p.pulsos.find(x=>x.id===hc.pulsoId);const prev=cfmTotal(p,act?act.fi:hc.fecha,false),tot=cfmTotal(p,hc.fecha,true);
    const L=[];if(act)L.push('PULSO ACTUAL: '+pulsoTitle(p,act)+' ('+fechasPalabras(act.fi,act.ff)+').');if(tot)L.push('DOSIS ACUMULADA DE CICLOFOSFAMIDA: '+fmtG(prev)+' PREVIA'+(act&&act.cfm?' / '+fmtG(tot)+' INCLUYENDO EL PULSO ACTUAL':'')+'.');if(L.length)B.push({t:'note',items:L})}
  const tz=TAMIZ.filter(k=>(p.tamiz[k]||{}).r);if(tz.length&&hc.tipo==='pulso'){B.push({t:'sub',x:'TAMIZAJE PRE-INMUNOSUPRESIÓN'},{t:'grid',cols:['EXAMEN','RESULTADO','FECHA'],rows:tz.map(k=>[k,up(p.tamiz[k].r),fmtD(p.tamiz[k].f)])})}
  if(p.biopsia.texto.trim()){B.push({t:'sub',x:'BIOPSIA RENAL'+(p.biopsia.fecha?' '+fmtD(p.biopsia.fecha):'')+':'});lines(p.biopsia.texto).forEach(l=>B.push({t:'p',x:l}))}
  const ids=selInfs(p,hc),inf=infsIn(p,hc).filter(r=>ids.includes(r.id));
  if(inf.length){B.push({t:'sub',x:'IMÁGENES Y OTROS INFORMES'});inf.forEach(r=>B.push({t:'kp',k:up(r.titulo)+(r.fecha?' ('+fmtD(r.fecha)+')':'')+': ',x:(r.res||r.texto||'').trim()}))}
  T('EXAMEN FÍSICO GENERAL');B.push({t:'box',x:hc.exGen});const fv=hc.fv;
  B.push({t:'p',x:['PA: '+(fv.pa||'—')+' MMHG','FC: '+(fv.fc||'—')+' LPM','FR: '+(fv.fr||'—'),'SATO2: '+(fv.sat||'—')+'%','FIO2: '+(fv.fio2||'—'),fv.t&&('T°: '+fv.t+' °C'),fv.peso&&('PESO: '+fv.peso+' KG')].filter(Boolean).join('    '),b:true});
  T('EXAMEN FÍSICO REGIONAL');B.push({t:'kv',rows:EXSEG.map(([k,l])=>[l,hc.ex[k]||'']),wide:true});
  T('IMPRESIÓN DIAGNÓSTICA');B.push({t:'num',items:lines(hc.dx).map(x=>x.replace(/^\s*\d+\s*[.)\-]*\s*/,''))});
  return B;
}
function fmtG(mg){return (mg>=1000?(Math.round(mg/100)/10)+' G':mg+' MG')}
function vtabText(t){const out=[];t.cols.forEach(c=>{if(c.t==='p'){out.push('*** '+c.txt+' ***');return}
  const v=t.keys.map(k=>{const x=t.val(k,c.f).v;return x?abbr(k)+' '+x+(PCT_K.includes(k)&&!/%$/.test(x)?'%':''):''}).filter(Boolean);if(v.length)out.push(fmtD(c.f)+': '+v.join(', '))});return out}
function docText(hc){const out=[];docBlocks(hc).forEach(b=>{switch(b.t){
  case'title':out.push(b.x,'');break;case'h':out.push('',b.x);break;case'sub':out.push(b.x);break;case'p':out.push(b.x);break;case'kp':out.push(b.k+(b.x||''));break;
  case'box':out.push(b.x);break;case'bul':b.items.forEach(i=>out.push('  - '+i));break;case'num':b.items.forEach((i,n)=>out.push((n+1)+'. '+i));break;case'note':b.items.forEach(i=>out.push(i));break;
  case'kv':b.rows.forEach(([k,v])=>out.push(up(k)+': '+(v||'')));break;
  case'vtab':out.push(...vtabText(b.tb));break;
  case'grid':b.rows.forEach(r=>out.push(r.map((v,i)=>i?(b.cols[i]+': '+(v||'—')):v).join(' · ')));break}});
  return up(out.join('\n').replace(/\n{3,}/g,'\n\n'))}

/* ---------- nota de ingreso ---------- */
function niOf(hc){if(!hc.ni)hc.ni={basal:'',plan:'',ind:''};return hc.ni}
const NIG=[['HEMOGRAMA + PCR',['hem','coag','inf']],['AZOADOS Y ELECTROLITOS',['ren']],['AGA',['aga']],['PROTEINURIAS',['r24']],['SEDIMENTO URINARIO',['ori']],['PERFIL HEPÁTICO',['hep']],['INMUNOLOGÍA Y SEROLOGÍAS',['inm','sero']],['OTROS',['lip','met','anem','tum','otr']]];
function niText(hc){const p=DB.patients[hc.dni],A=p.ant,N=niOf(hc),L=[];const e=p.edad||edad(p.fnac,hc.fecha);const sx=/^F/.test(p.sexo||'')?'MUJER':/^M/.test(p.sexo||'')?'VARÓN':'';
  const yy=(hc.fecha||'').slice(0,4);const dm=f=>f.slice(8)+'/'+f.slice(5,7)+(f.slice(0,4)!==yy?'/'+f.slice(2,4):'');const li=s=>lines(s).map(x=>/^[-•]/.test(x)?x.replace(/^[•]\s*/,'- '):'- '+x);
  L.push('NOTA DE INGRESO A NEFROLOGÍA');
  const f=['PACIENTE'+(sx?' '+sx:'')+(e?' DE '+e+' AÑOS':'')];
  if(p.natural||p.procedencia)f.push(p.natural&&p.procedencia?'NATURAL DE '+p.natural+' Y PROCEDENTE DE '+p.procedencia:(p.natural?'NATURAL DE '+p.natural:'PROCEDENTE DE '+p.procedencia));
  if(p.ocupacion)f.push('OCUPACIÓN '+p.ocupacion);if(p.civil)f.push('ESTADO CIVIL '+p.civil);if(p.religion)f.push('RELIGIÓN '+p.religion);
  L.push(f.join(', ')+'.'+(N.basal.trim()?' ESTADO BASAL '+dot(N.basal.trim().replace(/^ESTADO BASAL:?\s*/i,'')):''));
  L.push('ANTECEDENTES:');const med=[...ENFS.filter(x=>A.enf[x]==='SÍ'),...lines(A.otras)];L.push('MÉDICOS: '+(med.length?dot(med.join(', ')):'NIEGA.'));
  const qx=[...lines(A.quir),...(A.proc||[]).filter(x=>x.n.trim()).map(x=>x.n.trim()+(x.d.trim()?' ('+x.d.trim()+')':'')+(x.f.trim()?' '+x.f.trim():''))];L.push('QUIRÚRGICOS: '+(qx.length?qx.map(dot).join(' '):'NIEGA.'));
  L.push('HOSPITALIZACIONES: '+(lines(A.hosp).length?lines(A.hosp).map(dot).join(' '):'NIEGA.'));L.push('ALERGIAS: '+dot(A.alerg||'NIEGA'));
  if(A.transf.trim())L.push('TRANSFUSIONES: '+dot(A.transf));L.push('MEDICACIÓN HABITUAL: '+(lines(A.med).length?lines(A.med).map(dot).join(' '):'NIEGA.'));
  L.push('HISTORIA DE LA ENFERMEDAD:');const te=[hc.tiempo&&'TIEMPO DE ENFERMEDAD: '+dot(hc.tiempo),hc.sintomas&&'SÍNTOMAS PRINCIPALES: '+dot(hc.sintomas)].filter(Boolean);if(te.length)L.push(te.join(' '));if(hc.hea.trim())L.push(hc.hea.trim());
  const fv=hc.fv;L.push('AL EXAMEN FÍSICO');L.push([fv.pa&&'PA: '+fv.pa+' MMHG',fv.fc&&'FC: '+fv.fc+' LPM',fv.fr&&'FR: '+fv.fr+' RPM',fv.t&&'T°: '+fv.t+' °C',fv.sat&&'SATO2: '+fv.sat+'%',fv.fio2&&'FIO2: '+fv.fio2,fv.peso&&'PESO: '+fv.peso+' KG'].filter(Boolean).join(', ')||'PA: —');
  L.push('GENERAL: '+dot(hc.exGen));EXSEG.forEach(([k,l])=>{if((hc.ex[k]||'').trim())L.push(l+': '+dot(hc.ex[k]))});
  const keys=selKeys(p,hc),M=labMap(p,hc.fecha),ex=[];
  NIG.forEach(([t,cs])=>{const ks=keys.filter(k=>cs.includes(catOf(k))).sort(keyCmp);if(!ks.length)return;const ds=selDates(p,hc,ks).reverse();if(!ds.length)return;ex.push(t+':');
    ds.forEach(f=>ex.push(dm(f)+': '+ks.filter(k=>M[f].items[k]).map(k=>abbr(k)+' '+M[f].items[k]+(PCT_K.includes(k)&&!/%$/.test(M[f].items[k])?'%':'')).join(' ')))});
  if(p.biopsia.texto.trim())ex.push('BIOPSIA RENAL'+(p.biopsia.fecha?' '+dm(p.biopsia.fecha):'')+': '+dot(lines(p.biopsia.texto)[0]));
  const ids=selInfs(p,hc),inf=infsIn(p,hc).filter(r=>ids.includes(r.id));if(inf.length){ex.push('IMÁGENES:');inf.forEach(r=>ex.push(up(r.titulo)+(r.fecha?' '+dm(r.fecha):'')+': '+dot((r.res||r.texto||'').trim())))}
  if(ex.length)L.push('EXÁMENES AUXILIARES:',...ex);
  L.push('PROBLEMAS:',...(lines(hc.dx).length?lines(hc.dx).map(x=>'- '+x.replace(/^\s*\d+\s*[.)\-]*\s*/,'')):['-']));
  L.push('PLAN:',...(li(N.plan).length?li(N.plan):['-']));L.push('INDICACIONES:',...(li(N.ind).length?li(N.ind):['-']));
  return up(L.join('\n'))}

/* ---------- navegación / estado ---------- */
let R={v:'inicio',hid:null,tab:null,q:'',modo:null};let CUR=null,saveT=null;
function go(v,extra){Object.assign(R,{v,tab:null},extra||{});render();window.scrollTo(0,0)}
function render(){const nav={inicio:['inicio','nueva','importHC','hc'],pac:['pacientes'],aj:['ajustes']};Object.keys(nav).forEach(k=>$('#nav-'+k).classList.toggle('on',nav[k].includes(R.v)));
  CUR=null;document.querySelector('.bar')?.remove();$('#app').innerHTML={inicio:vInicio,nueva:vNueva,importHC:()=>vImportHC(),hc:vHC,pacientes:vPacientes,ajustes:vAjustes}[R.v]();if(CUR&&CUR.mount)CUR.mount();if(CUR&&CUR.preview)CUR.preview()}
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
  if(d.lab){const L=p.labs.find(l=>l.id===d.lab);if(d.k==='fecha')L.fecha=t.value;else if(d.k==='nota')L.nota=up(t.value);else{L.items[d.k]=up(t.value).trim();if(L.fl&&!L.items[d.k])delete L.fl[d.k]}touch();if(d.k==='fecha'&&ev.type==='change')rerender();return}
  if(d.sel){const S=selOf(CUR.hc);if(d.sel==='desde'){if(ev.type!=='change')return;S.desde=t.value}else if(d.sel==='pul')S.pul=t.checked;touch();return rerender()}
  if(d.selinf){const S=selOf(CUR.hc);if(!S.infs)S.infs=selInfs(p,CUR.hc);S.infs=t.checked?[...new Set([...S.infs,d.selinf])]:S.infs.filter(x=>x!==d.selinf);touch();return rerender()}
  if(d.pul){const x=p.pulsos.find(y=>y.id===d.pul);x[d.k]=d.k==='esquema'||d.k==='nota'?up(t.value):d.k==='num'?t.value.replace(/\D/g,''):t.value;touch();if(ev.type==='change'&&(d.k==='fi'||d.k==='num'))rerender();return}
  if(d.tz){p.tamiz[d.tz]=p.tamiz[d.tz]||{r:'',f:''};p.tamiz[d.tz][d.k]=d.k==='r'?up(t.value):t.value;return touch()}
  if(d.proc){const x=(p.ant.proc||[]).find(y=>y.id===d.proc);x[d.k]=up(t.value);return touch()}
  if(d.inf){const r=p.informes.find(y=>y.id===d.inf);r[d.k]=d.k==='img'?t.checked:d.k==='fecha'?t.value:up(t.value);return touch()}
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
    return `<div class="card pt" style="cursor:pointer" onclick="go('hc',{hid:'${h.id}'})"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(h.dni)} · ${fmtD(h.fecha)} · ${h.tipo==='pulso'?(pu?esc(ordinalOf(p,pu))+' PULSO':'PULSO'):'GENERAL'}</div></div><div class="row"><span class="badge ${h.tipo==='pulso'?'b-ok':'b-alta'}">${h.tipo==='pulso'?'Pulso':'General'}</span><button class="btn sm bad" onclick="event.stopPropagation();delHC('${h.id}')">✕</button></div></div>`}).join('')||'<div class="card muted">Aún no hay historias. Toca “Nueva historia clínica”.</div>'}`}
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
  <div class="card"><div class="pt"><div><h3 style="margin:0">📄 Partir de una HC antigua</h3><div class="muted">Sube su HC anterior en Word (.docx): llena filiación, antecedentes, labs${modo==='pulso'?', pulsos':''}, biopsia, informes, examen y diagnósticos.</div></div>
   <label class="btn pri" style="margin:0;font-size:16px;color:var(--pri-ink)">Subir Word<input type="file" accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" style="display:none" onchange="importHCFile(this.files[0])"></label></div><div id="impBusy" class="muted"></div></div>
  ${DB.patients[q]?'':`<div class="card"><h2>Paciente nuevo</h2><div class="grid w2"><div><label>DNI / CE</label><input id="nDni" value="${isDoc?esc(q):''}" inputmode="numeric" autocomplete="off"></div>
   <div><label>Apellidos y nombres</label><input id="nNom" value="${isDoc?'':esc(up(q))}" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase"></div></div>
   <div class="row" style="margin-top:12px"><button class="btn pri" onclick="createPatient()">Crear HC</button></div></div>`}`}
function createPatient(){const dni=$('#nDni').value.trim().replace(/\s/g,''),nom=up($('#nNom').value).trim().replace(/\s+/g,' ');
  if(!/^[0-9A-Za-z]{6,12}$/.test(dni))return toast('Ingresa un DNI/CE válido');if(!nom)return toast('Ingresa apellidos y nombres');if(DB.patients[dni])return toast('Ese DNI ya existe; búscalo arriba');
  DB.patients[dni]=newPatient(dni,nom);startHC(dni)}
function startHC(dni){const hc=newHC(dni,R.modo);DB.hcs[hc.id]=hc;save();go('hc',{hid:hc.id,tab:hc.prevId?(hc.tipo==='pulso'?'pulsos':'anam'):'fil'})}

/* ---- Editor de HC ---- */
function tabsFor(hc){return [['fil','Filiación'],['anam','Anamnesis'],['ant','Antecedentes'],['labs','Laboratorio'],...(hc.tipo==='pulso'?[['pulsos','Pulsos']]:[]),['inm','Tamizaje'],['inf','Biopsia e informes'],['ex','Examen'],['dx','Diagnóstico'],['doc','Documento'],['ni','Nota de ingreso']]}
function missing(hc){const p=DB.patients[hc.dni],M=[];if(!hc.hea.trim())M.push('Historia de la enfermedad');if(!hc.fv.pa)M.push('Funciones vitales');if(!lines(hc.dx).length)M.push('Impresión diagnóstica');
  if(!p.labs.length)M.push('Laboratorio');if(hc.tipo==='pulso'){const act=p.pulsos.find(x=>x.id===hc.pulsoId);if(act&&!act.esquema.trim())M.push('Esquema del pulso actual');
    const tz=TAMIZ.slice(0,5).filter(k=>!(p.tamiz[k]||{}).r);if(tz.length)M.push('Tamizaje: '+tz.join(', '))}return M}
function vHC(){const hc=DB.hcs[R.hid];if(!hc){R.v='inicio';return vInicio()}const p=DB.patients[hc.dni];const tab=R.tab||'fil';
  CUR={hc,preview(){const el=$('#prev');if(el)el.textContent=docText(hc);const ni=$('#niprev');if(ni)ni.textContent=niText(hc);const lt=$('#ltprev');if(lt)lt.innerHTML=labPreviewHTML(p,hc)},click:hcClick,mount(){bar(`<button class="btn" onclick="go('inicio')">← Inicio</button><button class="btn pri" onclick="exportWord('${hc.id}')">Word</button><button class="btn" onclick="exportTxt('${hc.id}')">TXT</button>`);if(tab==='labs')mountLabImport()}};
  const M=missing(hc);
  const head=`<div class="card"><div class="pt"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)} · HC ${hc.tipo==='pulso'?'💉 PULSO':'🩺 GENERAL'} · ${fmtD(hc.fecha)}</div></div>
   <span class="badge ${M.length?'b-pend':'b-copy'}" title="${esc(M.join(', '))}">${M.length?'Faltan '+M.length:'Completa'}</span></div>${M.length?`<div class="muted" style="margin-top:6px">Falta: ${esc(M.join(' · '))}</div>`:''}</div>
   <div class="tabs">${tabsFor(hc).map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(tab==='fil')body=`<div class="card"><h3>Paciente</h3><div class="grid w2">${F('p.nombre','Apellidos y nombres','data-up')}<div><label>DNI / CE</label><div class="row" style="flex-wrap:nowrap"><input value="${esc(p.dni)}" disabled style="flex:1"><button class="btn sm" onclick="changeDni('${esc(p.dni)}')">Cambiar DNI</button></div></div></div>
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
   <div class="card"><h3>Hospitalizaciones previas</h3>${TA('p.ant.hosp','Una por línea (fecha + motivo)',4,'04/2026: NEUMONÍA\n2025: PERITONITIS EN 02 OPORTUNIDADES')}</div>
   <div class="card"><h3>Procedimientos previos</h3>${(A.proc||[]).map(x=>`<div class="grid" style="grid-template-columns:150px 1fr 1fr auto;align-items:end;margin-bottom:6px"><div><label>Fecha / tiempo</label><input data-proc="${x.id}" data-k="f" value="${esc(x.f)}" placeholder="03/2024 · HACE 5 AÑOS" style="text-transform:uppercase"></div>
     <div><label>Procedimiento</label><input data-proc="${x.id}" data-k="n" value="${esc(x.n)}" style="text-transform:uppercase"></div><div><label>Detalle / resultado</label><input data-proc="${x.id}" data-k="d" value="${esc(x.d)}" placeholder="YUGULAR DER. / RETIRADO / GMN MEMBRANOSA" style="text-transform:uppercase"></div>
     <button class="btn sm bad" data-act="procDel" data-id="${x.id}">✕</button></div>`).join('')||'<div class="muted">Ninguno registrado.</div>'}
    <div class="chips" style="margin-top:8px">${PROC_CHIPS.map(c=>`<button class="chip" data-act="procAdd" data-v="${esc(c)}">+ ${esc(c)}</button>`).join('')}<button class="chip" data-act="procAdd" data-v="">+ Otro</button></div></div>
   <div class="card">${TA('p.ant.quir','Cirugías previas (una por línea)',3)}<div style="height:8px"></div>${TA('p.ant.med','Medicación habitual (una por línea)',5)}
   <div class="grid w2" style="margin-top:8px">${F('p.ant.alerg','Alergias','data-up')}${F('p.ant.transf','Transfusiones','data-up')}</div></div>`}
  if(tab==='labs')body=labsTab(hc,p);
  if(tab==='pulsos')body=pulsosTab(hc,p);
  if(tab==='inm')body=inmTab(hc,p);
  if(tab==='ni')body=niTab(hc,p);
  if(tab==='inf')body=`<div class="card"><h3>Biopsia renal</h3><div class="grid"><div><label>Fecha</label><input type="date" data-p="p.biopsia.fecha" value="${esc(p.biopsia.fecha)}"></div></div>
   <div style="margin-top:8px">${TA('p.biopsia.texto','Informe (pégalo completo: diagnóstico, microscopía, histoquímica, IF, nota)',10)}</div></div>
   <div class="card"><h3>Imágenes y otros informes</h3><p class="muted" style="margin-top:0">Cuáles salen en la HC se elige en Laboratorio → paso 2.</p>${p.informes.map(r=>`<div class="dx"><div class="grid w2"><div><label>Título</label><input data-inf="${r.id}" data-k="titulo" value="${esc(r.titulo)}" style="text-transform:uppercase" placeholder="ECOGRAFÍA RENAL"></div><div><label>Fecha</label><input type="date" data-inf="${r.id}" data-k="fecha" value="${esc(r.fecha)}"></div></div>
     <label class="chk" style="margin-top:8px"><input type="checkbox" data-inf="${r.id}" data-k="img" ${r.img?'checked':''}> Es imagen</label><label style="margin-top:8px">Resultado completo</label><textarea data-inf="${r.id}" data-k="texto" rows="4">${esc(r.texto)}</textarea><label style="margin-top:8px">Resumen para la HC (vacío = completo)</label><textarea data-inf="${r.id}" data-k="res" rows="2">${esc(r.res||'')}</textarea><div class="row" style="margin-top:6px"><span class="sp"></span><button class="btn sm bad" data-act="infDel" data-id="${r.id}">Quitar</button></div></div>`).join('')||'<div class="muted">Sin informes.</div>'}
   <button class="btn sm" style="margin-top:8px" data-act="infAdd">+ Agregar informe</button></div>`;
  if(tab==='ex')body=`<div class="card"><h3>Examen físico general</h3>${TA('exGen','',3)}<div class="grid" style="margin-top:10px">${F('fv.pa','PA (mmHg)','placeholder="120/80"')}${F('fv.fc','FC (lpm)',NUM)}${F('fv.fr','FR (rpm)',NUM)}${F('fv.sat','SatO2 (%)',NUM)}${F('fv.fio2','FiO2',NUM)}${F('fv.t','T° (°C)',NUM)}${F('fv.peso','Peso (kg)',NUM)}</div></div>
   <div class="card"><h3>Examen físico regional</h3><p class="muted" style="margin-top:0">${hc.prevId?'Viene de la HC anterior.':'Viene con el texto normal.'} Edita solo lo anormal.</p>
   ${EXSEG.map(([k,l])=>`<div class="ex-lbl"><label>${l}</label><button class="link" data-act="exReset" data-k="${k}">↺ Normal</button></div><textarea data-p="ex.${k}" rows="2">${esc(hc.ex[k]||'')}</textarea>`).join('')}</div>`;
  if(tab==='dx')body=`<div class="card"><h3>Impresión diagnóstica</h3><p class="muted" style="margin-top:0">Una por línea (se numeran solas).</p>${TA('dx','',8,'SÍNDROME NEFRÓTICO\nGLOMERULONEFRITIS MEMBRANOSA')}</div>`;
  if(tab==='doc')body=`<div class="card"><h3>Vista previa (texto)</h3><pre class="note" id="prev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" onclick="exportWord('${hc.id}')">Word</button><button class="btn" onclick="exportTxt('${hc.id}')">TXT</button><button class="btn" data-act="copy">Copiar</button><span class="sp"></span><button class="btn bad sm" data-act="delHC">Eliminar esta HC</button></div></div>`;
  return head+body}
async function hcClick(a,d){const hc=CUR.hc,p=DB.patients[hc.dni];
  const done=()=>{p.updated=Date.now();hc.updated=Date.now();save();rerender()};
  if(a==='mayus'){hc.hea=up(hc.hea);return done()}
  if(a==='enf'){p.ant.enf[d.e]=d.v;return done()}
  if(a==='exReset'){hc.ex[d.k]=DB.settings.ex[d.k];return done()}
  if(a==='copy')return copyText(docText(hc)).then(o=>toast(o?'HC copiada':'No se pudo copiar'));
  if(a==='delHC')return delHC(hc.id);
  if(a==='labAdd'){p.labs.push({id:uid(),fecha:hc.fecha,items:{},fl:{},nota:'',created:Date.now()});return done()}
  if(a==='labKey'){const L=p.labs.find(l=>l.id===d.id),k=$('#ak_'+d.id).value;if(k&&L.items[k]==null)L.items[k]='';return done()}
  if(a==='lastOk'){LS.last=null;return rerender()}
  if(a==='selPreset'){const S=selOf(hc);S.preset=d.v;S.keys=null;S.infs=null;S.off=[];return done()}
  if(a==='selKey'){const S=selOf(hc);if(!S.keys)S.keys=selKeys(p,hc);S.keys=S.keys.includes(d.k)?S.keys.filter(k=>k!==d.k):[...S.keys,d.k];return done()}
  if(a==='selCat'){const S=selOf(hc);const cur=selKeys(p,hc),ks=presentKeys(p,hc).filter(k=>catOf(k)===d.c);S.keys=ks.every(k=>cur.includes(k))?cur.filter(k=>!ks.includes(k)):[...new Set([...cur,...ks])];return done()}
  if(a==='selDate'){const S=selOf(hc);S.off=S.off.includes(d.f)?S.off.filter(x=>x!==d.f):[...S.off,d.f];return done()}
  if(a==='niCopy')return copyText(niText(hc)).then(o=>toast(o?'Nota de ingreso copiada':'No se pudo copiar'));
  if(a==='niTxt')return exportNiTxt(hc.id);
  if(a==='labDel'){if(!await ask('¿Eliminar esta fila?'))return;p.labs=p.labs.filter(l=>l.id!==d.id);return done()}
  if(a==='pulAdd'){p.pulsos.push({id:uid(),fi:'',ff:'',esquema:'',cfm:'',nota:'',created:Date.now()});return done()}
  if(a==='pulDel'){if(d.id===hc.pulsoId)return toast('Es el pulso de esta HC; no se puede quitar aquí');if(!await ask('¿Eliminar este pulso?'))return;p.pulsos=p.pulsos.filter(x=>x.id!==d.id);return done()}
  if(a==='esq'){const x=p.pulsos.find(y=>y.id===d.id);const v=d.v;x.esquema=up((v.startsWith('+')?(x.esquema.trim()+' '+v):(x.esquema.trim()?x.esquema.trim()+' + '+v:v)).trim());const m=v.match(/CICLOFOSFAMIDA (\d+(?:\.\d+)?) ?(G|MG)/);if(m&&!x.cfm)x.cfm=String(m[2]==='G'?parseFloat(m[1])*1000:m[1]);return done()}
  if(a==='procAdd'){p.ant.proc=p.ant.proc||[];p.ant.proc.push({id:uid(),f:'',n:d.v||'',d:''});return done()}
  if(a==='procDel'){p.ant.proc=(p.ant.proc||[]).filter(x=>x.id!==d.id);return done()}
  if(a==='infAdd'){p.informes.push({id:uid(),titulo:'',fecha:'',texto:'',res:'',img:true,created:Date.now()});return done()}
  if(a==='infDel'){if(!await ask('¿Quitar este informe?'))return;p.informes=p.informes.filter(r=>r.id!==d.id);return done()}
  if(a==='parse'){LS.text=$('#ltext').value;const r=parseLabs(LS.text,LS.fecha||hc.fecha);LS.rows=r.rows.map(x=>({...x,on:true}));LS.unk=r.unk;rerender();if(!LS.rows.length)toast('No reconocí resultados');return}
  if(a==='lclear'){LS={text:'',rows:null,unk:[],fecha:hc.fecha,busy:'',last:null};return rerender()}
  if(a==='lclaude'){return copyText(CLAUDE_PROMPT+anonLabText($('#ltext').value)).then(o=>toast(o?'Copiado sin nombre/DNI. Pega la respuesta de Claude en el cuadro':'No se pudo copiar'))}
  if(a==='lsave'){const rows=(LS.rows||[]).filter(r=>r.on&&String(r.v).trim()&&r.fecha),tx=(LS.texts||[]).filter(t=>t.on);if(!rows.length&&!tx.length)return toast('Nada que guardar');
    const r=saveLabRows(p,rows,tx);LS={text:'',rows:null,unk:[],fecha:LS.fecha,busy:'',last:null};toast(r.n+' valores'+(tx.length?' y '+tx.length+' informe(s)':'')+' guardados. Elige abajo qué sale en la HC');return done()}
}

/* ---- pestaña Laboratorio: 1 subir · 2 elegir · 3 tabla ---- */
let LS={text:'',rows:null,unk:[],fecha:null,busy:'',last:null};
function labsTab(hc,p){if(!LS.fecha)LS.fecha=hc.fecha;const S=selOf(hc);const M=labMap(p,hc.fecha);
  const fechas=Object.keys(M).filter(f=>!S.desde||f>=S.desde).sort().reverse();const pk=presentKeys(p,hc),keys=selKeys(p,hc),ids=selInfs(p,hc),infs=infsIn(p,hc);
  const opts=LABDEF.map(d=>`<option value="${d[0]}">${d[1]} · ${AREAS[d[2]]}</option>`).join('');const lst=LS.last;
  const s1=`<div class="card"><h3>1 · Subir resultados</h3><p class="muted" style="margin-top:0">PDF del ESSI: se leen y se guardan solos, con la <b>fecha de resultado</b> y los valores fuera de rango marcados (salen en negrita). Puedes subir varios a la vez.</p>
   <div class="row"><label class="btn pri" style="margin:0;font-size:16px;color:var(--pri-ink)">📄 PDF del ESSI<input id="lpdf" type="file" accept="application/pdf" multiple style="display:none"></label>
   <label class="btn" style="margin:0;color:var(--ink);font-size:16px">📷 Fotos<input id="lfotos" type="file" accept="image/*" multiple style="display:none"></label></div>
   <div id="lbusy" class="muted" style="margin-top:8px">${esc(LS.busy)}</div><div class="prog" ${LS.busy?'':'hidden'}><i id="lprog"></i></div>
   ${lst?`<div class="alert a-info" style="margin-top:8px">✓ ${lst.ne} PDF: <b>${lst.n} valores</b> guardados${lst.fechas.length?' ('+lst.fechas.length+' fecha(s): '+fmtD(lst.fechas[0])+(lst.fechas.length>1?' → '+fmtD(lst.fechas[lst.fechas.length-1]):'')+')':''}${lst.texts?' · '+lst.texts+' informe(s)':''}.
     ${lst.pend.length?`<br>Aún sin resultado: ${esc(lst.pend.map(x=>x.titulo).join(', '))}.`:''}${lst.unk.length?`<details style="margin-top:4px"><summary>No reconocidos (${lst.unk.length})</summary><pre class="note">${esc(lst.unk.join('\n'))}</pre></details>`:''}
     <button class="link" data-act="lastOk">Ocultar</button></div>`:''}
   <details style="margin-top:10px" ${LS.text||LS.rows?'open':''}><summary>Pegar texto (otro laboratorio, foto, Texto en vivo)</summary>
   <div class="grid" style="margin-top:8px"><div><label>Fecha si el texto no trae</label><input id="lfecha" type="date" value="${LS.fecha}"></div></div>
   <textarea id="ltext" rows="6" style="margin-top:8px" placeholder="Pega aquí los resultados…">${esc(LS.text)}</textarea>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-act="parse">Procesar</button><button class="btn" data-act="lclear">Limpiar</button><span class="sp"></span><button class="btn sm" data-act="lclaude">Copiar para Claude (sin nombre/DNI)</button></div>
   ${LS.rows||LS.texts?`<h4>Revisar (${(LS.rows||[]).length} valores)</h4><table class="rev"><tr><th></th><th>Fecha</th><th>Examen</th><th>Valor</th></tr>${(LS.rows||[]).map((r,i)=>`<tr><td><input type="checkbox" ${r.on?'checked':''} onchange="LS.rows[${i}].on=this.checked"></td><td><input type="date" value="${r.fecha}" onchange="LS.rows[${i}].fecha=this.value"></td>
    <td><select onchange="LS.rows[${i}].k=this.value">${opts.replace(`value="${r.k}"`,`value="${r.k}" selected`)}</select></td><td><input value="${esc(r.v)}" oninput="LS.rows[${i}].v=this.value"></td></tr>`).join('')}</table>
    ${revExtraHTML(LS,'LS','Solo informativo: aún no tienen resultado.')}
    <div class="row" style="margin-top:8px"><button class="btn pri" data-act="lsave">Guardar</button></div>${(LS.unk||[]).length?`<details style="margin-top:8px"><summary>No reconocidas (${LS.unk.length})</summary><pre class="note">${esc(LS.unk.join('\n'))}</pre></details>`:''}`:''}</details></div>`;
  const pre=Object.keys(PRESETS).map(k=>`<button class="btn ${S.preset===k&&!S.keys&&!S.infs?'pri':''}" data-act="selPreset" data-v="${k}" title="${esc(PRESETS[k].d)}">${PRESETS[k].n}</button>`).join('');
  const cats=CATS.map(([c,n])=>{const ks=pk.filter(k=>catOf(k)===c);if(!ks.length)return'';const all=ks.every(k=>keys.includes(k));
    return `<div class="dx"><div class="pt"><b>${n}</b><button class="link" data-act="selCat" data-c="${c}">${all?'Quitar todos':'Elegir todos'}</button></div><div class="chips" style="margin-top:6px">${ks.map(k=>{const nd=Object.keys(M).filter(f=>(!S.desde||f>=S.desde)&&M[f].items[k]).length;
      return `<button class="chip ${keys.includes(k)?'on':''}" data-act="selKey" data-k="${k}">${esc(rlab(k).replace(/\s*\(.*\)$/,''))} <span class="cnt">${nd}</span></button>`}).join('')}</div></div>`}).join('');
  const s2=`<div class="card"><h3>2 · Elegir qué va en la HC</h3>
   <div class="row">${pre}<span class="sp"></span><div><label>Desde</label><input type="date" data-sel="desde" value="${esc(S.desde)}" style="width:170px"></div></div>
   ${p.pulsos.some(x=>x.fi)?`<label class="chk" style="margin-top:10px"><input type="checkbox" data-sel="pul" ${S.pul?'checked':''}> Columnas amarillas de los pulsos en la tabla</label>`:''}
   <h4>Fechas ${fechas.length?`<span class="muted">(toca para quitar/poner)</span>`:''}</h4>${fechas.length?`<div class="chips">${fechas.map(f=>`<button class="chip ${S.off.includes(f)?'':'on'}" data-act="selDate" data-f="${f}">${fmtD(f)}</button>`).join('')}</div>`:'<div class="muted">Aún no hay análisis guardados.</div>'}
   ${pk.length?`<h4>Exámenes</h4>${cats}`:''}
   ${infs.length?`<h4>Imágenes e informes</h4>${infs.map(r=>{const on=ids.includes(r.id);return `<div class="dx"><label class="chk"><input type="checkbox" data-selinf="${r.id}" ${on?'checked':''}> <b>${esc(r.titulo||'(sin título)')}</b> <span class="muted">${fmtD(r.fecha)}</span></label>
     ${on?`<label style="margin-top:6px">Resumen que va en la HC</label><textarea data-inf="${r.id}" data-k="res" rows="2" placeholder="Vacío = texto completo">${esc(r.res||'')}</textarea><details><summary class="muted">Texto completo</summary><pre class="note">${esc(r.texto)}</pre></details>`:''}</div>`}).join('')}`:''}</div>`;
  const s3=`<div class="card"><h3>3 · Tabla para la HC</h3><div id="ltprev">${labPreviewHTML(p,hc)}</div>
   <details style="margin-top:12px"><summary>Editar valores guardados (${p.labs.length} fecha(s))</summary><div class="row" style="margin:8px 0"><button class="btn sm pri" data-act="labAdd">+ Fecha</button></div>
   ${p.labs.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(l=>`<div class="dx"><div class="pt"><input type="date" data-lab="${l.id}" data-k="fecha" value="${l.fecha}" style="width:170px"><button class="btn sm bad" data-act="labDel" data-id="${l.id}">✕ Fecha</button></div>
     <div class="grid" style="margin-top:8px">${Object.keys(l.items).sort(keyCmp).map(k=>`<div><label>${esc(rlab(k))}${l.fl&&l.fl[k]?' ⚑':''}</label><input data-lab="${l.id}" data-k="${k}" value="${esc(l.items[k])}" style="text-transform:uppercase"></div>`).join('')}</div>
     <div class="row" style="margin-top:8px"><select id="ak_${l.id}" style="width:220px"><option value="">+ examen…</option>${opts}</select><button class="btn sm" data-act="labKey" data-id="${l.id}">Agregar</button></div>
     <label style="margin-top:6px">Nota (sale debajo de la tabla)</label><input data-lab="${l.id}" data-k="nota" value="${esc(l.nota||'')}" style="text-transform:uppercase"></div>`).join('')}</details></div>`;
  return s1+s2+s3}

/* ---- pestaña Pulsos ---- */
function pulsosTab(hc,p){const ps=pulsosSorted(p);const act=p.pulsos.find(x=>x.id===hc.pulsoId);const prev=cfmTotal(p,act&&act.fi?act.fi:hc.fecha,false),tot=cfmTotal(p,'9999-12-31',true);
  return `<div class="card"><h3>Registro de pulsos</h3><p class="muted" style="margin-top:0">Agrégalos en cualquier orden y pon tú el N°: la app los ordena por fecha de inicio y los pone como columnas amarillas en la tabla de labs.</p>
   <div class="alert a-info">CFM acumulada previa: <b>${fmtG(prev)}</b>${act&&act.cfm?` · con el pulso actual: <b>${fmtG(prev+(parseFloat(act.cfm)||0))}</b>`:''} · total registrado: ${fmtG(tot)}</div>
   ${ps.map((x,i)=>{const isA=x.id===hc.pulsoId;return `<div class="dx" style="${isA?'border:2px solid var(--pri)':''}"><div class="pt"><b>${x.fi?esc(pulLabel(p,x)):'Pulso sin fecha'}${isA?' · ACTUAL (esta HC)':''}</b>${isA?'':`<button class="btn sm bad" data-act="pulDel" data-id="${x.id}">✕</button>`}</div>
    <div class="grid" style="margin-top:8px"><div><label>N° de pulso</label><input data-pul="${x.id}" data-k="num" value="${esc(x.num||'')}" inputmode="numeric" placeholder="${i+1}"></div><div><label>Inicio</label><input type="date" data-pul="${x.id}" data-k="fi" value="${esc(x.fi)}"></div><div><label>Fin</label><input type="date" data-pul="${x.id}" data-k="ff" value="${esc(x.ff)}"></div><div><label>Ciclofosfamida (mg)</label><input data-pul="${x.id}" data-k="cfm" value="${esc(x.cfm)}" ${NUM}></div></div>
    <label style="margin-top:8px">Esquema / fármacos</label><input data-pul="${x.id}" data-k="esquema" value="${esc(x.esquema)}" style="text-transform:uppercase" placeholder="MTP 500 MG EV X 3 DÍAS + CICLOFOSFAMIDA 500 MG">
    <div class="chips" style="margin-top:6px">${ESQ_CHIPS.map(c=>`<button class="chip" data-act="esq" data-id="${x.id}" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <label style="margin-top:8px">Nota (opcional)</label><input data-pul="${x.id}" data-k="nota" value="${esc(x.nota)}" style="text-transform:uppercase" placeholder="TOLERÓ BIEN / REACCIÓN…">
    <div class="muted" style="margin-top:6px">En el texto: ${esc(pulsoTitle(p,x))} — ${esc(fechasPalabras(x.fi,x.ff)||'sin fechas')}</div></div>`}).join('')}
   <button class="btn sm" data-act="pulAdd">+ Agregar pulso</button></div>`}

/* ---- pestaña Tamizaje ---- */
function inmTab(hc,p){return `<div class="card"><h3>Tamizaje pre-inmunosupresión</h3><p class="muted" style="margin-top:0">Se llena solo con las serologías de los PDF del ESSI. La inmunología (ANA, ANCA, C3/C4…) ahora está en Laboratorio.${hc.tipo==='pulso'?' En una HC de pulso, los 5 primeros salen como “falta” si están vacíos.':''}</p>
   ${TAMIZ.map(k=>`<div class="grid" style="grid-template-columns:1.3fr 1fr 150px;align-items:end;margin-bottom:6px"><div style="font-weight:600;font-size:14px">${k}</div><input data-tz="${k}" data-k="r" value="${esc((p.tamiz[k]||{}).r||'')}" placeholder="NO REACTIVO" style="text-transform:uppercase"><input type="date" data-tz="${k}" data-k="f" value="${esc((p.tamiz[k]||{}).f||'')}"></div>`).join('')}</div>`}

/* ---- pestaña Nota de ingreso ---- */
function niTab(hc,p){niOf(hc);return `<div class="card"><h3>Nota de ingreso a Nefrología</h3><p class="muted" style="margin-top:0">Se arma sola con la HC: filiación, antecedentes (con hospitalizaciones), historia, examen, los análisis e imágenes que elegiste en Laboratorio (más reciente primero) y los diagnósticos como problemas. Aquí solo completa lo propio de la nota.</p>
   ${TA('ni.basal','Estado basal / cómo ingresa',2,'INDEPENDIENTE. INGRESA CON VÍA VENOSA PERIFÉRICA.')}<div style="height:8px"></div>
   ${TA('ni.plan','Plan (uno por línea)',4,'SE SOLICITAN EXÁMENES DE RUTINA')}<div style="height:8px"></div>${TA('ni.ind','Indicaciones (una por línea)',8,'DIETA HIPOSÓDICA\nOMEPRAZOL 20 MG VO C/24H')}</div>
   <div class="card"><h3>Vista previa</h3><pre class="note" id="niprev"></pre><div class="row" style="margin-top:10px"><button class="btn pri" data-act="niCopy">Copiar</button><button class="btn" data-act="niTxt">TXT</button></div></div>`}
function exportNiTxt(id){const hc=DB.hcs[id],p=DB.patients[hc.dni];saveFile(new Blob(['﻿'+niText(hc).replace(/\r?\n/g,'\r\n')],{type:'text/plain;charset=utf-8'}),'NOTA INGRESO '+p.nombre.replace(/[^A-ZÑÁÉÍÓÚ ]/gi,'').trim()+' '+hc.fecha+'.txt')}

/* ---- Word: tabla vertical (parámetros en filas, fechas en columnas, pulsos en amarillo) ---- */
function vtabXML(t){const FW=1450,MAXW=9495-FW;
  const lp=(tx,sz,b,jc)=>`<w:p><w:pPr><w:keepNext/><w:spacing w:after="0"/>${jc?`<w:jc w:val="${jc}"/>`:''}</w:pPr>${run(tx,{b,sz})}</w:p>`;
  const wOf=c=>c.t==='p'?295:Math.max(385,Math.min(1500,Math.max(0,...t.keys.map(k=>String(t.val(k,c.f).v).length))*66+70));
  const chunks=[];let cur=[],w=0;t.cols.forEach(c=>{const cw=wOf(c);if(cur.length&&w+cw>MAXW){chunks.push(cur);cur=[];w=0}cur.push({...c,w:cw});w+=cw});if(cur.length)chunks.push(cur);
  const B6=s=>`<w:${s} w:val="single" w:sz="6" w:space="0" w:color="000000"/>`,B12=s=>`<w:${s} w:val="single" w:sz="12" w:space="0" w:color="000000"/>`;
  const pulTc=(c,pos)=>`<w:tc><w:tcPr><w:tcW w:w="${c.w}" w:type="dxa"/>${pos==='first'?'<w:vMerge w:val="restart"/>':'<w:vMerge/>'}<w:tcBorders>${pos==='first'?B6('top'):''}${B12('left')}${pos==='last'?B6('bottom'):''}${B12('right')}</w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/><w:textDirection w:val="btLr"/></w:tcPr>${pos==='first'?lp(c.txt,10,true,'center'):'<w:p/>'}</w:tc>`;
  const tc=(w,inner)=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${inner}</w:tc>`;
  return chunks.map(cs=>{const ws=[FW,...cs.map(c=>c.w)],n=t.keys.length;
    const head=`<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="560"/><w:tblHeader/></w:trPr>${tc(FW,lp('Parámetro',13,true))}${cs.map(c=>c.t==='p'?pulTc(c,'first'):tc(c.w,lp(c.f.slice(8)+'-'+c.f.slice(5,7),11,true,'center')+lp(c.f.slice(2,4),11,true,'center'))).join('')}</w:tr>`;
    const rows=t.keys.map((k,i)=>`<w:tr><w:trPr><w:cantSplit/></w:trPr>${tc(FW,lp(rlab(k),13))}${cs.map(c=>{if(c.t==='p')return pulTc(c,i===n-1?'last':'mid');const x=t.val(k,c.f);return tc(c.w,lp(x.v,13,x.b,'center'))}).join('')}</w:tr>`).join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="${ws.reduce((a,b)=>a+b,0)}" w:type="dxa"/><w:tblInd w:w="50" w:type="dxa"/>${BORD}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="20" w:type="dxa"/><w:left w:w="30" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/><w:right w:w="30" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${ws.map(x=>`<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${head}${rows}</w:tbl>${par('',{after:60})}`}).join('')}
function mountLabImport(){const f=$('#lfotos'),pd=$('#lpdf'),t=$('#ltext'),fe=$('#lfecha');if(f)f.onchange=ev=>ocrFiles([...ev.target.files]);if(pd)pd.onchange=ev=>pdfFiles([...ev.target.files]);if(t)t.oninput=()=>{LS.text=t.value};if(fe)fe.onchange=()=>{LS.fecha=fe.value}}
function curDni(){const h=CUR&&CUR.hc;return h&&/^\d{8}$/.test(h.dni)?h.dni:''}
function onEssi(r,ne){const hc=CUR&&CUR.hc;if(!hc)return;const p=DB.patients[hc.dni];const sv=saveLabRows(p,r.rows,r.texts);LS.last={n:sv.n,fechas:sv.fechas,texts:r.texts.length,pend:r.pend,unk:r.unk,ne};p.updated=hc.updated=Date.now();save();rerender();toast(ne+' PDF del ESSI: '+sv.n+' valores guardados')}
function setBusy(msg,frac){LS.busy=msg;const b=$('#lbusy');if(b)b.textContent=msg;const pr=$('#lprog');if(pr){pr.parentNode.hidden=!msg;pr.style.width=Math.round((frac||0)*100)+'%'}}
function appendText(t){LS.text=(LS.text?LS.text+'\n':'')+t;const ta=$('#ltext');if(ta)ta.value=LS.text}
let OCRW=null;
async function ocrWorker(){if(OCRW)return OCRW;await loadScript('lib/tesseract.min.js');OCRW=await Tesseract.createWorker('spa',1,{workerPath:absURL('lib/worker.min.js'),corePath:absURL('lib/core'),langPath:absURL('lib/lang'),gzip:true,
  logger:m=>{if(m.status==='recognizing text')setBusy('Leyendo… '+Math.round(m.progress*100)+'%',m.progress)}});await OCRW.setParameters({preserve_interword_spaces:'1'});return OCRW}
async function ocrFiles(files){if(!files.length)return;try{setBusy('Preparando lector de fotos (la primera vez tarda un poco)…',0.02);const w=await ocrWorker();
  for(let i=0;i<files.length;i++){setBusy('Leyendo foto '+(i+1)+' de '+files.length+'…',i/files.length);const r=await w.recognize(files[i]);appendText(r.data.text)}setBusy('',0);toast('Texto leído. Revisa y toca Procesar')}catch(e){setBusy('',0);toast('No se pudo leer la foto: '+e.message)}}
async function pdfFiles(files){if(!files.length)return;try{setBusy('Abriendo PDF…',0.05);await loadScript('lib/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc=absURL('lib/pdf.worker.min.js');
  const ess=[];let n=0;
  for(const f of files){n++;setBusy('Leyendo '+f.name+' ('+n+'/'+files.length+')…',n/files.length);const {rows}=await pdfRows(f);
    if(essiDetect(rows)){ess.push(essiParse(rows));continue}
    if(rows.length>=5){appendText(rows.map(r=>r.map(i=>i.s).join(' ')).join('\n'));continue}
    await pdfOCR(f)}
  setBusy('',0);if(ess.length){const dni=curDni();const ok=ess.filter(r=>!dni||!r.dni||r.dni===dni),bad=ess.length-ok.length;
    if(bad)setTimeout(()=>toast('⚠️ '+bad+' PDF de OTRO paciente (DNI distinto) no se importaron'),2600);if(ok.length)onEssi(combineEssi(ok),ok.length);else toast('⚠️ Ninguno de esos PDF es de este paciente (DNI distinto)')}else toast('PDF leído. Revisa y toca Procesar')}catch(e){setBusy('',0);toast('No se pudo leer el PDF: '+e.message)}}
async function pdfOCR(f){const doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const vp=pg.getViewport({scale:2});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;const w=await ocrWorker();appendText((await w.recognize(cv)).data.text)}}
function essiMsg(r,ne){return ne+' reporte(s) del ESSI: '+r.rows.length+' valores'+(r.texts.length?', '+r.texts.length+' informe(s)':'')+(r.pend.length?', '+r.pend.length+' sin resultado':'')+'. Revisa y guarda.'}
function sortRev(rows){return rows.sort((a,b)=>b.fecha.localeCompare(a.fecha)||LABORDER.indexOf(a.k)-LABORDER.indexOf(b.k))}
function revExtraHTML(S,stateName,pendLabel){return `${(S.texts||[]).length?`<h4>Informes de texto (${S.texts.length})</h4>${S.texts.map((t,i)=>`<label class="chkl"><input type="checkbox" ${t.on?'checked':''} onchange="${stateName}.texts[${i}].on=this.checked"><span><b>${fmtD(t.fecha)} · ${esc(t.titulo)}</b><br><span class="muted">${esc(t.onlyC&&t.concl?t.concl:t.texto)}</span>${t.concl?`<br><label class="chk" style="margin-top:4px" onclick="event.stopPropagation()"><input type="checkbox" ${t.onlyC?'checked':''} onchange="${stateName}.texts[${i}].onlyC=this.checked;rerender()"> Solo la conclusión</label>`:''}</span></label>`).join('')}`:''}
  ${(S.pend||[]).length?`<h4>Aún sin resultado en el ESSI (${S.pend.length})</h4>${S.pend.map((p,i)=>`<label class="chkl"><input type="checkbox" ${p.on?'checked':''} onchange="${stateName}.pend[${i}].on=this.checked"><span>${esc(p.titulo)} <span class="muted">(solicitado ${fmtD(p.solic)})</span></span></label>`).join('')}<p class="muted">${pendLabel}</p>`:''}`}


/* ---- Pacientes y ajustes ---- */
function vPacientes(){const q=deacc(R.q||'');const ps=Object.values(DB.patients).filter(p=>!q||p.dni.includes(q)||deacc(p.nombre).includes(q)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  return `<div class="card"><h2>Pacientes (${Object.keys(DB.patients).length})</h2><input id="pq" placeholder="Buscar" value="${esc(R.q||'')}" oninput="R.q=this.value;const c=this.selectionStart;render();const i=$('#pq');i.focus();i.setSelectionRange(c,c)"></div>
  ${ps.map(p=>{const hs=Object.values(DB.hcs).filter(h=>h.dni===p.dni).sort((a,b)=>b.fecha.localeCompare(a.fecha));return `<div class="card"><div class="pt"><div><div class="nm">${esc(p.nombre)}</div><div class="muted">DNI ${esc(p.dni)} · ${hs.length} HC · ${p.pulsos.filter(x=>x.fi).length} pulso(s) · ${p.labs.length} fecha(s) de labs</div></div><div class="row"><button class="btn sm" onclick="changeDni('${esc(p.dni)}')">Cambiar DNI</button><button class="btn sm bad" onclick="delPatient('${esc(p.dni)}')">Eliminar</button></div></div>
   ${hs.map(h=>`<div class="pt" style="border-top:1px solid var(--line);padding:6px 0;margin-top:6px"><span>${fmtD(h.fecha)} · ${h.tipo==='pulso'?'Pulso':'General'}</span><div class="row"><button class="btn sm" onclick="go('hc',{hid:'${h.id}'})">Abrir</button><button class="btn sm bad" onclick="delHC('${h.id}')">✕</button></div></div>`).join('')}</div>`}).join('')||'<div class="card muted">Sin pacientes.</div>'}`}
function askText(msg,val,ok='Guardar'){return new Promise(res=>{const o=document.createElement('div');o.className='modal';
  o.innerHTML=`<div class="mbox"><p>${esc(msg)}</p><input id="askIn" value="${esc(val||'')}" inputmode="numeric" autocomplete="off" style="margin:8px 0 12px"><div class="row" style="justify-content:flex-end"><button class="btn" data-r="0">Cancelar</button><button class="btn pri" data-r="1">${esc(ok)}</button></div></div>`;
  o.addEventListener('click',e=>{const b=e.target.closest('button');if(b||e.target===o){const v=$('#askIn').value;o.remove();res(b&&b.dataset.r==='1'?v:null)}});document.body.appendChild(o);setTimeout(()=>{const i=$('#askIn');if(i){i.focus();i.select()}},50)})}
async function changeDni(old){const p=DB.patients[old];if(!p)return;let v=await askText('Nuevo DNI / CE de '+p.nombre+' (ahora: '+old+'). Se mueven también sus HC, labs y pulsos.',old);if(v==null)return;
  v=v.trim().replace(/\s/g,'').toUpperCase();if(v===old)return;if(!/^[0-9A-Z]{6,12}$/.test(v))return toast('DNI/CE no válido (6 a 12 letras o números)');
  if(DB.patients[v])return toast('Ya existe otro paciente con el DNI '+v+': '+DB.patients[v].nombre);
  p.dni=v;p.updated=Date.now();DB.patients[v]=p;delete DB.patients[old];Object.values(DB.hcs).forEach(h=>{if(h.dni===old){h.dni=v;h.updated=Date.now()}});save();rerender();toast('DNI cambiado a '+v)}
async function delPatient(dni){if(!await ask('¿Eliminar a '+DB.patients[dni].nombre+' con todas sus HC, labs y pulsos?'))return;Object.values(DB.hcs).filter(h=>h.dni===dni).forEach(h=>delete DB.hcs[h.id]);delete DB.patients[dni];save();render()}
function vAjustes(){const s=DB.settings;
  CUR={click(a){if(a==='saveAj'){s.autor=up($('#sAut').value.trim());s.exGen=up($('#sGen').value.trim());EXSEG.forEach(([k])=>s.ex[k]=up($('#sx_'+k).value.trim()));save();toast('Ajustes guardados')}else if(a==='resetEx'){EXSEG.forEach(([k])=>$('#sx_'+k).value=EXDEF[k]);$('#sGen').value=EXGEN}}};
  let bytes=0;try{bytes=(localStorage.getItem(KEY)||'').length*2}catch(e){}
  return `<div class="card"><h3>Elaborado por (por defecto)</h3><input id="sAut" value="${esc(s.autor)}" placeholder="MR1 NEFROLOGÍA NOMBRE APELLIDO" style="text-transform:uppercase"></div>
  <div class="card"><h3>Plantilla del examen físico</h3><label>General</label><textarea id="sGen" rows="2">${esc(s.exGen)}</textarea>${EXSEG.map(([k,l])=>`<label style="margin-top:8px">${l}</label><textarea id="sx_${k}" rows="2">${esc(s.ex[k])}</textarea>`).join('')}
   <div class="row" style="margin-top:8px"><button class="btn pri" onclick="CUR.click('saveAj')">Guardar ajustes</button><button class="btn" onclick="CUR.click('resetEx')">Restaurar examen</button></div></div>
  <div class="card"><h3>Respaldo</h3><p class="muted" style="margin-top:0">Último: ${s.lastBackup?new Date(s.lastBackup).toLocaleString('es-PE'):'nunca'} · ${(bytes/1024).toFixed(0)} KB</p>
   <div class="row"><button class="btn pri" onclick="exportBackup()">Exportar respaldo</button><label class="btn" style="margin:0;color:var(--ink);font-size:16px">Importar<input type="file" accept=".json,application/json" style="display:none" onchange="importBackup(this.files[0])"></label></div></div>
  <div class="card"><h3>Zona de riesgo</h3><button class="btn bad" onclick="wipe()">Borrar todos los datos</button></div>
  <p class="muted">HC Nefro v2.1 · Plantillas editables: valídalas con el servicio.</p>`}

/* =====================================================================
   EXPORTAR
   ===================================================================== */
async function saveFile(blob,name){try{const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})&&/iPad|iPhone|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document){await navigator.share({files:[f],title:name});return true}}catch(e){if(e.name==='AbortError')return false}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);return true}
function fname(hc){const p=DB.patients[hc.dni];return 'HC '+p.nombre.replace(/[^A-ZÑÁÉÍÓÚ ]/gi,'').trim()+' '+hc.fecha}
function exportTxt(id){const hc=DB.hcs[id];const t='﻿'+docText(hc).replace(/\r?\n/g,'\r\n');saveFile(new Blob([t],{type:'text/plain;charset=utf-8'}),fname(hc)+'.txt')}
function exportBackup(){saveFile(new Blob([JSON.stringify({app:'hc-nefro',version:1,exported:new Date().toISOString(),data:DB})],{type:'application/json'}),'respaldo-hc-nefro-'+todayISO()+'.json').then(ok=>{if(ok){DB.settings.lastBackup=Date.now();save();render();toast('Respaldo exportado')}})}
function importBackup(file){if(!file)return;const r=new FileReader();r.onload=async()=>{try{const j=JSON.parse(r.result);if(j.app&&j.app!=='hc-nefro')throw new Error('app');const d=j.data||j;if(!d.patients||!d.hcs)throw new Error('f');migrate(d);
  if(!await ask('Aceptar = COMBINAR (gana la versión más reciente de cada registro).'))return;let c=0;[['patients','dni'],['hcs','id']].forEach(([k,id])=>Object.values(d[k]).forEach(x=>{const cur=DB[k][x[id]];if(!cur||(x.updated||0)>(cur.updated||0)){DB[k][x[id]]=x;c++}}));save();render();toast('Importados '+c+' registros')}catch(e){toast(e.message==='app'?'Ese respaldo es de otra app':'Archivo no válido')}};r.readAsText(file)}

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
const WL=14570; // ancho útil A4 horizontal
const SECT=(land)=>`<w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/>${land?'<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>':'<w:pgSz w:w="11906" w:h="16838"/>'}<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>`;
// cierra la sección anterior: land=true → la sección que termina es horizontal
function secBreak(land){return `<w:p><w:pPr><w:sectPr>${SECT(land)}</w:sectPr></w:pPr></w:p>`}
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
  case'vtab':parts.push(vtabXML(b.tb));break;
  case'grid':{const n=b.cols.length,cw=Math.floor(W/n);parts.push(tbl(Array(n).fill(cw),[`<w:tr>${b.cols.map(c=>cell(cw,cp(c,{b:true,sz:16,jc:'center'}),{fill:'D9E2F3'})).join('')}</w:tr>`,...b.rows.map(r=>`<w:tr>${r.map(v=>cell(cw,cp(v||'',{sz:16,jc:'center'}))).join('')}</w:tr>`)]));break}}});
  return parts.join('')}
function exportWord(id){const hc=DB.hcs[id],p=DB.patients[hc.dni];
  const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${docXML(hc)}<w:sectPr>${SECT(false)}</w:sectPr></w:body></w:document>`;
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

DB=load();render();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
