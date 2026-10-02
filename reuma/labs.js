/* ===== Lector de laboratorio: texto (foto/Texto en vivo/PDF) → resultados estructurados ===== */
'use strict';
// Áreas en el orden en que aparecen en la nota
const AREAS={HEM:'Hematología',COAG:'Coagulación',BIOQ:'Bioquímica',HEP:'Perfil hepático',AGA:'AGA',ORINA:'Orina / función renal',INMUNO:'Inmunología',OTROS:'Otros'};
// [clave, nombre en la nota, área, unidad en la nota, regex del nombre (sin tildes, mayúsculas), contextos donde NO aplica]
const LABDEF=[
 ['LEU','LEU','HEM','', 'LEUCOCITOS?|LEUCOS|LEUCO|LEU|WBC|GLOBULOS BLANCOS','ORINA'],
 ['SEG','SEG','HEM','%', 'SEGMENTADOS|NEUTROFILOS( SEGMENTADOS)?( %)?|NEUT%?|SEG'],
 ['ABS','ABS','HEM','%', 'ABASTONADOS|ABAST|ABS'],
 ['LINF','LINF','HEM','%', 'LINFOCITOS|LINF|LYM%?'],
 ['MONO','MONO','HEM','%', 'MONOCITOS|MONO'],
 ['EOS','EOS','HEM','%', 'EOSINOFILOS|EOS'],
 ['HB','HB','HEM','G/DL', 'HEMOGLOBINA|HGB|HB'],
 ['HTO','HTO','HEM','%', 'HEMATOCRITO|HTO|HCT'],
 ['VCM','VCM','HEM','', 'VCM|MCV|VOLUMEN CORPUSCULAR MEDIO'],
 ['PLAQ','PLAQ','HEM','', 'PLAQUETAS|PLT|PLAQ|PLA'],
 ['VSG','VSG','HEM','', 'VSG|VELOCIDAD DE SEDIMENTACION'],
 ['INR','INR','COAG','', 'INR'],
 ['TP','TP','COAG','', 'TIEMPO DE PROTROMBINA|TP'],
 ['TTP','TTP','COAG','', 'TTPA?|TIEMPO DE TROMBOPLASTINA( PARCIAL)?( ACTIVADA)?'],
 ['FIB','FIBRINÓGENO','COAG','', 'FIBRINOGENO'],
 ['GLU','GLUCOSA','BIOQ','MG/DL', 'GLUCOSA|GLICEMIA|GLUCEMIA','ORINA'],
 ['UREA','UREA','BIOQ','MG/DL', 'UREA|BUN'],
 ['CREA','CREATININA','BIOQ','MG/DL', 'CREATININA( SERICA)?|CREA|CRE','ORINA'],
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
 ['BT','BT','HEP','', 'BILIRRUBINA TOTAL|BT|BILI'],
 ['BD','BD','HEP','', 'BILIRRUBINA DIRECTA|BD'],
 ['BI','BI','HEP','', 'BILIRRUBINA INDIRECTA|BI'],
 ['PT','PROTEÍNAS TOTALES','HEP','G/DL', 'PROTEINAS TOTALES|PT','ORINA'],
 ['ALB','ALBÚMINA','HEP','G/DL', 'ALBUMINA( SERICA)?|ALB','ORINA'],
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
 ['COLEST','COLEST','BIOQ','', 'COLESTEROL( TOTAL)?|COLEST|COL'],
 ['TRIG','TRIG','BIOQ','', 'TRIGLICERIDOS|TRIG|TG'],
 ['GLOB','GLOB','HEP','', 'GLOBULINAS?|GLOB|GLO'],
 ['T4L','T4L','BIOQ','', 'T4 ?L(IBRE)?|T4'],
 ['TSH','TSH','BIOQ','', 'TSH|TIROTROPINA'],
 ['PTH','PTH','BIOQ','', 'PTH|PARATOHORMONA|PARATHORMONA|HORMONA PARATIROIDEA'],
 ['BNP','NT-PROBNP','BIOQ','', 'NT-?PRO ?BNP|PRO ?BNP|BNP|PEPTIDO NATRIURETICO'],
 ['IGE','IGE','INMUNO','', 'IGE|DOSAJE DE IGE|INMUNOGLOBULINA E'],
 ['FE','HIERRO','BIOQ','', 'FIERRO SERICO|HIERRO SERICO|HIERRO|FE SERICO'],
 ['TRANSF','TRANSFERRINA','BIOQ','', 'TRANSFERRINA'],
 ['B12','VITAMINA B12','BIOQ','', 'VITAMINA B ?-?12|CIANOCOBALAMINA'],
 ['FOL','ÁCIDO FÓLICO','BIOQ','', 'AC\\.? FOLICO|ACIDO FOLICO|FOLATO'],
 ['T3','T3','BIOQ','', 'T3( TOTAL)?|TRIYODOTIRONINA'],
 ['CYFRA','CYFRA 21-1','OTROS','', 'CYFRA ?21-1'],
 ['CA125','CA 125','OTROS','', 'CA ?125'],
 ['CA199','CA 19-9','OTROS','', 'CA ?19-9'],
 ['CA153','CA 15-3','OTROS','', 'CA ?15-3'],
 ['OCEL','CÉLULAS EPITELIALES','ORINA','', 'CELULAS EPITELIALES'],
 ['HBSAG','HBSAG','INMUNO','', 'HBSAG|ANTIGENO DE SUPERFICIE|VHB'],
 ['HBC','ANTI-HBC','INMUNO','', 'ANTI[ -]?HBC( TOTAL)?|CORE TOTAL'],
 ['HBS','ANTI-HBS','INMUNO','', 'ANTI[ -]?HBS'],
 ['VHC','ANTI-VHC','INMUNO','', 'ANTI[ -]?VHC|ANTI[ -]?HCV|HEPATITIS C|VHC'],
 ['VIH','VIH','INMUNO','', 'VIH|HIV'],
 ['VDRL','VDRL','INMUNO','', 'VDRL|RPR'],
 ['HAVIGM','VHA IGM','INMUNO','', 'HEPATITIS A IGM|VHA IGM'],
 ['COOMBSD','COOMBS DIRECTO','INMUNO','', 'COOMBS DIRECTO|COOMBS'],
 ['COOMBSI','COOMBS INDIRECTO','INMUNO','', 'COOMBS INDIRECTO'],
 ['CRIO','CRIOGLOBULINAS','INMUNO','', 'CRIOGLOBULINAS?'],
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
 ['ACL','ANTICARDIOLIPINA','INMUNO','', 'ANTICARDIOLIPINAS?( IGG| IGM)?|ACL'],
 ['AL','ANTICOAGULANTE LÚPICO','INMUNO','', 'ANTICOAGULANTE LUPICO|AL'],
 ['B2','ANTI-B2GP1','INMUNO','', 'ANTI[ -]?B(ETA)?2 ?(GP1|GLICOPROTEINA)|B2 ?GP ?1'],
 ['ASMA','ANTI-MÚSCULO LISO','INMUNO','', 'ANTI[ -]?MUSCULO LISO|ASMA'],
 ['IGG','IGG','INMUNO','', 'IGG|DOSAJE DE IGG|INMUNOGLOBULINA G'],
 ['IGA','IGA','INMUNO','', 'IGA|DOSAJE DE IGA|INMUNOGLOBULINA A'],
 ['IGM','IGM','INMUNO','', 'IGM|DOSAJE DE IGM|INMUNOGLOBULINA M'],
 ['HDL','HDL','BIOQ','', 'HDL|COLESTEROL HDL'],
 ['LDL','LDL','BIOQ','', 'LDL|COLESTEROL LDL']
];
const LABMAP={};LABDEF.forEach(d=>LABMAP[d[0]]={k:d[0],n:d[1],a:d[2],u:d[3],re:new RegExp('^(?:'+d[4]+')(?![A-Z0-9])'),no:(d[5]||'').split(',').filter(Boolean)});
const LABORDER=LABDEF.map(d=>d[0]);

