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

// Epilogue: 3 modes, 12 questions each. Questions without an explicit mode are split in order: first 12 = Mode 1, next 12 = Mode 2, the rest = Mode 3.
const MODE_NAMES = {1:'Sudharsan Shield Mode', 2:'Divine Intervention Mode', 3:'Wager with Divine Blessing Mode'};
const CARD_SPLIT = {1:8, 2:8, 3:9};                       // answers per mode on a 25-answer card
const HID_SPEC = {1:{star:2}, 2:{star:2,bomb:2}, 3:{gem:1,star:2,bomb:2}};
function assignModes(qs){
  const anyM = qs.some(q=>q.m);
  qs.forEach((q,i)=>{ if(!(q.m>=1&&q.m<=3)) q.m = anyM ? 0 : (i<12?1:(i<24?2:3)); });
  if (anyM){ let last=1; qs.forEach(q=>{ if(!q.m) q.m=last; else last=q.m; }); }
}
function defaultQuestions(){ return DEFAULT_QA.map(([q,a]) => ({q,a})); }
function parseQA(text){
  const lines = (text||'').split('\n').map(l=>l.trim()).filter(Boolean);
  const out = [], bad = []; let curM = 0, explicitM = false;
  for (let l of lines){
    // mode header line:  "Mode 1" / "Mode-2" / "મોડ 3" / "# Mode 3 ..." (no "::" in it)  => the questions below belong to that mode
    { const mh = !l.includes('::') && l.match(/^[#=\-\s]*(?:mode|મોડ)\s*[-:]?\s*([123])\b[^]*$/i); if (mh){ curM = +mh[1]; explicitM = true; continue; } }
    let qm = 0; l = l.replace(/\[(?:m|mode):\s*([123])\s*\]/i, (m,d)=>{ qm=+d; return ''; }).trim();
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
    if (parts && parts[0].trim() && parts[1] && parts[1].trim()) { const o={q:parts[0].trim(), a:parts[1].trim()}; if(img) o.img=img; if(aud) o.aud=aud; if(qm||curM){ o.m=qm||curM; explicitM=true; } out.push(o); }
    else bad.push(l);
  }
  const qs = out.length?out:defaultQuestions();
  assignModes(qs);
  return { questions: qs, bad, usedDefault: out.length===0 };
}
function shuffle(a){ const arr=a.slice(); for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
// 25-answer card: 8 answers from Mode 1's questions + 8 from Mode 2's + 9 from Mode 3's (all different answers), placed on random cells
function makeCard(questions){
  const by = {1:[],2:[],3:[]}; const seen = new Set();
  for (const q of shuffle(questions)){ const m=(q.m>=1&&q.m<=3)?q.m:1; if(seen.has(q.a)) continue; seen.add(q.a); by[m].push(q.a); }
  let pick = []; const left = [];
  for (const m of [1,2,3]){ pick = pick.concat(by[m].slice(0,CARD_SPLIT[m])); left.push(...by[m].slice(CARD_SPLIT[m])); }
  if (pick.length<25) pick = pick.concat(shuffle(left).slice(0,25-pick.length));
  while (pick.length < 25){ const all = shuffle(questions.map(q=>q.a)); pick = pick.concat(all.slice(0,25-pick.length)); }   // tiny quizzes only
  return shuffle(pick).slice(0,25);
}
function ansModeMap(questions){ const m={}; questions.forEach(q=>{ if(m[q.a]===undefined) m[q.a]=(q.m>=1&&q.m<=3)?q.m:1; }); return m; }
function cardModes(card, questions){ const m=ansModeMap(questions); return card.map(a=>m[a]||1); }
function randCode(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s='GYAN'; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }

const rooms = {}; // code -> room object

// ---------- Epilogue: hidden cells, Life Lines, Zone card ----------
const LIFE_KEYS = ['safety','madad','change','streak','recharge'];
// 🎁 Mystery Questions (secret until Reveal) and 🗳 Zone Vote questions
const MYSTERY_N = 3, VOTE_N = 2, VOTE_PTS = 3;
function pickQs(total, n, avoid){ const a=[]; for(let i=0;i<total;i++) if(!avoid.includes(i)) a.push(i); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a.slice(0,Math.min(n,Math.max(0,a.length-1))); }
function mystReward(room, name, qi){ let h=7; const t=(room.code||'')+'|'+name+'|'+qi; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0; const m=h%10; return m<5?1:(m<8?2:3); }
const ZM_MIN = 2;                              // Zone Madad needs at least this many OTHER zone-mates who already answered
const GEM_PTS=10, STAR_PTS=3, BOMB_EXTRA=-2;   // hidden cells (only matter when the answer is CORRECT, except the bomb: wrong answer)
const ZONE_LINE_PTS=3, ZONE_LINE_MAX=5, ZONE_FULL_PTS=15;
function zkey(p){ return String(p.zone||'').trim().toLowerCase(); }
const STREAK_LEN = 3, STREAK_WIN = 10, STREAK_LOSE = -5;
function streakStarts(p){ return [...((p.lifeOld&&p.lifeOld.streak)||[]), ...(p.lives&&p.lives.streak!=null?[p.lives.streak]:[])]; }
// the Bonus Streak covers the question it was started on + the next 2 asked questions; returns null while it is not finished
function streakWindow(room, sq){ const seq = room.usedIdx||[]; const pos = seq.indexOf(sq); if (pos<0 || pos+STREAK_LEN>seq.length) return null; return seq.slice(pos,pos+STREAK_LEN); }
// Mode-3 Recharge: the Player's earlier Mode-2 use of that line is archived and the line becomes usable once more
function rcTake(p, life){ if (p.lives[life]!=null){ if(!p.lifeOld) p.lifeOld={}; (p.lifeOld[life]=p.lifeOld[life]||[]).push(p.lives[life]); delete p.lives[life]; if(life==='change') p.changed=false; } p.rcOpen=false; }
function markCell(p, qi){ const k = Object.keys(p.marks).find(k=>p.marks[k]===qi); return k===undefined ? undefined : +k; }
function answerOnCard(room, p, qi){ const q = room.questions[qi]; return !!(q && q.a!==undefined && p.card.includes(q.a)); }
// hidden cells per mode: Mode 1 = 2 stars; Mode 2 = 2 stars + 2 bombs; Mode 3 = 1 diamond jackpot + 2 stars + 2 bombs
function makeHidden(card, questions){
  const h = Array(25).fill(''); const cm = cardModes(card, questions);
  for (const m of [1,2,3]){
    const cells = shuffle([...Array(25).keys()].filter(i=>cm[i]===m)); let k=0;
    for (const [kind,n] of Object.entries(HID_SPEC[m])) for(let i=0;i<n && k<cells.length;i++) h[cells[k++]] = (kind==='gem'?'gem':kind);
  }
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
      for (const n of z.names){ const p=r.players[n]; const ci=inv[n][qi]; if(ci!==undefined){ const t=p.card[ci]; cnt[t]=(cnt[t]||0)+1; }
        if (p.lives && (p.lives.safety===qi || (p.lifeOld && p.lifeOld.safety && p.lifeOld.safety.includes(qi)))) safe=true; }
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
    z.votes=[]; z.voteBonus=0;
    for (const qi of (r.voteSet||[])){
      if (!r.usedIdx.includes(qi)) continue; if (!full && !(r.qClosedAt && r.qClosedAt[qi])) continue;
      const q=r.questions[qi]; if(!q||q.a===undefined) continue;
      const tl={}; let voters=0; for (const n of z.names){ const ci=inv[n][qi]; if(ci===undefined) continue; const t=r.players[n].card[ci]; tl[t]=(tl[t]||0)+1; voters++; }
      if (voters<2){ z.votes.push({qi,res:'novote'}); continue; }
      const arr=Object.entries(tl).sort((a,b)=>b[1]-a[1]); if (arr.length>1 && arr[0][1]===arr[1][1]){ z.votes.push({qi,res:'tie',voters}); continue; }
      const ok=arr[0][0]===q.a; if(ok) z.voteBonus+=VOTE_PTS; z.votes.push({qi,res:ok?'ok':'bad',ans:arr[0][0],voters,share:Math.round(arr[0][1]*100/voters)});
    }
    z.lineMs = z.lineTs.map(t=>t?Math.max(0,t-t0):null); z.fhMs = z.fhTs ? Math.max(0,z.fhTs-t0) : null;
    z.full = !!z.fhTs; z.bonus = ZONE_LINE_PTS*Math.min(z.lines,ZONE_LINE_MAX) + (z.full?ZONE_FULL_PTS:0) + z.voteBonus;
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
  let base=0, hiddenPts=0, streakPts=0, gems=0, stars=0, bombs=0;
  Object.entries(p.marks).forEach(([ci,qi]) => {
    ci = +ci; const q = room.questions[qi]; const right = !!(q && q.a === p.card[ci]);
    cellState[ci] = right ? 'green' : 'red';
    const h = (p.hid && p.hid[ci]) || ''; 
    const qm = (q&&q.m)||1; let b = right ? 1 : (qm===1 ? 0 : -1), ex = 0;
    if (right){ if (h==='gem'){ ex=GEM_PTS; gems++; } else if (h==='star'){ ex=STAR_PTS; stars++; } }
    else if (h==='bomb' && qm!==1){ ex=BOMB_EXTRA; bombs++; }
    base += b; hiddenPts += ex;
    pts[ci] = b + ex;
  });
  (p.hid||[]).forEach((h,ci)=>{ fx[ci]=h; });
  const usedAnswers = room.usedIdx.map(i => room.questions[i].a);
  for (let ci=0; ci<25; ci++) if (cellState[ci]==='none' && usedAnswers.includes(p.card[ci])) cellState[ci]='yellow';
  const correctRows = LINES.filter(line => line.every(ci=>cellState[ci]==='green')).length;
  const correctCount = cellState.filter(s=>s==='green').length;
  const wrongCount = cellState.filter(s=>s==='red').length;
  const fullHouse = cellState.every(s=>s==='green');
  let streakOk = null;
  for (const sq of streakStarts(p)){ const w = streakWindow(room, sq); if (!w) continue; const okAll = w.every(q=>{ const ci=markCell(p,q); return ci!==undefined && p.card[ci]===room.questions[q].a; }); streakPts += okAll ? STREAK_WIN : STREAK_LOSE; streakOk = okAll; }
  let mysteryPts = 0; const mysteryQs = [];
  for (const qi of (room.mystery||[])){ if(!room.usedIdx.includes(qi)) continue; const ci=markCell(p,qi); if(ci===undefined || room.questions[qi].a!==p.card[ci]) continue; const pt=mystReward(room,pname,qi); mysteryPts+=pt; mysteryQs.push({qi,pts:pt}); }
  const personal = base + hiddenPts + streakPts + mysteryPts;
  const zi = room.zoneInfo && room.zoneInfo[zkey(p)];
  const zoneBonus = zi ? zi.bonus : 0;
  return { cellState, pts, fx, correctRows, correctCount, wrongCount, fullHouse, base, hiddenPts, streakPts, mysteryPts, mysteryQs, gems, stars, bombs, personal, zoneBonus, netScore: personal+zoneBonus };
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
    return {qi, m:q.m||1, correct:c, wrong:w, none, pct: Math.round(c*100/Math.max(1,c+w+none))};
  });
  const LS = {safety:0,madad:0,change:0,streak:0,recharge:0};
  for (const p of Object.values(r.players)) for (const k of LIFE_KEYS) LS[k] += ((p.lives && p.lives[k]!=null)?1:0) + ((p.lifeOld&&p.lifeOld[k])?p.lifeOld[k].length:0);
  r.lifeStats = LS;
  const HS = {gemHit:0, gemTotal:0, starHit:0, starTotal:0, bombHit:0, bombTotal:0};
  for (const [n,p] of Object.entries(r.players)){ HS.gemTotal++; HS.starTotal+=6; HS.bombTotal+=4; HS.gemHit+=R[n].gems; HS.starHit+=R[n].stars; HS.bombHit+=R[n].bombs; }
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
  const o = {...p, claims}; delete o.hid; delete o._c; delete o.cm;
  if (!own){ delete o._ak; delete o._md; delete o._f; }
  return o;
}
function cleanMN(n){ const o={}; if(!n||typeof n!=='object') return o; for(const k of ['1','2','3']){ const v=n[k]; if(!v||typeof v!=='object') continue; const gu=String(v.gu||'').trim().slice(0,40), en=String(v.en||'').trim().slice(0,50); if(gu||en) o[k]={gu,en}; } return o; }
function publicRoom(room){
  if (room.status==='revealed') return {...room, cert:undefined};
  const players = {};
  for (const [n,p] of Object.entries(room.players)) players[n] = pubPlayer(room,p,false);
  return {...room, cert:undefined, questions: room.questions.map(q=>({q:q.q, img:q.img, aud:q.aud, m:q.m||1})), players};
}
// ---- 500-player friendly state: a PLAYER only receives his own data (+ the few winners after the reveal).
function zoneSummary(room){
  return Object.values(room.zoneInfo||{}).map(z=>({lockLines:z.lockLines,lockedCells:z.lockedCells,zone:z.zone,count:z.count,active:z.active,avg:z.avg,total:z.total,bonus:z.bonus,lines:z.lines,full:z.full,lineTs:z.lineTs,lineMs:z.lineMs,fhTs:z.fhTs,fhMs:z.fhMs,okCells:z.okCells,rank:z.rank}))
    .sort((a,b)=>a.rank-b.rank);
}
function zoneProgOf(room){ const m={}, q=room.curIdx, live=(room.status==='question'||room.status==='locked'); for(const p of Object.values(room.players||{})){ const z=String((p&&p.zone)||'').trim(); if(!z) continue; const k=z.toLowerCase(); const o=m[k]||(m[k]={z,i:Object.keys(m).length,n:0,a:0,l:0}); o.n++; if(live&&q!=null&&Object.values(p.marks||{}).includes(q)) o.a++; } if(room.zlock) for(const k in m){ const zl=room.zlock[k]; if(zl&&zl.locks) m[k].l=zl.locks.reduce((s,x)=>s+(x?1:0),0); } return Object.values(m).slice(0,40); }
function slimBase(room){
  const { clientMap, tokens, cert, players, zoneCards, zoneSet, zoneInfo, results, zlock, mystery, voteSet, ...rest } = room;
  const n = Object.keys(players).length;
  if (room.status==='revealed'){
    const keep = {};
    for (const k of ['line1','line2','line3','line4','line5','full','top1','top2','top3']){ const v=(room.winners||{})[k]; if (typeof v==='string' && players[v]) keep[v]={...players[v], res:results[v]}; }
    return {base:{...rest, nPlayers:n, zoneS:zoneSummary(room)}, keep};
  }
  return {base:{...rest, nPlayers:n, questions: room.questions.map(q=>({q:q.q, img:q.img, aud:q.aud, m:q.m||1})), zoneProg: zoneProgOf(room)}, keep:{}};
}
function zoneListOf(room){ const seen=[],m={}; for(const p of Object.values(room.players||{})){ const k=String((p&&p.zone)||'').trim().toLowerCase(); if(k&&!(k in m)){ m[k]=seen.length; seen.push(k);} } return m; }
function slimFor(room, S, name){
  const players = {...S.keep}; const out = {...S.base, players};
  const p = name && room.players[name];
  { const zi=(S.zi||(S.zi=zoneListOf(room))); const pz=p?String(p.zone||'').trim().toLowerCase():''; out.zoneIdx=(pz in zi)?zi[pz]:null; }
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
const ONLINE_MS = +process.env.ONLINE_MS || 10000;
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

function newPlayerObj(r,name,zone,avatar){ const card=makeCard(r.questions); return { card, cm: cardModes(card,r.questions), hid: makeHidden(card,r.questions), baseName: name, zone, avatar: avatar||'🦁', marks:{}, markTs:{}, lives:{}, claims:{}, joinedAt: Date.now() }; }
function newToken(){ return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10); }
function tokFor(r,key){ if(!r.tokens) r.tokens={}; if(!r.tokens[key]) r.tokens[key]=newToken(); return r.tokens[key]; }
function tokOwner(r,token){ if(!token||!r.tokens) return null; return Object.keys(r.tokens).find(k=>r.tokens[k]===token && r.players[k]) || null; }
function bindName(socket, r, code, clientId, key, token){
  // a player is identified ONLY by his secret token (given at join) — never by a browser-wide id, so two people on one phone/browser can never get each other's card
  const k = (key && r.tokens && r.tokens[key]===token && r.players[key]) ? key : tokOwner(r, token);
  if (k){ bindSock(socket, r, code, k); return k; }
  return null;
}

// drop event floods from one socket (a stuck/abusive client); normal play is a few events per second
io.use((socket, next) => next());
setInterval(() => { const cut = Date.now() - 48*3600*1000; for (const c of Object.keys(rooms)) if ((rooms[c].createdAt||Date.now()) < cut) delete rooms[c]; }, 3600*1000);
io.on('connection', (socket) => {
  let _n = 0, _t = Date.now();
  socket.use((pkt, next) => { const now = Date.now(); if (now-_t>1000){ _t=now; _n=0; } if (++_n>60) return; next(); });
  socket.on('subscribe', ({code, host, clientId, key, token}, cb) => {
    if (rooms[code]){
      socket.join(code); if(!host) bindName(socket, rooms[code], code, clientId, key, token);
      if (host){ socket.join(code+'#h'); scheduleBackup(code); cb && cb({ok:true, room: publicRoom(rooms[code])}); }
      else { const Sx = slimBase(rooms[code]); cb && cb({ok:true, room: slimFor(rooms[code], Sx, socket.data&&socket.data.code===code?socket.data.name:null)}); }
    }
    else cb && cb({ok:false, error:'Room code મળ્યો નહિ.'});
  });

  // Players call this every few seconds: re-joins the room after a server restart/restore.
  socket.on('resync', ({code, clientId, key, token}, cb) => {
    const r = rooms[code];
    if (!r){ cb && cb({ok:false}); return; }
    const mineKey = (key && r.tokens && r.tokens[key]===token && r.players[key]) ? key : tokOwner(r, token);
    if (socket.rooms.has(code) && socket.data && socket.data.code===code && (!mineKey || socket.data.name===mineKey)) { seen(code,socket.data.name); cb && cb({ok:true}); return; }
    socket.join(code); bindName(socket, r, code, clientId, key, token); const Sy = slimBase(r); cb && cb({ok:true, room: slimFor(r, Sy, socket.data&&socket.data.code===code?socket.data.name:null)});
  });

  // Host restores a game from the backup kept in the host's browser (after server sleep/restart).
  // ---- Host tools: kick / rename / pre-test (test players) ----
  function socksOf(code){ const ids=io.sockets.adapter.rooms.get(code), out=[]; if(ids) for(const id of ids){ const sk=io.sockets.sockets.get(id); if(sk) out.push(sk); } return out; }
  function hostRoom(code){ const r=rooms[code]; return r||null; }
  socket.on('host:kick', ({code,name}, cb) => {
    const r=hostRoom(code); if(!r||!r.players[name]){ cb&&cb({ok:false}); return; }
    delete r.players[name]; if(r.tokens) delete r.tokens[name]; if(r.clientMap) for(const c of Object.keys(r.clientMap)) if(r.clientMap[c]===name) delete r.clientMap[c];
    for(const sk of socksOf(code)) if(sk.data && sk.data.name===name) sk.data={};
    broadcast(code); cb&&cb({ok:true});
  });
  socket.on('host:rename', ({code,name,newName}, cb) => {
    const r=hostRoom(code); newName=String(newName||'').trim().slice(0,40);
    if(!r||!r.players[name]||!newName){ cb&&cb({ok:false,error:'નામ ખાલી છે.'}); return; }
    if(r.status==='revealed'){ cb&&cb({ok:false,error:'Result પછી નામ બદલી શકાતું નથી.'}); return; }
    if(newName===name){ cb&&cb({ok:true}); return; }
    if(r.players[newName]){ cb&&cb({ok:false,error:'આ નામ પહેલેથી છે.'}); return; }
    r.players[newName]=r.players[name]; r.players[newName].baseName=newName; delete r.players[name];
    if(r.tokens&&r.tokens[name]){ r.tokens[newName]=r.tokens[name]; delete r.tokens[name]; }
    if(r.clientMap) for(const c of Object.keys(r.clientMap)) if(r.clientMap[c]===name) r.clientMap[c]=newName;
    if(SEEN[code+'|'+name]){ SEEN[code+'|'+newName]=SEEN[code+'|'+name]; delete SEEN[code+'|'+name]; }
    for(const sk of socksOf(code)) if(sk.data && sk.data.name===name) sk.data={code,name:newName};
    broadcast(code); cb&&cb({ok:true});
  });
  socket.on('host:addBots', ({code,n}, cb) => {
    const r=hostRoom(code); if(!r){ cb&&cb({ok:false}); return; }
    if(r.status!=='lobby'){ cb&&cb({ok:false,error:'Test Players fakt Game શરૂ થતા પહેલાં (Lobby માં) ઉમેરી શકાય.'}); return; }
    n=Math.max(1,Math.min(1000,Math.round(+n||50)));
    const zones=['Test-A','Test-B','Test-C','Test-D','Test-E']; let added=0;
    for(let i=1;i<=n && Object.keys(r.players).length<2000;i++){ let k='Test '+(Object.values(r.players).filter(p=>p.bot).length+1); if(r.players[k]) continue;
      const pl=newPlayerObj(r,k,zones[i%zones.length],['🦁','🐯','🐼','🐵','🦊'][i%5]); pl.bot=true; r.players[k]=pl; added++; }
    const t0=Date.now(); const S=slimBase(r); const k0=Object.keys(r.players).find(k=>r.players[k].bot);
    const hostBytes=JSON.stringify(publicRoom(r)).length, playerBytes=JSON.stringify(slimFor(r,S,k0)).length, ms=Date.now()-t0;
    broadcast(code);
    cb&&cb({ok:true, added, total:Object.keys(r.players).length, hostKB:Math.round(hostBytes/1024), playerKB:Math.round(playerBytes/1024), ms});
  });
  socket.on('host:botsPlay', ({code,on}, cb) => { const r=hostRoom(code); if(!r){ cb&&cb({ok:false}); return; } r.botsPlay=!!on; cb&&cb({ok:true,on:r.botsPlay}); });
  socket.on('host:clearBots', ({code}, cb) => {
    const r=hostRoom(code); if(!r){ cb&&cb({ok:false}); return; }
    let c=0; for(const k of Object.keys(r.players)) if(r.players[k].bot){ delete r.players[k]; c++; }
    broadcast(code); cb&&cb({ok:true,removed:c});
  });

  socket.on('host:setCert', ({code,cert}, cb) => {
    const r=rooms[code]; if(!r||!cert){ cb&&cb({ok:false}); return; }
    const t=(x,n)=>String(x==null?'':x).slice(0,n);
    const c={title:t(cert.title,60),sub:t(cert.sub,60),msg:t(cert.msg,120),event:t(cert.event,100),org:t(cert.org,60),signer:t(cert.signer,60),color:/^#[0-9a-f]{6}$/i.test(cert.color||'')?cert.color:''};
    if(typeof cert.logo==='string' && /^data:image\/(png|jpeg|webp);base64,/.test(cert.logo) && cert.logo.length<=450000) c.logo=cert.logo;
    r.cert=c; scheduleBackup(code); cb&&cb({ok:true});
  });
  socket.on('cert:get', ({code}, cb) => { const r=rooms[code]; cb&&cb({ok:!!r, cert:(r&&r.cert)||null, revealed:!!r&&r.status==='revealed'}); });
  // 📶 how many players are really connected right now (players ping us every ~4 s)
  socket.on('host:online', ({code}, cb) => {
    const r = rooms[code]; if(!r || typeof cb!=='function') return;
    const now = Date.now(); let on=0, tot=0; const off=[];
    for (const k of Object.keys(r.players)){ const p=r.players[k]; if(p.bot) continue; tot++; const t=SEEN[code+'|'+k]||0; if(now-t <= ONLINE_MS+5000) on++; else off.push(k); }
    cb({ok:true, online:on, total:tot, off:off.slice(0,12)});
  });
  socket.on('host:joinTimer', ({code,sec}, cb) => {
    const r=rooms[code]; if(!r){ cb&&cb({ok:false}); return; }
    sec=Math.round(+sec); r.joinEnd = (sec>0 && sec<=3600) ? Date.now()+sec*1000 : null; broadcast(code); cb&&cb({ok:true});
  });
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
      if (p._ak && p._ak.qi===idx) delete p._ak; if (p._md && p._md.qi===idx) delete p._md; if (p._f && p._f.qi===idx) delete p._f;
    }
    if (r.qClosedAt) delete r.qClosedAt[idx];
    try{ refreshZoneLocks(r); }catch(e){}
    r.status='active'; r.curIdx=null; r.timerEnd=null; r.paused=false; r.pausedMs=null; r.modeDone=false;
    cb && cb({ok:true});
    broadcast(code);
  });

  socket.on('host:login', ({id,pw}, cb) => {
    cb && cb({ok: id===HOST_ID && pw===HOST_PW});
  });

  socket.on('host:create', ({hostName, maxPlayers, qaText, modeNames}, cb) => {
    const code = randCode();
    const parsed = parseQA(qaText);
    rooms[code] = {
      code, hostName, maxPlayers: maxPlayers||null, status:'lobby',
      questions: parsed.questions, usedIdx:[], curIdx:null, timerEnd:null,
      players:{}, winners:null, revealStep:0, createdAt: Date.now(), zonePct:30, zoneSafe:25, draw:'book', mode:1, modeDone:false, zoneCards:{}, qClosedAt:{}, modeNames:cleanMN(modeNames)
    };
    rooms[code].mystery = pickQs(parsed.questions.length, MYSTERY_N, []); rooms[code].voteSet = pickQs(parsed.questions.length, VOTE_N, rooms[code].mystery); rooms[code].voteNow = false;
    socket.join(code);
    cb && cb({ok:true, code, parseInfo:{count:parsed.questions.length, bad:parsed.bad, usedDefault:parsed.usedDefault}});
    broadcast(code);
  });

  socket.on('host:start', ({code}) => { const r=rooms[code]; if(!r) return; r.joinEnd=null; if(!r.botsPlay) for(const k of Object.keys(r.players)) if(r.players[k].bot) delete r.players[k]; r.status='active'; if(!r.startedAt) r.startedAt=Date.now(); broadcast(code); });

  const REVEAL_MS=1600;       // how long the big number popup stays up before the question appears
  const SPIN_SAFETY_MS=9500;  // safety net only — if host's browser never confirms, auto-advance so the game can't get stuck
  socket.on('host:spin', ({code}) => {
    const r = rooms[code]; if(!r) return;
    if(r.status!=='active' && r.status!=='locked') return; // ignore duplicate/racing spin clicks — fixes skipped questions
    if (!r.mode) r.mode=1;
    if (r.modeDone){ return; }                                   // host must start the next mode first
    const avail=[]; for(let i=0;i<r.questions.length;i++) if(!r.usedIdx.includes(i) && (r.questions[i].m||1)===r.mode) avail.push(i);
    if (avail.length===0){
      const more = [1,2,3].some(m=>m>r.mode && r.questions.some((q,i)=>(q.m||1)===m && !r.usedIdx.includes(i)));
      if (more){ r.modeDone=true; r.status='locked'; r.timerEnd=null; } else r.status='ended';
      broadcast(code); return;
    }
    const idx = avail[Math.floor(Math.random()*avail.length)];
    r.status='spinning'; r.voteNow=false; r.curIdx=idx; r.usedIdx=[...r.usedIdx, idx]; r.timerEnd=null; r.paused=false; r.pausedMs=null; r.lastSpinAt=Date.now();
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
      rr.status='question'; rr.voteNow=(rr.voteSet||[]).includes(idx); rr.timerEnd=Date.now()+(rr.qSec||30)*1000; broadcast(code);
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
  // Host: shorten (or extend) the RUNNING question's time
  socket.on('host:adjTimer', ({code, delta}) => {
    const r = rooms[code]; if(!r || r.status!=='question') return;
    delta = Math.round(+delta); if(!delta || Math.abs(delta)>60) return;
    if (r.paused){ r.pausedMs = Math.max(2000, (r.pausedMs||0)+delta*1000); }
    else if (r.timerEnd){ r.timerEnd = Math.max(Date.now()+2000, r.timerEnd+delta*1000); }
    broadcast(code);
  });
  socket.on('host:skipTimer', ({code}) => {
    const r = rooms[code]; if(!r || r.status!=='question') return;
    lockQ(r); r.paused=false; r.pausedMs=null; broadcast(code);
  });
  // Epilogue modes: host starts the next mode (or jumps to a chosen one) after a mode is finished
  socket.on('host:nextMode', ({code, mode}, cb) => {
    const r = rooms[code]; if(!r) return;
    if (!['active','locked'].includes(r.status)){ cb&&cb({ok:false,error:'પહેલા ચાલુ Question પૂરો કરો.'}); return; }
    let m = (+mode>=1 && +mode<=3) ? +mode : (r.mode||1)+1;
    const has = x => r.questions.some((q,i)=>(q.m||1)===x && !r.usedIdx.includes(i));
    while (m<=3 && !has(m)) m++;
    if (m>3){ r.status='ended'; r.modeDone=false; broadcast(code); cb&&cb({ok:true,ended:true}); return; }
    r.mode=m; r.modeDone=false; r.status='active'; r.modeStartAt=Date.now(); broadcast(code); cb&&cb({ok:true,mode:m});
  });
  // add a question by hand (Lobby only: every Player's card is re-made so the new answer can be on it)
  socket.on('host:addQ', ({code,q,a,m,img,aud}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false}); return; }
    if (r.status!=='lobby'){ cb&&cb({ok:false,error:'પ્રશ્ન ફક્ત Game શરૂ થતા પહેલાં (Lobby માં) ઉમેરી શકાય.'}); return; }
    q=String(q||'').trim().slice(0,600); a=String(a||'').trim().slice(0,120); m=+m;
    if(!q||!a){ cb&&cb({ok:false,error:'પ્રશ્ન અને જવાબ બંને લખો.'}); return; }
    if(!(m>=1&&m<=3)) m=1;
    if (r.questions.filter(x=>(x.m||1)===m).length>=12){ cb&&cb({ok:false,error:'Mode '+m+' માં પહેલેથી 12 પ્રશ્નો છે.'}); return; }
    const o={q,a,m}; if(img) o.img=String(img).slice(0,300); if(aud) o.aud=String(aud).slice(0,300);
    r.questions.push(o);
    r.zoneSet=null; r.zoneCards={};
    for (const p of Object.values(r.players)){ p.card=makeCard(r.questions); p.cm=cardModes(p.card,r.questions); p.hid=makeHidden(p.card,r.questions); }
    r.mystery = pickQs(r.questions.length, MYSTERY_N, []); r.voteSet = pickQs(r.questions.length, VOTE_N, r.mystery);
    broadcast(code); cb&&cb({ok:true, n:r.questions.length});
  });
  socket.on('host:delQ', ({code,i}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false}); return; }
    if (r.status!=='lobby' || !(i>=0 && i<r.questions.length) || r.questions.length<=5){ cb&&cb({ok:false,error:'હમણાં પ્રશ્ન કાઢી શકાય નહિ.'}); return; }
    r.questions.splice(+i,1); r.zoneSet=null; r.zoneCards={};
    for (const p of Object.values(r.players)){ p.card=makeCard(r.questions); p.cm=cardModes(p.card,r.questions); p.hid=makeHidden(p.card,r.questions); }
    r.mystery = pickQs(r.questions.length, MYSTERY_N, []); r.voteSet = pickQs(r.questions.length, VOTE_N, r.mystery);
    broadcast(code); cb&&cb({ok:true});
  });
  socket.on('host:setZone', ({code, pct, safe}) => {
    const r = rooms[code]; if(!r || r.status==='revealed') return;
    pct=Math.round(+pct); safe=Math.round(+safe);
    if(!(pct>=10 && pct<=90) || !(safe>=5 && safe<=pct)) return;
    r.zonePct=pct; r.zoneSafe=safe; broadcast(code);
  });
  socket.on('host:setModeNames', ({code, names}, cb) => {
    const r = rooms[code]; if(!r) return; r.modeNames = cleanMN(names); broadcast(code); cb && cb({ok:true});
  });

  socket.on('host:setDraw', ({code, method}) => {
    const r = rooms[code]; if(!r || !['wheel','ball','dice','slot','kalash','book'].includes(method)) return;
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


  socket.on('player:join', ({code,name,zone,avatar,clientId,token}, cb) => {
    const r = rooms[code]; if(!r){ cb&&cb({ok:false,error:'Room code મળ્યો નહિ.'}); return; }
    name=(name||'').trim(); zone=(zone||'').trim();
    if(!name){ cb&&cb({ok:false,error:'નામ લખો.'}); return; }
    if(!r.clientMap) r.clientMap = {};
    const norm = x => (x||'').trim().toLowerCase();
    // 0) the player's own secret token => always his own card (refresh / network drop / reopen)
    { const tk = tokOwner(r, token);
      if(tk){
        if (clientId) r.clientMap[clientId] = tk;
        socket.join(code); bindSock(socket, r, code, tk);
        cb && cb({ok:true, room: slimFor(r,slimBase(r),tk), yourKey:tk, resumed:true, token:tokFor(r,tk)});
        touchHost(code); return;
      } }
    // 1) same device + same name + same zone => reconnecting (refresh / network drop): resume own card
    const mine = clientId && r.clientMap[clientId];
    if(mine && r.players[mine] && norm(r.players[mine].baseName)===norm(name) && norm(r.players[mine].zone)===norm(zone)){
      socket.join(code); bindSock(socket, r, code, mine);
      const S0 = slimBase(r);
      cb && cb({ok:true, room: slimFor(r,S0,mine), yourKey:mine, resumed:true, token:tokFor(r,mine)});
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
        cb && cb({ok:true, room: slimFor(r,S0,dupKey), yourKey:dupKey, resumed:true, token:tokFor(r,dupKey)});
        touchHost(code); return;
      }
      cb&&cb({ok:false, retry:true, error:'⏳ આ નામ + Zone વાળો Player હમણાં Online દેખાય છે. થોડી સેકન્ડમાં આપોઆપ ફરી પ્રયત્ન થશે… (જો બીજો Player હોય તો નામમાં અટક/ઉપનામ ઉમેરો)'}); return;
    }
    if (r.maxPlayers && Object.keys(r.players).length>=r.maxPlayers){ cb&&cb({ok:false,error:'Room ભરાઈ ગયો છે.'}); return; }
    // 3) same name in a different zone is allowed; give it a unique internal key "Name (2)"
    let key = name;
    if(r.players[key]){
      let n=2; while(r.players[`${name} (${n})`]) n++;
      key = `${name} (${n})`;
    }
    r.players[key] = newPlayerObj(r,name,zone,avatar);
    if(clientId) r.clientMap[clientId] = key;
    socket.join(code); bindSock(socket, r, code, key);
    const S1 = slimBase(r);
    cb && cb({ok:true, room: slimFor(r,S1,key), yourKey:key, token:tokFor(r,key)});
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
  socket.on('player:life', ({code,name,life,target}, cb) => {
    seen(code,name);
    const r = rooms[code]; const fail = m => cb && cb({ok:false,error:m});
    if(!r || r.status!=='question' || r.paused) return fail('હમણાં Life Line વાપરી શકાય નહિ.');
    if (r.timerEnd && Date.now()>r.timerEnd+300) return fail('સમય પૂરો થઈ ગયો.');
    const p = r.players[name]; if(!p) return fail('Player મળ્યો નહિ.');
    if(!LIFE_KEYS.includes(life)) return fail('ખોટી Life Line.');
    if(!p.lives) p.lives = {};
    const cur = r.curIdx, q = r.questions[cur]; const qm = (q&&q.m)||1;
    if (qm===1) return fail('🛡 Mode-1 માં કોઈ Life Line નથી.');
    if (qm===2 && !['madad','change'].includes(life)) return fail('Mode-2 માં ફક્ત 🤝 Zone Madad અને 🔄 Change વાપરી શકાય.');
    if (qm===3 && ['madad','change'].includes(life)){
      // Mode-3: Madad / Change only after ♻️ Recharge (one of the two Mode-2 lines, once per Recharge)
      if (!p.rcOpen) return fail('Mode-3 માં 🤝/🔄 વાપરવા માટે પહેલા ♻️ Recharge વાપરો.');
    }
    if (p.lives[life]!=null && !(qm===3 && p.rcOpen && ['madad','change'].includes(life))) return fail('આ Life Line તમે પહેલેથી વાપરી લીધી છે.');
    if (life!=='change' && LIFE_KEYS.some(k=>k!=='change' && p.lives[k]===cur)) return fail('આ પ્રશ્નમાં એક Life Line વપરાઈ ગઈ છે. એક પ્રશ્નમાં ફક્ત એક (🔄 Change સિવાય).');
    if (life==='streak'){
      if (r.questions.filter((x,i)=>(x.m||1)===3 && !(r.usedIdx||[]).includes(i)).length < STREAK_LEN-1) return fail('Bonus Streak માટે હવે પૂરતા પ્રશ્નો બાકી નથી.');
      p.lives.streak = cur; touch(socket,code,name); return cb && cb({ok:true});
    }
    if (life==='recharge'){
      if (p.rcOpen) return fail('♻️ Recharge ની એક Life Line હજી વાપરી નથી.');
      p.lives.recharge = cur; p.rcOpen = true; touch(socket,code,name); return cb && cb({ok:true, rc:'open'});
    }
    const zk = zkey(p);
    if (life==='change'){
      if (markCell(p,cur)===undefined) return fail('પહેલા એક ખાનું દબાવો, પછી 🔄 Change વાપરો.');
      if (qm===3){ rcTake(p,'change'); }
      p.lives.change = cur; p.changed = false; touch(socket,code,name); return cb && cb({ok:true});
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
      if (qm===3){ rcTake(p,'madad'); }
      p.lives.madad = cur; p._md = {qi:cur, list, n:tot};
      touch(socket,code,name); return cb && cb({ok:true, md:p._md});
    }
    if (life==='safety'){ p.lives.safety = cur; touch(socket,code,name); return cb && cb({ok:true}); }   // 🛡 Safety Net: lowers the Zone's lock limit for THIS question (never stacks)
    if (!answerOnCard(r,p,cur)) return fail('આ પ્રશ્નનો જવાબ તમારા Card માં નથી. Life Line વપરાઈ નથી.');
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
// 🤖 Test bots that really answer (only when the host switched "Bots play" on) — for a full dry-run
setInterval(()=>{
  for (const code of Object.keys(rooms)){
    const r=rooms[code]; if(!r || !r.botsPlay || r.status!=='question' || r.paused || r.curIdx==null) continue;
    const q=r.questions[r.curIdx]; if(!q) continue; let changed=false;
    for (const p of Object.values(r.players)){
      if(!p.bot || !p.card || Object.values(p.marks||{}).includes(r.curIdx)) continue;
      if(Math.random()>0.25) continue;
      const free=[]; for(let i=0;i<25;i++) if(p.marks[i]===undefined) free.push(i);
      if(!free.length) continue;
      const right=p.card.indexOf(q.a); let ci;
      if(right>=0 && p.marks[right]===undefined && Math.random()<0.7) ci=right; else { if(Math.random()<0.2) continue; ci=free[Math.floor(Math.random()*free.length)]; }
      p.marks[ci]=r.curIdx; if(p.markTs) p.markTs[r.curIdx]=Date.now(); changed=true;
    }
    if(changed && (!r._bb || Date.now()-r._bb>2000)){ r._bb=Date.now(); broadcast(code); }
  }
}, 1000);

server.listen(PORT, () => console.log('Gyan Shodh Quiz server (The Epilogue) running on port '+PORT));
