'use strict';
/* ===== Importar una HC antigua (Word .docx) → datos estructurados ===== */
async function readDocx(file){
  await loadScript('lib/jszip.min.js');
  const z=await JSZip.loadAsync(await file.arrayBuffer());const f=z.file('word/document.xml');if(!f)throw new Error('No es un Word .docx válido');
  const xml=new DOMParser().parseFromString(await f.async('string'),'application/xml');
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const kids=(el,name)=>[...el.childNodes].filter(n=>n.namespaceURI===W&&n.localName===name);
  function pText(p){let t='',bold=0,tot=0;p.getElementsByTagNameNS(W,'r').length;
    [...p.getElementsByTagNameNS(W,'r')].forEach(r=>{let s='';[...r.childNodes].forEach(n=>{if(n.namespaceURI!==W)return;if(n.localName==='t')s+=n.textContent;else if(n.localName==='tab')s+='\t';else if(n.localName==='br')s+='\n'});
      const rp=kids(r,'rPr')[0];const b=rp&&kids(rp,'b')[0];const isB=b&&b.getAttributeNS(W,'val')!=='0'&&b.getAttributeNS(W,'val')!=='false';if(s.trim()){tot+=s.trim().length;if(isB)bold+=s.trim().length}t+=s});
    const num=p.getElementsByTagNameNS(W,'numPr').length>0;return {x:t.replace(/ /g,' '),b:tot>0&&bold/tot>0.6,num}}
  const body=xml.getElementsByTagNameNS(W,'body')[0];const blocks=[];
  [...body.childNodes].forEach(n=>{if(n.namespaceURI!==W)return;
    if(n.localName==='p'){const p=pText(n);if(p.x.trim())blocks.push({t:'p',...p})}
    else if(n.localName==='tbl'){const rows=kids(n,'tr').map(tr=>kids(tr,'tc').map(tc=>{const gs=tc.getElementsByTagNameNS(W,'gridSpan')[0];return {x:kids(tc,'p').map(p=>pText(p).x).join('\n').replace(/\s+\n/g,'\n').trim(),span:gs?+gs.getAttributeNS(W,'val'):1}}));blocks.push({t:'tbl',rows})}});
  return blocks;
}
/* ---- utilidades de interpretación ---- */
const nz=s=>deacc(String(s||'')).replace(/\s+/g,' ').trim();
const nk=s=>deacc(String(s||'')).replace(/[^A-Z0-9/]/g,'');
function parseDate(s){const m=String(s||'').match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{2,4})/);if(!m)return'';let y=+m[3];if(y<100)y+=2000;if(y<1900||y>2100)return'';const mo=+m[2],d=+m[1];if(mo<1||mo>12||d<1||d>31)return'';return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
const MESN={ENERO:1,FEBRERO:2,MARZO:3,ABRIL:4,MAYO:5,JUNIO:6,JULIO:7,AGOSTO:8,SETIEMBRE:9,SEPTIEMBRE:9,OCTUBRE:10,NOVIEMBRE:11,DICIEMBRE:12};
function isoYMD(y,m,d){return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
function parsePulso(text){const u=nz(text).replace(/\n/g,' ');if(!/PULSO/.test(u))return null;
  let esq=(u.match(/PULSO\s+(?:DE\s+)?(.+?)(?=\s+\d{1,2}\s+(?:DE\s+[A-Z]+\s+)?AL\s+\d|\s+\d{1,2}\s+DE\s+[A-Z]+|$)/)||[])[1]||'';
  let fi='',ff='';let m=u.match(/(\d{1,2})\s+(?:DE\s+([A-Z]+)\s+)?(?:DEL?\s+(\d{4})\s+)?AL\s+(\d{1,2})\s+DE\s+([A-Z]+)\s+(?:DEL?\s+)?(\d{4})/);
  if(m&&MESN[m[5]]){const y2=+m[6],m2=MESN[m[5]],m1=m[2]&&MESN[m[2]]?MESN[m[2]]:m2,y1=m[3]?+m[3]:(m1>m2?y2-1:y2);fi=isoYMD(y1,m1,+m[1]);ff=isoYMD(y2,m2,+m[4])}
  else{m=u.match(/(\d{1,2})\s+DE\s+([A-Z]+)\s+(?:DEL?\s+)?(\d{4})/);if(m&&MESN[m[2]])fi=isoYMD(+m[3],MESN[m[2]],+m[1]);else{const d=parseDate(u);if(d)fi=d}}
  const cfm=(u.match(/CICLOFOSFAMIDA\s+(\d+(?:[.,]\d+)?)\s*(G|MG)\b/)||[]);
  return {fi,ff,esquema:esq.replace(/\s*[-–]\s*$/,'').trim(),cfm:cfm[1]?String(cfm[2]==='G'?parseFloat(cfm[1].replace(',','.'))*1000:cfm[1]):''}}
const HDRMAP={CREAT:['CREA'],CREA:['CREA'],CREATININA:['CREA'],UREA:['UREA'],HB:['HB'],HGB:['HB'],LEU:['LEU'],LEUCO:['LEU'],LEUCOS:['LEU'],LEUCOCITOS:['LEU'],PLAQ:['PLAQ'],PLAQUETAS:['PLAQ'],
  'K/NA':['K','NA'],K:['K'],NA:['NA'],COLEST:['COLEST'],TRIG:['TRIG'],PCR:['PCR'],GLUCOSA:['GLU'],GLU:['GLU'],ALB:['ALB'],ALBUMINA:['ALB'],'PROT/G/ALB':['PT','GLOB','ALB'],'T4/TSH':['T4L','TSH'],'PTH/P/CA':['PTH','P','CA'],
  'TGO/TGP':['TGO','TGP'],INR:['INR'],SEG:['SEG'],ABAST:['ABS']};
function mapHeader(h){const k=nk(h);if(!k||k==='FECHA')return null;if(HDRMAP[k])return HDRMAP[k];if(/^PROTEIN/.test(k))return['PROT24'];if(/^RECUEN/.test(k))return['RC'];if(/^MICROALB/.test(k))return['MALB'];
  if(/^DOSAJEDE/.test(k)){const r=findKey(k.replace(/^DOSAJEDE/,''),null);return r?[r]:null}
  const parts=k.split('/');const ks=parts.map(p=>HDRMAP[p]?HDRMAP[p][0]:findKey(p,null)).filter(Boolean);return ks.length===parts.length?ks:null}
const FILMAP=[['nombre',/^APELLIDOS/],['dni',/^DNI/],['edad',/^EDAD/],['sexo',/^SEXO/],['fnac',/^FECHA DE NACIMIENTO/],['natural',/^NATURAL/],['procedencia',/^PROCEDEN/],['ocupacion',/^OCUPACION/],['civil',/^ESTADO CIVIL/],['familiar',/^FAMILIAR/],['telefono',/^TELEFONO/],['religion',/^RELIGION/],
  ['_ingresa',/^INGRESA POR/],['_fing',/^FECHA DE INGRESO/],['_felab',/^FECHA DE ELABORACION/],['_inf',/^INFORMANTE/],['_elab',/^ELABORADO/]];
const SEGKEY=EXSEG.map(([k,l])=>[k,nk(l)]);
function segOf(label){const k=nk(label);if(!k)return null;const hit=SEGKEY.find(([,l])=>k===l||k.startsWith(l)||l.startsWith(k)&&k.length>=4);return hit?hit[0]:null}
const IMGW=/(ECOGRAF|ECO\b|TEM\b|TAC\b|RX\b|RADIOGRAF|RMN|RESONANCIA|CITOQUIMIC|URETRO|CISTOGRAF|GAMMAGRAF|ECOCARDIO|DOPPLER|ENDOSCOP|COLONOSCOP|ELECTROCARDIO|EKG|ECG|ANGIO|DENSITOMETR|CULTIVO|PERITONEAL)/;

function parseHCBlocks(blocks){
  const R={fil:{},anam:{tiempo:'',sintomas:'',hea:''},fb:{},ant:{otras:[],quir:[],med:[],proc:[],enf:{},parto:'',inmun:'',covid:'',alerg:'',transf:''},grupo:'',labs:[],inmuno:[],pulsos:[],biopsia:{fecha:'',texto:''},informes:[],exGen:'',fv:{},ex:{},dx:[]};
  let sec='',sub='',cur=null,anamF='';
  const head=u=>{if(/^HISTORIA CLINICA$/.test(u)||/^FILIACION/.test(u))return'fil';if(/^ANAMNESIS/.test(u))return'anam';if(/^FUNCIONES BIOLOGICAS/.test(u))return'fb';if(/^ANTECEDENTES\s*:?$/.test(u))return'ant';
    if(/^EXAMENES AUXILIARES/.test(u))return'aux';if(/^EXAMEN FISICO REGIONAL/.test(u))return'exreg';if(/^EXAMEN FISICO/.test(u))return'exgen';if(/^IMPRESION DIAGNOSTICA|^DIAGNOSTICOS?\s*:?$/.test(u))return'dx';return null};
  const addLab=(fecha,items,nota)=>{if(!fecha)return;const inm={},lab={};Object.keys(items).forEach(k=>{if(!items[k])return;(LABMAP[k]&&LABMAP[k].a==='INMUNO'?inm:lab)[k]=items[k]});
    if(Object.keys(lab).length||nota){let L=R.labs.find(l=>l.fecha===fecha);if(!L){L={fecha,items:{},nota:''};R.labs.push(L)}Object.assign(L.items,lab);if(nota)L.nota=(L.nota?L.nota+' / ':'')+nota}
    if(Object.keys(inm).length){let I=R.inmuno.find(l=>l.fecha===fecha);if(!I){I={fecha,items:{}};R.inmuno.push(I)}Object.assign(I.items,inm)}};
  const fvParse=t=>{const u=nz(t);const g=(re)=>(u.match(re)||[])[1]||'';const pa=g(/PA\s*:?\s*(\d{2,3}\s*\/\s*\d{2,3})/);if(pa)R.fv.pa=pa.replace(/\s/g,'');const fc=g(/FC\s*:?\s*(\d{2,3})/);if(fc)R.fv.fc=fc;const fr=g(/FR\s*:?\s*(\d{1,2})/);if(fr)R.fv.fr=fr;
    const sat=g(/S(?:AT)?\s*O2\s*:?\s*(\d{2,3})/);if(sat)R.fv.sat=sat;const fi=g(/FIO2\s*:?\s*(0?[.,]\d+|\d{2})/);if(fi)R.fv.fio2=fi.replace(',','.');const tt=g(/T°?\s*:\s*(\d{2}(?:[.,]\d)?)/);if(tt)R.fv.t=tt;return !!(pa||fc||sat)};
  blocks.forEach(b=>{
    if(b.t==='tbl'){const rows=b.rows;if(!rows.length)return;const ncol=Math.max(...rows.map(r=>r.reduce((s,c)=>s+c.span,0)));
      // filiación
      if(rows.filter(r=>r.length>=2&&FILMAP.some(([,re])=>re.test(nz(r[0].x)))).length>=3){rows.forEach(r=>{if(r.length<2)return;const hit=FILMAP.find(([,re])=>re.test(nz(r[0].x)));if(hit)R.fil[hit[0]]=up(r.slice(1).map(c=>c.x).join(' ').trim())});return}
      // examen regional
      if(rows.filter(r=>r.length>=2&&segOf(r[0].x)).length>=4){rows.forEach(r=>{const k=r.length>=2&&segOf(r[0].x);if(k)R.ex[k]=up(r.slice(1).map(c=>c.x).join(' ').replace(/\s+/g,' ').trim())});return}
      // tabla de laboratorio
      if(nk(rows[0][0].x)==='FECHA'){const H=rows[0].map(c=>mapHeader(c.x));
        rows.slice(1).forEach(r=>{const span=r.reduce((s,c)=>s+c.span,0);const first=r[0].x;const fecha=parseDate(first);
          const txt=r.map(c=>c.x).join(' ').trim();if(!txt)return;
          if(/PULSO/.test(nz(txt))&&(!fecha||r.length<=2)){const pu=parsePulso(txt);if(pu)R.pulsos.push(pu);return}
          if(r.length<rows[0].length&&r.length<=2){if(fecha&&r.length===2)addLab(fecha,{},up(r[1].x.replace(/\s+/g,' ')));else if(!fecha){const d2=parseDate(txt);if(d2)addLab(d2,{},up(txt.replace(/\s+/g,' ')))}return}
          if(!fecha)return;const items={};let ci=0;r.forEach((c,i)=>{const keys=H[ci];ci+=c.span;if(i===0||!keys||!c.x.trim())return;let v=c.x.replace(/\s+/g,' ').trim();
            const parts=keys.length>1?v.split('/').map(s=>s.trim()):[v];if(parts.length===keys.length)keys.forEach((k,j)=>{items[k]=up(parts[j].replace(new RegExp('^'+k+'\\s+','i'),''))});else items[keys[0]]=up(v)});
          addLab(fecha,items,'')});return}
      // diagnósticos en tabla
      if(sec==='dx'||rows.every(r=>r.length===2&&/^\d+\.?$/.test(r[0].x.trim()))){rows.forEach(r=>{const t=r[r.length-1].x.trim();if(t)R.dx.push(up(t.replace(/^\d+\s*[.)\-]*\s*/,'')))});return}
      // recuadros 1x1
      const txt=rows.map(r=>r.map(c=>c.x).join(' ')).join('\n').trim();
      if(sec==='anam'){R.anam.hea=(R.anam.hea?R.anam.hea+'\n':'')+up(txt);return}
      if(sec==='exgen'){if(!fvParse(txt)||txt.length>120)R.exGen=(R.exGen?R.exGen+' ':'')+up(txt.replace(/PA\s*:.*$/is,'').trim()||txt);else fvParse(txt);return}
      if(sec==='aux'&&cur){cur.texto+=(cur.texto?'\n':'')+up(txt)}return}
    // párrafos
    const raw=b.x.trim(),u=nz(raw);{const g=u.match(/GRUPO ?SANGUINEO\s*:?\s*([ABO]{1,2}\s*(?:[+-]|POSITIVO|NEGATIVO|RH ?[+-]))/);if(g)R.grupo=g[1].replace(/\s+/g,' ')}const h=head(u.replace(/[:.]$/,''));
    if(h&&raw.length<60){sec=h;sub='';cur=null;return}
    if(/^EXAMENES AUXILIARES/.test(u)){sec='aux';const g=u.match(/GRUPO ?SANGUINEO\s*:?\s*([ABO]{1,2}\s*[+-]|[ABO]{1,2}\s*(POSITIVO|NEGATIVO))/);if(g)R.grupo=g[1].replace(/\s+/g,' ');cur=null;return}
    if(sec==='anam'){let m;
      if(m=raw.match(/^tiempo de enfermedad\s*:?\s*(.*)$/i)){R.anam.tiempo=up(m[1].trim());anamF='';return}
      if(m=raw.match(/^s[ií]ntomas? principales?\s*:?\s*(.*)$/i)){R.anam.sintomas=up(m[1].trim());anamF='';return}
      if(m=raw.match(/^historia de la enfermedad\s*:?\s*(.*)$/i)){anamF='hea';if(m[1].trim())R.anam.hea=up(m[1].trim());return}
      R.anam.hea=(R.anam.hea?R.anam.hea+'\n':'')+up(raw);return}
    if(sec==='fb'){const m=raw.replace(/^[-•\s]+/,'').match(/^(orinas?|heces|sed|apetito|sue[nñ]o)\s*:\s*(.*)$/i);if(m){const k={ORINA:'orinas',ORINAS:'orinas',HECES:'heces',SED:'sed',APETITO:'apetito',SUENO:'sueno'}[nz(m[1])];if(k)R.fb[k]=up(m[2].trim())}return}
    if(sec==='ant'){const t=raw.replace(/^[-•·\s]+/,'').trim(),tu=nz(t);let m;
      if(/^ANTECEDENTES PERSONALES/.test(tu)){sub='pers';return}if(/^ENFERMEDADES MEDICAS|^ANTECEDENTES PATOLOGICOS|^PATOLOGICOS/.test(tu)){sub='enf';const rest=t.replace(/^[^:]*:\s*/,'');if(rest&&rest!==t)lineEnf(rest);return}
      if(/^CIRUGIAS|^ANTECEDENTES QUIRURGICOS|^QUIRURGICOS/.test(tu)){sub='quir';const rest=t.replace(/^[^:.]*[:.]\s*/,'');if(rest&&rest!==t&&!/^NIEGA$/i.test(rest))R.ant.quir.push(up(rest));return}
      if(/^MEDICACION HABITUAL|^MEDICACION/.test(tu)){sub='med';const rest=t.replace(/^[^:]*:\s*/,'');if(rest&&rest!==t)R.ant.med.push(up(rest));return}
      if(/^PROCEDIMIENTOS/.test(tu)){sub='proc';return}
      if(m=t.match(/^alergias?\s*:?\s*(.*)$/i)){R.ant.alerg=up(m[1].trim()||'NIEGA');sub='';return}
      if(m=t.match(/^transfusion(?:es)?\s*:?\s*(.*)$/i)){R.ant.transf=up(m[1].trim());sub='';return}
      if(sub==='pers'){if(/PARTO/.test(tu))R.ant.parto=up(t);else if(/INMUNIZ/.test(tu))R.ant.inmun=up(t);else if(/COVID/.test(tu))R.ant.covid=up(t.replace(/^.*COVID\s*:?\s*/i,''));return}
      if(sub==='enf'){lineEnf(t);return}if(sub==='quir'){if(!/^NIEGA$/.test(tu))R.ant.quir.push(up(t));return}if(sub==='med'){if(!/^NIEGA$/.test(tu))R.ant.med.push(up(t));return}
      if(sub==='proc'){R.ant.proc.push({f:'',n:up(t),d:''});return}return}
    if(sec==='aux'){if(/^LABORATORIO\s*:?$/.test(u))return;const g=u.match(/GRUPO ?SANGUINEO\s*:?\s*(.+)$/);if(g){R.grupo=g[1].replace(/\s+/g,' ').trim();return}
      const isTitle=(b.b&&raw.length<110)||(raw.length<70&&/:$/.test(raw)&&!/^-/.test(raw));
      if(isTitle&&!(cur&&cur.bio&&!IMGW.test(u))){const bio=/BIOPSIA/.test(u)&&!IMGW.test(u);const fecha=parseDate(raw);
        if(bio){cur={bio:true};R.biopsia.fecha=fecha;R.biopsia.texto=up(raw);return}
        cur={titulo:up(raw.replace(/\s*\d{1,2}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{2,4}\s*:?\s*$/,'').replace(/:$/,'').trim()),fecha,texto:''};R.informes.push(cur);return}
      if(cur&&cur.bio){R.biopsia.texto+='\n'+up(raw);return}if(cur){cur.texto+=(cur.texto?'\n':'')+up(raw);return}
      const d=parseDate(raw);if(d&&/^\d/.test(raw)){addLab(d,{},up(raw.replace(/^[\d\/\-. ]+:?\s*/,'')));return}
      R.informes.push(cur={titulo:'OTROS',fecha:'',texto:up(raw)});return}
    if(sec==='exgen'||sec==='exreg'){if(/^SIGNOS VITALES|^FUNCIONES VITALES/.test(u)&&raw.length<25)return;
      if(/\bPA\s*:|FC\s*:|SATO2|FIO2/.test(u)&&fvParse(raw))return;
      const m=raw.match(/^([^:]{3,30}):\s*(.*)$/);const k=m&&segOf(m[1]);if(k){R.ex[k]=up(m[2].trim());sec='exreg';return}
      if(sec==='exgen'){R.exGen=(R.exGen?R.exGen+' ':'')+up(raw)}return}
    if(sec==='dx'){const t=raw.replace(/^\s*\d+\s*[.)\-]*\s*/,'').trim();if(t&&!/^\d+$/.test(t))R.dx.push(up(t));return}
  });
  function lineEnf(t){const tu=nz(t);const toks=[...tu.matchAll(/\b(DM|HTA|TBC|ASMA|LES)\s*\(\s*(SI|NO)\s*\)/g)];
    if(toks.length){toks.forEach(m=>R.ant.enf[m[1]]=m[2]==='SI'?'SÍ':'NO');return}if(t.trim()&&!/^NIEGA$/.test(tu))R.ant.otras.push(up(t))}
  if(R.fil.fnac){const d=parseDate(R.fil.fnac);R.fil.fnac=d||''}if(R.fil.edad)R.fil.edad=R.fil.edad.replace(/\D+/g,'');
  if(R.fil.sexo)R.fil.sexo=/^F/.test(R.fil.sexo)?'FEMENINO':/^M/.test(R.fil.sexo)?'MASCULINO':R.fil.sexo;if(R.fil.dni)R.fil.dni=R.fil.dni.replace(/\D/g,'')||R.fil.dni;
  const split=a=>a.flatMap(x=>String(x).split('\n')).map(x=>x.replace(/^[-•·*\s]+/,'').replace(/^\d+\s*[.)]?\s*-?\s*/,'').trim()).filter(Boolean);
  R.ant.med=split(R.ant.med);R.ant.quir=split(R.ant.quir);R.ant.otras=split(R.ant.otras);R.dx=split(R.dx);
  R.informes=R.informes.filter(i=>i.titulo||i.texto);
  return R;
}

