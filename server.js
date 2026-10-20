const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
// 500-player settings: patient pings (mobile networks), big enough buffer for the host's backup, no per-socket zlib memory
const io = new Server(server, { pingInterval: 20000, pingTimeout: 40000, maxHttpBufferSize: 8e6, perMessageDeflate: false });
// one bad event must never take the whole game down
process.on('uncaughtException', e => console.error('uncaughtException:', e && e.stack || e));
process.on('unhandledRejection', e => console.error('unhandledRejection:', e));
app.get('/health', (req,res) => res.type('text').send('ok'));
// Files are served from public/ — or, if you uploaded everything flat (no folders, e.g. from a phone), from the project root.
app.use((req,res,next)=>{
  if (req.method!=='GET') return next();
  let rel; try{ rel = decodeURIComponent(req.path); }catch(e){ return next(); }
  if (rel.includes('..')) return next();
  const _p=require('path'), _f=require('fs');
  const base=_p.basename(rel);
  if (!['.html','.png','.jpg','.jpeg','.gif','.webp','.svg','.json','.mp3','.m4a','.ogg','.wav','.aac'].includes(_p.extname(base).toLowerCase())) return next();
  if (['config.json','package.json','package-lock.json'].includes(base)) return next();
  for (const f of [_p.join(__dirname,'public',rel), _p.join(__dirname,base)]){
    try{ if (_f.statSync(f).isFile()) return res.sendFile(f); }catch(e){}
  }
  next();
});
app.use(express.static('public'));
app.get('/', (req,res)=>res.redirect('/player.html'+(req.query.code?'?code='+encodeURIComponent(req.query.code):'')));
// Short Host links: /host or /admin open the Host page directly
app.get(['/host','/admin'], (req,res)=>res.redirect('/host.html'));
app.use(express.json({limit:'2mb'}));

const HOST_ID = process.env.HOST_ID || 'admin';
const HOST_PW = process.env.HOST_PW || 'gyan2026';

const DEFAULT_QA = [
 ['જીવને માયામાંથી તારીને ભગવાનના દિવ્ય સ્વરૂપમાં જોડવા માટે સંતો દ્વારા અખંડ કથા-વાર્તા અને વિચરણ કરીને કરવામાં આવતા ભારે આધ્યાત્મિક પરિશ્રમને શું કહેવાય?','દાખડો'],
 ['અંતરમાં અખંડ ટાઢક (શાંતિ) રાખવાના અને મન અશાંત ન થાય તેના સ્વામીએ કેટલા ઉપાયો બતાવ્યા છે?','બે'],
 ['સ્વામીના મતે મોક્ષના દાતા કોણ છે?','ભગવાન અને એકાંતિક સાધુ'],
 ['ભગવાન અને સાધુ જ મોક્ષના દાતા હોવાથી આપણે શું ધ્યાન રાખવું જોઈએ?','અવગુણ ન લેવો'],
 ['સ્વામીના મતે ભવિષ્યમાં સત્સંગ અને મંદિરોનો વિકાસ કેવો થશે?','કરોડ ગણો'],
 ['સ્વામીના મતે સારો સત્સંગી કોણ છે?','ભગવાનના ભક્તમાં આત્મબુદ્ધિ'],
 ['સ્વામી ક્યાં સુધી સત્સંગ કરાવવાની વાત કરે છે?','રાત્રિપ્રલય'],
 ['મનુષ્યના જીવનમાં કયું દુઃખ થોડું અને કયું દુઃખ વધારે (ઝાઝું) હોય છે?','દેહનું અને મનનું'],
 ['સત્સંગમાંથી ક્યારેય ન પડાય (વિમુખ ન થવાય) તે માટે સ્વામીએ કેટલા સારા સાધુ અને કેટલા સારા હરીભક્તો સાથે જીવ બાંધવા કહ્યું છે','બે અને ત્રણ'],
 ['ભગવાન, સંતો, હરિભક્તો કે સત્સંગની વ્યવસ્થાઓ વિશે નકારાત્મક વાતો કરવી કે દોષ જોવાને સત્સંગની ભાષામાં શું કહેવાય?','અભાવ અવગુણ'],
 ['સ્વામીના વચન અનુસાર આપણે આપણા પોતાના સ્વરૂપને કેવું માનવું જોઈએ?','અક્ષર'],
 ['જો પોતાના સ્વરૂપને અક્ષર ન માની શકાય, તો પણ કઈ બાબતની પોતાને ના માનવું?','સ્થૂળ દેહ'],
 ['વિષયો દેહના ભાવ તરીકે એક પડખે રહ્યા હોય, તો પણ જીવે પોતાના આત્માને શું ન માનવો?','નરકનો કીડો'],
 ['સત્સંગમાં ભક્તોના આધ્યાત્મિક વિકાસને સમજાવવા સ્વામીએ કોનું ઉદાહરણ આપ્યું છે?','વામનજીની લાકડી'],
 ['સ્વામીના મતે ભક્ત કથા, કીર્તન કે વાતો કરે પણ કઈ મૂળભૂત જાગૃતિ વિના તે બધું અધૂરું છે?','આ દેહ હું નહિ'],
 ['ભગવાન અને સાધુનો સાચો મહિમા સમજવાનું કારણ (સાધન) શું છે?','ભગવદીનો પ્રસંગ'],
 ['દુષ્કાળ, રોગચાળો, આર્થિક સંકટ, કુદરતી આફતો કે જીવનમાં આવતી કોઈપણ વિપરીત અને પ્રતિકૂળ પરિસ્થિતિને સામાન્ય રીતે શું કહેવાય?','દેશકાળની અવરાઈ'],
 ['દોષ પીડે તેથી સત્સંગમાં શું થઈને રહેવાય ?','દિન આધીન'],
 ['આધ્યાત્મિક માર્ગમાં સૌથી બળવાન તત્વ કયું દર્શાવવામાં આવ્યું છે?','શબ્દ'],
 ['સ્વામીના મતે જીવ સૌથી શ્રેષ્ઠ અને ઉત્તમ રીતે શેનાથી શુદ્ધ થાય છે?','વાતું'],
 ['આધ્યાત્મિક માર્ગમાં જીવને બળવાન બનાવવાનું સૌથી મોટું સાધન કયું છે?','મહિમા'],
 ['દેહના દુશ્મન કોણ કદી હોય નહિ? જેમ કરશે તેમ સુખ જ થાશે.','હરિ'],
 ['દિવ્યભાવ ને મનુષ્યભાવ એ બેને એક સમજે તે શેને તરી રહ્યો છે?','માયા'],
 ['આઠે પહોર ભજન કરવું જે, "હું દેહ નથી ને દેહમાં રહ્યો એવો જે હું કોણ છું?"','આત્મા'],
 ['જેમ નાતનો, નામનો અને ગામનો નિશ્ચય થયો છે, તેમ જ એવું શુ કરવું જોઈએ?, "હું આત્મા છું, બ્રહ્મ છું, સુખરૂપ છું"','અભ્યાસ'],
 ['ભગવાન પુરુષોત્તમ નારાયણ સર્વ અવતારના કોણ છે?','અવતારી'],
 ['ભગવાન જ્યારે પૃથ્વી ઉપર આવે ત્યારે રાજસી, તામસી, સાત્ત્વિક ને શેનો ઉદ્ધાર કરી નાખે છે?','અધમ'],
 ['નિત્યે લાખ રૂપિયા લાવે ને સત્સંગનું શું બોલતો હોય તો તે મને ન ગમે?','ઘસાતું'],
 ['અમારો મત એવો જે, ક્રિયા કરવામાં પણ ક્રિયારૂપ ન થાવું ને ક્રિયા મૂકીને પણ તેના શું ન કરવા?','મનસૂબા'],
 ['ભગવાનના કર્તાપણાની સમજણ ન હોય તો મુશ્કેલ દેશકાળમાં શું નુકસાન થાય છે?','સત્સંગ ચૂંથાઈ જાય'],
 ['સ્વામીના વચન મુજબ, કોઈ વ્યક્તિ રોજ કેટલું કમાઈને લાવે તો પણ જો સત્સંગનું ઘસાતું બોલે તો સ્વામીને ગમતું નથી?','લાખ રૂપિયા'],
 ['મહારાજના વચનામૃતના આધારે, જો ભક્તમાં કામ-લોભ ન હોય પણ ભગવાનના ભક્તમાં જીવન બંધાયો હોય તો તેનું શું પરિણામ આવે છે?','અસુર'],
 ['‘સ્વામિનારાયણ’ મહામંત્રના જાપથી કયા બાહ્ય સંકટનું ઝેર પણ ચડતું નથી?','કાળો નાગ'],
 ['‘સ્વામિનારાયણ’ મંત્ર કયા મોટા બંધનોમાંથી મુક્તિ અપાવે છે?','કાળ, કર્મ, માયા'],
 ['સ્વામીના મતે આજની તારીખે કયો મંત્ર સૌથી વધુ બળિયો (શક્તિશાળી) છે?','સ્વામિનારાયણ'],
 ['સ્વામીના મતે દેહ આપણી પાસે રોજ શું કરાવે છે?','નરક']
];