function deacc(s){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase()}
const DATE_RE=/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
function toISO(m){let y=+m[3];if(y<100)y+=2000;const mo=+m[2],d=+m[1];if(mo<1||mo>12||d<1||d>31)return null;return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
const VAL_RE=/^[\s:=.\-–]*((?:NO\s+)?REACTIVO|POSITIVO|NEGATIVO|INDETERMINADO|NO\s+SE\s+OBSERVAN?|ESCAS[OA]S?|ABUNDANTES?|REGULAR(?:ES)?|AUSENTES?|1\s?\/\s?\d+(?![.,\d])|[<>]\s?\d+(?:[.,]\d+)?|\d+\s?[-–]\s?\d+|\d{1,3}(?:[ ]\d{3})+(?![.,]\d)|\d+(?:[.,]\d+)?)(\s*(?:\(?\s*1\s*[\/:]\s*\d+\s*\)?|%))?/;
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
      u=u.replace(DATE_RE,'').replace(/^[\s:,.\-•·*]+/,'')}}
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
  rest=rest.replace(/^\s*(MG\s*\/\s*DL|MG\s*\/|G\s*\/\s*DL|GR\/DL|MMOL\/L|MEQ\/L|U\s*\/\s*L|UI\/L|10\^\d\/MM\^3|PG\s*\/\s*ML|PG|FL|UM\^3|NG\/ML|%)\s+(?=[<>\d]|NHR)/,'');
  const m=rest.match(VAL_RE);if(!m)return null;
  return {k:best.k,v:cleanV(m[1]+(m[2]||''))};
}
function cleanV(v){return String(v).trim().replace(/\s+/g,' ').replace(/,(?=\d{1,2}$)/,'.').replace(/\(\s*/,'').replace(/\s*\)/,'').replace(/\s?%$/,'')}
// Texto anonimizado para pedir ayuda a Claude
function anonLabText(t){return t.split(/\r?\n/).filter(l=>!/PACIENTE|NOMBRE|APELLIDO|DNI|DOCUMENTO|HISTORIA|H\.?\s?C\.?\s|N[°º] ?HC|AFILIAD|AUTOGENERADO/i.test(deacc(l))).map(l=>l.replace(/\b\d{8,}\b/g,'########')).join('\n')}
const CLAUDE_PROMPT='Ordena estos resultados de laboratorio. Responde SOLO con líneas en el formato "dd/mm/aaaa | EXAMEN | VALOR" (una por resultado, sin unidades ni rangos de referencia, usa el nombre del examen tal como aparece). Si no hay fecha para un resultado, usa la fecha más cercana que aparezca arriba.\n\n';

