/* ===== Lector de laboratorio: texto (foto/Texto en vivo/PDF) → resultados estructurados ===== */
'use strict';
// Áreas en el orden en que aparecen en la nota
const AREAS={HEM:'Hematología',COAG:'Coagulación',BIOQ:'Bioquímica',HEP:'Perfil hepático',AGA:'AGA',ORINA:'Orina / función renal',INMUNO:'Inmunología',OTROS:'Otros'};
// [clave, nombre en la nota, área, unidad en la nota, regex del nombre (sin tildes, mayúsculas), contextos donde NO aplica]
const LABDEF=[
 ['LEU','LEU','HEM','', 'LEUCOCITOS?|LEUCOS|LEU|WBC|GLOBULOS BLANCOS','ORINA'],
 ['SEG','SEG','HEM','%', 'SEGMENTADOS|NEUTROFILOS( SEGMENTADOS)?( %)?|NEUT%?|SEG'],
 ['ABS','ABS','HEM','%', 'ABASTONADOS|ABAST|ABS'],
 ['LINF','LINF','HEM','%', 'LINFOCITOS|LINF|LYM%?'],
 ['MONO','MONO','HEM','%', 'MONOCITOS|MONO'],
 ['EOS','EOS','HEM','%', 'EOSINOFILOS|EOS'],
 ['HB','HB','HEM','G/DL', 'HEMOGLOBINA|HGB|HB'],
 ['HTO','HTO','HEM','%', 'HEMATOCRITO|HTO|HCT'],
 ['VCM','VCM','HEM','', 'VCM|MCV|VOLUMEN CORPUSCULAR MEDIO'],
 ['PLAQ','PLAQ','HEM','', 'PLAQUETAS|PLT|PLAQ'],
 ['VSG','VSG','HEM','', 'VSG|VELOCIDAD DE SEDIMENTACION'],
 ['INR','INR','COAG','', 'INR'],
 ['TP','TP','COAG','', 'TIEMPO DE PROTROMBINA|TP'],
 ['TTP','TTP','COAG','', 'TTPA?|TIEMPO DE TROMBOPLASTINA( PARCIAL)?( ACTIVADA)?'],
 ['FIB','FIBRINÓGENO','COAG','', 'FIBRINOGENO'],
 ['GLU','GLUCOSA','BIOQ','MG/DL', 'GLUCOSA|GLICEMIA|GLUCEMIA','ORINA'],
 ['UREA','UREA','BIOQ','MG/DL', 'UREA|BUN'],
 ['CREA','CREATININA','BIOQ','MG/DL', 'CREATININA( SERICA)?|CREA','ORINA'],
 ['AU','ÁCIDO ÚRICO','BIOQ','', 'ACIDO URICO'],
 ['NA','NA','BIOQ','', 'SODIO|NA\\+?'],
 ['K','K','BIOQ','', 'POTASIO|K\\+?'],
 ['CL','CL','BIOQ','', 'CLORO|CLORURO|CL-?'],
 ['CA','CALCIO','BIOQ','', 'CALCIO( SERICO| TOTAL)?|CA'],
 ['CAI','CA IÓNICO','BIOQ','', 'CALCIO IONICO|CA IONICO|CA\\+\\+|ICA'],
 ['P','FÓSFORO','BIOQ','', 'FOSFORO|P'],
 ['MG','MAGNESIO','BIOQ','', 'MAGNESIO|MG'],
 ['PCR','PCR','BIOQ','', 'PROTEINA C REACTIVA|PCR'],
 ['PCT','PCT','BIOQ','', 'PROCALCITONINA|PCT'],
 ['DHL','DHL','BIOQ','', 'DESHIDROGENASA LACTICA|DHL|LDH'],
 ['CPK','CPK','BIOQ','', 'CPK|CK( TOTAL)?|CREATIN ?(FOSFO)?KINASA'],
 ['FERR','FERRITINA','BIOQ','', 'FERRITINA'],
 ['HBA1C','HBA1C','BIOQ','%', 'HBA1C|HEMOGLOBINA GLICOSILADA|HEMOGLOBINA GLICADA'],
 ['VITD','VITAMINA D','BIOQ','', 'VITAMINA D|25 ?OH VITAMINA D|25-OH'],
 ['TGO','TGO','HEP','', 'TGO|AST|ASPARTATO AMINOTRANSFERASA'],
 ['TGP','TGP','HEP','', 'TGP|ALT|ALANINO AMINOTRANSFERASA'],
 ['FA','FOSFATASA ALCALINA','HEP','', 'FOSFATASA ALCALINA|FA'],
 ['GGT','GGTP','HEP','', 'GGTP?|GAMMA ?GLUTAMIL ?TRANSFERASA'],
 ['BT','BT','HEP','', 'BILIRRUBINA TOTAL|BT'],
 ['BD','BD','HEP','', 'BILIRRUBINA DIRECTA|BD'],
 ['BI','BI','HEP','', 'BILIRRUBINA INDIRECTA|BI'],
 ['PT','PROTEÍNAS TOTALES','HEP','G/DL', 'PROTEINAS TOTALES','ORINA'],
 ['ALB','ALBÚMINA','HEP','G/DL', 'ALBUMINA( SERICA)?','ORINA'],
 ['PH','PH','AGA','', 'PH','ORINA'],
 ['PCO2','PCO₂','AGA','', 'PA?CO2|PCO₂|PACO₂'],
 ['PO2','PO₂','AGA','', 'PA?O2|PO₂|PAO₂'],
 ['HCO3','HCO₃','AGA','', 'HCO3-?|HCO₃|BICARBONATO'],
 ['BE','BE','AGA','', 'BE|EXCESO DE BASE'],
 ['LAC','LACTATO','AGA','', 'LACTATO|LACTICO'],
 ['SAT','SATO₂','AGA','%', 'SAT ?O2|SO2'],
 ['OLEU','LEUCOCITOS','ORINA','X CAMPO', 'LEUCOCITOS?'],
 ['OHEM','HEMATÍES','ORINA','X CAMPO', 'HEMATIES|ERITROCITOS|GLOBULOS ROJOS'],
 ['OBACT','BACTERIAS','ORINA','', 'BACTERIAS|GERMENES'],
 ['OCIL','CILINDROS','ORINA','', 'CILINDROS'],
 ['OPROT','PROTEÍNAS','ORINA','', 'PROTEINAS?'],
 ['ODENS','DENSIDAD','ORINA','', 'DENSIDAD'],
 ['PROT24','PROTEINURIA DE 24 H','ORINA','G/24 H', 'PROTEINURIA( DE)? 24 ?(H|HORAS)|PROTEINAS EN ORINA DE 24 ?(H|HORAS)'],
 ['CREA24','CREATININA EN ORINA DE 24 H','ORINA','', 'CREATININA EN ORINA( DE 24 ?(H|HORAS))?'],
 ['RPC','ÍNDICE PROT/CREAT','ORINA','', 'INDICE PROTEINA ?/ ?CREATININA|RELACION PROTEINA ?/ ?CREATININA|IPC'],
 ['ANA','ANA','INMUNO','', 'ANA|ANTICUERPOS ANTINUCLEARES|AAN'],
 ['ANCAC','ANCA-C','INMUNO','', 'ANCA[ -]?C|C[ -]?ANCA'],
 ['ANCAP','ANCA-P','INMUNO','', 'ANCA[ -]?P|P[ -]?ANCA'],
 ['PR3','ANTI-PR3','INMUNO','', '(ANTI[ -]?)?PR3'],
 ['MPO','ANTI-MPO','INMUNO','', '(ANTI[ -]?)?MPO'],
 ['DNA','ANTI-DNA','INMUNO','', 'ANTI[ -]?DNA( DC| DS)?|ANTI[ -]?DSDNA'],
 ['SM','ANTI-SM','INMUNO','', 'ANTI[ -]?SM'],
 ['RNP','ANTI-RNP','INMUNO','', 'ANTI[ -]?(U1[ -]?)?RNP'],
 ['RO','ANTI-RO','INMUNO','', 'ANTI[ -]?RO( ?\\/ ?SSA)?|ANTI[ -]?SSA'],
 ['LA','ANTI-LA','INMUNO','', 'ANTI[ -]?LA( ?\\/ ?SSB)?|ANTI[ -]?SSB'],
 ['C3','C3','INMUNO','', 'C3|COMPLEMENTO C3'],
 ['C4','C4','INMUNO','', 'C4|COMPLEMENTO C4'],
 ['FR','FR','INMUNO','', 'FACTOR REUMATOIDEO|FR'],
 ['CCP','ANTI-CCP','INMUNO','', 'ANTI[ -]?CCP|ANTI[ -]?PCC|PEPTIDO CITRULINADO'],
 ['ACL','ANTICARDIOLIPINA','INMUNO','', 'ANTICARDIOLIPINAS?( IGG| IGM)?'],
 ['AL','ANTICOAGULANTE LÚPICO','INMUNO','', 'ANTICOAGULANTE LUPICO'],
 ['B2','ANTI-B2GP1','INMUNO','', 'ANTI[ -]?B(ETA)?2 ?(GP1|GLICOPROTEINA)'],
 ['ASMA','ANTI-MÚSCULO LISO','INMUNO','', 'ANTI[ -]?MUSCULO LISO|ASMA']
];
const LABMAP={};LABDEF.forEach(d=>LABMAP[d[0]]={k:d[0],n:d[1],a:d[2],u:d[3],re:new RegExp('^(?:'+d[4]+')(?![A-Z0-9])'),no:(d[5]||'').split(',').filter(Boolean)});
const LABORDER=LABDEF.map(d=>d[0]);