/* ---- flujo de importación ---- */
let IMPHC=null;
async function importHCFile(file){if(!file)return;const bz=document.getElementById('impBusy');
  if(/\.doc$/i.test(file.name)){toast('Ese es un .doc antiguo. Ábrelo en Word o Pages y guárdalo/expórtalo como .docx');return}
  try{if(bz)bz.textContent='Leyendo '+file.name+'…';const r=parseHCBlocks(await readDocx(file));IMPHC={r,name:file.name,tipo:R.modo||'general',on:{fil:1,ant:1,fb:1,labs:1,pulsos:1,inmuno:1,biopsia:1,informes:1,ex:1,dx:1,hea:1,fv:0}};
    if(!r.fil.nombre&&!r.labs.length&&!r.dx.length)throw new Error('No encontré la estructura de una HC');go('importHC')}
  catch(e){if(bz)bz.textContent='';toast('No se pudo leer: '+e.message)}}
function vImportHC(){if(!IMPHC){R.v='nueva';return vNueva()}const r=IMPHC.r,on=IMPHC.on;const dni=(r.fil.dni||'').trim();const ex=dni&&DB.patients[dni];
  const A=r.ant;const nEx=Object.keys(r.ex).length;
  const row=(k,label,detail,disabled)=>`<label class="chkl ${disabled?'':''}"><input type="checkbox" ${on[k]?'checked':''} ${disabled?'disabled':''} onchange="IMPHC.on['${k}']=this.checked?1:0"><span><b>${label}</b>${detail?'<br><span class="muted">'+esc(detail)+'</span>':''}</span></label>`;
  return `<div class="card"><div class="pt"><div><div class="nm">Importar HC antigua</div><div class="muted">${esc(IMPHC.name)} · nueva HC ${IMPHC.tipo==='pulso'?'💉 PULSO':'🩺 GENERAL'}</div></div><button class="btn" onclick="IMPHC=null;go('nueva')">Cancelar</button></div></div>
  <div class="card"><h3>Paciente</h3><div class="grid w2"><div><label>DNI</label><input id="impDni" value="${esc(dni)}" inputmode="numeric"></div><div><label>Apellidos y nombres</label><input id="impNom" value="${esc(r.fil.nombre||'')}" style="text-transform:uppercase"></div></div>
   <div class="alert ${ex?'a-info':'a-warn'}" style="margin:10px 0 0">${ex?'Ya está registrado: se completarán sus datos sin borrar lo que ya tenía.':'Paciente nuevo: se crea con estos datos.'}</div></div>
  <div class="card"><h3>¿Qué traigo de la HC antigua?</h3>
   ${row('fil','Filiación',[r.fil.edad&&r.fil.edad+' a',r.fil.sexo,r.fil.natural,r.fil.ocupacion,r.fil.familiar].filter(Boolean).join(' · '))}
   ${row('ant','Antecedentes',['enfermedades: '+(Object.keys(A.enf).filter(k=>A.enf[k]==='SÍ').join(', ')||'—')+(A.otras.length?' + '+A.otras.length+' más':''),A.quir.length+' cirugía(s)',A.med.length+' fármaco(s)','alergias: '+(A.alerg||'—'),A.transf&&'transfusiones'].filter(Boolean).join(' · '))}
   ${row('fb','Funciones biológicas',Object.values(r.fb).join(' · '))}
   ${row('labs','Laboratorio',r.labs.length+' fecha(s)'+(r.labs.length?' ('+fmtD(r.labs.map(l=>l.fecha).sort()[0])+' → '+fmtD(r.labs.map(l=>l.fecha).sort().pop())+')':''),!r.labs.length)}
   ${row('pulsos','Pulsos previos',r.pulsos.map(x=>fechasPalabras(x.fi,x.ff)).join(' · ')||'ninguno',!r.pulsos.length)}
   ${row('inmuno','Perfil inmunológico',r.inmuno.length+' fecha(s)',!r.inmuno.length)}
   ${row('biopsia','Biopsia renal',r.biopsia.texto.trim()?r.biopsia.texto.split('\n')[0].slice(0,90):'no encontrada',!r.biopsia.texto.trim())}
   ${row('informes','Imágenes / otros informes',r.informes.map(i=>i.titulo).join(' · ')||'ninguno',!r.informes.length)}
   ${row('ex','Examen físico (como base)',(r.exGen?'general + ':'')+nEx+' segmento(s)')}
   ${row('dx','Impresión diagnóstica (como base)',r.dx.join(' · '))}
   ${row('hea','Historia de la enfermedad anterior (para editarla)',r.anam.hea.slice(0,120)+(r.anam.hea.length>120?'…':''),!r.anam.hea.trim())}
   ${row('fv','Funciones vitales de esa HC',Object.entries(r.fv).map(([k,v])=>k.toUpperCase()+' '+v).join(' · ')||'—',!Object.keys(r.fv).length)}
   <p class="muted">Por defecto NO trae las funciones vitales (son de ese día). Todo queda editable.</p>
   <div class="row" style="margin-top:10px"><button class="btn pri" onclick="applyImportHC()">Crear HC con estos datos</button></div></div>`}