/* ---- Formato para la nota (estilo del modelo del servicio) ---- */
function fmtD2(iso){const[y,m,d]=iso.split('-');return d+'/'+m+'/'+y}
function itemTxt(it){const d=LABMAP[it.k];if(!d)return (it.n||it.k)+': '+it.v;let v=it.v;
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

/* ---- Formato de EVOLUCIÓN (modelo del servicio: minúsculas, abreviaturas cortas, "dd/mm: … | …") ---- */
const SC_LOW=new Set(('DE DEL LA EL LOS LAS Y E O U EN CON SIN POR A AL QUE SE NO SU SUS UN UNA MAS MÁS MUY ES HOY AÚN AUN YA SI SÍ NI LE LO HAY '+
 'PIEL PASA BIEN LEVE ZONA LADO CARA OJOS OJO MANO PIES PIE DEDO DOS TRES DÍAS DIAS DÍA DIA CADA VEZ TRAS PARA COMO SOLO SÓLO TIPO ALTA BAJA ORAL CASA '+
 'VIDA MAL BUEN FINO FINA GRAN OTRO OTRA ESTE ESTA ESA ESE ESO HACE DADO AÑO AÑOS MES HORA TOS BOCA ROJA ROJO SECO SECA DURA DURO NADA TODO TODA UNO '+
 'MG ML MCG KG CM MM LPM RPM SEG MIN NIEGA REFIERE BIEN PERO TIENE MISMO MISMA ANTE ESTÁ ESTA SERÁ SOLA SOLO BAJO ALTO LIBRE').split(' '));
const SC_KEEP=new Set(['LOTEP','BIRADS','ANGIOTEM','ESSALUD','HNCASE','COVID','MMSS','MMII','EPID','ANCA','AREG','AREN','AREH','SOMA','EDTC','IECA','AINE','ERGE','NYHA','EPOC','SDRA','CPRE','HBPM','ARA2','ANTI','PCR','RHA','RCR','SAAF','CREST','DMARD','BIOL']);
// Convierte a minúsculas un texto que está TODO en mayúsculas (datos antiguos); respeta siglas cortas. Si ya tiene minúsculas, no lo toca.
function sc(s){s=String(s??'');if(!s.trim()||/[a-zà-ÿ]/.test(s))return s;
  let o=s.replace(/[A-ZÁÉÍÓÚÜÑ]+/g,w=>SC_LOW.has(w)?w.toLowerCase():SC_KEEP.has(w)||w.length<=3||!/[AEIOUÁÉÍÓÚ]/.test(w)?w:w.toLowerCase());
  return o.replace(/(^\s*|[.!?]\s+|\n\s*)([a-záéíóúüñ])/g,(m,a,b)=>a+b.toUpperCase())}
const SHORT={LEU:'Leuco',SEG:'Seg',ABS:'Abast',LINF:'Linf',MONO:'Mono',EOS:'Eos',HB:'Hb',HTO:'Hto',VCM:'VCM',PLAQ:'Pla',VSG:'VSG',INR:'INR',TP:'TP',TTP:'TTPa',FIB:'Fibrinógeno',
 GLU:'Glu',UREA:'Urea',CREA:'Cre',AU:'Ác. úrico',NA:'Na',K:'K',CL:'Cl',CA:'Ca',CAI:'Ca iónico',P:'P',MG:'Mg',PCR:'PCR',PCT:'PCT',DHL:'LDH',CPK:'CPK',FERR:'Ferritina',HBA1C:'HbA1c',VITD:'Vit D',
 TGO:'TGO',TGP:'TGP',FA:'FA',GGT:'GGT',BT:'BT',BD:'BD',BI:'BI',PT:'PT',ALB:'Alb',GLOB:'Glo',PH:'pH',PCO2:'pCO2',PO2:'pO2',HCO3:'HCO3',BE:'BE',LAC:'Lactato',SAT:'SatO2',
 OLEU:'L',OHEM:'H',OBACT:'Bact',OCIL:'Cilindros',OPROT:'Prot',ODENS:'Dens',OCEL:'Cél. epit',PROT24:'P24H',CREA24:'Cre orina 24h',RPC:'IPC',
 COLEST:'Col',TRIG:'TG',HDL:'HDL',LDL:'LDL',T4L:'T4L',TSH:'TSH',T3:'T3',PTH:'PTH',BNP:'NT-proBNP',FE:'Hierro',TRANSF:'Transferrina',B12:'B12',FOL:'Ac. fólico',
 CYFRA:'CYFRA 21-1',CA125:'CA 125',CA199:'CA 19-9',CA153:'CA 15-3',HBSAG:'HBsAg',HBC:'Anti-HBc',HBS:'Anti-HBs',VHC:'VHC',VIH:'HIV',VDRL:'VDRL',HAVIGM:'VHA IgM',
 COOMBSD:'Coombs',COOMBSI:'Coombs indirecto',CRIO:'Crioglobulinas',ANA:'ANA',ANCAC:'ANCA-C',ANCAP:'ANCA-P',PR3:'PR3',MPO:'MPO',DNA:'Anti-DNA',SM:'Anti-Sm',RNP:'Anti-RNP',RO:'Anti-Ro',LA:'Anti-La',
 C3:'C3',C4:'C4',FR:'FR',CCP:'Anti-CCP',ACL:'ACL',AL:'AL',B2:'B2GP1',ASMA:'ASMA',IGG:'IgG',IGA:'IgA',IGM:'IgM',IGE:'IgE'};
const SERO_K=['HBSAG','HBC','HBS','VHC','VIH','VDRL','HAVIGM'];
const IMG_RE=/TOMOGRAF|\bTEM\b|\bTAC\b|ANGIOTEM|RESONANCIA|\bRMN\b|\bRM\b|ECOGRAF|\bECO\b|DOPPLER|RADIOGRAF|\bRX\b|MAMOGRAF|GAMMAGRAF|DENSITOMETR|ECOCARDIO|PET/;
const PROC_RE=/ENDOSCOP|\bEDA\b|COLONOSCOP|MANOMETR|BIOPSIA|\bBX\b|ELECTROMIOGRAF|\bEMG\b|ELECTROCARDIOGRAMA|\bEKG\b|\bECG\b|ESPIROMETR|PUNCION|PARACENTESIS|TORACOCENTESIS|ARTROCENTESIS|CAPILAROSCOP|ANATOMIA PATOLOG|PATOLOGIA|BRONCOSCOP|HOLTER|POLISOMNOGRAF/;
function txtKind(titulo){const u=deacc(titulo||'');return PROC_RE.test(u)?'proc':IMG_RE.test(u)?'img':'lab'}
function dm(iso){const[y,m,d]=iso.split('-');return d+'/'+m}
function vEv(k,v){v=String(v??'').trim();const d=LABMAP[k];
  v=v.replace(/^(NO REACTIVO|NEGATIVO|NEG)\b\.?/i,'(-)').replace(/^(POSITIVO|REACTIVO|POS)\b\.?/i,'(+)');
  v=sc(v).replace(/^\((\+|-)\)\s*[,:]?\s*/,'($1) ').replace(/\bIG([GMAE])\b/g,'Ig$1').trim();
  v=v.replace(/^(\d{1,3}) (\d{3})$/,'$1$2');if(d&&d.u==='%'&&/^[\d.,<>]+$/.test(v))v+='%';return v}
function itemEv(it){if(/^TXT_/.test(it.k))return null;const n=SHORT[it.k]||(LABMAP[it.k]?sc(LABMAP[it.k].n):sc(it.n||it.k));return n+' '+vEv(it.k,it.v)}
// labs:[{fecha,area,items}] → {lab:[líneas], img:[], proc:[]}
function fmtLabsEvol(labs){
  const byDate={};labs.forEach(l=>l.items.forEach(it=>{(byDate[l.fecha]=byDate[l.fecha]||[]).push(it)}));
  const out={lab:[],img:[],proc:[]};
  Object.keys(byDate).sort().reverse().forEach(f=>{const its=sortItems(byDate[f]);const G={main:[],inm:[],sero:[],tum:[],ori:[],eco:[]};
    its.forEach(it=>{if(/^TXT_/.test(it.k)){const kd=txtKind(it.n);if(kd==='lab')G.tum.push(sc(it.n)+': '+sc(it.v).trim().replace(/\.$/,''));else out[kd].push(dm(f)+' '+sc(it.n)+': '+dot2(sc(it.v)));return}
      const d=LABMAP[it.k],a=d?d.a:'OTROS',x=itemEv(it);
      if(SERO_K.includes(it.k))G.sero.push(x);else if(a==='INMUNO')G.inm.push(x);else if(a==='ORINA')(['OLEU','OHEM','OBACT','OCIL','OPROT','ODENS','OCEL'].includes(it.k)?G.eco:G.ori).push(x);
      else if(a==='OTROS')G.tum.push(x);else if(a==='AGA')G.main.push(x);else G.main.push(x)});
    if(G.eco.length)G.ori.unshift('e.c.o. '+G.eco.join(' '));
    const parts=[G.main,G.inm,G.sero,G.ori,G.tum].filter(g=>g.length).map(g=>g.join(' '));
    if(parts.length)out.lab.push(dm(f)+': '+parts.join(' | '))});
  return out}
function dot2(s){s=String(s||'').trim();return!s?'':/[.!?:)]$/.test(s)?s:s+'.'}
// Líneas de laboratorio escritas al estilo de la evolución ("30/09: Leuco 7.7 Hb 11.0 … | C3 110 FR (-)") → filas
function parseEvLabs(lines,ref){const rows=[],texts=[];let fecha=ref;
  const yr=(d,m)=>{let y=+ref.slice(0,4);let iso=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');if(iso>ref)iso=(y-1)+iso.slice(4);return iso};
  lines.forEach(raw=>{let l=raw.replace(/\s+/g,' ').trim().replace(/^[-•·*]\s*/,'');if(!l)return;
    const m=l.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*[:\-]?\s*/);
    if(m){const d=+m[1],mo=+m[2];if(mo>=1&&mo<=12&&d>=1&&d<=31){fecha=m[3]?toISO([0,m[1],m[2],m[3]]):yr(d,mo);l=l.slice(m[0].length)}}
    l=l.replace(/^\([^)]*[A-Za-z][^)]*\)\s*/,'').replace(/^perfil[^:]{0,30}:\s*/i,'');
    if(!/\d|\([+-]\)/.test(l))return;
    l.split('|').forEach(part=>{const O=part.replace(/,/g,' ');let s=[...O].map(c=>deacc(c)||c).join('');let off=0,eco=false,guard=0;
      const adv=n=>{s=s.slice(n);off+=n};
      while(s&&guard++<200){const ws=s.match(/^[\s.;:]+/);if(ws)adv(ws[0].length);if(!s)break;
        const ec=s.match(/^E\.?\s?C\.?\s?O\.?(?=\s)/);if(ec){eco=true;adv(ec[0].length);continue}
        if(eco){const em=s.match(/^(L|H|LEU|HEM)\s+(\d+\s*-\s*\d+|\d+|>\s?\d+)/);if(em){rows.push({fecha,k:/^L/.test(em[1])?'OLEU':'OHEM',v:em[2].replace(/\s/g,'')});adv(em[0].length);continue}}
        let best=null;
        for(const k of LABORDER){const mm=s.match(LABMAP[k].re);if(mm&&(!best||mm[0].length>best.len))best={k,len:mm[0].length}}
        if(!best){adv((s.match(/^\S+\s*/)||[s])[0].length);continue}
        adv(best.len);const sp=s.match(/^\s*:?\s*/);adv(sp[0].length);
        const q=s.match(/^\(\s*([+-])\s*\)((?:\s*IG[GMA]\s*\d\+)?)/);
        if(q){let v=(q[1]==='+'?'POSITIVO':'NEGATIVO')+(q[2]?' '+q[2].trim():'');adv(q[0].length);
          // ANA/ANCA: arrastra el patrón y el título ("patrón nuclear granular fino 1/160")
          if(['ANA','ANCAC','ANCAP','MPO','PR3','DNA'].includes(best.k)){const pm=s.match(/^\s*(?:[.;]\s*)?((?:PATRON|TITULO|>|1\s*\/)[^.|]*?)(?=\s*(?:\.|$|\s(?:C3|C4|ANCA|MPO|PR3|ANTI|ENA|FR)\b))/);if(pm){v+=' '+O.substr(off+pm[0].indexOf(pm[1]),pm[1].length).trim();adv(pm[0].length)}}
          rows.push({fecha,k:best.k,v});continue}
        const mv=s.match(VAL_RE);if(mv&&mv[1]){rows.push({fecha,k:best.k,v:cleanV(mv[1]+(mv[2]||''))});adv(mv[0].length)}}})});
  // si un examen aparece dos veces el mismo día, queda el primero
  const seen=new Set();return {rows:rows.filter(r=>{const id=r.fecha+r.k;if(seen.has(id))return false;seen.add(id);return true}),texts}}