function deacc(s){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase()}
const DATE_RE=/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
function toISO(m){let y=+m[3];if(y<100)y+=2000;const mo=+m[2],d=+m[1];if(mo<1||mo>12||d<1||d>31)return null;return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
const VAL_RE=/^[\s:=.\-–]*((?:NO\s+)?REACTIVO|POSITIVO|NEGATIVO|INDETERMINADO|NO\s+SE\s+OBSERVAN?|ESCAS[OA]S?|ABUNDANTES?|REGULAR(?:ES)?|AUSENTES?|[<>]\s?\d+(?:[.,]\d+)?|\d+\s?[-–]\s?\d+|\d{1,3}(?:[ ]\d{3})+(?![.,]\d)|\d+(?:[.,]\d+)?)(\s*(?:\(?\s*1\s*[\/:]\s*\d+\s*\)?|%))?/;
function ctxOf(line){const u=deacc(line);if(/\d/.test(u.replace(/CO2|O2|HCO3|C3|C4|24/g,''))&&u.length>30)return null;
  if(/HEMOGRAMA|HEMATOLOG/.test(u))return'HEM';if(/ORINA|SEDIMENTO|URIANALISIS/.test(u))return'ORINA';if(/GASES|GASOMETR|\bAGA\b/.test(u))return'AGA';
  if(/INMUNOLOG|SEROLOG|AUTOINMUN|REUMATOLOG/.test(u))return'INMUNO';if(/BIOQUIM/.test(u))return'BIOQ';if(/HEPATIC/.test(u))return'HEP';if(/COAGULA/.test(u))return'COAG';return null}
// Texto → filas {fecha,k,v}. defFecha: fecha por defecto (ISO)
function parseLabs(text,defFecha){
  const rows=[],unk=[];let fecha=defFecha||'',ctx=null;
  text.split(/\r?\n/).forEach(raw=>{
    let line=raw.replace(/\t/g,' ').replace(/\s+/g,' ').trim();if(!line)return;
    // formato "fecha | examen | valor" (respuesta de Claude)
    const pipe=line.split('|').map(s=>s.trim());
    if(pipe.length>=3&&DATE_RE.test(pipe[0])){const f=toISO(pipe[0].match(DATE_RE));const k=findKey(deacc(pipe[1]),ctx);if(f&&k){rows.push({fecha:f,k,v:cleanV(pipe[2])});return}}
    const dm=line.match(DATE_RE);
    let u=deacc(line).replace(/^[•·\-*\d.)\s]{0,4}(?=[A-Z])/,'');
    if(dm){const f=toISO(dm);if(f){const rest=u.replace(DATE_RE,'').replace(/FECHA( DE)?( TOMA| RESULTADO| EMISION| MUESTRA| INGRESO)?|HORA|\d{1,2}:\d\d(:\d\d)?/g,'').replace(/[\s:,\-]+/g,' ').trim();
      fecha=f;
      if(rest.length<25&&!/\d/.test(rest)){const c=ctxOf(rest);if(c)ctx=c;return}
      u=u.replace(DATE_RE,'').replace(/^[\s:,.\-]+/,'')}}
    const c=ctxOf(line);if(c&&!/\d/.test(u.replace(/CO2|O2|HCO3|C3|C4|24/g,''))){ctx=c;return}
    const lead=u.match(/^(AGA|GASES ARTERIALES|HEMOGRAMA|ORINA|SEDIMENTO URINARIO|EXAMEN DE ORINA|PERFIL INMUNOLOGICO|INMUNOLOGIA|PERFIL HEPATICO|PERFIL MINERAL|BIOQUIMICA)\s*:\s*/);
    if(lead){const c2=ctxOf(lead[1]);if(c2)ctx=c2;u=u.slice(lead[0].length)}
    // puede haber varios analitos en una línea: "LEU 6.65, SEG 72%, HB 9.3"
    const segs=u.split(/[,;](?=\s*[A-Z])/);let any=false;
    segs.forEach(sg=>{sg=sg.trim();if(!sg)return;const hit=matchSeg(sg,ctx);if(hit){rows.push({fecha,k:hit.k,v:hit.v});any=true}});
    if(!any&&/[A-Z]{2,}/.test(u)&&!/PACIENTE|NOMBRE|DNI|HISTORIA|H\.?C\.?|MEDICO|SERVICIO|RESULTADO|REFERENCIA|UNIDAD|EXAMEN|PAGINA|HOSPITAL|ESSALUD|EDAD|SEXO/.test(u))unk.push(raw.trim());
  });
  return {rows,unk};
}
function findKey(u,ctx){for(const k of LABORDER){const d=LABMAP[k];if(d.no.includes(ctx))continue;if(d.a==='ORINA'&&['OLEU','OHEM','OBACT','OCIL','OPROT','ODENS'].includes(k)&&ctx!=='ORINA')continue;if(d.re.test(u))return k}return null}
function matchSeg(u,ctx){
  // prueba nombres más largos primero para evitar que "CA" gane a "CALCIO IONICO"
  let best=null;
  for(const k of LABORDER){const d=LABMAP[k];if(d.no.includes(ctx))continue;
    if(['OLEU','OHEM','OBACT','OCIL','OPROT','ODENS'].includes(k)&&ctx!=='ORINA')continue;
    const m=u.match(d.re);if(m&&(!best||m[0].length>best.len)){best={k,len:m[0].length}}}
  if(!best)return null;
  if(ctx==='INMUNO'&&best.k==='CA')best.k='C4'; // OCR suele leer "C4" como "CA"
  let rest=u.slice(best.len);
  rest=rest.replace(/^\s*\((?:[^)]{0,12})\)/,'');           // "(SERICO)" etc.
  rest=rest.replace(/^\s*(EN SANGRE|SERICO|SERICA|TOTAL|ABSOLUTOS?|%)\b/,'');
  const m=rest.match(VAL_RE);if(!m)return null;
  return {k:best.k,v:cleanV(m[1]+(m[2]||''))};
}
function cleanV(v){return String(v).trim().replace(/\s+/g,' ').replace(/,(?=\d{1,2}$)/,'.').replace(/\(\s*/,'').replace(/\s*\)/,'').replace(/\s?%$/,'')}
// Texto anonimizado para pedir ayuda a Claude
function anonLabText(t){return t.split(/\r?\n/).filter(l=>!/PACIENTE|NOMBRE|APELLIDO|DNI|DOCUMENTO|HISTORIA|H\.?\s?C\.?\s|N[°º] ?HC|AFILIAD|AUTOGENERADO/i.test(deacc(l))).map(l=>l.replace(/\b\d{8,}\b/g,'########')).join('\n')}
const CLAUDE_PROMPT='Ordena estos resultados de laboratorio. Responde SOLO con líneas en el formato "dd/mm/aaaa | EXAMEN | VALOR" (una por resultado, sin unidades ni rangos de referencia, usa el nombre del examen tal como aparece). Si no hay fecha para un resultado, usa la fecha más cercana que aparezca arriba.\n\n';