const LINES = (() => {
  const L = [];
  for (let r = 0; r < 5; r++) L.push([0,1,2,3,4].map(c => r*5+c));
  for (let c = 0; c < 5; c++) L.push([0,1,2,3,4].map(r => r*5+c));
  L.push([0,6,12,18,24]); L.push([4,8,12,16,20]);
  return L;
})();
const WINNER_ORDER = ['line1','line2','line3','line4','line5','full','top3','top2','top1','zonefull','zone'];
const WINNER_LABELS = {line1:'1 Line',line2:'2 Line',line3:'3 Line',line4:'4 Line',line5:'5 Line',full:'Full House',top3:'3rd Score',top2:'2nd Score',top1:'Overall Champion',zonefull:'Zone Full House',zone:'Zone Champion'};

function defaultQuestions(){ return DEFAULT_QA.map(([q,a]) => ({q,a})); }
function parseQA(text){
  const lines = (text||'').split('\n').map(l=>l.trim()).filter(Boolean);
  const out = [], bad = [];
  for (let l of lines){
    // optional picture: put [img:https://...] anywhere in the line
    let img = '';
    l = l.replace(/\[img:\s*(\S+?)\s*\]/i, (m,u)=>{ img=u; return ''; }).trim();
    // just a file name (e.g. q1.jpg) => picture from the public/qimg/ folder
    if (img && !/^(https?:|data:|\/)/i.test(img)) img = '/qimg/' + encodeURIComponent(img.replace(/^qimg\//i,''));
    // optional audio: [audio:song.mp3] (file in public/qaudio/) or [audio:https://...mp3]
    let aud = '';
    l = l.replace(/\[audio:\s*(\S+?)\s*\]/i, (m,u)=>{ aud=u; return ''; }).trim();
    if (aud && !/^(https?:|data:|\/)/i.test(aud)) aud = '/qaudio/' + encodeURIComponent(aud.replace(/^qaudio\//i,''));
    let parts = null;
    if (l.includes('::')) parts = [l.split('::')[0], l.split('::').slice(1).join('::')];
    else if (l.includes(' - ')) parts = [l.split(' - ')[0], l.split(' - ').slice(1).join(' - ')];
    else if ((l.match(/:/g)||[]).length===1) parts = l.split(':');
    if (parts && parts[0].trim() && parts[1] && parts[1].trim()) { const o={q:parts[0].trim(), a:parts[1].trim()}; if(img) o.img=img; if(aud) o.aud=aud; out.push(o); }
    else bad.push(l);
  }
  return { questions: out.length?out:defaultQuestions(), bad, usedDefault: out.length===0 };
}
function shuffle(a){ const arr=a.slice(); for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
function makeCard(questions){
  let pool = shuffle(questions.map(q=>q.a));
  while (pool.length < 25) pool = pool.concat(shuffle(questions.map(q=>q.a)));
  return pool.slice(0,25);
}
function randCode(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s='GYAN'; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }

const rooms = {}; // code -> room object

// ---------- Epilogue: hidden cells, Life Lines, Zone card ----------
const LIFE_KEYS = ['akshar','madad','change','safety','double'];
const ZM_MIN = 2;                              // Zone Madad needs at least this many OTHER zone-mates who already answered
const GEM_PTS=10, STAR_PTS=3, BOMB_EXTRA=-2;   // hidden cells (only matter when the answer is CORRECT, except the bomb: wrong answer)
const ZONE_LINE_PTS=3, ZONE_LINE_MAX=5, ZONE_FULL_PTS=15;
function zkey(p){ return String(p.zone||'').trim().toLowerCase(); }
function markCell(p, qi){ const k = Object.keys(p.marks).find(k=>p.marks[k]===qi); return k===undefined ? undefined : +k; }
function answerOnCard(room, p, qi){ const q = room.questions[qi]; return !!(q && q.a!==undefined && p.card.includes(q.a)); }
function makeHidden(){   // 1 gem, 3 stars, 3 bombs on 7 different cells
  const idx = shuffle([...Array(25).keys()]); const h = Array(25).fill('');
  h[idx[0]]='gem'; for(let i=1;i<=3;i++) h[idx[i]]='star'; for(let i=4;i<=6;i++) h[idx[i]]='bomb';
  return h;
}
function firstAkshar(s){
  s = String(s||'').trim();
  try{ if (typeof Intl!=='undefined' && Intl.Segmenter){ const it = new Intl.Segmenter('gu',{granularity:'grapheme'}).segment(s)[Symbol.iterator]().next(); if(!it.done) return it.value.segment; } }catch(e){}
  const m = s.match(/^[\s\S][ઁ-ઃ઼ા-્]*/); return m ? m[0] : s.charAt(0);
}
function ensureZoneCard(r, k){
  if (!r.zoneCards) r.zoneCards = {};
  if (!r.zoneSet) r.zoneSet = makeCard(r.questions);   // ONE common answer set; every Zone gets its own arrangement of it
  if (!r.zoneCards[k]) r.zoneCards[k] = shuffle(r.zoneSet);
  return r.zoneCards[k];
}
// how many correct answers the Zone needs for that question's cell to fill (host-tunable %, Safety Net lowers it, never stacks)
function zoneNeed(r, active, safe){
  const pct = r.zonePct||30, sp = Math.min(r.zoneSafe||25, pct);
  const need = Math.max(1, Math.ceil(active*pct/100 - 1e-9));
  if (!safe) return need;
  const ns = Math.max(1, Math.ceil(active*sp/100 - 1e-9));
  return ns<need ? ns : Math.max(1, need-1);
}
function closeTs(r, qi){ return (r.qClosedAt && r.qClosedAt[qi]) || r.lastSpinAt || Date.now(); }
function lockQ(r){ if (r.curIdx!=null){ if(!r.qClosedAt) r.qClosedAt={}; r.qClosedAt[r.curIdx]=Date.now(); } r.status='locked'; r.timerEnd=null; try{ refreshZoneLocks(r); }catch(e){ console.error('zlock',e); } }

// Zone cards. A Zone-card cell LOCKS when >=30% (host-tunable) of the Zone's active Players picked THAT answer on a question,
// right or wrong (just like a Player's own card). Right/wrong only becomes known at Reveal. Replayed in draw order so every Line gets a time.
function zoneCompute(r, full){
  const Z = {}, inv = {}, first = {}, pos = {};
  r.usedIdx.forEach((qi,i)=>{ pos[qi]=i; });
  for (const [n,p] of Object.entries(r.players)){
    const iv = {}; let f = 1e9;
    for (const [ci,qi] of Object.entries(p.marks)){ iv[qi]=+ci; if (pos[qi]!==undefined && pos[qi]<f) f=pos[qi]; }
    inv[n]=iv; first[n]=f;
    const k = zkey(p); if (!k) continue;
    (Z[k] = Z[k] || {key:k, zone:String(p.zone).trim(), names:[]}).names.push(n);
  }
  const t0 = r.startedAt||r.createdAt;
  for (const z of Object.values(Z)){
    const card = ensureZoneCard(r, z.key);
    z.active = z.names.filter(n=>first[n]<1e9).length; z.count = z.names.length;
    z.card = card.slice(); z.cell = card.map(()=>({st:'',pct:null,qi:null}));
    z.lineTs=[null,null,null,null,null]; z.fhTs=null; z.lines=0; z.lockLineTs=[null,null,null,null,null]; z.lockFhTs=null; z.lockLines=0;
    for (const qi of r.usedIdx){
      if (!full && !(r.qClosedAt && r.qClosedAt[qi])) continue;     // while playing, only CLOSED questions count
      const q = r.questions[qi]; if (!q || q.a===undefined) continue;
      const act = z.names.filter(n=>first[n]<=pos[qi]).length;       // active AT that question, so a lock never changes later
      let safe=false; const cnt={};
      for (const n of z.names){ const p=r.players[n]; if(p.lives && p.lives.safety===qi) safe=true; const ci=inv[n][qi]; if(ci!==undefined){ const t=p.card[ci]; cnt[t]=(cnt[t]||0)+1; } }
      const need = zoneNeed(r, act, safe); const ts = closeTs(r, qi); let any=false;
      for (const [t,c] of Object.entries(cnt).sort((a,b)=>b[1]-a[1])){
        if (act<=0 || c<need) continue;
        const pct = Math.round(c*100/act);
        card.forEach((x,i)=>{ if (x===t && z.cell[i].st===''){ any=true; z.cell[i]={st:(q.a===t?'ok':'no'), qi, pct, c, need, safe}; } });
      }
      if (!any) continue;
      const lc = LINES.filter(L=>L.every(i=>z.cell[i].st!=='')).length;
      if (lc>z.lockLines){ for (let k=z.lockLines+1; k<=Math.min(lc,ZONE_LINE_MAX); k++) z.lockLineTs[k-1]=ts; z.lockLines=lc; }
      if (!z.lockFhTs && z.cell.every(c=>c.st!=='')) z.lockFhTs=ts;
      const cnt2 = LINES.filter(L=>L.every(i=>z.cell[i].st==='ok')).length;
      if (cnt2>z.lines){ for (let k=z.lines+1; k<=Math.min(cnt2,ZONE_LINE_MAX); k++) z.lineTs[k-1]=ts; z.lines=cnt2; }
      if (!z.fhTs && z.cell.every(c=>c.st==='ok')) z.fhTs=ts;
    }
    z.lineMs = z.lineTs.map(t=>t?Math.max(0,t-t0):null); z.fhMs = z.fhTs ? Math.max(0,z.fhTs-t0) : null;
    z.full = !!z.fhTs; z.bonus = ZONE_LINE_PTS*Math.min(z.lines,ZONE_LINE_MAX) + (z.full?ZONE_FULL_PTS:0);
    z.okCells = z.cell.filter(c=>c.st==='ok').length; z.lockedCells = z.cell.filter(c=>c.st!=='').length;
  }
  return Z;
}
// what the Zone's Players may see DURING the game: which cells are locked and when a Line of locked cells formed (never right/wrong)
function refreshZoneLocks(r){
  const Z = zoneCompute(r, false); r.zlock = {};
  for (const z of Object.values(Z)) r.zlock[z.key] = {locks: z.cell.map(c=>c.st?1:0), lockLineTs: z.lockLineTs, lockLines: z.lockLines, lockFhTs: z.lockFhTs};
}

// Final result of one player. netScore = FINAL score (personal + Zone bonus); personal = without Zone bonus.
function playerResults(room, pname){
  const p = room.players[pname];
  const cellState = Array(25).fill('none'), pts = Array(25).fill(0), fx = Array(25).fill('');
  let base=0, hiddenPts=0, ddPts=0, gems=0, stars=0, bombs=0;
  Object.entries(p.marks).forEach(([ci,qi]) => {
    ci = +ci; const q = room.questions[qi]; const right = !!(q && q.a === p.card[ci]);
    cellState[ci] = right ? 'green' : 'red';
    const h = (p.hid && p.hid[ci]) || ''; const dd = !!(p.lives && p.lives.double===qi);
    let b = right ? 1 : -1, ex = 0;
    if (right){ if (h==='gem'){ ex=GEM_PTS; gems++; } else if (h==='star'){ ex=STAR_PTS; stars++; } }
    else if (h==='bomb'){ ex=BOMB_EXTRA; bombs++; }
    base += b; hiddenPts += ex; if (dd) ddPts += b;      // double down doubles the +-1 only
    pts[ci] = b*(dd?2:1) + ex;
  });
  (p.hid||[]).forEach((h,ci)=>{ fx[ci]=h; });
  const usedAnswers = room.usedIdx.map(i => room.questions[i].a);
  for (let ci=0; ci<25; ci++) if (cellState[ci]==='none' && usedAnswers.includes(p.card[ci])) cellState[ci]='yellow';
  const correctRows = LINES.filter(line => line.every(ci=>cellState[ci]==='green')).length;
  const correctCount = cellState.filter(s=>s==='green').length;
  const wrongCount = cellState.filter(s=>s==='red').length;
  const fullHouse = cellState.every(s=>s==='green');
  const personal = base + hiddenPts + ddPts;
  const zi = room.zoneInfo && room.zoneInfo[zkey(p)];
  const zoneBonus = zi ? zi.bonus : 0;
  return { cellState, pts, fx, correctRows, correctCount, wrongCount, fullHouse, base, hiddenPts, ddPts, gems, stars, bombs, personal, zoneBonus, netScore: personal+zoneBonus };
}
function computeAll(r){
  r.zoneInfo = zoneCompute(r, true);
  const R = {};
  for (const n of Object.keys(r.players)) R[n] = playerResults(r, n);
  const ranked = Object.entries(r.players).map(([name,p])=>({name,p,res:R[name]}))
    .sort((a,b)=> b.res.netScore-a.res.netScore || b.res.correctCount-a.res.correctCount || a.res.wrongCount-b.res.wrongCount || a.p.joinedAt-b.p.joinedAt);
  ranked.forEach((x,i)=>{ R[x.name].rank=i+1; R[x.name].of=ranked.length; });
  for (const z of Object.values(r.zoneInfo)){
    z.total = z.names.reduce((s,n)=>s+R[n].personal,0); z.avg = z.count ? z.total/z.count : 0;
  }
  Object.values(r.zoneInfo).sort((a,b)=>b.avg-a.avg||b.total-a.total).forEach((z,i)=>{ z.rank=i+1; });
  for (const [n,p] of Object.entries(r.players)){ const z=r.zoneInfo[zkey(p)]; if (z){ R[n].zoneRank=z.rank; R[n].zones=Object.keys(r.zoneInfo).length; } }
  r.results = R;
  // per-question stats, Life Line use and hidden-cell stats for the Dashboard
  r.qStats = r.usedIdx.map(qi=>{
    const q = r.questions[qi]; let c=0, w=0, none=0;
    for (const p of Object.values(r.players)){ const ci=markCell(p,qi); if(ci===undefined) none++; else if(p.card[ci]===q.a) c++; else w++; }
    return {qi, correct:c, wrong:w, none, pct: Math.round(c*100/Math.max(1,c+w+none))};
  });
  const LS = {akshar:0,madad:0,change:0,safety:0,double:0};
  for (const p of Object.values(r.players)) for (const k of LIFE_KEYS) if (p.lives && p.lives[k]!=null) LS[k]++;
  r.lifeStats = LS;
  const HS = {gemHit:0, gemTotal:0, starHit:0, starTotal:0, bombHit:0, bombTotal:0};
  for (const [n,p] of Object.entries(r.players)){ HS.gemTotal++; HS.starTotal+=3; HS.bombTotal+=3; HS.gemHit+=R[n].gems; HS.starHit+=R[n].stars; HS.bombHit+=R[n].bombs; }
  r.hidStats = HS;
  r.winners = computeWinners(r);
}
function computeWinners(room){
  const winners = {}; const R = room.results;
  for (const cat of ['line1','line2','line3','line4','line5','full']){
    let best=null, tied=[];
    for (const [name,p] of Object.entries(room.players)){
      if (!p.claims || !p.claims[cat]) continue;
      if (p.claims[cat].valid === true){   // judged when the claim was made
        const ts=p.claims[cat].ts;
        if(!best || ts<best.ts){ best={name,ts}; tied=[name]; }
        else if(ts===best.ts){ tied.push(name); }
      }
    }
    winners[cat] = best?best.name:null;
    winners[cat+'_ts'] = best?best.ts:null;
    winners[cat+'_ms'] = best?Math.max(0,best.ts-(room.startedAt||room.createdAt)):null;
    winners[cat+'_tie'] = tied.length>1 ? tied : null;
  }
  const ranked = Object.entries(room.players).map(([name,p])=>({name,p,res:R[name]}))
    .sort((a,b)=> b.res.netScore-a.res.netScore || b.res.correctCount-a.res.correctCount || a.res.wrongCount-b.res.wrongCount || a.p.joinedAt-b.p.joinedAt);
  [['top1',0],['top2',1],['top3',2]].forEach(([k,i])=>{ const x=ranked[i]; winners[k]=x?x.name:null; winners[k+'_score']=x?x.res.netScore:null; winners[k+'_correct']=x?x.res.correctCount:null; winners[k+'_wrong']=x?x.res.wrongCount:null; });
  const Zs = Object.values(room.zoneInfo||{});
  // Zone Full House: the Zone whose card was completed EARLIEST
  const fz = Zs.filter(z=>z.fhTs).sort((a,b)=>a.fhTs-b.fhTs || a.zone.localeCompare(b.zone))[0];
  winners.zonefull = fz ? fz.zone : null; winners.zonefull_ts = fz ? fz.fhTs : null; winners.zonefull_ms = fz ? fz.fhMs : null; winners.zonefull_count = fz ? fz.count : null;
  // Zone Champion: highest AVERAGE personal score (without Zone bonus); tie -> higher total
  let bz=null;
  for (const z of Zs){ if(!bz || z.avg>bz.avg || (z.avg===bz.avg && z.total>bz.total)) bz=z; }
  winners.zone = bz && bz.avg>0 ? bz.zone : null;
  winners.zone_avg = bz && bz.avg>0 ? Math.round(bz.avg*100)/100 : null;
  winners.zone_total = bz && bz.avg>0 ? bz.total : null;
  winners.zone_count = bz && bz.avg>0 ? bz.count : null;
  return winners;
}
// What a browser may see. Hidden cells, correctness, Zone-card state: NOTHING until the host presses Reveal.
function pubPlayer(room, p, own){
  const claims = {};
  for (const [k,c] of Object.entries(p.claims||{})) claims[k] = {ts:(c.shownTs||c.ts), marks:c.marks};
  const o = {...p, claims}; delete o.hid; delete o._f; delete o._c;
  if (!own){ delete o._ak; delete o._md; }
  return o;
}
function publicRoom(room){
  if (room.status==='revealed') return room;
  const players = {};
  for (const [n,p] of Object.entries(room.players)) players[n] = pubPlayer(room,p,false);
  return {...room, questions: room.questions.map(q=>({q:q.q, img:q.img, aud:q.aud})), players};
}
// ---- 500-player friendly state: a PLAYER only receives his own data (+ the few winners after the reveal).
function zoneSummary(room){
  return Object.values(room.zoneInfo||{}).map(z=>({lockLines:z.lockLines,lockedCells:z.lockedCells,zone:z.zone,count:z.count,active:z.active,avg:z.avg,total:z.total,bonus:z.bonus,lines:z.lines,full:z.full,lineTs:z.lineTs,lineMs:z.lineMs,fhTs:z.fhTs,fhMs:z.fhMs,okCells:z.okCells,rank:z.rank}))
    .sort((a,b)=>a.rank-b.rank);
}
function slimBase(room){
  const { clientMap, players, zoneCards, zoneSet, zoneInfo, results, zlock, ...rest } = room;
  const n = Object.keys(players).length;
  if (room.status==='revealed'){
    const keep = {};
    for (const k of ['line1','line2','line3','line4','line5','full','top1','top2','top3']){ const v=(room.winners||{})[k]; if (typeof v==='string' && players[v]) keep[v]={...players[v], res:results[v]}; }
    return {base:{...rest, nPlayers:n, zoneS:zoneSummary(room)}, keep};
  }
  return {base:{...rest, nPlayers:n, questions: room.questions.map(q=>({q:q.q, img:q.img, aud:q.aud}))}, keep:{}};
}
function slimFor(room, S, name){
  const players = {...S.keep}; const out = {...S.base, players};
  const p = name && room.players[name];
  if (p){
    const k = zkey(p);
    if (room.status==='revealed'){ players[name] = {...p, res:room.results[name]}; if (k && room.zoneInfo[k]) out.myZone = room.zoneInfo[k]; }
    else { players[name] = pubPlayer(room, p, true); if (k){ out.zoneCard = ensureZoneCard(room,k); out.zoneLock = (room.zlock && room.zlock[k]) || null; } }
  }
  return out;
}
// Host-only backup: the host's browser keeps the FULL room (with answers) so that if the server
// sleeps/restarts (Render free tier), the host can restore the game instantly.
const bkTimers = {};
function scheduleBackup(code){
  if (bkTimers[code]) return;
  bkTimers[code] = setTimeout(()=>{ delete bkTimers[code]; if (rooms[code]) io.to(code+'#h').emit('backup', rooms[code]); }, 4000);
}
function broadcast(code){
  const r = rooms[code]; if(!r) return;
  io.to(code+'#h').emit('state', publicRoom(r));
  const ids = io.sockets.adapter.rooms.get(code); if (ids){
    const S = slimBase(r);
    for (const id of ids){
      const sk = io.sockets.sockets.get(id); if(!sk || sk.rooms.has(code+'#h')) continue;
      sk.emit('state', slimFor(r, S, sk.data && sk.data.code===code ? sk.data.name : null));
    }
  }
  scheduleBackup(code);
}
// a player did something small (tap, join, life line): tell ONLY him now; the host gets a throttled update
const hostT = {};
function touchHost(code){
  if (hostT[code]) return;
  hostT[code] = setTimeout(()=>{ delete hostT[code]; if (rooms[code]){ io.to(code+'#h').emit('state', publicRoom(rooms[code])); scheduleBackup(code); } }, 1000);
}
function touch(socket, code, name){
  const r = rooms[code]; if(!r) return;
  const p = r.players[name]; if(p) socket.emit('me', {name, p: pubPlayer(r,p,true)});
  touchHost(code);
}
// Live "Zone: X% got it right" for the OPEN question only, sent to the players of that Zone (never the answer itself)
function emitZoneLive(code, r){
  const qi = r.curIdx, q = r.questions[qi]; if (!q) return;
  const S = {};
  for (const p of Object.values(r.players)){
    const k = zkey(p); if (!k) continue; const z = S[k] || (S[k]={act:0,c:0});
    if (Object.keys(p.marks).length) z.act++;
    const ci = markCell(p,qi); if (ci!==undefined && p.card[ci]===q.a) z.c++;
  }
  for (const k of Object.keys(S)){ const z=S[k]; io.to(code+'#z:'+k).emit('zlive', {qi, n:z.act, c:z.c, pct: z.act>=3 ? Math.round(z.c*100/z.act) : null}); }
}

const SEEN = {};   // code|key -> last time that player's browser talked to us (join, tap, resync every 4 s)
function seen(code,key){ if (key) SEEN[code+'|'+key]=Date.now(); }
const ONLINE_MS = +process.env.ONLINE_MS || 15000;
let _zt = 0;
setInterval(() => {
  _zt++;
  for (const code of Object.keys(rooms)){
    const r = rooms[code];
    if (r.status==='question' && !r.paused && r.timerEnd && Date.now()>=r.timerEnd){
      lockQ(r); broadcast(code);
    } else if (r.status==='question' && !r.paused && _zt%2===0) emitZoneLive(code, r);
  }
}, 1000);

function bindSock(socket, r, code, name){
  socket.data = {code, name}; seen(code,name);
  const p = r.players[name]; const k = p && zkey(p);
  if (k){ ensureZoneCard(r,k); socket.join(code+'#z:'+k); }
}
function bindName(socket, r, code, clientId){
  const nm = clientId && r.clientMap && r.clientMap[clientId];
  if (nm && r.players[nm]) bindSock(socket, r, code, nm);
}

// drop event floods from one socket (a stuck/abusive client); normal play is a few events per second
io.use((socket, next) => next());
setInterval(() => { const cut = Date.now() - 48*3600*1000; for (const c of Object.keys(rooms)) if ((rooms[c].createdAt||Date.now()) < cut) delete rooms[c]; }, 3600*1000);
io.on('connection', (socket) => {
  let _n = 0, _t = Date.now();
  socket.use((pkt, next) => { const now = Date.now(); if (now-_t>1000){ _t=now; _n=0; } if (++_n>60) return; next(); });
  socket.on('subscribe', ({code, host, clientId}, cb) => {
    if (rooms[code]){
      socket.join(code); if(!host) bindName(socket, rooms[code], code, clientId);
      if (host){ socket.join(code+'#h'); scheduleBackup(code); cb && cb({ok:true, room: publicRoom(rooms[code])}); }
      else { const Sx = slimBase(rooms[code]); cb && cb({ok:true, room: slimFor(rooms[code], Sx, socket.data&&socket.data.code===code?socket.data.name:null)}); }
    }
    else cb && cb({ok:false, error:'Room code મળ્યો નહિ.'});
  });

  // Players call this every few seconds: re-joins the room after a server restart/restore.
  socket.on('resync', ({code, clientId}, cb) => {
    const r = rooms[code];
    if (!r){ cb && cb({ok:false}); return; }
    if (socket.rooms.has(code) && socket.data && socket.data.code===code) { seen(code,socket.data.name); cb && cb({ok:true}); return; }
    socket.join(code); bindName(socket, r, code, clientId); const Sy = slimBase(r); cb && cb({ok:true, room: slimFor(r, Sy, socket.data&&socket.data.code===code?socket.data.name:null)});
  });

  // Host restores a game from the backup kept in the host's browser (after server sleep/restart).
  socket.on('host:restore', ({room}, cb) => {
    try{
      if (!room || typeof room.code!=='string' || !room.players || !Array.isArray(room.questions)){ cb&&cb({ok:false,error:'Backup ખરાબ છે.'}); return; }
      const code = room.code;
      if (!rooms[code]){
        const r = room;
        // a spin that never completed is cancelled; give the question back to the wheel
        if (r.status==='spinning' || r.status==='revealing'){
          r.usedIdx = (r.usedIdx||[]).filter(i=>i!==r.curIdx); r.curIdx=null; r.status='active'; r.timerEnd=null;
        }
        if (r.status==='question' && !r.paused && (!r.timerEnd || r.timerEnd<Date.now())) lockQ(r);
        r.clientMap = r.clientMap || {};
        rooms[code] = r;
      }
      socket.join(code); socket.join(code+'#h');
      cb && cb({ok:true, code});
      broadcast(code);
    }catch(e){ cb && cb({ok:false, error:String(e.message||e)}); }
  });

  // ---- Pause / Resume the question timer ----
  socket.on('host:pause', ({code}) => {
    const r = rooms[code]; if(!r || r.status!=='question' || r.paused) return;
    r.paused = true; r.pausedMs = Math.max(0, (r.timerEnd||0)-Date.now()); r.timerEnd = null;
    broadcast(code);
  });
  socket.on('host:resume', ({code}) => {
    const r = rooms[code]; if(!r || !r.paused) return;
    r.paused = false; r.timerEnd = Date.now() + (r.pausedMs||0); r.pausedMs = null;
    broadcast(code);
  });

  // ---- Undo the last spin (only if nobody has claimed since that spin) ----
  socket.on('host:undoSpin', ({code}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false}); return; }
    if (r.curIdx==null || !['question','locked','revealing'].includes(r.status) || !r.usedIdx.includes(r.curIdx)){ cb&&cb({ok:false,error:'Undo કરવા જેવું કોઈ Question નથી.'}); return; }
    for (const p of Object.values(r.players)){
      for (const c of Object.values(p.claims||{})){
        if (c.shownTs>=r.lastSpinAt || c.ts>=r.lastSpinAt){ cb&&cb({ok:false,error:'આ Question પછી કોઈ Player એ Claim કરી દીધી છે, એટલે Undo થઈ શકશે નહિ.'}); return; }
      }
    }
    const idx = r.curIdx;
    r.usedIdx = r.usedIdx.filter(i=>i!==idx);
    for (const p of Object.values(r.players)){
      for (const ci of Object.keys(p.marks)) if (p.marks[ci]===idx) delete p.marks[ci];
      if (p.markTs) delete p.markTs[idx];
      if (p.lives) for (const k of LIFE_KEYS) if (p.lives[k]===idx){ delete p.lives[k]; if(k==='change') p.changed=false; }
      if (p._ak && p._ak.qi===idx) delete p._ak; if (p._md && p._md.qi===idx) delete p._md;
    }
    if (r.qClosedAt) delete r.qClosedAt[idx];
    try{ refreshZoneLocks(r); }catch(e){}
    r.status='active'; r.curIdx=null; r.timerEnd=null; r.paused=false; r.pausedMs=null;
    cb && cb({ok:true});
    broadcast(code);
  });

  socket.on('host:login', ({id,pw}, cb) => {
    cb && cb({ok: id===HOST_ID && pw===HOST_PW});
  });

  socket.on('host:create', ({hostName, maxPlayers, qaText}, cb) => {
    const code = randCode();
    const parsed = parseQA(qaText);
    rooms[code] = {
      code, hostName, maxPlayers: maxPlayers||null, status:'lobby',
      questions: parsed.questions, usedIdx:[], curIdx:null, timerEnd:null,
      players:{}, winners:null, revealStep:0, createdAt: Date.now(), zonePct:30, zoneSafe:25, draw:'wheel', zoneCards:{}, qClosedAt:{}
    };
    socket.join(code);
    cb && cb({ok:true, code, parseInfo:{count:parsed.questions.length, bad:parsed.bad, usedDefault:parsed.usedDefault}});
    broadcast(code);
  });

  socket.on('host:start', ({code}) => { const r=rooms[code]; if(!r) return; r.status='active'; if(!r.startedAt) r.startedAt=Date.now(); broadcast(code); });

  const REVEAL_MS=1600;       // how long the big number popup stays up before the question appears
  const SPIN_SAFETY_MS=6000;  // safety net only — if host's browser never confirms, auto-advance so the game can't get stuck
  socket.on('host:spin', ({code}) => {
    const r = rooms[code]; if(!r) return;
    if(r.status!=='active' && r.status!=='locked') return; // ignore duplicate/racing spin clicks — fixes skipped questions
    const avail=[]; for(let i=0;i<r.questions.length;i++) if(!r.usedIdx.includes(i)) avail.push(i);
    if (avail.length===0){ r.status='ended'; broadcast(code); return; }
    const idx = avail[Math.floor(Math.random()*avail.length)];
    r.status='spinning'; r.curIdx=idx; r.usedIdx=[...r.usedIdx, idx]; r.timerEnd=null; r.paused=false; r.pausedMs=null; r.lastSpinAt=Date.now();
    broadcast(code);
    // Safety net only: if the host's own wheel never confirms completion (tab closed, crash, etc.),
    // reveal anyway after a generous timeout so the game never gets permanently stuck.
    setTimeout(()=>{
      const rr=rooms[code]; if(!rr||rr.status!=='spinning'||rr.curIdx!==idx) return;
      advanceToRevealing(code, idx);
    }, SPIN_SAFETY_MS);
  });
  function advanceToRevealing(code, idx){
    const r=rooms[code]; if(!r||r.status!=='spinning'||r.curIdx!==idx) return;
    r.status='revealing'; broadcast(code);
    setTimeout(()=>{
      const rr=rooms[code]; if(!rr||rr.status!=='revealing'||rr.curIdx!==idx) return;
      rr.status='question'; rr.timerEnd=Date.now()+(rr.qSec||30)*1000; broadcast(code);
    }, REVEAL_MS);
  }
  // Host's own wheel tells us exactly when its CSS animation visually finished — no guessing, no drift.
  socket.on('host:spinComplete', ({code, idx}) => { advanceToRevealing(code, idx); });

  // Host: question timer length (10-60 s) and skip the remaining time
  socket.on('host:setTimer', ({code, sec}) => {
    const r = rooms[code]; if(!r) return;
    sec = Math.round(+sec); if(!(sec>=10 && sec<=60)) return;
    r.qSec = sec; broadcast(code);
  });
  socket.on('host:skipTimer', ({code}) => {
    const r = rooms[code]; if(!r || r.status!=='question') return;
    lockQ(r); r.paused=false; r.pausedMs=null; broadcast(code);
  });
  socket.on('host:setZone', ({code, pct, safe}) => {
    const r = rooms[code]; if(!r || r.status==='revealed') return;
    pct=Math.round(+pct); safe=Math.round(+safe);
    if(!(pct>=10 && pct<=90) || !(safe>=5 && safe<=pct)) return;
    r.zonePct=pct; r.zoneSafe=safe; broadcast(code);
  });
  socket.on('host:setDraw', ({code, method}) => {
    const r = rooms[code]; if(!r || !['wheel','ball','dice','slot'].includes(method)) return;
    r.draw=method; broadcast(code);
  });

  socket.on('host:end', ({code}) => { const r=rooms[code]; if(!r) return; if(r.status==='question') lockQ(r); r.status='ended'; r.paused=false; broadcast(code); });

  // Host's live note shown under every player's Scratch Card message
  socket.on('host:scNote', ({code, text}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false}); return; }
    r.scNote = String(text||'').replace(/[\u0000-\u001f]+/g,' ').trim().slice(0,140);
    broadcast(code); cb&&cb({ok:true});
  });

  // Host reveals the Scratch Card to every player
  socket.on('host:scReveal', ({code, on}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false}); return; }
    r.scReveal = !!on; broadcast(code); cb&&cb({ok:true});
  });

  socket.on('host:reveal', ({code}) => {
    const r = rooms[code]; if(!r) return;
    if(r.status==='question') lockQ(r); r.status='revealed'; computeAll(r); r.revealStep=1;
    broadcast(code);
  });

  socket.on('host:nextWinner', ({code}) => {
    const r = rooms[code]; if(!r) return;
    r.revealStep = (r.revealStep||0)+1;
    broadcast(code);
  });


  socket.on('player:join', ({code,name,zone,avatar,clientId}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false,error:'Room code મળ્યો નહિ.'}); return; }
    name=(name||'').trim(); zone=(zone||'').trim();
    if(!name){ cb&&cb({ok:false,error:'નામ લખો.'}); return; }
    if(!r.clientMap) r.clientMap = {};
    const norm = x => (x||'').trim().toLowerCase();
    // 1) same device + same name + same zone => reconnecting (refresh / network drop): resume own card
    const mine = clientId && r.clientMap[clientId];
    if(mine && r.players[mine] && norm(r.players[mine].baseName)===norm(name) && norm(r.players[mine].zone)===norm(zone)){
      socket.join(code); bindSock(socket, r, code, mine);
      const S0 = slimBase(r);
      cb && cb({ok:true, room: slimFor(r,S0,mine), yourKey:mine, resumed:true});
      touchHost(code);
      return;
    }
    // 2) another player with the same name AND same zone already exists => ask for a different name
    const dupKey = Object.keys(r.players).find(k => norm(r.players[k].baseName)===norm(name) && norm(r.players[k].zone)===norm(zone));
    if(dupKey){
      // same name + same zone: if that Player is NOT online right now (refresh / closed browser / new browser) it is the same person coming back => resume his card.
      // If that Player is online at this moment it is a different person => refuse.
      const last = SEEN[code+'|'+dupKey]||0;
      if (Date.now()-last > ONLINE_MS){
        if (clientId) r.clientMap[clientId] = dupKey;
        socket.join(code); bindSock(socket, r, code, dupKey);
        const S0 = slimBase(r);
        cb && cb({ok:true, room: slimFor(r,S0,dupKey), yourKey:dupKey, resumed:true});
        touchHost(code); return;
      }
      cb&&cb({ok:false,error:'⚠️ આ નામ અને Zone વાળો Player હમણાં Game માં ચાલુ (Online) છે. જો તે તમે જ હો તો જૂનું Tab/Browser બંધ કરી 15 સેકન્ડ પછી ફરી Join કરો. બીજી વ્યક્તિ હો તો બીજું નામ (અથવા અટક) વાપરો.'}); return;
    }
    if (r.maxPlayers && Object.keys(r.players).length>=r.maxPlayers){ cb&&cb({ok:false,error:'Room ભરાઈ ગયો છે.'}); return; }
    // 3) same name in a different zone is allowed; give it a unique internal key "Name (2)"
    let key = name;
    if(r.players[key]){
      let n=2; while(r.players[`${name} (${n})`]) n++;
      key = `${name} (${n})`;
    }
    r.players[key] = { card: makeCard(r.questions), hid: makeHidden(), baseName: name, zone, avatar: avatar||'🦁', marks:{}, markTs:{}, lives:{}, claims:{}, joinedAt: Date.now() };
    if(clientId) r.clientMap[clientId] = key;
    socket.join(code); bindSock(socket, r, code, key);
    const S1 = slimBase(r);
    cb && cb({ok:true, room: slimFor(r,S1,key), yourKey:key});
    touchHost(code);
  });

  socket.on('player:mark', ({code,name,ci}) => {
    seen(code,name);
    const r = rooms[code]; if(!r || r.status!=='question' || r.paused) return;
    if (r.timerEnd && Date.now()>r.timerEnd+500) return;      // the server clock decides when time is up
    const p = r.players[name]; if(!p) return;
    ci = +ci; if(!Number.isInteger(ci) || ci<0 || ci>24) return;
    if(!p.markTs) p.markTs = {}; if(!p.lives) p.lives = {};
    const old = markCell(p, r.curIdx);
    if (old!==undefined){
      // already answered: only allowed once, and only after 🔄 Change Answer was switched on for THIS question
      if (!(p.lives.change===r.curIdx && !p.changed)) return;
      if (old===ci || p.marks[ci]!==undefined) return;
      delete p.marks[old]; p.marks[ci] = r.curIdx; p.markTs[r.curIdx] = Date.now(); p.changed = true;
      touch(socket,code,name); return;
    }
    if (p.marks[ci]!==undefined) return;
    p.marks[ci] = r.curIdx; p.markTs[r.curIdx] = Date.now();
    touch(socket,code,name);
  });

  // ---- 5 Life Lines (each once per game; one per question, 🔄 Change Answer is exempt) ----
  socket.on('player:life', ({code,name,life}, cb) => {
    seen(code,name);
    const r = rooms[code]; const fail = m => cb && cb({ok:false,error:m});
    if(!r || r.status!=='question' || r.paused) return fail('હમણાં Life Line વાપરી શકાય નહિ.');
    if (r.timerEnd && Date.now()>r.timerEnd+300) return fail('સમય પૂરો થઈ ગયો.');
    const p = r.players[name]; if(!p) return fail('Player મળ્યો નહિ.');
    if(!LIFE_KEYS.includes(life)) return fail('ખોટી Life Line.');
    if(!p.lives) p.lives = {};
    const cur = r.curIdx, q = r.questions[cur];
    if (p.lives[life]!=null) return fail('આ Life Line તમે પહેલેથી વાપરી લીધી છે.');
    if (life!=='change' && LIFE_KEYS.some(k=>k!=='change' && p.lives[k]===cur)) return fail('આ પ્રશ્નમાં એક Life Line વપરાઈ ગઈ છે. એક પ્રશ્નમાં ફક્ત એક (🔄 Change સિવાય).');
    const zk = zkey(p);
    if (life==='change'){
      if (markCell(p,cur)===undefined) return fail('પહેલા એક ખાનું દબાવો, પછી 🔄 Change વાપરો.');
      p.lives.change = cur; p.changed = false; touch(socket,code,name); return cb && cb({ok:true});
    }
    if (life==='safety'){
      if (!zk) return fail('Zone વગર Safety Net ન વપરાય.');
      p.lives.safety = cur; touch(socket,code,name); return cb && cb({ok:true});
    }
    if (life==='madad'){
      if (!zk) return fail('Zone વગર Zone Madad ન વપરાય.');
      const cnt = {}; let tot = 0;
      for (const [n,o] of Object.entries(r.players)){
        if (n===name || zkey(o)!==zk) continue; const ci = markCell(o,cur); if (ci===undefined) continue;
        const t = o.card[ci]; cnt[t] = (cnt[t]||0)+1; tot++;
      }
      if (tot<ZM_MIN) return fail('તમારા Zone માંથી હજી ફક્ત '+tot+' Players એ જવાબ આપ્યો છે. 🤝 Madad માટે ઓછામાં ઓછા '+ZM_MIN+' જોઈએ. Life Line વપરાઈ નથી, થોડી વાર પછી ફરી પ્રયત્ન કરો.');
      const list = Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,c])=>({text:t, pct:Math.round(c*100/tot)}));
      p.lives.madad = cur; p._md = {qi:cur, list, n:tot};
      touch(socket,code,name); return cb && cb({ok:true, md:p._md});
    }
    if (!answerOnCard(r,p,cur)) return fail('આ પ્રશ્નનો જવાબ તમારા Card માં નથી. Life Line વપરાઈ નથી.');
    if (life==='double'){ p.lives.double = cur; touch(socket,code,name); return cb && cb({ok:true}); }
    if (life==='akshar'){
      const ch = firstAkshar(q.a);
      const cells = []; p.card.forEach((t,i)=>{ if (firstAkshar(t)===ch) cells.push(i); });
      p.lives.akshar = cur; p._ak = {qi:cur, ch, cells};
      touch(socket,code,name); return cb && cb({ok:true, ak:p._ak});
    }
  });

  socket.on('player:claim', ({code,name,type}) => {
    seen(code,name);
    const r = rooms[code]; if(!r || r.status==='revealed') return;
    const p = r.players[name]; if(!p) return;
    if(!p.claims) p.claims={};
    if(!/^(line[1-5]|full)$/.test(type)) return;
    const now = Date.now();
    const res = playerResults(r, name);       // validity is judged at the moment of the claim
    const marks = Object.keys(p.marks).length;
    const put = (key, need) => {
      const valid = key==='full' ? res.fullHouse : res.correctRows>=need;
      const old = p.claims[key];
      if(old && old.valid){ old.marks = marks; return; }   // an earlier valid claim always stays (earliest time wins)
      // shownTs = time of the player's FIRST click; it never changes, so a player can't tell from the clock
      // whether an earlier claim was wrong. ts = official time used for winners (only revealed at the end).
      p.claims[key] = {ts: now, shownTs: old ? (old.shownTs||old.ts) : now, valid, marks};
    };
    put(type, type==='full'?null:+type.replace('line',''));
    // Claiming "N Line" also registers 1..N-1 Line, each judged on its own truth.
    if(/^line[2-5]$/.test(type)){
      const n = +type.replace('line','');
      for(let k=1;k<n;k++) put('line'+k, k);
    }
    touch(socket,code,name);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Gyan Shodh Quiz server (The Epilogue) running on port '+PORT));