// "23/09 TEM TAP: no EPID" / "TEM de tórax: No EPID." → {fecha,titulo,texto}
function parseEvTexts(lines,ref){let fecha=ref;const out=[];
  const yr=(d,m)=>{let y=+ref.slice(0,4);let iso=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');if(iso>ref)iso=(y-1)+iso.slice(4);return iso};
  lines.forEach(raw=>{let l=raw.replace(/\s+/g,' ').trim().replace(/^[-•·*]\s*/,'');if(!l)return;let f=fecha;
    const m=l.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*[:\-,]?\s*/);if(m){f=m[3]?toISO([0,m[1],m[2],m[3]]):yr(+m[1],+m[2]);l=l.slice(m[0].length)}
    const i=l.indexOf(':');if(i>1&&i<80){let ti=l.slice(0,i).trim(),tx=l.slice(i+1).trim();const c=ti.lastIndexOf(',');if(c>0){tx='('+ti.slice(0,c).trim()+') '+tx;ti=ti.slice(c+1).trim()}out.push({fecha:f,titulo:ti,texto:tx})}else if(out.length)out[out.length-1].texto+=' '+l;else out.push({fecha:f,titulo:'Informe',texto:l})});
  return out}

/* ===== Lector específico de reportes de laboratorio del ESSI (PDF con texto) ===== */
// Soporta los dos formatos de impresión: "Visualiza Atenciones del Acto Médico" y "Muestra en ventana emergente…"
const ESSI_MAP={'CREATININA':'CREA','GLUCOSA BASAL':'GLU','GLUCOSA':'GLU','DESHIDROGENASA LACTICA':'DHL','POTASIO':'K','SODIO':'NA','CLORO':'CL','TGO':'TGO','TGP':'TGP','UREA':'UREA',
 'LEUCOCITOS':'LEU','HEMOGLOBINA':'HB','HEMATOCRITO':'HTO','VOLUMEN CORPUSCULAR MEDIO':'VCM','PLAQUETAS':'PLAQ','SEGMENTADOS %':'SEG','EOSINOFILOS %':'EOS','LINFOCITOS %':'LINF','MONOCITOS %':'MONO',
 'ABASTONADOS %':'ABS','ABASTONADOS':'ABS','INR':'INR','TIEMPO DE PROTOMBINA':'TP','TIEMPO DE PROTROMBINA':'TP','TIEMPO DE TROMBOPLASTINA':'TTP',
 'PCR - PROTEINA C REACTIVA':'PCR','PROTEINA C REACTIVA':'PCR','PROBNP':'BNP','NT-PROBNP':'BNP','PARATOHORMONA':'PTH','CALCIO SERICO':'CA','CALCIO IONICO':'CAI','CALCIO IONIZADO':'CAI','CALCIO':'CA','PROTEINAS TOTALES':'PT','GLOBULINA':'GLOB',
 'ALBUMINA':'ALB','HEMOGLOBINA GLICOSILADA':'HBA1C','FOSFORO':'P','MAGNESIO':'MG','ACIDO URICO':'AU','BILIRRUBINA TOTAL':'BT','BILIRRUBINA DIRECTA':'BD','BILIRRUBINA INDIRECTA':'BI',
 'FOSFATASA ALCALINA':'FA','GAMMA GLUTAMIL':'GGT','PROCALCITONINA':'PCT','FERRITINA':'FERR','VELOCIDAD DE SEDIMENTACION':'VSG','COLESTEROL HDL':'HDL','COLESTEROL LDL':'LDL','HDL COLESTEROL':'HDL','LDL COLESTEROL':'LDL','COLESTEROL TOTAL':'COLEST','COLESTEROL':'COLEST','TRIGLICERIDOS':'TRIG',
 'FIBRINOGENO':'FIB','LACTATO':'LAC','TSH':'TSH','HORMONA ESTIMULANTE':'TSH','T4 LIBRE':'T4L','T3 TOTAL':'T3','TRIYODOTIRONINA':'T3','COMPLEMENTO C3':'C3','COMPLEMENTO C4':'C4','C3':'C3','C4':'C4',
 'DOSAJE DE IGM':'IGM','DOSAJE DE IGA':'IGA','DOSAJE DE IGG':'IGG','IGE':'IGE','FACTOR REUMATOIDEO':'FR','CREATINA QUINASA':'CPK','CPK':'CPK','VITAMINA B12':'B12','AC. FOLICO':'FOL','ACIDO FOLICO':'FOL',
 'FIERRO SERICO':'FE','HIERRO SERICO':'FE','HIERRO':'FE','TRANSFERRINA':'TRANSF','VDRL':'VDRL','RPR':'VDRL','PEPTIDO CICLICO CITRULINADO':'CCP','ANTI CCP':'CCP','ANTIGENO DE SUPERFICIE':'HBSAG','HBSAG':'HBSAG',
 'HIV':'VIH','VIH':'VIH','HEPATITIS C':'VHC','HEPATITIS A IGM':'HAVIGM','CORE TOTAL':'HBC','ANTI HBC':'HBC','ANTI HBS':'HBS','CYFRA 21-1':'CYFRA','CA 125':'CA125','CA 19-9':'CA199','CA 15-3':'CA153',
 'COOMBS DIRECTO':'COOMBSD','COOMBS INDIRECTO':'COOMBSI','CRIOGLOBULINA':'CRIO'};