/* ---- Formato para la nota (estilo del modelo del servicio) ---- */
function fmtD2(iso){const[y,m,d]=iso.split('-');return d+'/'+m+'/'+y}
function itemTxt(it){const d=LABMAP[it.k];if(!d)return (it.n||it.k)+' '+it.v;let v=it.v;
  if(d.u==='%')return d.n+' '+v+'%';return d.n+' '+v+(d.u&&/^[\d.<>]/.test(v)?' '+d.u:'')}
function sortItems(items){return items.slice().sort((a,b)=>LABORDER.indexOf(a.k)-LABORDER.indexOf(b.k))}
// labs: [{fecha,area,items:[{k,v}]}] → bloques de texto
function fmtLabBlocks(labs){
  const byDate={};labs.forEach(l=>{(byDate[l.fecha]=byDate[l.fecha]||[]).push(l)});
  const dates=Object.keys(byDate).sort().reverse();
  const B={LAB:[],ORINA:[],INMUNO:[],OTROS:[]};
  dates.forEach(f=>{const L=byDate[f];const pick=a=>sortItems(L.filter(x=>a.includes(x.area)).flatMap(x=>x.items));
    const main=pick(['HEM','COAG','BIOQ','HEP']);if(main.length)B.LAB.push(fmtD2(f)+': '+main.map(itemTxt).join(', ')+'.');
    const aga=pick(['AGA']);if(aga.length)B.LAB.push(fmtD2(f)+', AGA: '+aga.map(itemTxt).join(', ')+'.');
    const o=pick(['ORINA']);if(o.length)B.ORINA.push('• '+fmtD2(f)+': '+o.map(itemTxt).join(', ')+'.');
    const im=pick(['INMUNO']);if(im.length)B.INMUNO.push('• '+fmtD2(f)+': '+im.map(itemTxt).join('; ')+'.');
    const ot=pick(['OTROS']);if(ot.length)B.OTROS.push('• '+fmtD2(f)+': '+ot.map(itemTxt).join(', ')+'.');
  });
  return B;
}
function fmtLabsText(labs,titles){
  const B=fmtLabBlocks(labs),T=Object.assign({LAB:'LAB',ORINA:'FUNCIÓN RENAL / ORINA',INMUNO:'PERFIL INMUNOLÓGICO:',OTROS:'OTROS RESULTADOS:'},titles||{});
  return ['LAB','ORINA','INMUNO','OTROS'].filter(k=>B[k].length).map(k=>T[k]+'\n'+B[k].join('\n')).join('\n\n');
}