function applyImportHC(){const r=IMPHC.r,on=IMPHC.on;const dni=$('#impDni').value.trim().replace(/\s/g,'');const nom=up($('#impNom').value).trim();
  if(!/^[0-9A-Za-z]{6,12}$/.test(dni))return toast('Revisa el DNI');if(!nom)return toast('Falta el nombre');
  let p=DB.patients[dni];const isNew=!p;if(!p){p=newPatient(dni,nom);DB.patients[dni]=p}
  const fill=(o,k,v)=>{if(v&&!String(o[k]||'').trim())o[k]=v};
  if(on.fil){['edad','sexo','fnac','natural','procedencia','ocupacion','civil','familiar','telefono','religion'].forEach(k=>fill(p,k,r.fil[k]));if(isNew)p.nombre=nom}
  if(r.grupo)fill(p,'grupo',up(r.grupo));
  if(on.ant){const A=p.ant,I=r.ant;['parto','inmun','covid','alerg','transf'].forEach(k=>{if(I[k]&&(isNew||!A[k]||(k==='alerg'&&A[k]==='NIEGA')||(k==='parto'&&A[k]==='NACIDO DE PARTO VAGINAL')||(k==='inmun'&&A[k]==='REFIERE INMUNIZACIONES COMPLETAS')))A[k]=I[k]});
    Object.keys(I.enf).forEach(k=>{if(isNew||A.enf[k]!=='SÍ')A.enf[k]=I.enf[k]});
    const merge=(cur,add)=>{const L=lines(cur);add.forEach(x=>{if(!L.some(y=>deacc(y)===deacc(x)))L.push(x)});return L.join('\n')};A.otras=merge(A.otras,I.otras);A.quir=merge(A.quir,I.quir);A.med=merge(A.med,I.med);
    A.proc=A.proc||[];I.proc.forEach(x=>{if(!A.proc.some(y=>deacc(y.n)===deacc(x.n)))A.proc.push({id:uid(),...x})})}
  if(on.labs)r.labs.forEach(l=>{let L=p.labs.find(x=>x.fecha===l.fecha);if(!L){L={id:uid(),fecha:l.fecha,items:{},nota:'',created:Date.now()};p.labs.push(L)}Object.keys(l.items).forEach(k=>{if(!L.items[k])L.items[k]=l.items[k]});if(l.nota&&!(L.nota||'').includes(l.nota))L.nota=(L.nota?L.nota+' / ':'')+l.nota});
  if(on.inmuno)r.inmuno.forEach(l=>{let I=p.inmuno.find(x=>x.fecha===l.fecha);if(!I){I={id:uid(),fecha:l.fecha,items:{},created:Date.now()};p.inmuno.push(I)}Object.keys(l.items).forEach(k=>{if(!I.items[k])I.items[k]=l.items[k]})});
  if(on.pulsos)r.pulsos.forEach(x=>{if(!p.pulsos.some(y=>y.fi&&y.fi===x.fi))p.pulsos.push({id:uid(),fi:x.fi,ff:x.ff,esquema:up(x.esquema),cfm:x.cfm||'',nota:'',created:Date.now()})});
  if(on.biopsia&&r.biopsia.texto.trim()&&!p.biopsia.texto.trim())p.biopsia={fecha:r.biopsia.fecha,texto:r.biopsia.texto};
  if(on.informes)r.informes.forEach(i=>{if(!p.informes.some(y=>deacc(y.titulo)===deacc(i.titulo)&&y.fecha===i.fecha))p.informes.push({id:uid(),titulo:i.titulo,fecha:i.fecha,texto:i.texto,created:Date.now()})});
  p.updated=Date.now();
  const hc=newHC(dni,IMPHC.tipo);hc.importedFrom=IMPHC.name;
  if(on.fb)Object.assign(hc.fb,r.fb);if(on.ex){if(r.exGen)hc.exGen=r.exGen;Object.assign(hc.ex,r.ex)}if(on.dx&&r.dx.length)hc.dx=r.dx.join('\n');
  if(on.hea&&r.anam.hea.trim())hc.hea=r.anam.hea;if(r.anam.tiempo)hc.tiempo=r.anam.tiempo;if(IMPHC.tipo!=='pulso'&&r.anam.sintomas)hc.sintomas=r.anam.sintomas;if(on.fv)Object.assign(hc.fv,r.fv);
  DB.hcs[hc.id]=hc;save();IMPHC=null;toast('HC creada a partir de la antigua. Revisa y actualiza lo nuevo');go('hc',{hid:hc.id,tab:hc.tipo==='pulso'?'pulsos':'anam'})}