const ESSI_KEYS=Object.keys(ESSI_MAP).sort((a,b)=>b.length-a.length);
function essiKey(name){const n=name.replace(/\bC\s+(3|4)\b/g,'C$1');if(ESSI_MAP[n])return ESSI_MAP[n];const k=ESSI_KEYS.find(x=>n.startsWith(x+' ')||n.startsWith(x+' -')||n===x);return k?ESSI_MAP[k]:findKey(n,null)}
const ESSI_SKIP=/^(HEMATIES|IDE-?SD|IDE-?CV|HEMOGLOBINA CORPUSCULAR|CONCENTRACION MEDIA DE|VOLUMEN PLAQUETARIO MEDIO|BASOFILOS %|.*#)$/;
const ESSI_TIT={'89051':'RECUENTO CELULAR','87205':'GRAM','87070':'CULTIVO','87040':'HEMOCULTIVO','87086':'UROCULTIVO','87088':'UROCULTIVO','87117':'CULTIVO DE BK','87556.01':'GENEXPERT MTB/RIF','87206':'BK DIRECTO','84157':'PROTEÍNAS','82945':'GLUCOSA','84165':'ELECTROFORESIS DE PROTEÍNAS','85007':'FROTIS DE SANGRE PERIFÉRICA','88305':'ANATOMÍA PATOLÓGICA'};
const UNIT_RE=/^(mg\s*\/?|g\s*\/?|gr\/dl|g\/dl|mg\/dl|mmol\/l|meq\/l|u\s*\/\s*l|ui\/l|iu\s*\/\s*ml|10\^\d\/mm\^3|%|pg\s*\/?|pg\/ml|fl|um\^3|ng\/ml|ng\s*\/\s*ml|ug\/dl|seg|s|dl|ml|mm\/h|cel\/mm3)$/i;
const VAL_ITEM=/^(?:[<>]=?\s*)?\d+(?:[.,]\d+)?$|^\d+\s*-\s*\d+$|^NHR$|^(?:NO\s*)?REACTIVO$|^(SUERO\s+)?NO\s*REACTIVO$|^POSITIVO|^NEGATIVO|^INDETERMINADO|^TRAZAS|^\+{1,4}$|^\d\+$|1\s*\/\s*\d+|^MEMO$/i;
const ESSI_NOISE=/^\d{1,2}\/\d{1,2}\/\d{2},|sgss\.essalud|Muestra en ventana emergente|^Datos del Paciente|^(Apellidos y Nombres|Doc\. de Identidad|Direcci[oó]n|Cas de Adscripci[oó]n|CAS de Atencion|Tipo de Seguro|Tipo Acreditaci[oó]n|Acto de Salud|Fecha de Ingreso|Area Hospitalaria|Numero de Atencion|Examenes Auxiliares)/i;
function essiImgTitle(e){if(!e)return null;let n=deacc(e.name).replace(/\([^)]*\)/g,'').replace(/\s+/g,' ');const ind=deacc(e.ind||'');
  const mod=/TOMOGRAF/.test(n)?'TEM':/RESONANCIA/.test(n)?'RMN':/ECOGRAF|ULTRASONID/.test(n)?'ECOGRAFÍA':/MAMOGRAF/.test(n+' '+ind)?'MAMOGRAFÍA':/RADIOGRAF|RAYOS X/.test(n)?'RX':/ECOCARDIOGRAF/.test(n)?'ECOCARDIOGRAMA':null;if(!mod)return null;
  if(mod==='MAMOGRAFÍA')return mod;let reg=(n.match(/(?:,|\bDE\b)\s*([A-Z ]+?)\s*(?:;|,|\.|$)/)||[])[1]||'';reg=reg.replace(/^(LA|EL|LOS|LAS)\s+/,'').replace(/^(AXIAL|COMPUTARIZADA)\s*/,'').trim();
  const con=/SIN MATERIALES? DE CONTRASTE|SIN CONTRASTE/.test(n)?' SIN CONTRASTE':/CON MATERIALES? DE CONTRASTE|CON CONTRASTE/.test(n)?' CON CONTRASTE':'';return (mod+(reg?' DE '+reg:'')+con).replace(/\s+/g,' ').trim()}
function essiConcl(tx){const u=deacc(tx);const re=/(IMPRESION DIAGNOSTICA|IMP\.?\s*DG|IDX|CONCLUSION(?:ES)?)\s*:/g;let m,last=null;while((m=re.exec(u)))last=m;return last?tx.slice(last.index+last[0].length).trim():''}
function essiDetect(rows){return rows.some(r=>r.some(i=>/Examenes Auxiliares Solicitados|Solicitud Nro/i.test(i.s)))}
function essiVal(v){v=String(v);if(v.length>14)return v.replace(/^SUERO\s+/i,'').replace(/\s+/g,' ').trim();return cleanV(String(v).replace(/^SUERO\s+/i,'').replace(/^NOREACTIVO$/i,'NO REACTIVO').replace(/\s*-\s*/,'-'))}
function essiParse(rows){
  const out={rows:[],texts:[],pend:[],unk:[]};let exam=null,fecha=null,muestra='',solic='',inf=null,hora='';
  const short=e=>e?(ESSI_TIT[e.code]||up(e.name).replace(/;\s*/,' ').replace(/[,(].*$/,'').replace(/^(DOSAJE DE|PRUEBA DE|DETECCION DE)\s+/,'').trim()):'';
  const push=(k,v,f)=>{out.rows.push({fecha:f||fecha||solic,k,v:essiVal(v),h:hora});if(exam){exam.n=(exam.n||0)+1;out.texts=out.texts.filter(t=>!(t._e===exam&&/^(NHR|NO)\b/.test(t.texto)))}};
  const special=(e,tx,f)=>{const u=deacc(tx);let hit=false;const g=(re)=>{const m=u.match(re);return m?m[1].trim():''};
    if(e.code==='86039'){const t=g(/TITULACION\s*:?\s*(1\s*\/\s*\d+)/),pt=g(/PATRON\s*:?\s*(.+?)(?=\s+TITULACION|\s+\*\*|$)/);const neg=/NEGATIVO/.test(u)&&!t;if(t||pt||neg){push('ANA',neg?'NEGATIVO':(t+(pt?' PATRÓN '+pt:'')).trim(),f);hit=true}}
    if(e.code==='86021.03'||/ANCA/.test(u)){const c=g(/ANCA[ -]?C\s*:\s*([A-Z0-9\/ ]+?)(?=\s+ANCA|\s+\*\*|\s+MPO|$)/),p=g(/ANCA[ -]?P\s*:\s*([A-Z0-9\/ ]+?)(?=\s+ANCA|\s+\*\*|\s+MPO|$)/);if(c){push('ANCAC',c,f);hit=true}if(p){push('ANCAP',p,f);hit=true}
      if(!/NO PROCEDE/.test(u)){const mpo=g(/\bMPO\s*:\s*([A-Z0-9.,<> ]+?)(?=\s+PR3|$)/),pr3=g(/\bPR3\s*:\s*([A-Z0-9.,<> ]+?)(?=\s+\*|$)/);if(mpo)push('MPO',mpo,f);if(pr3)push('PR3',pr3,f)}}
    if(/COOMBS/.test(u)){const d=g(/COOMBS\s*:?\s*DIRECTO\s*:\s*(POSITIVO|NEGATIVO)/),i=g(/INDIRECTO\s*:\s*(POSITIVO|NEGATIVO)/),mono=g(/MONOESPECIFICO\s*:\s*(.+?)(?=\s+COOMBS|$)/);
      if(d){push('COOMBSD',d+(mono?' ('+mono+')':''),f);hit=true}if(i){push('COOMBSI',i,f);hit=true}}
    if(e.code==='82595'&&/(NEGATIVO|POSITIVO)/.test(u)){push('CRIO',g(/(NEGATIVO|POSITIVO)/),f);hit=true}
    return hit};
  const flush=()=>{if(inf){const e=inf.exam||{};const L=inf.lines.map(x=>x.trim()).filter(x=>x&&!/^(FECHA DE (OBTENCION|RECEPCI|PROCESAMIENTO|EMISION)|\*\*INTERPRETACI|POSITIVO$|NO DETECTADO\s*=|DETECTADO\s*=|RESULTADO:?$|\(STANDARD|TUBERCULOSIS Y SUSCEPTIBILIDAD|-?PCR MULTIPLEX|\*\*\s*METODO|MUESTRA:\s*P\d+)/i.test(deacc(x)));
      let tx=L.join(' ').replace(/\s+/g,' ').replace(/^-\s*/,'').trim();let smp='';tx=tx.replace(/TIPO DE MUESTRA:\s*(.+?)\s+REG:\s*\d+\s*-?\s*/i,(m,a)=>{smp=a;return ''}).trim();
      if(e.cod)tx=(e.cod+'. '+tx).trim();
      if(tx&&!special(e,tx,inf.fecha)&&!(e.n&&/^(NHR|NO)\b/i.test(tx))){const it=essiImgTitle(e);let ti=inf.title||it||short(e)+(smp?' ('+up(smp)+')':'');const ind=(e.ind||'').trim();if(ind&&!inf.title&&!it&&/LIQU?I?DO|ORINA|SANGRE|HECES|ESPUTO|SECRECION|LCR|BIOPSIA/.test(deacc(ind))&&!deacc(tx).includes(deacc(ind).slice(0,10)))ti+=' ('+up(ind)+')';
        if(/^VER EN INFORME ADJUNTO/i.test(deacc(tx)))tx='VER INFORME ADJUNTO';
        if(/VER INFORME EN PAGINA WEB/i.test(deacc(tx)))tx='VER INFORME EN EL LABORATORIO CENTRAL';out.texts.push({fecha:inf.fecha||solic,titulo:up(ti),texto:up(tx),concl:up(it?essiConcl(tx):''),img:!!it,_e:e})}}inf=null};
  // nombre en formato "Muestra en ventana emergente": a veces cae en una fila vecina
  for(let i=0;i<rows.length&&i<40;i++){const it=rows[i];const lab=it.find(x=>/^Apellidos y Nombres/i.test(x.s.trim()));if(!lab)continue;
    const inRow=it.map(x=>x.s).join(' ').match(/Apellidos y Nombres\s*:?\s*(.+?)\s+(?:Nro\.? Historia|Fecha de Vigencia|Vigencia)/i);
    if(inRow&&/^[A-ZÑÁÉÍÓÚ' ]{5,}$/.test(inRow[1].trim())){out.nombre=inRow[1].trim();break}
    const other=it.find(x=>x!==lab&&/Vigencia|Historia/i.test(x.s)),xmax=other?other.x:1e9;
    const cand=[rows[i],rows[i-1],rows[i+1]].filter(Boolean).flat().filter(x=>x.x>lab.x+5&&x.x<xmax&&/^[A-ZÑÁÉÍÓÚ' ]{5,}$/.test(x.s.trim())&&!/APELLIDOS|DATOS DEL|^\s*(FEMENINO|MASCULINO)\s*$/.test(x.s));
    if(cand.length){out.nombre=cand.sort((a,b)=>a.x-b.x).map(x=>x.s.trim()).join(' ');break}}
  rows.forEach(r=>{let it=r.filter(i=>i.s.trim()).map(i=>({x:i.x,s:i.s.trim()}));if(!it.length)return;const t0=it.map(i=>i.s).join(' ');
    if(!out.dni){const dm=t0.match(/D\.N\.I\.\s*(\d{8})/);if(dm)out.dni=dm[1]}
    if(!out.nombre){const nm=t0.match(/Apellidos y Nombres\s*:?\s*(.+?)\s+Nro\.? Historia/i);if(nm)out.nombre=up(nm[1].trim())}
    if(!out.sexo){const sx=t0.match(/Sexo\s*:?\s*(FEMENINO|MASCULINO)/i);if(sx)out.sexo=/^F/i.test(sx[1])?'F':'M'}
    if(!out.edad){const ed=t0.match(/\bEdad\s*:?\s*(\d{1,3})\s*A\b/i);if(ed)out.edad=ed[1]}
    if(!out.fing){const fi=t0.match(/Fecha de Ingreso\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);if(fi)out.fing=toISO(fi[1].match(DATE_RE))}
    if(ESSI_NOISE.test(t0))return;
    if(/^Indicaciones$/i.test(it[0].s)){if(exam)exam.ind=it.slice(1).map(i=>i.s).join(' ');return}
    if(/^Cod\. Resultado/i.test(it[0].s)){if(exam)exam.cod=it.slice(1).map(i=>i.s).join(' ');return}
    it=it.filter(i=>!/^(Codigo|Resultados|Indicaciones)$/i.test(i.s));if(!it.length)return;
    const t=it.map(i=>i.s).join(' ');
    if(/Solicitud Nro|Fecha de (la )?Solicitud/i.test(t)){flush();const m=t.match(DATE_RE);solic=m?toISO(m):'';return}
    if(/^\d{5}(\.\d+)?$/.test(it[0].s)){flush();exam={code:it[0].s,name:it.slice(1).map(i=>i.s).join(' '),ind:'',n:0};fecha=null;muestra='';hora='';return}
    if(/^INF\.:/.test(it[0].s)){flush();
      if(/FECHA RESULTADO:/i.test(t)&&/\/\s*\/\s*00:00:00/.test(t)){if(exam)out.pend.push({titulo:short(exam),solic});fecha=null;return}
      const dm=t.match(/FECHA(?:\s+RESULTADO:)?\s+(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?/);fecha=dm?toISO(dm[1].match(DATE_RE)):solic;if(dm&&dm[2])hora=dm[2];
      const fx=(it.find(i=>/^FECHA/.test(i.s))||{x:9999}).x;const tx=[it[0].s.replace(/^INF\.:\s*/,''),...it.slice(1).filter(i=>i.x<fx).map(i=>i.s)].join(' ').trim();
      inf={exam,fecha,lines:tx&&!/^NO$/i.test(tx)?[tx]:[]};return}
    if(/^RESULTADO:$/.test(it[0].s)){hora=(it[1]&&it[1].s)||hora;return}
    if(/^MUESTRA:/.test(it[0].s)){flush();muestra=deacc(it.slice(1).map(i=>i.s).join(' ')+' '+it[0].s.replace(/^MUESTRA:\s*/,'')).trim();return}
    if(/^\d{1,2}$/.test(it[0].s)&&it.length>=2&&!/^\d/.test(it[1].s)){flush();
      let name=deacc(it[1].s).replace(/\s+(UM\^3|PG|FL|G\/DL)$/,'').trim();
      const rest=it.slice(2).filter(i=>!/^Hrs\./i.test(i.s));let unit='',val='';
      for(const i of rest){if(/^[FM]:/.test(i.s))break;if(!val&&VAL_ITEM.test(i.s)){val=i.s;continue}if(!unit&&UNIT_RE.test(i.s.replace(/\s+/g,'')))unit=i.s}
      if(!val){const c=rest.find(i=>!/^[FM]:/.test(i.s)&&!UNIT_RE.test(i.s.replace(/\s+/g,'')));if(c)val=c.s}
      if(!val||/^\(.*\)$/.test(val)||ESSI_SKIP.test(name))return;
      const f=fecha||solic;
      if(/^MEMO$/i.test(val)){inf={exam:{...exam,n:0},fecha:f,lines:[],title:ESSI_TIT[exam&&exam.code]||up(name)};return}
      if(/LIQUIDO|LCR|CEFALORRAQ/.test(muestra)){out.texts.push({fecha:f,titulo:up(name+' EN '+muestra.replace(/^LIQUIDO/,'LÍQUIDO')),texto:up(val+(unit?' '+unit.replace(/\s+/g,''):''))});return}
      let k=null;if(/ORINA/.test(muestra)||(exam&&exam.code==='81000')){k=/PROTEIN/.test(name)?(/24/.test(muestra)?'PROT24':'OPROT'):/CREATININA/.test(name)?(/24/.test(muestra)?'CREA24':null):/LEUCOCITOS/.test(name)?'OLEU':/HEMATIES/.test(name)?'OHEM':/ALBUMIN/.test(name)?'MALB':/EPITELIAL/.test(name)?'OCEL':findKey(name,'ORINA')}
      else k=essiKey(name);
      if(k&&LABMAP[k])push(k,val,f);else out.unk.push(up(name)+': '+val+(unit?' '+unit:'')+' ('+fmtD2(f)+')');return}
    if(inf){const tx=it.filter(i=>!/^(FECHA|RESULTADO:)/.test(i.s)&&!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(i.s)).map(i=>i.s).join(' ').trim();if(tx)inf.lines.push(tx);return}
    if(exam&&!fecha&&it.length===1&&it[0].x>60){exam.name+=' '+it[0].s}
  });
  flush();
  out.rows=dedupeRows(out.rows);return out;
}

/* filas con posición x desde pdf.js */
async function pdfRows(file){const doc=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const all=[];
  for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const tc=await pg.getTextContent();const rows={};
    tc.items.forEach(it=>{if(!it.str.trim())return;const y=Math.round(it.transform[5]/3);(rows[y]=rows[y]||[]).push({x:it.transform[4],s:it.str})});
    Object.keys(rows).map(Number).sort((a,b)=>b-a).forEach(y=>all.push(rows[y].sort((a,b)=>a.x-b.x)))}
  return {rows:all,pages:doc.numPages}}

/* misma fecha + mismo examen en varios reportes: queda el de hora de resultado más tardía */
function dedupeRows(rows){const best={};rows.forEach(r=>{const k=r.fecha+'|'+r.k;if(!best[k]||(r.h||'')>=(best[k].h||''))best[k]=r});return rows.filter(r=>best[r.fecha+'|'+r.k]===r)}
/* agrupa resultados de texto del mismo líquido y fecha (citoquímico, recuento, gram, cultivo…) */
function groupTexts(texts){const out=[],map={};texts.forEach(t=>{const m=deacc(t.titulo+' '+t.texto).match(/LIQU?I?DO (ASCITI?CO|PLEURAL|CEFALORRAQUIDEO|SINOVIAL|PERITONEAL|PERICARDICO)/);
  if(!m){out.push({...t});return}const fl='LÍQUIDO '+{ASCITICO:'ASCÍTICO',ASCITCO:'ASCÍTICO',PLEURAL:'PLEURAL',CEFALORRAQUIDEO:'CEFALORRAQUÍDEO',SINOVIAL:'SINOVIAL',PERITONEAL:'PERITONEAL',PERICARDICO:'PERICÁRDICO'}[m[1]];
  const key=t.fecha+fl;let tx=t.texto.replace(/^LIQU?I?DO ASCITI?CO:\s*/i,'');tx=tx.replace(/\s+EN\s+LIQU?I?DO\s+ASCITI?CO/ig,'');const ti=t.titulo.replace(/\s*\(.*\)$/,'').replace(/ EN LÍQUIDO.*$/,'');if(!deacc(tx).startsWith(deacc(ti).split(' ')[0]))tx=ti+': '+tx;
  if(!map[key]){map[key]={fecha:t.fecha,titulo:fl,texto:tx};out.push(map[key])}else map[key].texto+='; '+tx});return out}

/* junta los resultados de varios PDFs del ESSI */
function combineEssi(list){const all={rows:[],texts:[],pend:[],unk:[],dnis:[...new Set(list.map(r=>r.dni).filter(Boolean))],nombre:(list.find(r=>r.nombre)||{}).nombre||'',sexo:(list.find(r=>r.sexo)||{}).sexo||'',edad:(list.find(r=>r.edad)||{}).edad||'',fing:list.map(r=>r.fing).filter(Boolean).sort()[0]||''};list.forEach(r=>['rows','texts','pend','unk'].forEach(k=>all[k].push(...r[k])));
  all.rows=dedupeRows(all.rows);all.texts=groupTexts(all.texts.filter((t,i,a)=>a.findIndex(u=>u.fecha===t.fecha&&u.titulo===t.titulo&&u.texto===t.texto)===i));
  const keyOf=t=>ESSI_MAP[deacc(t)]||findKey(deacc(t),null);
  all.pend=all.pend.filter((p,i,a)=>{const k=keyOf(p.titulo);if(k&&all.rows.some(r=>r.k===k&&r.fecha>=p.solic))return false;if(all.texts.some(t=>deacc(t.titulo+' '+t.texto).includes(deacc(p.titulo))&&t.fecha>=p.solic)&&!/BK/.test(p.titulo))return false;return a.findIndex(q=>q.titulo===p.titulo&&q.solic===p.solic)===i});
  return all}
