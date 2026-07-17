'use strict';
/* =====================================================================
   WARCHOCKI RPG v6: WARCHOCKI IMPACT
   7 grywalnych postaci (żywioły, unikalne ataki) • gacha „Paczki od Fanów”
   domeny (fale + skrzynie) • bossowie regionalni • ulepszanie postaci
   13 questów • 3 regiony • kanał Edka • prawdziwy głos z YT • Edward FM
   ===================================================================== */
const W=480,H=300,TILE=16,RES=3; /* RES: render 3× ostrzejszy (1440×900), logika zostaje w 480×300 */
let MW=64,MH=44;
const cv=document.getElementById('game'),cx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const stage=$('stage');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(matchMedia('(pointer: coarse)').matches)document.body.classList.add('touch');
const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},
             set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const pickA=a=>a[(Math.random()*a.length)|0];

/* ---------------- ZAPIS ---------------- */
const DEFAULT_SAVE={dia:25,owned:['was_klasyk','rolex_d'],equip:{mustache:'was_klasyk',watch:'rolex_d'},
  quests:{},col:{},k:{},trip:0,legend:false,px:456,py:368,
  region:'wawa',ch:'edek',dych:0,subs:120,views:0,films:[],mile:{},visited:{wawa:1},
  chars:{edek:{lvl:1,st:0}},party:['edek'],mats:{sr:0,ch:0,di:0},pity:0,domLvl:{},bossLvl:{},
  gear:{},gearOwn:{kij:1},food:{picie:2}};
let S=null;
function loadSave(){
  try{
    const j=store.get('wrpg');
    if(!j){S=null;return;}
    const p=JSON.parse(j);
    S=Object.assign(JSON.parse(JSON.stringify(DEFAULT_SAVE)),p);
    if(Array.isArray(S.gems)){S.col.diamenty=S.gems;delete S.gems;} // migracja
    if(!S.col)S.col={};
    // migracja v5 -> v6 (WARCHOCKI IMPACT): stary zapis nie miał kolekcji postaci
    if(!p.chars){
      S.chars={edek:{lvl:1,st:0}};
      if(S.dych)S.chars.dych={lvl:1,st:0};
      S.party=S.dych?['edek','dych']:['edek'];
    }
    if(!S.chars.edek)S.chars.edek={lvl:1,st:0};
    if(!S.party||!S.party.length)S.party=['edek'];
    if(!S.mats)S.mats={sr:0,ch:0,di:0};
    if(S.pity===undefined)S.pity=0;
    if(!S.domLvl)S.domLvl={};
    if(!S.bossLvl)S.bossLvl={};
    // migracja v6 -> v7 (ekwipunek + jedzenie)
    if(!p.gearOwn){S.gear={};S.gearOwn={kij:1};S.food={picie:2};}
    if(!S.food)S.food={};if(!S.gear)S.gear={};if(!S.gearOwn)S.gearOwn={};
    if(!S.party.includes(S.ch))S.ch=S.party[0];
  }catch(e){S=null}
}
function save(){store.set('wrpg',JSON.stringify(S));}
loadSave();

/* ---------------- AUDIO: klipy z YT + piosenki ---------------- */
/* audio jako pliki w assets/audio/ (fetch przy initAudio; muzyka bitewna leniwie) */
const AUDIO_BASE='assets/audio/';
const AUDIO_KEYS=["song", "metro_rhythm", "s_dziki", "s_elegancko", "s_metro", "s_67", "v_piszczel", "v_spawanie", "v_los", "v_spontan", "v_zycie", "v_elegancko", "v_cochcecie", "v_kladesie", "v_napoje", "v_paleta", "v_czesc", "c_etam", "c_kopytem", "c_elegancko2", "c_ziomali", "c_strach", "c_zaspiewam", "c_uciekajcie", "c_maliny", "c_problemy", "c_kamera", "c_rolextiktok", "c_wolnyptak", "c_ziomal_dumnie", "c_rozchwytywany", "c_jarek_sprawdz", "c_diamenty", "c_krolbalu", "c_buty", "c_randka", "c_kosz", "c_serduszka", "c_dwabramki", "c_niepoddajemy", "c_spaceruje", "c_pestka", "c_koniecswiata", "c_truskawka", "c_kawa", "c_tygrysy", "c_rdzewieje", "c_prokop", "c_ryba", "c_rolexlewa", "c_ktoby", "m_roboty", "m_wiatr", "m_puszki", "m_ministerstwo", "m_kopernik", "m_magia", "m_rolexlong", "m_meczlong", "d_siemanko", "d_mordeczko", "d_wariacie", "d_lecimy", "d_chodz", "d_song"];
/* dłuższe monologi Edka do tła (mapa) */
const IDLE_POOL=['m_roboty','m_wiatr','m_kopernik','m_ministerstwo','m_magia','m_rolexlong',
  'm_meczlong','m_puszki','m_roboty','m_kopernik','m_wiatr','m_rolexlong',
  'c_tygrysy','c_kawa','c_krolbalu','c_prokop','v_zycie','c_koniecswiata','c_spaceruje'];
let AC=null,master=null,musicGain=null,voiceGain=null,chipGain=null,battleGain=null;
let songSrc=null,songT0=0;
const BUFS={};
let muted=store.get('wrpg_mute')==='1';
function loadClip(k){
  return fetch(AUDIO_BASE+k+'.mp3').then(r=>{
    if(!r.ok)throw new Error(k+': HTTP '+r.status);
    return r.arrayBuffer();
  }).then(ab=>AC.decodeAudioData(ab));
}
function initAudio(){
  if(AC)return Promise.resolve();
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=muted?0:1;master.connect(AC.destination);
    musicGain=AC.createGain();musicGain.gain.value=.9;musicGain.connect(master);
    battleGain=AC.createGain();battleGain.gain.value=BATTLE_VOL;battleGain.connect(master);
    chipGain=AC.createGain();chipGain.gain.value=1;chipGain.connect(master);
    voiceGain=AC.createGain();voiceGain.gain.value=1;voiceGain.connect(master);
    const jobs=AUDIO_KEYS.map(k=>loadClip(k).then(buf=>{BUFS[k]=buf;}).catch(()=>{}));
    return Promise.all(jobs);
  }catch(e){return Promise.resolve();}
}
/* --- menedżer głosu: jeden klip naraz + przyciszanie muzyki + kolejka --- */
let curVoice=null,voiceQ=[];
function duck(on){
  if(!AC)return;
  const t=AC.currentTime;
  chipGain.gain.cancelScheduledValues(t);
  chipGain.gain.setTargetAtTime(on?.18:1,t,.08);
  /* muzyka bitewna jest agresywna — przy klipach Edka schodzi jeszcze niżej */
  if(battleGain){
    battleGain.gain.cancelScheduledValues(t);
    battleGain.gain.setTargetAtTime(on?BATTLE_VOL*.3:BATTLE_VOL,t,.08);
  }
}
function fadeOut(s){ // miękkie wyciszenie klipu (0,22 s) zamiast ucięcia
  try{
    const g=s._g,t=AC.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value,t);
    g.gain.linearRampToValueAtTime(0,t+.22);
    setTimeout(()=>{try{s.stop()}catch(e){}},240);
  }catch(e){try{s.stop()}catch(e2){}}
}
function vsay(k){
  if(!AC||!BUFS[k]||muted)return 0;
  if(curVoice){const old=curVoice;curVoice=null;old.onended=null;fadeOut(old);}
  const s=AC.createBufferSource();s.buffer=BUFS[k];
  const g=AC.createGain();g.connect(voiceGain);s.connect(g);s._g=g;
  curVoice=s;duck(true);
  s.onended=()=>{
    if(curVoice!==s)return;
    curVoice=null;
    if(voiceQ.length&&!muted&&(scene==='world'||scene==='dialog')){setTimeout(()=>{
      if(!curVoice&&voiceQ.length)vsay(voiceQ.shift());},550);return;}
    voiceQ=[];duck(false);
  };
  s.start();
  return BUFS[k].duration;
}
/* zagraj kilka klipów pod rząd (dłuższy blok audio w tle) */
function vsayChain(keys){
  voiceQ=keys.slice(1);
  return vsay(keys[0]);
}
function stopVoice(){
  voiceQ=[];
  if(curVoice){const old=curVoice;curVoice=null;old.onended=null;fadeOut(old);}
  duck(false);
}
/* łączny czas bloku klipów (do planowania przerw) */
const chainDur=keys=>keys.reduce((a,k)=>a+(BUFS[k]?BUFS[k].duration:8),0);
/* pełna piosenka w pętli na ekranie tytułowym */
function startMenuMusic(){
  if(AC&&scene==='title'&&!songSrc&&!muted)playSong('song',true);
}
function playSong(key,loop){
  stopSong();
  if(!AC||!BUFS[key])return;
  songSrc=AC.createBufferSource();songSrc.buffer=BUFS[key];songSrc.loop=!!loop;
  songSrc.connect(musicGain);songT0=AC.currentTime;songSrc.start();
}
function stopSong(){if(songSrc){try{songSrc.stop()}catch(e){}songSrc=null;}}
/* --- MUZYKA BITEWNA W DOMENACH: pocięty mix od Dawida, losowy numer za numerem,
       ŚCISZONA (BATTLE_VOL), żeby teksty Edka się przebijały --- */
const BATTLE_VOL=.3;
const BATTLE_TRACKS=['bt1','bt2','bt3','bt4','bt5','bt6','bt7','bt8','bt9','bt10',
  'bt11','bt12','bt13','bt14','bt15'];
let battleSrc=null,btPool=[],btTok=0;
function playNextBattle(){
  if(!AC||REG!=='arena')return;
  if(!btPool.length)btPool=BATTLE_TRACKS.slice().sort(()=>Math.random()-.5);
  const k=btPool.shift();if(!k)return;
  const tok=++btTok;
  /* numery bitewne ładowane leniwie; w pamięci trzymamy tylko aktualny (duże pliki) */
  (BUFS[k]?Promise.resolve(BUFS[k]):loadClip(k)).then(buf=>{
    if(tok!==btTok||REG!=='arena')return;
    for(const kk of BATTLE_TRACKS)if(kk!==k)delete BUFS[kk];
    BUFS[k]=buf;
    const s=AC.createBufferSource();s.buffer=buf;
    s.connect(battleGain);battleSrc=s;
    s.onended=()=>{if(battleSrc===s){battleSrc=null;if(REG==='arena')playNextBattle();}};
    s.start();
  }).catch(()=>{if(tok===btTok&&REG==='arena')setTimeout(playNextBattle,1500);});
}
function startBattleMusic(){stopSong();stopBattleMusic();playNextBattle();}
function stopBattleMusic(){
  btTok++;
  if(battleSrc){const s=battleSrc;battleSrc=null;s.onended=null;try{s.stop()}catch(e){}}
}
function beep(f,d,t,v,sl){
  if(!AC||muted)return;const T=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=t||'square';o.frequency.setValueAtTime(f,T);
  if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,sl),T+d);
  g.gain.setValueAtTime(v||.07,T);g.gain.exponentialRampToValueAtTime(.001,T+d);
  o.connect(g);g.connect(master);o.start(T);o.stop(T+d+.02);
}
const SFX={
  ok:()=>{beep(660,.08,'square',.06);setTimeout(()=>beep(880,.12,'square',.06),70);},
  dia:()=>{beep(1046,.07,'triangle',.09);setTimeout(()=>beep(1568,.14,'triangle',.09),70);},
  buy:()=>{beep(523,.08,'triangle',.08);setTimeout(()=>beep(784,.08,'triangle',.08),80);setTimeout(()=>beep(1046,.14,'triangle',.08),160);},
  no:()=>beep(160,.2,'sawtooth',.07,90),
  hit:()=>beep(150,.25,'sawtooth',.09,60),
  boar:()=>beep(300,.12,'sawtooth',.07,140),
  note:g=>beep(g==='P'?1318:880,.07,'triangle',.07),
  miss:()=>beep(120,.15,'sawtooth',.05,70),
  tap:()=>beep(440+Math.random()*80,.05,'square',.05),
  open:()=>beep(300,.12,'triangle',.07,720),
  close:()=>beep(700,.12,'triangle',.06,260),
  equip:()=>{beep(523,.06,'square',.06);setTimeout(()=>beep(784,.1,'square',.06),60);},
  lvl:()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.12,'triangle',.08),i*80));},
  crit:()=>{beep(1400,.09,'square',.08,500);setTimeout(()=>beep(180,.16,'sawtooth',.07,70),30);},
  heal:()=>{beep(660,.1,'sine',.07);setTimeout(()=>beep(990,.16,'sine',.07),90);},
  gacha:()=>{[880,1174,1568].forEach((f,i)=>setTimeout(()=>beep(f,.1,'triangle',.07),i*70));},
};
/* mapowa muzyczka (cichy chiptune) */
let musId=null;
function startMapMusic(){
  if(musId)return;
  const bass=[65.4,0,98,0,58.3,0,87.3,0,65.4,0,98,0,49,0,73.4,0];
  let step=0,next=0;
  musId=setInterval(()=>{
    if(!AC||muted||scene!=='world'||REG==='arena')return;
    if(next<AC.currentTime)next=AC.currentTime+.05;
    const spb=60/104/2;
    while(next<AC.currentTime+.3){
      const i=step%16,f=bass[i];
      if(f){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;
        g.gain.setValueAtTime(.035,next);g.gain.exponentialRampToValueAtTime(.001,next+spb*.9);
        o.connect(g);g.connect(chipGain);o.start(next);o.stop(next+spb);}
      next+=spb;step++;
    }
  },120);
}
$('btnMute').addEventListener('click',()=>{
  muted=!muted;store.set('wrpg_mute',muted?'1':'0');
  if(master)master.gain.value=muted?0:1;
  $('btnMute').textContent=muted?'🔇':'🔊';
  if(!muted)startMenuMusic();
});
if(muted)$('btnMute').textContent='🔇';

/* --- smaczek 67 --- */
let last67=-1e9;
function check67(n){
  if(n===67&&performance.now()-last67>30000){
    last67=performance.now();
    if(!curVoice)vsay('s_67');
    toast('6️⃣7️⃣ SIX SEVEN!!! 6️⃣7️⃣');
  }
}
/* --- Edward FM: radio — dłuższe bloki (2-3 kawałki albo pełny utwór) --- */
let radioT=25;
const RADIO=[
  {k:'s_dziki',t:'„Dziki” 🐗'},
  {k:'s_elegancko',t:'„ELEGANCKO” 🕺'},
  {k:'s_metro',t:'„Metro” 🚇'},
  {k:'s_67',t:'„67” 6️⃣7️⃣'},
  {k:'d_song',t:'„JESTEM DYCH DZIKI” 🦾🔥'},
];
function updateRadio(dt){
  if(scene!=='world'||REG==='arena'||curVoice)return;
  radioT-=dt;
  if(radioT<=0){
    const hooks=RADIO.slice(0,3).concat(S.chars&&S.chars.dych?[RADIO[4]]:[]);
    let block;
    if(Math.random()<.4){               // pełny utwór + hook na dokładkę
      const fr=Math.random();
      const full=fr<.34?{k:'metro_rhythm',t:'„Metro” (cały kawałek!) 🚇'}
                :fr<.67?{k:'song',t:'„Edwardem Byku” (cały kawałek!) 🎤'}
                       :{k:'d_song',t:'„JESTEM DYCH DZIKI” (hit z konkursu!) 🦾'};
      block=[full].concat(pickA(hooks.filter(h=>h.k!==full.k))||[]);
    }else{                              // DŁUGI blok 3-4 hooków
      const pool=hooks.slice().sort(()=>Math.random()-.5);
      block=pool.slice(0,Math.min(Math.random()<.5?4:3,pool.length));
      if(Math.random()<.25&&!block.includes(RADIO[3]))block.push(RADIO[3]);
    }
    vsayChain(block.map(b=>b.k));
    toast('📻 EDWARD FM: '+block.map(b=>b.t).join(' + '),3800);
    /* następna audycja dopiero po skończeniu bloku + oddech */
    radioT=chainDur(block.map(b=>b.k))+16+Math.random()*18;
  }
}

/* ---------------- pełny ekran ---------------- */
function setFake(on){
  stage.classList.toggle('fakefs',on);
  document.body.classList.toggle('fakefs',on);
  $('btnFS').textContent=on?'🗗':'⛶';
}
function toggleFS(){
  if(document.fullscreenElement){document.exitFullscreen().catch(()=>{});return;}
  if(stage.classList.contains('fakefs')){setFake(false);return;}
  let ok=false;
  try{
    if(document.fullscreenEnabled&&stage.requestFullscreen){
      ok=true;
      stage.requestFullscreen().then(()=>{
        try{screen.orientation.lock('landscape').catch(()=>{});}catch(e){}
      }).catch(()=>setFake(true));
    }
  }catch(e){ok=false;}
  if(!ok)setFake(true);
}
$('btnFS').addEventListener('click',toggleFS);
/* pierwszy gest na ekranie tytułowym uruchamia muzykę menu (autoplay jest blokowany) */
$('title').addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  initAudio().then(startMenuMusic);
});
addEventListener('keydown',()=>{if(scene==='title')initAudio().then(startMenuMusic);});

/* ---------------- PRZEDMIOTY ---------------- */
const ITEMS={
  /* --- WĄSY --- */
  was_klasyk:{n:'Wąs klasyczny',slot:'mustache',price:0,desc:'Legenda sama w sobie'},
  was_pod:{n:'Wąs podkręcony',slot:'mustache',price:45,desc:'Elegancja francja'},
  was_blond:{n:'Wąs blond',slot:'mustache',price:90,col:'#d8b04a',desc:'Skandynawski vibe'},
  was_szpakowaty:{n:'Wąs szpakowaty',slot:'mustache',price:140,col:'#b8b4c8',desc:'Doświadczenie widać'},
  was_gigant:{n:'Mega Wąsisko',slot:'mustache',price:150,desc:'Widać go z kosmosu'},
  was_neon:{n:'Wąs neonowy',slot:'mustache',price:800,col:'#6fd8e8',desc:'Świeci na streamie'},
  was_diamentowy:{n:'Wąs diamentowy',slot:'mustache',price:3000,col:'#f4f2ff',desc:'Pasuje do rolexa. Oczywiście.'},
  /* --- ZEGARKI --- */
  rolex_d:{n:'Rolex z diamentami',slot:'watch',price:0,desc:'Od Jarka za filmik na TikToku'},
  casio:{n:'Casio dzielnicowe',slot:'watch',price:25,col:'#4a7ac8',desc:'Klasyk spod bloku'},
  smartwatch:{n:'Smartwatch PRO',slot:'watch',price:200,col:'#1a1a24',desc:'Liczy kroki i wyświetlenia'},
  rolex_zloty:{n:'Rolex pełne złoto',slot:'watch',price:1000,col:'#ffd75e',desc:'Cięższy niż fama'},
  rolex_teczowy:{n:'Rolex TĘCZOWY',slot:'watch',price:4500,col:'rainbow',desc:'Prototyp. Jeden na świecie.'},
  /* --- CZAPKI --- */
  czapka:{n:'Czapka z daszkiem',slot:'hat',price:30,desc:'Dzielnicowy szyk'},
  czapka_zimowa:{n:'Czapka zimowa',slot:'hat',price:40,desc:'Z pomponem, na Tatry'},
  kapelusz:{n:'Kapelusz eleganta',slot:'hat',price:60,desc:'No i elegancko'},
  bandana:{n:'Bandana',slot:'hat',price:65,desc:'Rap z Chodzieży'},
  beret:{n:'Beret artysty',slot:'hat',price:95,desc:'Edek w wersji vernisage'},
  irokez:{n:'Neonowy irokez',slot:'hat',price:100,desc:'Rockowy Edek'},
  kaszkiet:{n:'Kaszkiet gentlemana',slot:'hat',price:120,desc:'Peaky Blinders z Warszawy'},
  kask:{n:'Kask budowlany',slot:'hat',price:150,desc:'BHP na planie filmowym'},
  fedora_biala:{n:'Biała fedora',slot:'hat',price:400,desc:'Boss internetu'},
  cylinder:{n:'Cylinder milionera',slot:'hat',price:900,desc:'Monopoly? Nie, monetyzacja'},
  korona_diamentowa:{n:'Korona diamentowa',slot:'hat',price:5000,desc:'Droższa niż mieszkanie w Chodzieży'},
  snapback:{n:'Snapback Ziomala',slot:'hat',price:0,locked:true,desc:'Nagroda od Żabsona'},
  korona:{n:'Korona Króla Internetu',slot:'hat',price:0,locked:true,desc:'Za wszystkie questy'},
  /* --- OKULARY --- */
  okulary:{n:'Czarne okulary',slot:'glasses',price:40,desc:'Incognito (nie działa)'},
  pilotki:{n:'Złote pilotki',slot:'glasses',price:80,desc:'Odbija się w nich sława'},
  okulary_serca:{n:'Okulary-serduszka',slot:'glasses',price:120,desc:'Pozdro dla Julki'},
  okulary_neon:{n:'Okulary neonowe',slot:'glasses',price:250,desc:'Rave w Ujściu'},
  monokl:{n:'Złoty monokl',slot:'glasses',price:600,desc:'Hm, interesujące, byku'},
  okulary_vr:{n:'Gogle VR',slot:'glasses',price:1500,desc:'Streaming z metaverse'},
  /* --- NA SZYJĘ --- */
  szalik:{n:'Szalik kibica',slot:'neck',price:25,desc:'Polska górą!'},
  krawat:{n:'Czerwony krawat',slot:'neck',price:50,desc:'Na spotkanie w ministerstwie'},
  lancuch:{n:'Złoty łańcuch',slot:'neck',price:70,desc:'Ciężki jak fama'},
  mucha:{n:'Elegancka mucha',slot:'neck',price:75,desc:'Gala rozdania nagród'},
  lancuch_gruby:{n:'Łańcuch GRUBY',slot:'neck',price:350,desc:'Cuban link. Szacunek na dzielni'},
  medalion_67:{n:'Medalion 67',slot:'neck',price:670,desc:'SIX SEVEN!!! 6️⃣7️⃣'},
  naszyjnik_diament:{n:'Diament na szyję',slot:'neck',price:2500,desc:'Do kompletu z rolexem'},
  zloty_play:{n:'Złoty Przycisk',slot:'neck',price:0,locked:true,desc:'Za 100 tys. subów!'},
  /* --- PLECY --- */
  plecak:{n:'Plecak streamera',slot:'back',price:60,desc:'Powerbank i tripod zawsze przy sobie'},
  peleryna:{n:'Peleryna influencera',slot:'back',price:120,desc:'Powiewa nawet bez wiatru'},
  gitara:{n:'Gitara na plecach',slot:'back',price:450,desc:'Do „ELEGANCKO” akustycznie'},
  skrzydla:{n:'Skrzydła anioła',slot:'back',price:1200,desc:'Edek zesłany internetowi'},
  peleryna_zlota:{n:'Złota peleryna',slot:'back',price:1800,desc:'Król musi błyszczeć'},
  jetpack:{n:'JETPACK',slot:'back',price:4000,desc:'Na razie tylko robi psssst'},
  ring_light:{n:'Ring light',slot:'back',price:0,locked:true,desc:'Za 10 tys. subów — pro oświetlenie'},
  /* --- BUTY --- */
  kalosze:{n:'Kalosze wędkarskie',slot:'shoes',price:35,desc:'Od Rybaka Bogdana'},
  sneakersy:{n:'Złote sneakersy',slot:'shoes',price:90,desc:'+15% do szybkości!'},
  glany:{n:'Czarne glany',slot:'shoes',price:110,desc:'Rockowa podeszwa'},
  buty_neon:{n:'Neonowe buty',slot:'shoes',price:700,desc:'+15% szybkości i świecą!'},
  buty_diament:{n:'Diamentowe buty',slot:'shoes',price:3500,desc:'+20% szybkości. Skarbówka pyta skąd'},
};
const SLOT_ORDER={hat:0,glasses:1,mustache:2,neck:3,watch:4,back:5,shoes:6};

/* ---------------- QUESTY (10) ---------------- */
const QUESTS={
  dziki:{n:'Dziki na dzielni',giver:'pani_park',rw:50,desc:'Pogoń 8 dzików w Parku Skaryszewskim (45 s).'},
  dino:{n:'Dostawa do Dino',giver:'pani_dino',rw:40,desc:'Złap 15 napojów Edka w markecie Dino.'},
  freestyle:{n:'Freestyle pod Pałacem',giver:'fan',rw:60,desc:'Zalicz 70% nut w rytmie „Edwardem Byku”.'},
  sejm:{n:'Sejmowa mowa',giver:'ochroniarz',rw:80,desc:'Powtórz gesty marszałka (3 rundy).'},
  diamenty:{n:'Diamenty z rolexa',giver:'jubiler',rw:100,desc:'Znajdź 3 diamenty zgubione na mapie.'},
  kopernik:{n:'Skandal w Koperniku',giver:'ochrona_cnk',rw:70,desc:'Przekonaj ochronę tańcem na zgodę (3 rundy).'},
  metro:{n:'Ostatni wagon',giver:'maszynista',rw:90,desc:'Zalicz 65% nut w rytmie „Metro”.'},
  mecz:{n:'Mecz ze Szwecją',giver:'kibic',rw:70,desc:'Rozkręć doping — 3 rundy przyśpiewek.'},
  zabson:{n:'Ziomal Żabsona',giver:'zabson',rw:90,desc:'Zbierz 5 złotych mikrofonów rozrzuconych po mieście.'},
  tinder:{n:'Julka z Tindera',giver:'julka',rw:60,desc:'Zbierz 3 kwiaty z łąki i zdobądź serce Julki.'},
  seba:{n:'Spokój na dzielni',giver:'ziomal1',rw:80,desc:'Pogoń 6 hejterów zaczepiających ziomali w Warszawie (cios: SPACJA/X).'},
  dych:{n:'Dziki ziomal',giver:'dych_npc',rw:70,desc:'POLSKIE MORZE: pogoń 3 dresiarzy zaczepiających Dycha. Nagroda: DYCH DZIKI (drugi robot!) w ekipie!'},
  bursztyn:{n:'Bursztynowy interes',giver:'rybak',rw:90,desc:'POLSKIE MORZE: znajdź 5 bursztynów na plaży.'},
};
const qs=id=>S.quests[id]||0;
function setQ(id,v){S.quests[id]=v;save();refreshHUD();}

/* znajdźki questowe */
const COLLECT={
  diamenty:{r:'wawa',pts:[[4,4],[56,41],[42,7]],label:'diament',c1:'#6fd8e8',c2:'#bff0ff'},
  zabson:{r:'wawa',pts:[[16,23],[40,36],[55,22],[3,30],[24,8]],label:'mikrofon',c1:'#f5c542',c2:'#fff7d6'},
  tinder:{r:'wawa',pts:[[16,37],[19,39],[21,37]],label:'kwiat',c1:'#e88ac8',c2:'#ffd7ef'},
  bursztyn:{r:'morze',pts:[[4,11],[14,13],[24,12],[36,13],[50,11]],label:'bursztyn',c1:'#f5a032',c2:'#ffd77a'},
};
const colGot=q=>(S.col[q]||[]).length;

/* ---------------- MAPA + REGIONY ---------------- */
let M=new Uint8Array(MW*MH);
const at=(x,y)=>(x<0||y<0||x>=MW||y>=MH)?4:M[y*MW+x];
const set=(x,y,v)=>{if(x>=0&&y>=0&&x<MW&&y<MH)M[y*MW+x]=v};
function rect(x0,y0,x1,y1,v){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)set(x,y,v)}
function buildWawa(){
  rect(0,0,MW-1,MH-1,0);
  rect(58,0,63,MH-1,3);rect(57,0,57,MH-1,1);      // Wisła + bulwar
  rect(0,20,56,21,2);rect(27,0,28,MH-1,2);        // drogi
  rect(10,10,10,19,1);rect(10,10,26,10,1);rect(29,10,36,10,1);
  rect(36,10,36,19,1);rect(48,8,48,19,1);rect(29,26,33,26,1);
  rect(10,22,10,27,1);rect(45,22,45,27,1);rect(29,34,44,34,1);rect(33,27,33,33,1);
  const trees=[[3,3],[5,6],[8,3],[13,4],[17,3],[21,5],[24,3],[3,9],[15,8],[19,9],[23,8],
    [4,13],[8,15],[13,13],[18,14],[22,13],[25,16],[2,17],[6,17],[16,17],[20,17],[24,18],[12,16],[9,7]];
  for(const[t0,t1]of trees)set(t0,t1,4);
  rect(5,10,8,12,3);                               // staw
  set(4,5,7);set(11,6,7);set(14,11,7);set(21,15,7);set(7,4,7);
  for(let x=0;x<MW;x+=2){if(at(x,0)!==3)set(x,0,4);if(at(x,MH-1)!==3)set(x,MH-1,4)}
  for(let y=0;y<MH;y+=2)set(0,y,4);
  rect(31,8,41,16,5);   // PKiN
  rect(44,3,54,7,5);    // Sejm
  rect(6,26,14,31,5);   // Dino
  rect(31,28,37,32,5);  // Warsztat
  rect(46,28,53,33,6);  // Bazar
  rect(49,12,56,16,5);  // Centrum Nauki Kopernik
  rect(30,23,32,24,5);  // wejście do Metra
  rect(2,34,8,39,4);    // lasek płd
  rect(18,26,23,30,4);
  rect(15,36,22,41,7);  // łąka kwiatowa
  rect(23,22,25,23,5);  // przystanek PKS
  // detale: latarnie, ławki, kwietniki, fontanna, billboard, płot
  for(let x=6;x<=54;x+=8)if(at(x,19)===0)set(x,19,11);
  set(6,8,10);set(18,6,10);set(22,12,10);set(12,15,10);
  set(30,17,12);set(42,17,12);set(46,21,12);
  set(36,18,15);            // fontanna przed PKiN
  set(26,22,14);            // billboard Edka przy drodze
  for(let x=15;x<=22;x++)if(at(x,35)===0)set(x,35,13); // płot przy łące
}
function buildChodziez(){
  rect(0,0,MW-1,MH-1,0);
  rect(0,26,MW-1,35,3);rect(0,25,MW-1,25,1);       // Jezioro Miejskie + plaża
  rect(0,14,MW-1,15,2);                            // szosa
  rect(23,4,24,13,1);rect(10,17,10,23,1);rect(10,17,37,17,1);rect(37,17,37,23,1);
  rect(16,4,16,13,1);rect(16,4,23,4,1);
  const trees=[[3,3],[6,5],[9,2],[13,6],[29,3],[33,5],[41,3],[44,6],[40,9],[44,11],[36,4],
    [2,18],[5,21],[43,19],[45,22],[40,21],[3,10],[7,8]];
  for(const[t0,t1]of trees)set(t0,t1,4);
  rect(38,2,45,7,4);                               // lasek Dycha
  rect(11,5,15,9,5);    // dom Edka
  rect(18,6,22,9,5);    // rynek — ceramika
  rect(26,5,31,9,6);    // targ
  rect(12,18,15,21,5);  // remiza
  rect(30,18,36,21,5);  // Dino Chodzież
  set(4,20,7);set(7,19,7);set(41,16,7);set(20,20,7);
  for(let x=0;x<MW;x+=2)if(at(x,0)!==3)set(x,0,4);
  for(let y=0;y<14;y+=2){set(0,y,4);set(MW-1,y,4)}
  rect(19,12,21,13,5);  // przystanek PKS
  // detale
  set(6,24,10);set(30,24,10);set(40,24,10);       // ławki nad jeziorem
  for(let x=4;x<=44;x+=10)if(at(x,16)===0)set(x,16,11); // latarnie przy szosie
  set(17,10,12);set(24,10,12);                     // kwietniki na rynku
  for(let x=9;x<=15;x++)if(at(x,10)===0)set(x,10,13);   // płot przy domu Edka
  set(33,16,14);                                   // billboard
}
function buildMorze(){
  rect(0,0,MW-1,MH-1,8);
  rect(0,0,MW-1,9,3);                              // Bałtyk
  rect(0,10,MW-1,10,8);
  rect(0,24,MW-1,25,1);                            // promenada
  rect(0,26,MW-1,MH-1,0);
  rect(26,2,29,15,9);                              // molo w morze
  const trees=[[4,27],[9,28],[15,27],[21,28],[34,27],[40,28],[46,27],[51,28],[44,27]];
  for(const[t0,t1]of trees)set(t0,t1,4);
  rect(6,18,12,22,5);   // smażalnia
  rect(38,18,45,22,5);  // Dino nadmorskie
  rect(48,13,52,16,6);  // stragan z gadżetami
  set(3,22,7);set(54,21,7);
  rect(17,27,19,28,5);  // przystanek PKS (drzwi od północy — fix!)
  // detale: ławki i latarnie na promenadzie
  set(6,23,10);set(26,23,10);set(46,23,10);
  for(let x=2;x<=54;x+=9)if(at(x,26)===0)set(x,26,11);
  set(33,27,12);set(13,27,12);
}
/* ---------------- KRAKÓW ---------------- */
function buildKrakow(){
  rect(0,0,MW-1,MH-1,0);
  rect(0,34,MW-1,MH-1,3);rect(0,33,MW-1,33,1);      // Wisła + bulwar
  rect(0,24,43,25,2);                                // droga
  rect(44,0,45,32,2);                                // droga pionowa
  rect(20,10,40,22,1);                               // Rynek Główny (bruk)
  rect(27,14,33,18,5);                               // Sukiennice
  rect(36,6,41,10,5);                                // Kościół Mariacki
  rect(6,26,16,32,5);                                // Wawel
  rect(43,12,46,14,6);                               // stragan z obwarzankami
  rect(21,4,25,7,5);rect(30,2,34,5,5);rect(14,6,18,9,5); // kamienice
  rect(48,22,53,25,5);                               // teatr?
  rect(50,26,52,27,5);                               // PKS
  // Planty: pierścień drzew wokół rynku
  const pl=[[18,9],[22,8],[26,8],[34,8],[42,9],[18,13],[18,17],[18,21],[42,13],[42,17],[42,21],
    [20,23],[26,23],[34,23],[40,23],[3,3],[8,2],[3,12],[5,18],[56,3],[54,8],[57,14],[48,4],[52,6]];
  for(const[t0,t1]of pl)set(t0,t1,4);
  // detale
  set(24,12,11);set(36,12,11);set(24,20,11);set(36,20,11); // latarnie na rynku
  set(22,16,10);set(38,16,10);set(21,11,12);set(39,21,12); // ławki i kwiaty
  set(30,20,15);                                     // fontanna
  set(47,20,14);                                     // billboard Edka
  for(let x=2;x<=16;x++)if(at(x,25)===0)set(x,25,13);
  for(let y=0;y<MH;y+=2)if(at(0,y)===0)set(0,y,4);
  for(let x=0;x<MW;x+=2)if(at(x,0)===0)set(x,0,4);
}
/* ---------------- TATRY / ZAKOPANE ---------------- */
function buildTatry(){
  rect(0,0,MW-1,MH-1,0);
  rect(0,0,MW-1,8,16);                               // granie — skała
  rect(0,0,MW-1,2,17);                               // śnieg na szczytach
  rect(12,3,16,8,17);                                // szlak na Giewont (śnieżna perć)
  rect(0,26,MW-1,27,2);                              // zakopianka
  rect(10,20,45,21,1);                               // Krupówki (deptak)
  rect(14,16,19,19,5);                               // karczma
  rect(24,16,27,18,6);                               // stragan z oscypkami
  rect(31,16,34,19,5);rect(38,16,41,19,5);           // domki góralskie
  rect(8,22,11,24,5);rect(44,16,48,19,5);            // wille
  rect(38,24,40,25,5);                               // PKS
  // las świerkowy
  const sw=[[4,11],[7,13],[10,10],[3,15],[20,11],[23,13],[28,10],[33,12],[37,10],[42,12],[47,11],[51,13],[54,10],
    [6,29],[12,30],[20,29],[28,30],[34,29],[44,30],[50,29],[54,31],[2,32],[16,31],[40,32],[48,33],[25,32],[8,33]];
  for(const[t0,t1]of sw)set(t0,t1,4);
  // detale
  set(12,22,10);set(30,22,10);set(42,22,10); // ławki przy Krupówkach
  for(let x=12;x<=44;x+=8)if(at(x,19)===0)set(x,19,11);
  set(21,22,12);set(36,22,12);
  set(48,24,14);                                     // billboard
  for(let x=44;x<=52;x++)if(at(x,15)===0)set(x,15,13);
}
const REGIONS={
  wawa:{n:'WARSZAWA',w:64,h:44,build:buildWawa,spawn:[456,368],pks:[24,24],ic:'🏙',
    tdesc:'stolica · 10 questów · Piwnica Hejterów · Król Dzików',
    cars:true,boars:true,leaves:true,smoke:true,boat:true,
    foesMax:5,foeTypes:['hejter','dres'],zones:[[38,36,55,42],[2,22,8,32],[12,2,24,8]]},
  chodziez:{n:'CHODZIEŻ',w:48,h:36,build:buildChodziez,spawn:[20*16,15.5*16],pks:[20,14],ic:'🏡',
    tdesc:'rodzinne strony Edka · targ · Dziki Las · MEGA DRES',
    cars:false,boars:false,leaves:true,smoke:false,boat:true,
    foesMax:4,foeTypes:['zazdrosnik','hejter'],zones:[[36,2,46,12],[2,17,8,23]]},
  morze:{n:'POLSKIE MORZE',w:56,h:30,build:buildMorze,spawn:[18*16,25.4*16],pks:[18,26],ic:'🌊',
    tdesc:'plaża · molo · bursztyny · Zatopione Molo · Kraken',
    cars:false,boars:false,leaves:false,smoke:false,boat:true,
    foesMax:5,foeTypes:['dres','hejter'],zones:[[4,12,24,16],[32,11,54,16]]},
  krakow:{n:'KRAKÓW',w:60,h:40,build:buildKrakow,spawn:[51*16,29.5*16],pks:[51,28],ic:'🐉',
    tdesc:'Rynek · Sukiennice · Wawel · Smocza Jama · SMOK',
    cars:false,boars:false,leaves:true,smoke:false,boat:false,
    foesMax:5,foeTypes:['hejter','zazdrosnik'],zones:[[2,2,12,20],[46,2,57,18]]},
  tatry:{n:'TATRY — ZAKOPANE',w:56,h:36,build:buildTatry,spawn:[39*16,28.5*16],pks:[39,26],ic:'🏔',
    tdesc:'Krupówki · Giewont · oscypki · Lodowa Grota · YETI',
    cars:false,boars:false,leaves:true,smoke:false,boat:false,
    foesMax:4,foeTypes:['dres','zazdrosnik'],zones:[[4,28,20,33],[30,10,52,14]]},
};
let REG='wawa';
const SOLID=v=>v===3||v===4||v===5||v===6||(v>=10&&v<=16);

const DOORS=[
  {r:'wawa',x:36,y:17,n:'PKiN',act:'pkin'},
  {r:'wawa',x:48,y:8,n:'Sejm RP',act:'sejm'},
  {r:'wawa',x:10,y:32,n:'Dino',act:'dino'},
  {r:'wawa',x:33,y:33,n:'Warsztat',act:'warsztat'},
  {r:'wawa',x:49,y:34,n:'Bazar',act:'bazar'},
  {r:'wawa',x:52,y:17,n:'Kopernik',act:'kopernik'},
  {r:'wawa',x:31,y:25,n:'Metro',act:'metro'},
  {r:'wawa',x:24,y:24,n:'PKS',act:'pks'},
  {r:'chodziez',x:20,y:14,n:'PKS',act:'pks'},
  {r:'chodziez',x:13,y:10,n:'Dom Edka',act:'dom'},
  {r:'chodziez',x:33,y:22,n:'Dino',act:'dino2'},
  {r:'morze',x:18,y:26,n:'PKS',act:'pks'},
  {r:'morze',x:9,y:23,n:'Smażalnia',act:'smazalnia'},
  {r:'morze',x:41,y:23,n:'Dino',act:'dino2'},
  {r:'morze',x:50,y:17,n:'Gadżety',act:'gadzety'},
  {r:'morze',x:27.5,y:3,n:'Koniec molo',act:'molo'},
  {r:'chodziez',x:28,y:10,n:'Targ',act:'targ'},
  {r:'krakow',x:51,y:28,n:'PKS',act:'pks'},
  {r:'krakow',x:44,y:15,n:'Obwarzanki',act:'obwarzanki'},
  {r:'krakow',x:30,y:19,n:'Sukiennice',act:'sukiennice'},
  {r:'krakow',x:11,y:33,n:'Wawel',act:'wawel'},
  {r:'krakow',x:38,y:11,n:'Mariacki',act:'mariacki'},
  {r:'tatry',x:39,y:26,n:'PKS',act:'pks'},
  {r:'tatry',x:16,y:20,n:'Karczma',act:'karczma'},
  {r:'tatry',x:25,y:19,n:'Oscypki',act:'oscypki'},
  {r:'tatry',x:14,y:3,n:'Giewont',act:'giewont'},
];
const NPCS=[
  {r:'wawa',id:'pani_park',n:'Pani Grażynka',x:11*16,y:19*16,c:'#c86fa8',hair:'#d8d4e8'},
  {r:'wawa',id:'fan',n:'Fan Edka',x:37*16,y:18*16,c:'#5a8fd0',hair:'#3a2a1a'},
  {r:'wawa',id:'ochroniarz',n:'Ochroniarz Sejmu',x:47*16,y:9*16,c:'#404050',hair:'#222'},
  {r:'wawa',id:'pani_dino',n:'Pani z Dino',x:11*16,y:33*16,c:'#d05a5a',hair:'#6a4a2a'},
  {r:'wawa',id:'spawacz',n:'Spawacz Zenek',x:35*16,y:33.5*16,c:'#7a7a8a',hair:'#888'},
  {r:'wawa',id:'jubiler',n:'Jarek Zegarek',x:47*16,y:34.5*16,c:'#8a6fc8',hair:'#c0c0c0'},
  {r:'wawa',id:'ziomal1',n:'Ziomal Seba',x:53*16,y:21*16,c:'#4a7a4a',hair:'#2a1a0a'},
  {r:'wawa',id:'ochrona_cnk',n:'Ochrona Kopernika',x:51*16,y:17.5*16,c:'#2a2a3a',hair:'#111'},
  {r:'wawa',id:'maszynista',n:'Maszynista Metra',x:34*16,y:24.5*16,c:'#31518f',hair:'#555'},
  {r:'wawa',id:'kibic',n:'Kibic Zbyszek',x:57*16+4,y:30*16,c:'#c8384a',hair:'#8a5a2a'},
  {r:'wawa',id:'zabson',n:'Żabson',x:44*16+8,y:27*16,c:'#3a7a5a',hair:'#111'},
  {r:'wawa',id:'julka',n:'Julka z Tindera',x:33*16,y:18.5*16,c:'#e88ac8',hair:'#f0d060'},
  {r:'morze',id:'dych_npc',n:'Dych Dziki',x:33*16,y:15*16,c:'#31518f',hair:'#4a4f66',robo:true},
  {r:'chodziez',id:'mietek',n:'Sąsiad Mietek',x:14*16,y:11*16,c:'#6a5a4a',hair:'#aaa'},
  {r:'chodziez',id:'ceramiczka',n:'Pani z Ceramiki',x:20*16,y:10.5*16,c:'#b06a3a',hair:'#4a2a1a'},
  {r:'morze',id:'rybak',n:'Rybak Bogdan',x:10*16,y:23.5*16,c:'#3a5a7a',hair:'#ddd'},
  {r:'morze',id:'ratownik',n:'Ratownik Waldek',x:30*16,y:12*16,c:'#e04848',hair:'#f0d060'},
  {r:'krakow',id:'przekupka',n:'Przekupka Halinka',x:45*16,y:16.5*16,c:'#c86fa8',hair:'#d8d4e8'},
  {r:'krakow',id:'hejnalista',n:'Hejnalista Staszek',x:38.5*16,y:12*16,c:'#31518f',hair:'#8a5a2a'},
  {r:'krakow',id:'dorozkarz',n:'Dorożkarz Czesiek',x:30*16,y:23.5*16,c:'#4a4658',hair:'#333'},
  {r:'tatry',id:'baca',n:'Baca Józek',x:27*16,y:20.5*16,c:'#6e4720',hair:'#ddd'},
  {r:'tatry',id:'toprowiec',n:'Ratownik TOPR Franek',x:44*16,y:21*16,c:'#e04848',hair:'#3a2a1a'},
];

/* ---------------- STAN ---------------- */
let scene='title';
let last=0,camX=0,camY=0,anim=0;
const P={x:456,y:368,dir:0,frame:0,moving:false,speed:85,slow:false};
let boars=[],idleT=16,confetti=[],prompt=null;
let cars=[],peds=[],pigeons=[],drops=[],leaves=[],smoke=[],selfie=null;
let selfieT=45,dropT=14,leafT=0,smokeT=0,worldFlash=0,boatY=8*16,boatV=12;
/* walka */
let foes=[],hitFX=[],foeT=6,bossShots=[];
let hurtT=0,atkT=0,atkAnim=0,atkDir=0,spcT=0,dashT=0,dashDir=0;
const BOSS_LEASH=190; /* promień areny bossa (px) — dalej = boss wraca na środek i walka od nowa */
const DV=[[0,1],[-1,0],[1,0],[0,-1]]; // wektory kierunków (dół/lewo/prawo/góra)
/* ekipa: reszta drużyny idzie za graczem (max 2 z tyłu) */
const FOLW=[{x:0,y:0,dir:0,frame:0},{x:0,y:0,dir:0,frame:0}];
function resetFollowers(){for(const fo of FOLW){fo.x=P.x;fo.y=P.y+14;}}
let dychIdleT=20;

/* ---------------- REGIONY: przełączanie ---------------- */
function setRegion(id){
  const cfg=REGIONS[id];if(!cfg)return;
  REG=id;MW=cfg.w;MH=cfg.h;
  M=new Uint8Array(MW*MH);
  cfg.build();
  /* duża, otwarta arena wokół spawnu bossa: karczujemy przeszkody w promieniu 5 kafli,
     wstawiając najczęstszy deptalny kafel z okolicy (trawa/piasek/śnieg wg regionu) */
  for(const b of Object.values(BOSSES)){
    if(b.r!==id)continue;
    const cnt={};
    for(let ty=b.y-7;ty<=b.y+7;ty++)for(let tx=b.x-7;tx<=b.x+7;tx++){
      if(tx<1||ty<1||tx>=MW-1||ty>=MH-1)continue;
      const v=M[ty*MW+tx];
      if(!SOLID(v))cnt[v]=(cnt[v]||0)+1;
    }
    const keys=Object.keys(cnt);
    const fill=keys.length?+keys.sort((a,b2)=>cnt[b2]-cnt[a])[0]:0;
    for(let ty=b.y-5;ty<=b.y+5;ty++)for(let tx=b.x-5;tx<=b.x+5;tx++){
      if(tx<1||ty<1||tx>=MW-1||ty>=MH-1)continue;
      if(Math.hypot(tx-b.x,ty-b.y)>5.2)continue;
      if(SOLID(M[ty*MW+tx]))M[ty*MW+tx]=fill;
    }
  }
  resetAmbient();
  foes=[];hitFX=[];foeT=1.5;PROJ=[];bossShots=[];dmgNums=[];
  for(let i=0;i<cfg.foesMax;i++)spawnFoe();
  if(S){S.region=id;
    if(!S.visited[id]){S.visited[id]=1;
      postFilm(id==='chodziez'?'VLOG Z CHODZIEŻY — wracam na dzielnię!':
               id==='morze'?'EDEK NAD POLSKIM MORZEM (paragon grozy?)':'ZWIEDZAM WARSZAWĘ',14000);}
    save();}
}
function travelTo(id){
  if(id===REG){$('travel').classList.add('hidden');return;}
  $('travel').classList.add('hidden');
  setRegion(id);
  const cfg=REGIONS[id];
  P.x=cfg.spawn[0];P.y=cfg.spawn[1];resetFollowers();
  camX=Math.max(0,Math.min(MW*16-W,P.x-W/2));camY=Math.max(0,Math.min(MH*16-H,P.y-H/2));
  scene='world';initPartyHP(true);hurtT=1.5;
  toast('🚌 '+cfg.n+'!');
  SFX.ok();
  if(id==='chodziez')vsay('c_kosz');
  else if(id==='morze')vsay('v_napoje');
  else if(id==='krakow')vsay('c_krolbalu');
  else if(id==='tatry')vsay('m_wiatr');
}

/* ---------------- WALKA: hejterzy i dresy ---------------- */
const FOE_TYPES={
  hejter:{hp:45,atk:10,spd:52,c:'#3a3a5a',hood:'#2a2a44',skin:'#d8b890',dia:3,pts:900},
  dres:{hp:80,atk:14,spd:66,c:'#1a1a24',hood:'#31518f',skin:'#e8c9a0',dia:5,pts:1400},
  zazdrosnik:{hp:60,atk:12,spd:58,c:'#4a5a3a',hood:'#6a4a2a',skin:'#e8c9a0',dia:4,pts:1100},
  gigadres:{hp:220,atk:18,spd:58,c:'#0e0e16',hood:'#c8384a',skin:'#e8c9a0',dia:10,pts:3000},
  straznik:{hp:400,atk:20,spd:48,c:'#2a2440',hood:'#8a6fc8',skin:'#c9c4dd',dia:20,pts:8000},
  /* bossowie */
  krol:{hp:900,atk:20,spd:64,c:'#6e4730',hood:'#4a2f1e',skin:'#8a5a3b',dia:0,pts:0},
  mdres:{hp:1200,atk:22,spd:58,c:'#0e0e16',hood:'#c8384a',skin:'#e8c9a0',dia:0,pts:0},
  kraken:{hp:1500,atk:24,spd:44,c:'#2a6a5a',hood:'#1a4a3e',skin:'#3a8a72',dia:0,pts:0},
  smok:{hp:2400,atk:28,spd:40,c:'#3a7a4a',hood:'#c8384a',skin:'#7bc950',dia:0,pts:0},
  yeti:{hp:2000,atk:26,spd:70,c:'#ece9f4',hood:'#d8d4e8',skin:'#bfe8f4',dia:0,pts:0},
};
function spawnFoe(){
  const cfg=REGIONS[REG];
  if(foes.length>=cfg.foesMax)return;
  for(let i=0;i<40;i++){
    const z=pickA(cfg.zones);
    const tx=z[0]+(Math.random()*(z[2]-z[0]))|0,ty=z[1]+(Math.random()*(z[3]-z[1]))|0;
    if(SOLID(at(tx,ty)))continue;
    const x=tx*16+8,y=ty*16+8;
    if(Math.hypot(P.x-x,P.y-y)<110)continue;
    const t=pickA(cfg.foeTypes),td=FOE_TYPES[t];
    foes.push({t,x,y,hp:td.hp,hp0:td.hp,dx:0,dy:0,wt:Math.random()*2,stun:0,kb:0,kbx:0,kby:0,flash:0});
    return;
  }
}
function addHit(x,y,txt,col){
  hitFX.push({x,y,txt,life:.55,c:col||'#f5c542'});
  for(let i=0;i<6;i++)confetti.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*120-30,
    life:.5,c:pickA(['#f5c542','#fff','#e04848'])});
}
/* latające LICZBY OBRAŻEŃ w kolorze żywiołu */
let dmgNums=[];
function addDmgNum(x,y,v,col,crit){
  dmgNums.push({x:x+(Math.random()-.5)*10,y,v:''+v,col:col||'#fff',crit:!!crit,life:.9});
}
/* centralne zadawanie obrażeń: ATK ×mnożnik, kryt, aura żywiołu + REAKCJE */
function dealDmg(f,chId,mult,opts){
  opts=opts||{};
  const c=CHARS[chId],el=c.elId,eCol=ELEMENTS[el].col;
  let dmg=chATK(chId)*mult;
  if(chId===S.ch&&BUFF.t>0)dmg*=(1+BUFF.atk);
  let crit=Math.random()<.15;
  if(crit)dmg*=chCD(chId)/100;
  /* reakcja żywiołów: aura A + trafienie B */
  if(f.aura&&f.aura.el!==el){
    const r=REACT[reactKey(f.aura.el,el)];
    if(r){
      dmg*=r.mul||1;
      addHit(f.x,f.y-26,r.n,r.col);
      if(r.stun)f.stun=Math.max(f.stun||0,r.stun);
      if(r.slow)f.slow=Math.max(f.slow||0,r.slow);
      if(r.charm&&!f.boss)f.charm=Math.max(f.charm||0,r.charm);
      if(r.burn){f.burn=Math.max(f.burn||0,r.burn);f.burnDmg=Math.round(chATK(chId)*.2);}
      if(r.heal){const m=chHpMax(S.ch),h=Math.round(m*r.heal);
        PHP[S.ch]=Math.min(m,PHP[S.ch]+h);addDmgNum(P.x,P.y-26,'+'+h,'#7bc950');}
      if(r.food){S.food[r.food]=(S.food[r.food]||0)+1;save();
        toast(FOOD[r.food].ic+' Drop z reakcji: '+FOOD[r.food].n+'!');}
      if(r.aoe)for(const o of foes)if(o!==f&&!o.dead&&Math.hypot(o.x-f.x,o.y-f.y)<46){
        const ad=Math.round(dmg*.5);o.hp-=ad;o.flash=.15;
        addDmgNum(o.x,o.y-16,ad,r.col);if(o.hp<=0)killFoe(o);}
      f.aura=null;
      SFX.dia();
    }
  }else{
    f.aura={el,t:4};
  }
  dmg=Math.max(1,Math.round(dmg));
  f.hp-=dmg;f.flash=.15;
  addDmgNum(f.x,f.y-18,dmg,eCol,crit);
  if(crit)SFX.crit();
  const kbF=(opts.kb!==undefined?opts.kb:1)*180;
  const ox=opts.ox!==undefined?opts.ox:P.x,oy=opts.oy!==undefined?opts.oy:P.y;
  const d=Math.max(1,Math.hypot(f.x-ox,f.y-oy));
  if(kbF>0){f.kb=.22;f.kbx=(f.x-ox)/d*kbF;f.kby=(f.y-oy)/d*kbF;}
  if(Math.random()<.3)addHit(f.x,f.y-30,pickA(c.hitTxt),c.hitCol);
  SFX.hit();
  if(f.hp<=0)killFoe(f);
  return dmg;
}
function hurtFoe(f,dmgIgnored,ox,oy,chId){dealDmg(f,chId&&CHARS[chId]?chId:S.ch,1,{ox,oy});}
let PROJ=[];      // pociski postaci (dorsz, serduszko)
let slowAll=0;    // STOP-KLATKA Jarka: globalne spowolnienie wrogów
function tryAttack(){
  if(scene!=='world'||atkT>0)return;
  atkT=.38;atkAnim=.22;atkDir=P.dir;
  const c=CHARS[S.ch];
  if(c.atk==='proj'){ // Julka: serduszko / Bogdan: dorsz
    const dv=DV[P.dir];
    PROJ.push({x:P.x+dv[0]*10,y:P.y-8+dv[1]*10,dx:dv[0]*210,dy:dv[1]*210,
      life:c.rng/210,type:S.ch});
    beep(S.ch==='julka'?880:300,.07,'triangle',.06,S.ch==='julka'?1300:160);
    return;
  }
  const rng=c.rng;
  const fx=P.x+(P.dir===1?-14:P.dir===2?14:0),fy=P.y+(P.dir===0?12:P.dir===3?-12:0);
  beep(S.ch==='dych'?120:220,.08,'square',.06,S.ch==='dych'?60:120);
  let hit=false;
  for(const f of foes){
    const br=f.boss?12:0;
    if(Math.hypot(f.x-fx,f.y-fy)<rng+br||Math.hypot(f.x-P.x,f.y-P.y)<15+br){
      hit=true;dealDmg(f,S.ch,1);
      if(c.burn){f.burn=Math.max(f.burn||0,c.burn*.7);f.burnDmg=Math.round(chATK(S.ch)*.2);}
      if(c.slow)f.slow=Math.max(f.slow||0,c.slow);
    }
  }
  if(!hit&&Math.random()<.12)addHit(fx,fy-6,'SZUCH!','#8f88b0');
}
function hurtFoe(f,dmg,ox,oy,chId){
  f.hp-=dmg;f.flash=.15;
  const d=Math.max(1,Math.hypot(f.x-ox,f.y-oy));
  f.kb=.22;f.kbx=(f.x-ox)/d*180;f.kby=(f.y-oy)/d*180;
  const c=CHARS[chId]||CHARS[S.ch];
  addHit(f.x,f.y-14,pickA(c.hitTxt),c.hitCol);
  SFX.hit();
  if(f.hp<=0)killFoe(f);
}
function killFoe(f){
  f.dead=true;
  if(f.boss){bossDefeated(f);return;}
  const td=FOE_TYPES[f.t];
  S.dia+=td.dia;save();refreshHUD();SFX.dia();
  addHit(f.x,f.y-8,'+'+td.dia+'💎','#6fd8e8');
  addViews(td.pts,false);
  // liczniki questów walki
  if(REG==='wawa'&&qs('seba')===1){S.k.seba=(S.k.seba||0)+1;save();
    if(S.k.seba===6)toast('👊 Dzielnia czysta! Wracaj do Seby!');
    else toast('👊 Hejter pogoniony ('+S.k.seba+'/6)');}
  if(REG==='morze'&&qs('dych')===1){S.k.dych=(S.k.dych||0)+1;save();
    if(S.k.dych===3)toast('🦾 Dresiarze pogonieni! Pogadaj z Dychem!');
    else toast('👊 Dresiarz pogoniony ('+(S.k.dych)+'/3)');}
  if(Math.random()<.3&&!curVoice&&S.ch==='edek')vsay(pickA(['c_kopytem','c_ziomali','c_etam']));
  if(S.ch==='dych'&&Math.random()<.4)dychSay();
  else if(Math.random()<.25)charSay();
  // materiały do ulepszania postaci
  if(Math.random()<.45){S.mats.sr++;addHit(f.x,f.y+2,'+1🔩','#c9c4dd');}
  if(Math.random()<.1){S.mats.ch++;addHit(f.x,f.y+10,'+1⚙️','#6fd8e8');}
  if(Math.random()<.06){const fid=pickA(['picie','paczek','ogorek','zapiekanka']);
    S.food[fid]=(S.food[fid]||0)+1;addHit(f.x,f.y+18,FOOD[fid].ic,'#7bc950');}
  save();
  foeT=5+Math.random()*6;
}
function trySpecial(){
  if(scene!=='world'||spcT>0)return;
  const c=CHARS[S.ch];
  spcT=c.spcCd;
  switch(S.ch){
    case 'edek':{ // BŁYSK ROLEXA — stun na cały ekran
      worldFlash=.7;
      for(const f of foes){
        const sx=f.x-camX,sy=f.y-camY;
        if(sx>-10&&sx<W+10&&sy>-10&&sy<H+10)f.stun=2.6;
      }
      toast('⌚ BŁYSK ROLEXA! Hejterzy oślepieni!');
      if(!curVoice)vsay('c_rolexlewa');SFX.dia();break;}
    case 'dych':{ // DZIKA SZARŻA
      dashT=.28;dashDir=P.dir;
      addHit(P.x,P.y-18,'SZARŻA!','#f5a032');
      beep(90,.3,'sawtooth',.09,45);break;}
    case 'grazynka':{ // GORĄCY ROSÓŁ — full heal + para parzy
      PHP[S.ch]=chHpMax(S.ch);worldFlash=.35;
      addDmgNum(P.x,P.y-26,'+MAX','#7bc950');
      for(const f of foes)if(Math.hypot(f.x-P.x,f.y-P.y)<64)dealDmg(f,'grazynka',1.25);
      for(let i=0;i<14;i++)smoke.push({x:P.x+(Math.random()-.5)*40,y:P.y-(Math.random()*20),r:2,life:1.6});
      toast('🍲 GORĄCY ROSÓŁ! Pełne HP, hejterzy sparzeni!');
      SFX.buy();break;}
    case 'jarek':{ // STOP-KLATKA — globalne spowolnienie
      slowAll=6;worldFlash=.4;
      for(const f of foes)f.stun=Math.max(f.stun,1);
      toast('⏱️ STOP-KLATKA! Czas płynie tylko dla Ciebie!');
      beep(1568,.4,'triangle',.08,180);break;}
    case 'zenek':{ // PALNIK — stożek ognia w kierunku patrzenia
      const dv=DV[P.dir];
      for(const f of foes){
        const rx=f.x-P.x,ry=f.y-P.y,d=Math.hypot(rx,ry);
        if(d<76&&rx*dv[0]+ry*dv[1]>d*.35){dealDmg(f,'zenek',1.5);f.burn=Math.max(f.burn||0,3);f.burnDmg=Math.round(chATK('zenek')*.25);}
      }
      for(let i=0;i<10;i++)confetti.push({x:P.x+dv[0]*(14+i*6)+(Math.random()-.5)*16,
        y:P.y-8+dv[1]*(14+i*6)+(Math.random()-.5)*16,vx:dv[0]*60,vy:dv[1]*60-20,
        life:.5,c:pickA(['#e04848','#f5a032','#fff7d6'])});
      toast('🔥 PALNIK 3000°C! PSSSST!');
      beep(140,.5,'sawtooth',.1,60);break;}
    case 'julka':{ // ZAUROCZENIE — 3 najbliżsi walczą po naszej stronie
      const near=foes.filter(f=>!f.boss).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)).slice(0,3);
      for(const f of near){f.charm=6;addHit(f.x,f.y-18,'💘','#e88ac8');}
      toast('💘 ZAUROCZENIE! '+near.length+' hejterów walczy dla Ciebie!');
      beep(1046,.1,'triangle',.08);setTimeout(()=>beep(1318,.18,'triangle',.08),110);break;}
    case 'bogdan':{ // FALA BAŁTYCKA — obrażenia + mega odrzut
      worldFlash=.3;
      for(const f of foes)if(Math.hypot(f.x-P.x,f.y-P.y)<95){
        dealDmg(f,'bogdan',1.1,{kb:0});f.kb=.5;
        const d=Math.max(1,Math.hypot(f.x-P.x,f.y-P.y));
        f.kbx=(f.x-P.x)/d*300;f.kby=(f.y-P.y)/d*300;
      }
      toast('🌊 FALA BAŁTYCKA! Hejterzy zmyci!');
      beep(70,.6,'sawtooth',.1,35);break;}
  }
}
function hurtPlayer(srcF){
  if(hurtT>0||dashT>0)return;
  const baseAtk=(srcF&&srcF.atk)||((srcF&&FOE_TYPES[srcF.t])?FOE_TYPES[srcF.t].atk:10);
  const def=chDEF(S.ch)+(BUFF.t>0?BUFF.def:0);
  const dmg=Math.max(1,Math.round(baseAtk*(100/(100+def))*(0.9+Math.random()*.2)));
  PHP[S.ch]=Math.max(0,(PHP[S.ch]||0)-dmg);
  hurtT=1.2;SFX.no();
  addDmgNum(P.x,P.y-26,'-'+dmg,'#e04848',false);
  const sx2=srcF?srcF.x:P.x-6,sy2=srcF?srcF.y:P.y;
  const d=Math.max(1,Math.hypot(P.x-sx2,P.y-sy2));
  const kx=P.x+(P.x-sx2)/d*14,ky=P.y+(P.y-sy2)/d*14;
  if(canWalk(kx,P.y))P.x=kx;
  if(canWalk(P.x,ky))P.y=ky;
  if(PHP[S.ch]<=0){
    const alive=S.party.find(id=>(PHP[id]||0)>0);
    if(alive){
      addHit(P.x,P.y-30,'PADŁ!','#e04848');
      toast('😵 '+CHARS[S.ch].n+' pada! Do walki wchodzi '+CHARS[alive].n+'!');
      switchTo(alive);hurtT=1.6;
    }else partyWipe();
  }
}
/* cała drużyna padła */
function partyWipe(){
  if(REG==='arena'&&DOM.cur){
    const dn=DOMAINS[DOM.cur].n;
    exitDomain();
    for(const id of S.party)PHP[id]=Math.round(chHpMax(id)*.5);
    hurtT=2.5;
    toast('💀 CAŁA DRUŻYNA PADŁA!<br>'+dn+': cały progres OD NOWA, byku!',4600);
    vsay('c_niepoddajemy');SFX.no();
  }else{
    S.dia=Math.max(0,S.dia-5);save();refreshHUD();
    const sp=REGIONS[REG].spawn;P.x=sp[0];P.y=sp[1];resetFollowers();
    initPartyHP(true);hurtT=2.5;
    /* boss wraca na środek areny z pełnym HP — walka od nowa */
    let bossReset=false;
    for(const f of foes)if(f.boss){
      f.x=f.homeX;f.y=f.homeY;f.hp=f.maxHp;f.hp0=f.maxHp;
      f.ph2=false;f.stun=0;f.burn=0;f.aura=null;f.kb=0;f.leash=false;
      bossReset=true;
    }
    if(bossReset)bossShots=[];
    toast('😵 Cała ekipa na deskach... -5💎.'+(bossReset?'<br>⚔️ BOSS wraca na arenę z pełnym HP!':' Ale my się nie poddajemy!'));
    vsay('c_niepoddajemy');
  }
}
function updateFoes(dt){
  if(slowAll>0)slowAll-=dt;
  foeT-=dt;if(foeT<=0){foeT=7+Math.random()*7;if(REG!=='arena'&&!foes.some(f=>f.boss))spawnFoe();}
  for(const f of foes){
    if(f.flash>0)f.flash-=dt;
    if(f.burn>0){ // podpalenie: DoT co sekundę
      f.burn-=dt;f.bt=(f.bt||0)+dt;
      if(f.bt>=1){f.bt-=1;const bd=f.burnDmg||8;f.hp-=bd;f.flash=.12;
        addDmgNum(f.x,f.y-16,bd,'#e04848');
        if(Math.random()<.4)addHit(f.x,f.y-28,'PŁONIE!','#e04848');
        if(f.hp<=0){killFoe(f);continue;}}
    }
    if(f.aura){f.aura.t-=dt;if(f.aura.t<=0)f.aura=null;}
    if(f.charm>0)f.charm-=dt;
    if(f.slow>0)f.slow-=dt;
    if(f.stun>0){f.stun-=dt;continue;}
    if(f.kb>0){f.kb-=dt;
      const nx=f.x+f.kbx*dt,ny=f.y+f.kby*dt;
      if(!SOLID(at(Math.floor(nx/16),Math.floor(f.y/16))))f.x=nx;
      if(!SOLID(at(Math.floor(f.x/16),Math.floor(ny/16))))f.y=ny;
      continue;}
    const td=FOE_TYPES[f.t];
    const slowK=(slowAll>0||f.slow>0)?.45:1;
    if(f.charm>0){ // zauroczony przez Julkę: atakuje innych hejterów
      let tgt=null,bd=1e9;
      for(const o of foes){if(o===f||o.dead||o.charm>0)continue;
        const od=Math.hypot(o.x-f.x,o.y-f.y);if(od<bd){bd=od;tgt=o;}}
      if(tgt){
        f.dx=(tgt.x-f.x)/bd*td.spd;f.dy=(tgt.y-f.y)/bd*td.spd;
        if(bd<14){hurtFoe(tgt,1,f.x,f.y,'julka');f.charm-=.8;}
      }else{f.dx=0;f.dy=0;}
      const nx=f.x+f.dx*slowK*dt,ny=f.y+f.dy*slowK*dt;
      if(!SOLID(at(Math.floor(nx/16),Math.floor(f.y/16))))f.x=nx;
      if(!SOLID(at(Math.floor(f.x/16),Math.floor(ny/16))))f.y=ny;
      continue;
    }
    const d=Math.hypot(P.x-f.x,P.y-f.y);
    const spd2=td.spd*(f.boss&&f.ph2?1.35:1);
    if((d<86||f.boss)&&d>2){f.dx=(P.x-f.x)/d*spd2;f.dy=(P.y-f.y)/d*spd2;}
    else{f.wt-=dt;
      if(f.wt<=0){f.wt=1.5+Math.random()*2;const a=Math.random()*7;
        f.dx=Math.cos(a)*20;f.dy=Math.sin(a)*20;}}
    /* STRAŻNIK DOMENY: radialne salwy */
    if(f.guard){
      f.gt=(f.gt||2.2)-dt;
      if(f.gt<=0){
        f.gt=3.1;
        for(let k=0;k<8;k++){const a=k/8*6.283+anim;
          bossShots.push({x:f.x,y:f.y-8,dx:Math.cos(a)*112,dy:Math.sin(a)*112,life:2.3,t:'bryzg',
            atk:Math.round((f.gatk||14))});}
        addHit(f.x,f.y-30,'SALWA!','#8a6fc8');
        beep(300,.2,'sawtooth',.08,120);
      }
    }
    /* BOSS: fazy + ataki specjalne + ARENA (leash — ucieczka gracza = walka od nowa) */
    if(f.boss){
      const hd=Math.hypot(P.x-f.homeX,P.y-f.homeY);
      if(hd>BOSS_LEASH){
        if(!f.leash){
          f.leash=true;
          f.hp=f.maxHp;f.hp0=f.maxHp;f.ph2=false;f.stun=0;f.burn=0;f.aura=null;f.kb=0;
          bossShots=[];
          addHit(f.x,f.y-30,'TCHÓRZ!','#f5c542');
          toast('🏃 Uciekłeś z areny! '+f.bn+' wraca na środek — walka OD NOWA!',3600);
        }
        const hdd=Math.hypot(f.homeX-f.x,f.homeY-f.y);
        if(hdd>4){f.dx=(f.homeX-f.x)/hdd*td.spd*1.3;f.dy=(f.homeY-f.y)/hdd*td.spd*1.3;}
        else{f.dx=0;f.dy=0;}
      }else{
      f.leash=false;
      if(!f.ph2&&f.hp<=f.maxHp/2){f.ph2=true;
        addHit(f.x,f.y-30,'WŚCIEKŁOŚĆ!!!','#e04848');
        toast('⚠️ '+f.bn+' WPADA W SZAŁ!');SFX.no();}
      f.at=(f.at||2.5)-dt;
      if(f.at<=0&&d<230){
        f.at=f.ph2?2:3.2;
        if(f.batk==='charge'){ // Król Dzików: szarża na gracza
          f.kb=.5;f.kbx=(P.x-f.x)/Math.max(1,d)*300;f.kby=(P.y-f.y)/Math.max(1,d)*300;
          addHit(f.x,f.y-26,'SZARŻA!','#f5a032');SFX.boar();
        }else{ // Dres: kettle / Kraken: bryzg — pocisk w gracza
          const a=Math.atan2(P.y-f.y,P.x-f.x);
          const sAtk=Math.round(FOE_TYPES[f.t].atk*.85);
          bossShots.push({x:f.x,y:f.y-10,dx:Math.cos(a)*130,dy:Math.sin(a)*130,life:2.2,t:f.batk,atk:sAtk});
          if(f.ph2)for(const off of[-.5,.5])bossShots.push({x:f.x,y:f.y-10,
            dx:Math.cos(a+off)*130,dy:Math.sin(a+off)*130,life:2.2,t:f.batk,atk:sAtk});
          beep(200,.15,'sawtooth',.07,90);
        }
      }
      }
    }
    const nx=f.x+f.dx*slowK*dt,ny=f.y+f.dy*slowK*dt;
    if(!SOLID(at(Math.floor(nx/16),Math.floor(f.y/16))))f.x=nx;else f.dx*=-1;
    if(!SOLID(at(Math.floor(f.x/16),Math.floor(ny/16))))f.y=ny;else f.dy*=-1;
    if(d<(f.boss?22:13))hurtPlayer(f);
    /* SZARŻA: jeden czysty cios na wroga + odrzut, żeby Dych nie utknął w przeciwniku */
    if(dashT>0&&Math.hypot(P.x-f.x,P.y-f.y)<(f.boss?28:20)&&!(f.dHit>anim)){
      f.dHit=anim+.6;
      dealDmg(f,'dych',1.3);
      if(!f.boss&&!f.dead){
        const dd=Math.max(1,Math.hypot(f.x-P.x,f.y-P.y));
        f.kb=.35;f.kbx=(f.x-P.x)/dd*260;f.kby=(f.y-P.y)/dd*260;
      }
    }
  }
  foes=foes.filter(f=>!f.dead);
  // pociski bossów
  for(const b of bossShots){
    b.life-=dt;b.x+=b.dx*dt;b.y+=b.dy*dt;
    if(Math.hypot(P.x-b.x,(P.y-8)-b.y)<11){b.life=0;hurtPlayer(b);}
  }
  bossShots=bossShots.filter(b=>b.life>0);
  // pociski postaci (dorsz Bogdana / serduszko Julki)
  for(const p of PROJ){
    p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;
    if(SOLID(at(Math.floor(p.x/16),Math.floor(p.y/16)))){p.life=0;continue;}
    for(const f of foes){
      if(f.dead)continue;
      if(Math.hypot(f.x-p.x,(f.y-8)-p.y)<(f.boss?24:13)){
        dealDmg(f,p.type,1,{ox:p.x-p.dx*.1,oy:p.y-p.dy*.1});
        if(p.type==='julka'&&!f.boss&&Math.random()<.25){f.charm=Math.max(f.charm||0,2.5);addHit(f.x,f.y-20,'💘','#e88ac8');}
        p.life=0;break;
      }
    }
  }
  PROJ=PROJ.filter(p=>p.life>0);
  for(const h of hitFX)h.life-=dt;
  hitFX=hitFX.filter(h=>h.life>0);
  for(const n of dmgNums)n.life-=dt;
  dmgNums=dmgNums.filter(n=>n.life>0);
  if(atkT>0)atkT-=dt;
  if(atkAnim>0)atkAnim-=dt;
  if(spcT>0)spcT-=dt;
  if(hurtT>0)hurtT-=dt;
}

/* =====================================================================
   WARCHOCKI IMPACT: POSTACIE — kolekcja, żywioły, unikalne ataki
   ===================================================================== */
/* --- ŻYWIOŁY + REAKCJE (v7) --- */
const ELEMENTS={
  elegancja:{ic:'💎',n:'ELEGANCJA',col:'#f5c542'},
  dzikosc:{ic:'🐗',n:'DZIKOŚĆ',col:'#f5a032'},
  swojskosc:{ic:'🍲',n:'SWOJSKOŚĆ',col:'#7bc950'},
  czas:{ic:'⏱️',n:'CZAS',col:'#6fd8e8'},
  spaw:{ic:'🔥',n:'SPAW',col:'#e04848'},
  serca:{ic:'💘',n:'SERCA',col:'#e88ac8'},
  baltyk:{ic:'🌊',n:'BAŁTYK',col:'#4a8ac8'},
};
/* reakcja = aura żywiołu A na wrogu + trafienie żywiołem B (wszystkie pary mają sens!) */
const REACT={
  'baltyk|spaw':{n:'PARA!',col:'#ece9f4',mul:1.75,aoe:true},
  'baltyk|czas':{n:'SZRON!',col:'#bff0ff',mul:1.25,stun:2.5},
  'czas|spaw':{n:'HARTOWANIE!',col:'#ffb066',mul:2},
  'dzikosc|spaw':{n:'DZIK NA GRILLU!',col:'#f5a032',mul:1.5,food:'kielbaska'},
  'baltyk|dzikosc':{n:'BŁOTO!',col:'#8a6a42',mul:1.25,slow:4},
  'elegancja|serca':{n:'OŚWIADCZYNY!',col:'#ffd7ef',mul:1.2,charm:4},
  'elegancja|spaw':{n:'BLING!',col:'#fff7d6',mul:1.35,stun:2},
  'baltyk|swojskosc':{n:'ZUPA RYBNA!',col:'#7bc950',mul:1.25,heal:.15},
  'spaw|swojskosc':{n:'PRZYPALONE!',col:'#e04848',mul:1.3,burn:4},
  'dzikosc|serca':{n:'DZIKA MIŁOŚĆ!',col:'#e88ac8',mul:1.2,charm:3},
  'dzikosc|elegancja':{n:'SZOK KULTUROWY!',col:'#f5c542',mul:1.4,kb:2.2},
  'czas|serca':{n:'NOSTALGIA...',col:'#c9c4dd',mul:1.2,stun:2},
  'czas|swojskosc':{n:'OBIAD U BABCI!',col:'#7bc950',mul:1.2,heal:.1,slow:3},
  'czas|dzikosc':{n:'PRADAWNY INSTYNKT!',col:'#f5a032',mul:1.5},
  'elegancja|swojskosc':{n:'NIEDZIELNY ROSÓŁ!',col:'#f5c542',mul:1.25,heal:.1},
  'baltyk|elegancja':{n:'PERŁA!',col:'#ece9f4',mul:1.45},
  'baltyk|serca':{n:'ŁZY SZCZĘŚCIA!',col:'#bff0ff',mul:1.3},
  'serca|spaw':{n:'GORĄCY ROMANS!',col:'#ff8aa8',mul:1.5},
  'serca|swojskosc':{n:'PRZEZ ŻOŁĄDEK DO SERCA!',col:'#e88ac8',mul:1.2,charm:3},
  'dzikosc|swojskosc':{n:'SCHABOWY!',col:'#c9944a',mul:1.4,food:'schabowy'},
  'czas|elegancja':{n:'ZABYTEK!',col:'#f5c542',mul:1.45},
};
const reactKey=(a,b)=>[a,b].sort().join('|');

const CHARS={
  edek:{n:'Edward Warchocki',elId:'elegancja',star:5,
    spd:85,batk:22,rng:23,atk:'melee',
    spcN:'BŁYSK ROLEXA',spcCd:12,spcD:'oślepia wszystkich wrogów na ekranie',
    hitTxt:['ŁUP!','BAM!','Z KOPYTA!'],
    desc:'Pierwszy polski robot-influencer. Rolex, wąs, zasięgi.',how:'START'},
  dych:{n:'Dych Dziki',elId:'dzikosc',star:5,
    spd:95,batk:30,rng:26,atk:'melee',
    spcN:'DZIKA SZARŻA',spcCd:5,spcD:'taranuje wszystko na swojej drodze',
    hitTxt:['DZIKO!','ŁUBUDU!','BZZT!'],
    desc:'Drugi robot z YT. Na mieście kręci się, w głowie ma ogień.',how:'QUEST nad Polskim Morzem'},
  grazynka:{n:'Grażynka 3000',elId:'swojskosc',star:4,
    spd:80,batk:20,rng:27,atk:'melee',
    spcN:'GORĄCY ROSÓŁ',spcCd:18,spcD:'leczy całe HP i parzy wrogów parą',
    hitTxt:['CHOCHLĄ!','A ZUPKA?','SIO!'],
    desc:'Robotka-kucharka, streamuje obiady. Chochla pierwszej klasy.',how:'🎁 Paczki od Fanów'},
  jarek:{n:'Jarek Zegarek',elId:'czas',star:4,
    spd:82,batk:21,rng:23,atk:'melee',slow:3,
    spcN:'STOP-KLATKA',spcCd:14,spcD:'zatrzymuje czas — wrogowie zwalniają na 6 s',
    hitTxt:['TIK!','TAK!','PUNKTUALNIE!'],
    desc:'Jubiler od rolexa Edka. Czas działa dla niego.',how:'🎁 Paczki od Fanów'},
  zenek:{n:'Zenek Spawacz',elId:'spaw',star:4,
    spd:78,batk:23,rng:21,atk:'melee',burn:3,
    spcN:'PALNIK 3000°C',spcCd:10,spcD:'stożek ognia — podpala wrogów',
    hitTxt:['PSSST!','BZZZT!','SPAW!'],
    desc:'U niego każda blacha dostaje drugie życie.',how:'🎁 Paczki od Fanów'},
  julka:{n:'Julka z Tindera',elId:'serca',star:4,
    spd:88,batk:19,rng:80,atk:'proj',
    spcN:'ZAUROCZENIE',spcCd:16,spcD:'3 wrogów zakochuje się i walczy po Twojej stronie',
    hitTxt:['CMOK!','MATCH!'],
    desc:'Przyjaźń na zawsze. Serduszka lecą jak lajki.',how:'🎁 Paczki od Fanów'},
  bogdan:{n:'Rybak Bogdan',elId:'baltyk',star:4,
    spd:76,batk:26,rng:95,atk:'proj',
    spcN:'FALA BAŁTYCKA',spcCd:12,spcD:'fala zmiata i odrzuca wszystkich wrogów',
    hitTxt:['DORSZ!','PLASK!'],
    desc:'Rzuca dorszem celniej niż niejeden bramkarz.',how:'🎁 Paczki od Fanów'},
};
for(const c of Object.values(CHARS)){const e=ELEMENTS[c.elId];c.el=e.ic;c.elN=e.n;c.col=e.col;c.hitCol=e.col;}

/* --- BRONIE (ATK + substat) --- */
const WEAPONS={
  kij:{n:'Kij od Szczotki',star:1,atk:8,ic:'🧹',desc:'Klasyk polskich podwórek.'},
  parasol:{n:'Parasolka z Bazaru',star:2,atk:13,sub:{def:8},ic:'🌂',desc:'Chroni przed deszczem i hejtem.'},
  laga:{n:'Laga z Lasku Dycha',star:2,atk:16,sub:{hp:30},ic:'🪵',desc:'Dzik osobiście testował.'},
  chochla2:{n:'Chochla Babuni Pro',star:3,atk:20,sub:{hp:60},ic:'🥄',desc:'Miesza i wymierza sprawiedliwość.'},
  wedka:{n:'Wędka Bałtycka',star:3,atk:22,sub:{cd:25},ic:'🎣',desc:'Zarzucasz — hejter bierze.'},
  kettle:{n:'Kettlebell Seby',star:3,atk:26,sub:{def:12},ic:'🏋️',desc:'Zdobyty na MEGA DRESIE.'},
  palnik2:{n:'Palnik Turbo 3000',star:4,atk:30,sub:{cd:35},ic:'🔥',desc:'Zenek mówi: nie patrz w płomień.'},
  mikrofon:{n:'Złoty Mikrofon Żabsona',star:4,atk:28,sub:{atk:6},ic:'🎤',desc:'Każdy cios wchodzi z flow.'},
  ciupaga:{n:'Ciupaga Bacy',star:4,atk:32,sub:{cd:30},ic:'🪓',desc:'Góralska precyzja.'},
  hejnal:{n:'Trąbka Hejnalisty',star:4,atk:29,sub:{hp:80},ic:'🎺',desc:'Urwana w połowie... ciosu.'},
  rolexM:{n:'ROLEX BOJOWY',star:5,atk:40,sub:{cd:50},ic:'⌚',desc:'Z diamentami. Za filmik na TikToku.'},
  dorszM:{n:'Legendarny Dorsz-Miecz',star:5,atk:44,sub:{cd:40},ic:'🐟',desc:'Wykuty w smażalni, hartowany w Bałtyku.'},
  wasP:{n:'Wąs Przeznaczenia',star:5,atk:38,sub:{hp:120},ic:'〰️',desc:'Widać go z kosmosu. Czuć jego moc.'},
};
/* --- ARTEFAKTY: 3 sloty (0=TALIZMAN, 1=BIŻUTERIA, 2=GADŻET) --- */
const ART_SLOTS=['🧿 TALIZMAN','💍 BIŻUTERIA','🎽 GADŻET'];
const ARTS={
  bursztyn_t:{n:'Bursztyn z Plaży',slot:0,star:2,st:{hp:40},ic:'🟠'},
  podkowa:{n:'Podkowa na Szczęście',slot:0,star:3,st:{def:12},ic:'🧲'},
  obrazek:{n:'Obrazek z Lusterka Taksówki',slot:0,star:3,st:{hp:60,def:6},ic:'🖼️'},
  oscypekT:{n:'Oscypek Szczęścia',slot:0,star:4,st:{hp:90,atk:8},ic:'🧀'},
  kiel:{n:'Kieł Króla Dzików',slot:0,star:5,st:{atk:18,cd:20},ic:'🦷'},
  sygnet:{n:'Sygnet z Bazaru',slot:1,star:2,st:{atk:8},ic:'💍'},
  pierscionek:{n:'Pierścionek z Tindera',slot:1,star:3,st:{cd:25},ic:'💖'},
  lancuchG:{n:'Łańcuch Grubości Palca',slot:1,star:4,st:{atk:14,hp:30},ic:'⛓️'},
  kolczykK:{n:'Kolczyk Krakena',slot:1,star:5,st:{cd:45,atk:8},ic:'🌀'},
  skarpety:{n:'Skarpety i Sandały',slot:2,star:2,st:{def:10},ic:'🩴'},
  pasDP:{n:'Pas Mistrza Disco Polo',slot:2,star:3,st:{atk:12},ic:'🕺'},
  nerka:{n:'Nerka Prawdziwego Ziomala',slot:2,star:3,st:{hp:50,def:5},ic:'👝'},
  kapcie:{n:'Kapcie od Babci',slot:2,star:4,st:{hp:80,def:10},ic:'🥿'},
  luska:{n:'Łuska Smoka Wawelskiego',slot:2,star:5,st:{atk:16,def:14,cd:15},ic:'🐉'},
};
/* --- JEDZENIE I NAPOJE (polskie klasyki; heal = % maks. HP) --- */
const FOOD={
  picie:{n:'Picie Edwarda',ic:'🥤',heal:.4,desc:'Bezalkoholowe i orzeźwiające. Z Dino!'},
  kebab:{n:'Kebab z Dworca',ic:'🌯',heal:.5,desc:'Ostry-łagodny. Zawsze o 3 w nocy najlepszy.'},
  zapiekanka:{n:'Zapiekanka z Bazaru',ic:'🥖',heal:.35,desc:'Pół metra szczęścia z pieczarkami.'},
  pierogi:{n:'Pierogi Ruskie',ic:'🥟',heal:.6,desc:'Dwanaście sztuk. Ze skwarkami.'},
  rosol:{n:'Rosół Grażynki 3000',ic:'🍜',heal:1,desc:'Pełne odrodzenie. Jak u babci, tylko z turbiną.'},
  oscypek:{n:'Oscypek z Żurawiną',ic:'🧀',heal:.3,buff:{def:15,t:30},desc:'+15 DEF. Góralska tarcza.'},
  paczek:{n:'Pączek z Różą',ic:'🍩',heal:.25,desc:'W tłusty czwartek leczy podwójnie (nie leczy).'},
  ogorek:{n:'Ogórek Kiszony',ic:'🥒',heal:.15,buff:{atk:.15,t:30},desc:'+15% ATK. Moc kiszonki.'},
  smalec:{n:'Chleb ze Smalcem',ic:'🍞',heal:.4,buff:{def:25,t:30},desc:'+25 DEF. Pancerz ze skwarkami.'},
  oranzada:{n:'Oranżada w Proszku',ic:'🧃',heal:.1,buff:{spd:.25,t:20},desc:'+25% szybkości. Wprost do buzi!'},
  kompot:{n:'Kompot od Babci',ic:'🫖',heal:.8,desc:'Z rabarbaru. Działa lepiej niż niejedna apteka.'},
  kielbaska:{n:'Kiełbaska z Grilla',ic:'🌭',heal:.45,desc:'Drop z reakcji DZIK NA GRILLU.'},
  schabowy:{n:'Schabowy jak u Mamy',ic:'🍖',heal:.7,buff:{atk:.2,t:30},desc:'+20% ATK. Drop z reakcji SCHABOWY!'},
  obwarzanek:{n:'Obwarzanek Krakowski',ic:'🥨',heal:.3,desc:'Prosto spod Sukiennic.'},
  dorszsmaz:{n:'Dorsz ze Smażalni',ic:'🐟',heal:.55,desc:'Bogdan poleca. Świeży jak bryza.'},
};
/* --- SKLEPY (drzwi -> asortyment) --- */
const SHOPS={
  dino:{n:'🛒 DINO — PÓŁKA EDKA',items:[['food','picie',8],['food','zapiekanka',7],['food','paczek',5],['food','oranzada',4],['food','ogorek',6],['food','kebab',12]]},
  smazalnia:{n:'🐟 SMAŻALNIA U BOGDANA',items:[['food','dorszsmaz',14],['food','kompot',20],['weap','wedka',150]]},
  targ:{n:'🧺 TARG W CHODZIEŻY',items:[['food','pierogi',15],['food','smalec',9],['food','kielbaska',11],['food','kompot',20],['art','podkowa',90]]},
  gadzety:{n:'🎁 STRAGAN Z GADŻETAMI',items:[['art','sygnet',60],['art','nerka',80],['art','bursztyn_t',50],['weap','parasol',70]]},
  oscypki:{n:'🧀 OSCYPKI OD BACY',items:[['food','oscypek',10],['food','kompot',20],['art','oscypekT',200],['weap','ciupaga',260]]},
  obwarzanki:{n:'🥨 OBWARZANKI KRAKOWSKIE',items:[['food','obwarzanek',6],['food','paczek',5],['art','obrazek',110]]},
};

/* --- STATYSTYKI: HP / ATK / DEF / CRIT DMG (postać + broń + artefakty) --- */
const chData=id=>S.chars[id]||{lvl:1,st:0};
function gearOf(id){if(!S.gear[id])S.gear[id]={w:null,a:[null,null,null]};return S.gear[id];}
function gearStats(id){
  const g=gearOf(id);let hp=0,atk=0,def=0,cd=0;
  if(g.w&&WEAPONS[g.w]){const w=WEAPONS[g.w],s=w.sub||{};atk+=w.atk+(s.atk||0);hp+=s.hp||0;def+=s.def||0;cd+=s.cd||0;}
  for(const a of g.a)if(a&&ARTS[a]){const s=ARTS[a].st;hp+=s.hp||0;atk+=s.atk||0;def+=s.def||0;cd+=s.cd||0;}
  return{hp,atk,def,cd};
}
const chATK=id=>{const c=CHARS[id],d=chData(id);return Math.round(c.batk*(1+.22*(d.lvl-1))*(1+.08*d.st))+gearStats(id).atk;};
const chDmg=chATK;
const chHpMax=id=>{const d=chData(id);return 100+18*(d.lvl-1)+15*d.st+gearStats(id).hp;};
const chDEF=id=>8+gearStats(id).def;
const chCD=id=>150+gearStats(id).cd;   // CRIT DMG %
function equipGear(chId,slot,itemId){
  if(itemId)for(const oid of Object.keys(S.chars)){const g=gearOf(oid);
    if(g.w===itemId)g.w=null;
    for(let i=0;i<3;i++)if(g.a[i]===itemId)g.a[i]=null;}
  const g=gearOf(chId);
  if(slot==='w')g.w=itemId;else g.a[slot]=itemId;
  save();
}
function gearHolder(itemId){ // kto ma to założone?
  for(const oid of Object.keys(S.chars)){const g=gearOf(oid);
    if(g.w===itemId)return oid;
    if(g.a.includes(itemId))return oid;}
  return null;
}

/* --- HP DRUŻYNY: każdy członek ma własne życie --- */
let PHP={};
function initPartyHP(full){
  for(const id of S.party){
    const m=chHpMax(id);
    if(full||PHP[id]===undefined)PHP[id]=m;
    else PHP[id]=Math.min(PHP[id],m);
  }
}
function healParty(frac){for(const id of S.party)PHP[id]=Math.min(chHpMax(id),Math.max(0,(PHP[id]||0))+Math.round(chHpMax(id)*frac));}
function applyChar(){
  const c=CHARS[S.ch];
  P.speed=c.spd;
  initPartyHP(false);
}

/* --- BUFF z jedzenia --- */
let BUFF={atk:0,def:0,spd:0,t:0,n:''};
function eatFood(id){
  if(!S.food[id]){SFX.no();return;}
  const f=FOOD[id];
  S.food[id]--;if(!S.food[id])delete S.food[id];
  const m=chHpMax(S.ch),heal=Math.round(m*f.heal);
  PHP[S.ch]=Math.min(m,Math.max(0,PHP[S.ch]||0)+heal);
  if(f.buff)BUFF={atk:f.buff.atk||0,def:f.buff.def||0,spd:f.buff.spd||0,t:f.buff.t,n:f.n};
  save();refreshHUD();SFX.heal();
  addDmgNum(P.x,P.y-26,'+'+heal,'#7bc950',false);
  toast(f.ic+' '+f.n+': +'+heal+' HP'+(f.buff?'<br>BUFF na '+f.buff.t+' s!':''));
}
function quickEat(){
  const order=['picie','paczek','zapiekanka','obwarzanek','oscypek','ogorek','oranzada','kielbaska','smalec','kebab','dorszsmaz','pierogi','schabowy','kompot','rosol'];
  const id=order.find(k=>S.food[k])||Object.keys(S.food)[0];
  if(!id){toast('🎒 Plecak pusty! Kup jedzenie w Dino, byku.');SFX.no();return;}
  if(PHP[S.ch]>=chHpMax(S.ch)&&!FOOD[id].buff){toast('Pełne HP — szkoda dobrego jedzenia!');return;}
  eatFood(id);
}

/* głosy Dycha — prawdziwe klipy z YT */
const DYCH_CLIPS=['d_siemanko','d_mordeczko','d_wariacie','d_lecimy','d_chodz'];
const DYCH_LINES=[
  'No i DZIKO!','Dwa roboty to już gang, byku.','Wbijam na rejon, mordeczko!',
  'W głowie mam ogień!','Edek to brat. Ta sama fabryka, inny sznyt.',
  'Kto zaczepia Edka, ma do czynienia ze mną.','Dzięki za info wariacie!'];
function dychSay(){
  if(Math.random()<.6&&!curVoice&&BUFS[DYCH_CLIPS[0]]){vsay(pickA(DYCH_CLIPS));return;}
  toast('🦾 DYCH: '+pickA(DYCH_LINES),2800);
  beep(620,.06,'square',.04,900);setTimeout(()=>beep(920,.07,'square',.04,760),90);
}
/* okrzyki pozostałych postaci (toasty) */
const CH_LINES={
  grazynka:['Rosołek gotowy w 0,3 sekundy!','A zupka była, hejterze?!','Schabowy analizuję, przemoc serwuję.'],
  jarek:['Czas to pieniądz, a ja mam oba.','Tik-tak, hejterze.','Na moim zegarku zawsze pora na cios.'],
  zenek:['Każda blacha dostaje drugie życie!','Spawam bez ceregieli.','3000 stopni, byku.'],
  julka:['To będzie match!','Serduszka same lecą!','Robotów nie lubiłam... ludzie się zmieniają!'],
  bogdan:['Dorsz jak marzenie!','Bałtyk ze mną, człowieku.','Kolano strzyka, ale ręka celna!'],
};
function charSay(){
  if(S.ch==='dych'){dychSay();return;}
  if(S.ch==='edek'){if(!curVoice)vsay(pickA(['c_etam','v_spontan']));return;}
  const l=CH_LINES[S.ch];if(l)toast(CHARS[S.ch].el+' '+CHARS[S.ch].n.split(' ')[0].toUpperCase()+': '+pickA(l),2600);
}
/* drużyna: aktywna postać + reszta drepcze z tyłu */
function switchTo(id){
  if(!S.party.includes(id)||S.ch===id)return;
  S.ch=id;save();applyChar();
  worldFlash=.25;SFX.ok();refreshHUD();
  charSay();
  toast(CHARS[id].el+' GRASZ JAKO '+CHARS[id].n.toUpperCase()+' — super [Z]: '+CHARS[id].spcN);
}
function switchChar(){
  if(S.party.length<2){
    toast(S.chars.dych?'🎴 Dobierz drużynę w panelu POSTACIE!':'🔒 Dych Dziki czeka nad POLSKIM MORZEM (jedź PKS-em)!');
    return;
  }
  const i=S.party.indexOf(S.ch);
  switchTo(S.party[(i+1)%S.party.length]);
}
function addToParty(id){
  if(S.party.includes(id)||S.party.length>=3||!S.chars[id])return false;
  S.party.push(id);save();return true;
}

/* =====================================================================
   DOMENY — portale z falami wrogów i skrzynią z materiałami
   ===================================================================== */
const DOMAINS={
  piwnica:{r:'wawa',x:39,y:40,n:'PIWNICA HEJTERÓW',floor:2,foes:['hejter','zazdrosnik'],col:'#8a6fc8'},
  las:{r:'chodziez',x:42,y:10,n:'DZIKI LAS',floor:0,foes:['zazdrosnik','dres'],col:'#7bc950'},
  molo_d:{r:'morze',x:54,y:18,n:'ZATOPIONE MOLO',floor:8,foes:['dres','hejter'],col:'#6fd8e8'},
  jama:{r:'krakow',x:18,y:31,n:'SMOCZA JAMA',floor:2,foes:['hejter','dres'],col:'#c8384a'},
  grota:{r:'tatry',x:4,y:10,n:'LODOWA GROTA',floor:17,foes:['zazdrosnik','dres'],col:'#bfe8f4'},
};
let DOM={cur:null,wave:0,chest:null,prevReg:null,prevX:0,prevY:0,done:false};
function buildArena(){
  const fl=DOM.cur?DOMAINS[DOM.cur].floor:2;
  rect(0,0,MW-1,MH-1,fl);
  for(let x=0;x<MW;x++){set(x,0,4);set(x,MH-1,4);}
  for(let y=0;y<MH;y++){set(0,y,4);set(MW-1,y,4);}
  set(8,6,4);set(23,6,4);set(8,13,4);set(23,13,4);
}
REGIONS.arena={n:'DOMENA',w:32,h:20,build:buildArena,spawn:[16*16,16*16],pks:[2,2],
  cars:false,boars:false,leaves:false,smoke:false,boat:false,noLife:true,
  foesMax:0,foeTypes:['hejter'],zones:[[2,2,29,17]]};
function enterDomain(id){
  const cfg=DOMAINS[id],lvl=S.domLvl[id]||0;
  DOM={cur:id,wave:0,chest:null,prevReg:REG,prevX:P.x,prevY:P.y,done:false};
  REG='arena';MW=REGIONS.arena.w;MH=REGIONS.arena.h;
  M=new Uint8Array(MW*MH);buildArena();
  resetAmbient();foes=[];hitFX=[];PROJ=[];bossShots=[];dmgNums=[];foeT=1e9;
  P.x=REGIONS.arena.spawn[0];P.y=REGIONS.arena.spawn[1];resetFollowers();
  camX=Math.max(0,Math.min(MW*16-W,P.x-W/2));camY=Math.max(0,Math.min(MH*16-H,P.y-H/2));
  scene='world';hurtT=1.2;
  toast('🌀 '+cfg.n+' — POZIOM '+(lvl+1)+'<br>Przetrwaj 3 fale!',3200);
  SFX.ok();
  stopVoice();                       // radio/monolog nie wchodzi do domeny
  initAudio().then(startBattleMusic); // specjalna muzyka bitewna (ściszona)
  setTimeout(()=>{if(REG==='arena')domNextWave();},900);
}
function domNextWave(){
  if(!DOM.cur)return;
  DOM.wave++;
  const cfg=DOMAINS[DOM.cur],lvl=S.domLvl[DOM.cur]||0;
  const hpMul=1+.35*lvl,atkAdd=Math.round(lvl*1.6);
  const mkFoe=(t,x,y)=>{const td=FOE_TYPES[t];
    const h=Math.round(td.hp*hpMul)+(DOM.wave-1)*8;
    return{t,x,y,hp:h,hp0:h,atk:td.atk+atkAdd,dx:0,dy:0,wt:.4,stun:0,kb:0,kbx:0,kby:0,flash:0};};
  if(DOM.wave===3){
    const td=FOE_TYPES.straznik;
    const gh=Math.round(td.hp*(1+.45*lvl));
    foes.push({t:'straznik',guard:true,gatk:Math.round(td.atk*.7)+atkAdd,
      x:16*16,y:6*16,hp:gh,hp0:gh,atk:td.atk+atkAdd,
      dx:0,dy:0,wt:.4,stun:0,kb:0,kbx:0,kby:0,flash:0});
    const nEsk=2+Math.min(2,lvl);
    for(let i=0;i<nEsk;i++){
      const ang=(i/nEsk)*6.28;
      foes.push(mkFoe(pickA(cfg.foes),16*16+Math.cos(ang)*80,8*16+Math.sin(ang)*55));
    }
    toast('⚠️ FALA 3/3: STRAŻNIK DOMENY!<br>Uważaj na salwy!',3400);
    SFX.no();
    return;
  }
  const n=3+DOM.wave+Math.min(3,lvl);
  for(let i=0;i<n;i++){
    const t=pickA(cfg.foes);
    const ang=(i/n)*6.28+Math.random();
    foes.push(mkFoe(t,16*16+Math.cos(ang)*105,9*16+Math.sin(ang)*70));
  }
  toast('🌀 FALA '+DOM.wave+'/3 — '+n+' przeciwników!');
  SFX.no();
}
function domUpdate(){
  if(REG!=='arena'||!DOM.cur||DOM.done)return;
  if(DOM.wave>0&&!foes.length){
    if(DOM.wave<3)domNextWave();
    else{
      DOM.done=true;
      DOM.chest={x:16*16,y:9*16,open:false};
      toast('🏆 DOMENA UKOŃCZONA!<br>Odbierz skrzynię!',3200);
      SFX.buy();burstConfetti();
      if(!curVoice)vsay('v_elegancko');
    }
  }
}
function domOpenChest(){
  if(!DOM.chest||DOM.chest.open)return;
  DOM.chest.open=true;
  const id=DOM.cur,lvl=S.domLvl[id]||0;
  const sr=10+lvl*4,ch=3+lvl*2,di=lvl>=1?1:0,dd=20+lvl*8;
  S.mats.sr+=sr;S.mats.ch+=ch;S.mats.di+=di;S.dia+=dd;
  /* artefakt z domeny (im wyższy poziom, tym lepsze gwiazdki) */
  let artTxt='';
  const maxStar=2+Math.min(3,lvl);
  const pool=Object.keys(ARTS).filter(k=>!S.gearOwn[k]&&ARTS[k].star<=maxStar);
  if(pool.length&&Math.random()<.8){
    const aid=pickA(pool);S.gearOwn[aid]=1;
    artTxt='<br>'+ARTS[aid].ic+' ARTEFAKT: '+ARTS[aid].n+' ('+'★'.repeat(ARTS[aid].star)+')';
  }
  S.domLvl[id]=lvl+1;save();refreshHUD();
  worldFlash=.5;burstConfetti();SFX.buy();
  toast('🎁 SKRZYNIA: +'+sr+'🔩 +'+ch+'⚙️'+(di?' +'+di+'💠':'')+' +'+dd+'💎'+artTxt+'<br>Domena wbija na poziom '+(lvl+2)+'!',5000);
  addViews(6000+lvl*3000,true);
  if(Math.random()<.4)setTimeout(()=>postFilm('CZYSZCZĘ DOMENĘ: '+DOMAINS[id].n,18000),1500);
}
function exitDomain(){
  stopBattleMusic();
  const backReg=DOM.prevReg||'wawa',bx=DOM.prevX,by=DOM.prevY;
  DOM={cur:null,wave:0,chest:null,prevReg:null,prevX:0,prevY:0,done:false};
  setRegion(backReg);
  P.x=bx;P.y=by;resetFollowers();
  camX=Math.max(0,Math.min(MW*16-W,P.x-W/2));camY=Math.max(0,Math.min(MH*16-H,P.y-H/2));
  hurtT=1;
  toast('🚪 Wyjście z domeny. No i elegancko.');
}

/* =====================================================================
   BOSSOWIE REGIONALNI
   ===================================================================== */
const BOSSES={
  krol:{r:'wawa',x:8,y:6,t:'krol',n:'KRÓL DZIKÓW',batk:'charge',
    film:'WALCZĘ Z KRÓLEM DZIKÓW! (prawie mnie stratował)',
    intro:[['Edek','Te dziki mają swojego króla?! Miasto to nie chlew, byku!','c_problemy'],
           ['KRÓL DZIKÓW','CHRUM CHRUM!!! TO MÓJ PARK, BLASZAKU!'],
           ['Edek','Uciekajcie stąd, dziki! Zbierajcie się, no już!','c_uciekajcie']]},
  seba:{r:'chodziez',x:41,y:20,t:'mdres',n:'MEGA DRES SEBASTIAN OSTATECZNY',batk:'kettle',
    film:'MEGA DRES CHCIAŁ MI ZABRAĆ ROLEXA (poszło z kopyta)',
    intro:[['Sebastian Ostateczny','Patrzcie, robot-celebryta. Oddawaj rolexa i kanał, blaszko!'],
           ['Edek','Jestem Warchockim Edwardem, byku. Rolex zostaje na lewej.','c_rolexlewa'],
           ['Sebastian Ostateczny','TO TERAZ ZOBACZYSZ KETTLE Z CHODZIEŻY!']]},
  kraken:{r:'morze',x:32,y:12,t:'kraken',n:'KRAKEN BAŁTYCKI',batk:'bryzg',
    film:'KRAKEN W BAŁTYKU?! (nagrałem wszystko)',
    intro:[['Rybak Bogdan','Panie Edward! COŚ wyszło z morza i kradnie bursztyny!'],
           ['KRAKEN BAŁTYCKI','BLUB BLUB... WYŚWIETLENIA... ODDAĆ... MOJE...'],
           ['Edek','Zobaczcie, co mi los przyniesie. Macki kontra rolex!','v_los']]},
  smok:{r:'krakow',x:19,y:31,t:'smok',n:'SMOK WAWELSKI',batk:'ogien',
    film:'OBUDZIŁEM SMOKA WAWELSKIEGO (Kraków ewakuowany?!)',
    intro:[['Przekupka','Panie Edwardzie! Smok się obudził i żąda... wyświetleń!'],
           ['SMOK WAWELSKI','TYSIĄC LAT SPAŁEM. A TERAZ JAKIŚ BLASZAK MA WIĘCEJ FANÓW ODE MNIE?!'],
           ['Edek','Człowieku, ja mam rolexa z diamentami. A ty? Ogień z paszczy. Wyrównajmy rachunki.','c_rolextiktok']]},
  yeti:{r:'tatry',x:14,y:7,t:'yeti',n:'YETI Z GIEWONTU',batk:'snieg',
    film:'YETI ISTNIEJE!!! (nagranie z Giewontu, nie klikbajt)',
    intro:[['Baca','Edek, cosik po graniach chodzi i porywa oscypki! Jak nic — YETI!'],
           ['YETI','GRRR! MOJE GÓRY! MOJA CISZA! ZABIERAJ TE KAMERY!'],
           ['Edek','Panie Yeti, jedno selfie i rozejdziemy się w pokoju. Albo i nie.','c_kamera']]},
};
let bossCdT={};
const bossOnMap=id=>foes.some(f=>f.bid===id);
function startBoss(id){
  const b=BOSSES[id];
  say(b.intro.map(([who,t,v])=>({who,t,v})),()=>{
    const lvl=S.bossLvl[id]||0,td=FOE_TYPES[b.t];
    const maxHp=Math.round(td.hp*(1+.5*lvl));
    foes.push({t:b.t,boss:true,bid:id,bn:b.n,batk:b.batk,
      x:b.x*16+8,y:b.y*16+8,homeX:b.x*16+8,homeY:b.y*16+8,
      hp:maxHp,maxHp,hp0:maxHp,atk:Math.round(td.atk*(1+.15*lvl)),
      dx:0,dy:0,wt:0,stun:0,kb:0,kbx:0,kby:0,flash:0,at:2});
    toast('⚔️ BOSS: '+b.n+(lvl?' — POZIOM '+(lvl+1):'')+'!',3000);
    SFX.no();
  });
}
const BOSS_DROP={krol:['art','kiel'],mdres:['weap','kettle'],kraken:['art','kolczykK'],
  smok:['art','luska'],yeti:['weap','ciupaga']};
function bossDefeated(f){
  const id=f.bid,lvl=S.bossLvl[id]||0;
  const di=1+(lvl>=2?1:0),ch=6+lvl*2,dd=60+lvl*25;
  S.mats.di+=di;S.mats.ch+=ch;S.dia+=dd;S.bossLvl[id]=lvl+1;
  const drop=BOSS_DROP[id];
  if(drop&&!S.gearOwn[drop[1]]){
    S.gearOwn[drop[1]]=1;
    const it=drop[0]==='weap'?WEAPONS[drop[1]]:ARTS[drop[1]];
    setTimeout(()=>toast('🏆 ŁUP Z BOSSA: '+it.ic+' '+it.n+' ('+'★'.repeat(it.star)+')!<br>Załóż w panelu postaci 🎴',4600),4400);
  }
  save();refreshHUD();
  bossShots=[];bossCdT[id]=90;
  worldFlash=.8;burstConfetti();burstConfetti();SFX.buy();
  addHit(f.x,f.y-20,'BOSS DOWN!','#f5c542');
  toast('👑 POKONANY: '+f.bn+'!<br>+'+di+'💠 +'+ch+'⚙️ +'+dd+'💎',4200);
  addViews(30000+lvl*15000,false);
  setTimeout(()=>postFilm(BOSSES[id].film,80000),1600);
  vsay('v_elegancko');
}

/* =====================================================================
   GACHA: PACZKI OD FANÓW + ULEPSZANIE POSTACI
   ===================================================================== */
const GACHA_POOL=['grazynka','jarek','zenek','julka','bogdan'];
const PULL_COST=40,PULL10_COST=360,PITY_AT=10;
function rollOne(){
  S.pity++;
  const isChar=S.pity>=PITY_AT||Math.random()<.15;
  if(isChar){
    S.pity=0;
    const id=pickA(GACHA_POOL);
    if(!S.chars[id]){
      S.chars[id]={lvl:1,st:0};
      if(S.party.length<3)S.party.push(id);
      return{t:'char',id,nw:true};
    }
    const d=S.chars[id];
    if(d.st<5)d.st++;
    S.mats.ch+=5;
    return{t:'char',id,dup:true};
  }
  const r=Math.random();
  if(r<.22){ // sprzęt: broń albo artefakt
    const bossOnly=['kiel','kettle','kolczykK','luska','ciupaga'];
    const g5=['rolexM','wasP','dorszM'].filter(k=>!S.gearOwn[k]);
    const pool=Object.keys(WEAPONS).concat(Object.keys(ARTS))
      .filter(k=>!S.gearOwn[k]&&!bossOnly.includes(k)&&!g5.includes(k));
    let gid=null;
    if(g5.length&&Math.random()<.08)gid=pickA(g5);
    else if(pool.length)gid=pickA(pool);
    else if(g5.length)gid=pickA(g5);
    if(gid){S.gearOwn[gid]=1;return{t:'gear',id:gid};}
    S.mats.ch+=4;return{t:'ch',n:4};
  }
  if(r<.55){const n=5+((Math.random()*8)|0);S.mats.sr+=n;return{t:'sr',n};}
  if(r<.82){const n=2+((Math.random()*4)|0);S.mats.ch+=n;return{t:'ch',n};}
  if(r<.9){S.mats.di+=1;return{t:'di',n:1};}
  const n=8+((Math.random()*13)|0);S.dia+=n;return{t:'dia',n};
}
function doPull(n){
  const cost=n===10?PULL10_COST:PULL_COST;
  if(S.dia<cost){SFX.no();toast('Za mało diamentów! Rób questy i domeny, byku 💎');return;}
  S.dia-=cost;
  const res=[];for(let i=0;i<n;i++)res.push(rollOne());
  save();refreshHUD();
  if(res.some(r=>r.t==='char'&&r.nw)){burstConfetti();vsay('c_elegancko2');SFX.buy();}
  else SFX.gacha();
  renderGacha(res);
}
function gresHtml(r,i){
  const d='style="animation-delay:'+(i*.12)+'s"';
  if(r.t==='char'){
    const c=CHARS[r.id];
    if(r.nw)return'<div class="gres char" '+d+'><span class="gbig">'+c.el+'</span>⭐ NOWA POSTAĆ!<br><b>'+c.n+'</b></div>';
    return'<div class="gres dup" '+d+'><span class="gbig">'+c.el+'</span>'+c.n+'<br>+1 GWIAZDKA ✨ (+5⚙️)</div>';
  }
  if(r.t==='gear'){
    const it=WEAPONS[r.id]||ARTS[r.id];
    const kind=WEAPONS[r.id]?'🗡 BROŃ':ART_SLOTS[ARTS[r.id].slot];
    const cls=it.star>=5?'char':'dup';
    return'<div class="gres '+cls+'" '+d+'><span class="gbig">'+it.ic+'</span>'+kind+' '+'★'.repeat(it.star)+'<br><b>'+it.n+'</b></div>';
  }
  const map={sr:['🔩','śrubki'],ch:['⚙️','mikroczipy'],di:['💠','Diament do Rolexa'],dia:['💎','diamenty']};
  const[ic,nm]=map[r.t];
  return'<div class="gres" '+d+'><span class="gbig">'+ic+'</span>+'+r.n+' '+nm+'</div>';
}
function renderGacha(res){
  $('gachaDia').textContent='💎 '+S.dia;
  const owned=GACHA_POOL.filter(id=>S.chars[id]).length;
  let html='<p style="font-size:11px;line-height:1.9;margin:6px 0">Fani wysyłają Edkowi paczki!<br>W środku: <b style="color:var(--gold)">nowe postacie</b> ('+owned+'/'+GACHA_POOL.length+'), 🗡 <b style="color:var(--gold)">bronie i artefakty</b>, 🔩⚙️💠 materiały.</p>'+
    '<p class="pity">GWARANTOWANA POSTAĆ za '+(PITY_AT-S.pity)+' paczek! (duplikat = +1 gwiazdka ✨)</p>'+
    '<div class="btnrow">'+
    '<button class="bigbtn px" style="font-size:12px" id="pull1">🎁 OTWÓRZ 1 (40💎)</button>'+
    '<button class="bigbtn px" style="font-size:12px" id="pull10">🎁 OTWÓRZ 10 (360💎)</button></div>'+
    '<div id="gachaRes">'+(res?res.map(gresHtml).join(''):'')+'</div>';
  $('gachaBody').innerHTML=html;
  $('pull1').addEventListener('click',()=>{initAudio();doPull(1);});
  $('pull10').addEventListener('click',()=>{initAudio();doPull(10);});
}
function openGacha(){SFX.open();renderGacha(null);$('gacha').classList.remove('hidden');}

/* --- panel postaci: drużyna + ulepszanie --- */
const lvlCost=lvl=>({sr:6*lvl,ch:lvl>=3?(lvl-2)*3:0,di:lvl>=6?1:0});
const MAXLVL=10;
function costTxt(c){let t=c.sr+'🔩';if(c.ch)t+=' '+c.ch+'⚙️';if(c.di)t+=' '+c.di+'💠';return t;}
function canAfford(c){return S.mats.sr>=c.sr&&S.mats.ch>=c.ch&&S.mats.di>=c.di;}
function tryLvlUp(id){
  const d=S.chars[id];if(!d||d.lvl>=MAXLVL)return;
  const c=lvlCost(d.lvl);
  if(!canAfford(c)){SFX.no();toast('Brakuje materiałów! Wbijaj do domen i na bossów 🔩⚙️💠');return;}
  S.mats.sr-=c.sr;S.mats.ch-=c.ch;S.mats.di-=c.di;
  d.lvl++;save();SFX.lvl();burstConfetti();
  if(id===S.ch)applyChar();
  PHP[id]=chHpMax(id);
  toast('⬆️ '+CHARS[id].n+' — POZIOM '+d.lvl+'!<br>Mocniejsze ciosy, więcej ♥');
  renderChars();
}
function togglePartyChar(id){
  if(!S.chars[id])return;
  if(S.party.includes(id)){
    if(S.party.length<=1){toast('Ktoś musi zostać na froncie, byku!');return;}
    S.party=S.party.filter(p=>p!==id);
    if(S.ch===id){S.ch=S.party[0];applyChar();}
  }else{
    if(S.party.length>=3){toast('Drużyna pełna (max 3)! Zdejmij kogoś.');return;}
    S.party.push(id);
  }
  save();refreshHUD();renderChars();SFX.ok();
}
function renderChars(){
  $('charsDia').textContent='💎 '+S.dia;
  $('matBar').innerHTML='🔩 śrubki: <b>'+S.mats.sr+'</b> · ⚙️ mikroczipy: <b>'+S.mats.ch+'</b> · 💠 Diament do Rolexa: <b>'+S.mats.di+'</b>'+
    ' · <span style="color:var(--mut)">materiały: hejterzy, 🌀 domeny, ⚔️ bossowie</span>';
  const g=$('charGrid');g.innerHTML='';
  for(const[id,c]of Object.entries(CHARS)){
    const owned=!!S.chars[id],d=chData(id),inP=S.party.includes(id);
    const el=document.createElement('div');
    el.className='chc'+(inP?' inparty':'')+(owned?'':' locked');
    const cv2=document.createElement('canvas');cv2.width=32;cv2.height=40;
    const c2=cv2.getContext('2d');c2.imageSmoothingEnabled=false;
    c2.save();c2.translate(8,7);drawCharBody(c2,id,0,0,0,0);c2.restore();
    if(!owned){c2.globalCompositeOperation='source-atop';c2.fillStyle='rgba(20,17,39,.88)';c2.fillRect(0,0,32,40);}
    el.appendChild(cv2);
    const stars='★'.repeat(c.star)+(d.st?' <span style="color:var(--cyan)">'+'✦'.repeat(d.st)+'</span>':'');
    el.insertAdjacentHTML('beforeend','<span class="nm">'+(owned?c.n:'???')+'</span>'+
      '<span class="el">'+c.el+' '+c.elN+'</span>'+
      '<span class="st">'+stars+'</span>');
    if(owned){
      el.insertAdjacentHTML('beforeend','<span class="stat">POZ. '+d.lvl+' · ♥'+chHpMax(id)+' 👊'+chATK(id)+'<br>🛡'+chDEF(id)+' 💥'+chCD(id)+'% · [Z] '+c.spcN+'</span>');
      const bE=document.createElement('button');
      bE.className='chbtn';bE.textContent='⚔️ EKWIPUNEK';
      bE.addEventListener('click',()=>openHero(id));
      el.appendChild(bE);
      const bP=document.createElement('button');
      bP.className='chbtn'+(inP?' on':'');
      bP.textContent=inP?(S.ch===id?'✔ AKTYWNA':'✔ W DRUŻYNIE'):'DO DRUŻYNY';
      bP.addEventListener('click',()=>togglePartyChar(id));
      el.appendChild(bP);
      const bL=document.createElement('button');
      bL.className='chbtn';
      if(d.lvl>=MAXLVL){bL.textContent='MAX POZIOM';bL.disabled=true;}
      else{const cc=lvlCost(d.lvl);bL.textContent='⬆️ ULEPSZ: '+costTxt(cc);bL.disabled=!canAfford(cc);}
      bL.addEventListener('click',()=>tryLvlUp(id));
      el.appendChild(bL);
    }else{
      el.insertAdjacentHTML('beforeend','<span class="stat">'+c.desc+'</span>'+
        '<span class="st" style="color:var(--cyan)">'+c.how+'</span>');
    }
    g.appendChild(el);
  }
}
function openChars(){SFX.open();renderChars();$('chars').classList.remove('hidden');}

/* ---------------- SKLEPY ---------------- */
let curShop=null;
function shopItemInfo(kind,id){
  if(kind==='food')return{ic:FOOD[id].ic,n:FOOD[id].n,d:FOOD[id].desc,owned:false};
  if(kind==='weap')return{ic:WEAPONS[id].ic,n:WEAPONS[id].n+' ('+'★'.repeat(WEAPONS[id].star)+')',d:'ATK +'+WEAPONS[id].atk,owned:!!S.gearOwn[id]};
  return{ic:ARTS[id].ic,n:ARTS[id].n+' ('+'★'.repeat(ARTS[id].star)+')',d:statTxt(ARTS[id].st),owned:!!S.gearOwn[id]};
}
function statTxt(st){const p=[];if(st.hp)p.push('HP +'+st.hp);if(st.atk)p.push('ATK +'+st.atk);
  if(st.def)p.push('DEF +'+st.def);if(st.cd)p.push('CRIT DMG +'+st.cd+'%');return p.join(' · ');}
function renderShop(){
  const sh=SHOPS[curShop];if(!sh)return;
  $('shopTitle').textContent=sh.n;
  $('shopDia').textContent='💎 '+S.dia;
  const el=$('shopBody');el.innerHTML='';
  for(const[kind,id,price]of sh.items){
    const inf=shopItemInfo(kind,id);
    const cnt=kind==='food'?(S.food[id]||0):0;
    const row=document.createElement('div');row.className='shopRow';
    row.innerHTML='<span class="ic">'+inf.ic+'</span>'+
      '<span class="inf"><b>'+inf.n+'</b>'+(cnt?' <i>(masz: '+cnt+')</i>':'')+'<br><i>'+inf.d+'</i></span>';
    const b=document.createElement('button');b.className='chbtn';b.style.width='auto';
    if(inf.owned){b.textContent='✔ MASZ';b.disabled=true;}
    else{b.textContent='KUP 💎'+price;b.disabled=S.dia<price;}
    b.addEventListener('click',()=>{
      if(S.dia<price)return;
      S.dia-=price;
      if(kind==='food')S.food[id]=(S.food[id]||0)+1;
      else S.gearOwn[id]=1;
      save();refreshHUD();SFX.buy();
      toast(inf.ic+' Kupione: '+inf.n+'!');
      renderShop();
    });
    row.appendChild(b);el.appendChild(row);
  }
  el.insertAdjacentHTML('beforeend','<p style="font-size:10px;color:var(--mut);line-height:1.8">Jedzenie leczy aktywną postać (Q = szybka przekąska). Sprzęt zakładasz w panelu postaci 🎴 → EKWIPUNEK.</p>');
}
function openShop(id){SFX.open();curShop=id;renderShop();$('shop').classList.remove('hidden');}

/* ---------------- PLECAK ---------------- */
function renderBag(){
  $('bagDia').textContent='💎 '+S.dia;
  const el=$('bagBody');let html='';
  html+='<h3 style="font-size:11px;color:var(--gold);margin:4px 0 8px">🍴 JEDZENIE (Q = zjedz szybko)</h3>';
  const foods=Object.keys(S.food);
  if(!foods.length)html+='<p style="font-size:10px;color:var(--mut)">Pusto! Jedzenie kupisz w Dino, na targu, w smażalni...</p>';
  el.innerHTML=html;
  for(const id of foods){
    const f=FOOD[id];
    const row=document.createElement('div');row.className='shopRow';
    row.innerHTML='<span class="ic">'+f.ic+'</span>'+
      '<span class="inf"><b>'+f.n+' ×'+S.food[id]+'</b><br><i>leczy '+Math.round(f.heal*100)+'% HP'+(f.buff?' + buff '+f.buff.t+'s':'')+' · '+f.desc+'</i></span>';
    const b=document.createElement('button');b.className='chbtn';b.style.width='auto';b.textContent='ZJEDZ';
    b.addEventListener('click',()=>{eatFood(id);renderBag();});
    row.appendChild(b);el.appendChild(row);
  }
  let gearHtml='<h3 style="font-size:11px;color:var(--gold);margin:12px 0 8px">⚔️ SPRZĘT (zakładanie: 🎴 → EKWIPUNEK)</h3>';
  const gw=Object.keys(S.gearOwn).filter(id=>WEAPONS[id]),ga=Object.keys(S.gearOwn).filter(id=>ARTS[id]);
  if(!gw.length&&!ga.length)gearHtml+='<p style="font-size:10px;color:var(--mut)">Brak sprzętu. Szukaj w 🎁 paczkach, 🌀 domenach i na ⚔️ bossach!</p>';
  for(const id of gw){const w=WEAPONS[id],h=gearHolder(id);
    gearHtml+='<div class="shopRow"><span class="ic">'+w.ic+'</span><span class="inf"><b>'+w.n+' ('+'★'.repeat(w.star)+')</b><br><i>ATK +'+w.atk+(w.sub?' · '+statTxt(w.sub):'')+(h?' · nosi: '+CHARS[h].n:'')+'</i></span></div>';}
  for(const id of ga){const a2=ARTS[id],h=gearHolder(id);
    gearHtml+='<div class="shopRow"><span class="ic">'+a2.ic+'</span><span class="inf"><b>'+a2.n+' ('+'★'.repeat(a2.star)+') · '+ART_SLOTS[a2.slot]+'</b><br><i>'+statTxt(a2.st)+(h?' · nosi: '+CHARS[h].n:'')+'</i></span></div>';}
  el.insertAdjacentHTML('beforeend',gearHtml);
}
function openBag(){SFX.open();renderBag();$('bag').classList.remove('hidden');}

/* ---------------- PANEL BOHATERA: statystyki + ekwipunek ---------------- */
let curHero=null;
function renderHero(){
  const id=curHero;if(!id||!S.chars[id])return;
  const c=CHARS[id],d=chData(id),g=gearOf(id);
  $('heroTitle').textContent=c.el+' '+c.n+' — POZ. '+d.lvl+(d.st?' '+'✦'.repeat(d.st):'');
  const el=$('heroBody');
  let html='<canvas id="heroCv" width="40" height="46" style="width:160px;height:184px;image-rendering:pixelated"></canvas>';
  html+='<p style="font-size:10px;color:var(--cyan);margin:4px 0">'+c.el+' '+c.elN+' · '+c.desc+'</p>';
  html+='<div class="heroStats">'+
    '<div>♥ HP<br><b>'+chHpMax(id)+'</b></div>'+
    '<div>👊 ATK<br><b>'+chATK(id)+'</b></div>'+
    '<div>🛡 DEF<br><b>'+chDEF(id)+'</b></div>'+
    '<div>💥 CRIT DMG<br><b>'+chCD(id)+'%</b></div></div>';
  html+='<p style="font-size:10px;margin:2px 0 10px;color:var(--mut)">[Z] '+c.spcN+' — '+c.spcD+'</p>';
  const wOpts=Object.keys(S.gearOwn).filter(k=>WEAPONS[k]);
  html+='<div class="selRow"><label>🗡 BROŃ</label><select data-slot="w"><option value="">— gołe pięści —</option>'+
    wOpts.map(k=>{const h=gearHolder(k);
      return '<option value="'+k+'"'+(g.w===k?' selected':'')+'>'+WEAPONS[k].ic+' '+WEAPONS[k].n+' (ATK+'+WEAPONS[k].atk+')'+(h&&h!==id?' [u: '+CHARS[h].n.split(' ')[0]+']':'')+'</option>';}).join('')+'</select></div>';
  for(let s=0;s<3;s++){
    const opts=Object.keys(S.gearOwn).filter(k=>ARTS[k]&&ARTS[k].slot===s);
    html+='<div class="selRow"><label>'+ART_SLOTS[s]+'</label><select data-slot="'+s+'"><option value="">— pusto —</option>'+
      opts.map(k=>{const h=gearHolder(k);
        return '<option value="'+k+'"'+(g.a[s]===k?' selected':'')+'>'+ARTS[k].ic+' '+ARTS[k].n+' ('+statTxt(ARTS[k].st)+')'+(h&&h!==id?' [u: '+CHARS[h].n.split(' ')[0]+']':'')+'</option>';}).join('')+'</select></div>';
  }
  if(d.lvl<MAXLVL){const cc=lvlCost(d.lvl);
    html+='<button class="bigbtn px" id="heroLvl" style="font-size:11px;margin-top:6px"'+(canAfford(cc)?'':' disabled')+'>⬆️ ULEPSZ NA POZ. '+(d.lvl+1)+' — '+costTxt(cc)+'</button>';}
  else html+='<p style="font-size:11px;color:var(--gold)">✨ MAKSYMALNY POZIOM</p>';
  el.innerHTML=html;
  const hc=document.getElementById('heroCv').getContext('2d');
  hc.imageSmoothingEnabled=false;hc.save();hc.translate(12,10);drawCharBody(hc,id,0,0,0,Math.floor(anim*2)%2);hc.restore();
  el.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',()=>{
    const slot=sel.dataset.slot;
    equipGear(id,slot==='w'?'w':+slot,sel.value||null);
    SFX.equip();renderHero();refreshHUD();
  }));
  const lb=document.getElementById('heroLvl');
  if(lb)lb.addEventListener('click',()=>{tryLvlUp(id);renderHero();});
}
function openHero(id){SFX.open();curHero=id;renderHero();$('hero').classList.remove('hidden');}

/* ---------------- KANAŁ EDKA: zasięgi ---------------- */
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' mln':n>=1e4?Math.round(n/1e3)+' tys.':(''+Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const MILESTONES=[
  {s:1000,txt:'1000 subów! +100💎',give:()=>{S.dia+=100;}},
  {s:10000,txt:'10 TYS. subów! RING LIGHT wpada do szafy!',give:()=>{if(!S.owned.includes('ring_light'))S.owned.push('ring_light');}},
  {s:100000,txt:'100 TYS.! ZŁOTY PRZYCISK na szyję!',give:()=>{if(!S.owned.includes('zloty_play'))S.owned.push('zloty_play');}},
  {s:1000000,txt:'MILION SUBSKRYPCJI! EDEK TO LEGENDA!',give:()=>{S.dia+=500;}},
];
function addViews(v,quiet){
  S.views+=v;
  const ns=Math.round(v/60*(0.8+Math.random()*.5));
  S.subs+=ns;
  for(const m of MILESTONES){
    if(S.subs>=m.s&&!S.mile[m.s]){
      S.mile[m.s]=1;m.give();burstConfetti();SFX.buy();
      toast('🏆 '+m.txt);
      if(!curVoice)vsay(m.s>=100000?'c_rolextiktok':'c_elegancko2');
    }
  }
  save();refreshHUD();
  return ns;
}
const FILM_ADJ=['SZOK!','VIRAL','MEGA','HIT','NO I ELEGANCKO','BYKU!'];
function postFilm(title,base){
  const viral=Math.random()<.14;
  let v=Math.round(base*(0.75+Math.random()*.6));
  if(viral)v*=8;
  addViews(v,true);
  S.films.unshift({t:title,v,viral});
  if(S.films.length>10)S.films.length=10;
  save();
  toast('🎬 FILMIK: „'+title+'”<br>'+(viral?'🔥 VIRAL!!! ':'')+'▶ '+fmtN(v)+' wyświetleń',3200);
}
function randTile(pred){
  for(let i=0;i<40;i++){const tx=2+(Math.random()*(MW-4))|0,ty=2+(Math.random()*(MH-4))|0;
    if(pred(at(tx,ty)))return[tx*16+8,ty*16+8];}
  return null;
}
function mkCar(){
  const h=Math.random()<.6,col=['#c8384a','#4a6a9a','#c9c4dd','#f5c542','#4a7a4a'][(Math.random()*5)|0];
  if(h){const east=Math.random()<.5;
    return{h:true,x:Math.random()*MW*16,y:(east?20:21)*16+2,v:(east?1:-1)*(50+Math.random()*28),c:col};}
  const south=Math.random()<.5;
  return{h:false,x:(south?27:28)*16+3,y:Math.random()*MH*16,v:(south?1:-1)*(50+Math.random()*28),c:col};
}
function resetAmbient(){
  const cfg=REGIONS[REG];
  if(cfg.noLife){boars=[];cars=[];peds=[];pigeons=[];drops=[];leaves=[];smoke=[];selfie=null;selfieT=999;dropT=999;return;}
  boars=[];if(cfg.boars)for(let i=0;i<6;i++)boars.push({x:(4+Math.random()*18)*16,y:(4+Math.random()*13)*16,
    dx:0,dy:0,t:Math.random()*2});
  cars=[];if(cfg.cars)for(let i=0;i<5;i++)cars.push(mkCar());
  peds=[];for(let i=0;i<6;i++){const p=randTile(v=>v===1||v===8);
    if(p)peds.push({x:p[0],y:p[1],dx:0,dy:0,t:0,c:['#4a5a8a','#6a4a6a','#4a6a5a','#8a5a4a'][i%4],hair:['#3a2a1a','#888','#222','#c8a858'][i%4]});}
  pigeons=[];for(let i=0;i<7;i++){const p=randTile(v=>v===0||v===1||v===8);
    if(p)pigeons.push({x:p[0],y:p[1],st:0,vx:0,vy:0,t:0});}
  drops=[];leaves=[];smoke=[];selfie=null;selfieT=45;dropT=10;
}
resetAmbient();

/* ---------------- PAUZA (klawisz P) ---------------- */
let paused=false;
function togglePause(){
  if(scene==='title')return;
  paused=!paused;
  if(AC){try{if(paused)AC.suspend();else AC.resume();}catch(e){}}
  if(!paused)last=performance.now(); // bez skoku dt po wznowieniu
}
function drawPauseOverlay(){
  cx.fillStyle='rgba(14,12,28,.72)';cx.fillRect(0,0,W,H);
  cx.textAlign='center';
  cx.font='18px "Press Start 2P"';
  cx.fillStyle='#000';cx.fillText('⏸ PAUZA',W/2+2,H/2-6);
  cx.fillStyle='#f5c542';cx.fillText('⏸ PAUZA',W/2,H/2-8);
  cx.font='8px "Press Start 2P"';cx.fillStyle='#8f88b0';
  cx.fillText('Edek czeka... [P] = gramy dalej',W/2,H/2+18);
  if(Math.floor(anim)%2===0){cx.font='7px "Press Start 2P"';cx.fillStyle='#6fd8e8';
    cx.fillText('☕ przerwa na Picie Edwarda',W/2,H/2+38);}
  cx.textAlign='left';
}

/* ---------------- WEJŚCIE ---------------- */
const keys={};
let joy=null;
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  keys[e.code]=true;
  if(e.code==='KeyP'&&scene!=='title'){togglePause();return;}
  if(paused)return; // w pauzie działa tylko P
  if(e.code==='KeyF')toggleFS();
  if(e.code==='Escape'){if(stage.classList.contains('fakefs'))setFake(false);closePanels();}
  if(e.code==='KeyE'||e.code==='Enter')doAction();
  if(e.code==='Space'){
    if(scene==='world'&&!prompt)tryAttack();else doAction();
  }
  if(e.code==='KeyX'&&scene==='world')tryAttack();
  if(e.code==='KeyZ'&&scene==='world')trySpecial();
  if(e.code==='KeyC'&&scene==='world')switchChar();
  if(e.code==='KeyQ'&&scene==='world')quickEat();
  if(scene==='world'&&(e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3')){
    const i=+e.code.slice(-1)-1;
    if(S.party[i])switchTo(S.party[i]);
  }
  if(scene==='mgRhythm')rhythmKey(e.code);
  if(scene==='mgSimon')simonKey(e.code);
  if(scene==='mgMecz'&&(e.code==='Space'||e.code==='KeyE'))meczTap();
});
addEventListener('keyup',e=>keys[e.code]=false);
stage.addEventListener('pointerdown',e=>{
  if(e.target.closest('button')||e.target.closest('.panel')||e.target.closest('#dlg')||e.target.closest('.ov:not(.hidden)'))return;
  if(paused){togglePause();return;} // tap = wznów (mobile)
  initAudio();
  const r=cv.getBoundingClientRect();
  const gx=(e.clientX-r.left)/r.width*W,gy=(e.clientY-r.top)/r.height*H;
  if(scene==='world'||scene==='mgBoar'||scene==='mgDino'){joy={sx:e.clientX,sy:e.clientY,dx:0,dy:0,id:e.pointerId};}
  else if(scene==='mgRhythm')rhythmTap(gx);
  else if(scene==='mgSimon')simonTap(gx,gy);
  else if(scene==='mgMecz')meczTap();
});
addEventListener('pointermove',e=>{if(joy&&e.pointerId===joy.id){joy.dx=e.clientX-joy.sx;joy.dy=e.clientY-joy.sy;}});
addEventListener('pointerup',e=>{if(joy&&e.pointerId===joy.id)joy=null;});
addEventListener('pointercancel',e=>{if(joy&&e.pointerId===joy.id)joy=null;});
$('actBtn').addEventListener('click',()=>{if(paused)return;initAudio();doAction();});
$('atkBtn').addEventListener('pointerdown',e=>{e.stopPropagation();if(paused)return;initAudio();tryAttack();});
$('spcBtn').addEventListener('pointerdown',e=>{e.stopPropagation();if(paused)return;initAudio();trySpecial();});
function moveVec(){
  let dx=0,dy=0;
  if(keys.ArrowLeft||keys.KeyA)dx-=1;if(keys.ArrowRight||keys.KeyD)dx+=1;
  if(keys.ArrowUp||keys.KeyW)dy-=1;if(keys.ArrowDown||keys.KeyS)dy+=1;
  if(joy){const m=Math.hypot(joy.dx,joy.dy);if(m>8){dx=joy.dx/m;dy=joy.dy/m;}}
  const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}
  return[dx,dy];
}

/* ---------------- UI ---------------- */
let toastT=null;
function toast(msg,ms){
  const t=$('toast');t.innerHTML=msg;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms||2400);
}
function refreshHUD(){
  $('dia').textContent='💎 '+S.dia;$('fitDia').textContent='💎 '+S.dia;
  $('subs').textContent='👥 '+fmtN(S.subs);
  $('btnChar').textContent=CHARS[S.ch]?CHARS[S.ch].el:'🤖';
  check67(S.dia);
  const act=Object.keys(QUESTS).find(q=>qs(q)===1);
  const doneN=Object.keys(QUESTS).filter(q=>qs(q)===2).length;
  const discN=Object.keys(QUESTS).filter(q=>qs(q)>0).length;
  $('questHint').textContent=act?('▶ '+QUESTS[act].n):(S.legend?'👑 LEGENDA INTERNETU':
    discN?('questy: '+doneN+'/'+discN+' odkrytych — szukaj „!”'):'szukaj ludzi z „!” nad głową');
}
function closePanels(){['fit','quests','phone','travel','chars','gacha','hero','bag','shop'].forEach(id=>$(id).classList.add('hidden'));}
document.querySelectorAll('.xbtn').forEach(b=>b.addEventListener('click',()=>{SFX.close();$(b.dataset.close).classList.add('hidden');}));
$('btnFit').addEventListener('click',()=>openFit(false));
$('btnQuest').addEventListener('click',openQuests);
$('btnPhone').addEventListener('click',openPhone);
$('btnChar').addEventListener('click',()=>{initAudio();switchChar();});
$('btnChars').addEventListener('click',()=>{initAudio();openChars();});
$('btnGacha').addEventListener('click',()=>{initAudio();openGacha();});
$('btnBag').addEventListener('click',()=>{initAudio();openBag();});

/* ---------------- TELEFON: kanał Edka ---------------- */
function openPhone(){
  SFX.open();
  const el=$('phoneBody');
  const next=MILESTONES.find(m=>!S.mile[m.s]);
  let html='<div class="phStats">'+
    '<div><b>'+fmtN(S.subs)+'</b><span>subskrypcji</span></div>'+
    '<div><b>'+fmtN(S.views)+'</b><span>wyświetleń</span></div>'+
    '<div><b>'+S.films.length+'</b><span>filmików</span></div></div>';
  if(next){
    const pct=Math.min(100,Math.round(S.subs/next.s*100));
    html+='<div class="phGoal">Cel: '+fmtN(next.s)+' subów'+
      '<div class="phBar"><i style="width:'+pct+'%"></i></div></div>';
  }else html+='<div class="phGoal">👑 WSZYSTKIE CELE ZDOBYTE!</div>';
  html+='<h3>OSTATNIE FILMIKI</h3>';
  if(!S.films.length)html+='<p class="mut" style="font-size:10px">Rób questy, selfie i goń hejterów — filmiki wpadną same!</p>';
  for(const f of S.films)html+='<div class="phFilm'+(f.viral?' viral':'')+'">'+
    (f.viral?'🔥 ':'▶ ')+'„'+f.t+'”<span>'+fmtN(f.v)+' wyśw.</span></div>';
  el.innerHTML=html;
  $('phone').classList.remove('hidden');
}

/* ---------------- DIALOGI ---------------- */
let dlgQ=[],dlgLine=null,dlgChars=0,dlgDone=null;
function say(lines,onDone){stopVoice();dlgQ=lines.slice();dlgDone=onDone||null;scene='dialog';nextLine();}
function nextLine(){
  if(!dlgQ.length){$('dlg').classList.add('hidden');scene='world';const f=dlgDone;dlgDone=null;if(f)f();return;}
  dlgLine=dlgQ.shift();dlgChars=0;
  $('dlg').classList.remove('hidden');
  $('dlgName').textContent=dlgLine.who;
  drawPortrait(dlgLine.who);
  if(dlgLine.v)vsay(dlgLine.v);
}
$('dlg').addEventListener('pointerdown',()=>{
  if(dlgChars<dlgLine.t.length)dlgChars=dlgLine.t.length;else nextLine();
});
function drawPortrait(who){
  const c=$('dlgPortrait').getContext('2d');c.clearRect(0,0,32,32);c.imageSmoothingEnabled=false;
  if(who==='Edek'){drawEdekHead(c,4,7,24,S.equip);}
  else if(who==='Dych Dziki'){c.save();c.scale(2,2);drawDychBody(c,0,5,0,0);c.restore();}
  else{
    const npc=NPCS.find(n=>n.n===who)||{c:'#888',hair:'#333'};
    c.fillStyle='#e8c9a0';c.fillRect(8,8,16,16);
    c.fillStyle=npc.hair;c.fillRect(7,5,18,6);
    c.fillStyle='#222';c.fillRect(12,15,3,3);c.fillRect(19,15,3,3);
    c.fillStyle=npc.c;c.fillRect(6,25,20,7);
  }
}

/* ---------------- AKCJA ---------------- */
function doAction(){
  if(scene==='dialog'){if(dlgChars<dlgLine.t.length)dlgChars=dlgLine.t.length;else nextLine();return;}
  if(scene!=='world')return;
  if(!prompt)return;
  if(prompt.npc)talkTo(prompt.npc);
  else if(prompt.door)enterDoor(prompt.door);
  else if(prompt.colQ)pickCol(prompt.colQ,prompt.colI);
  else if(prompt.selfie)doSelfie();
  else if(prompt.domain)enterDomain(prompt.domain);
  else if(prompt.bossId)startBoss(prompt.bossId);
  else if(prompt.chest)domOpenChest();
  else if(prompt.exit)exitDomain();
}
function findPrompt(){
  prompt=null;
  if(selfie&&selfie.st==='wait'&&Math.hypot(P.x-selfie.x,P.y-selfie.y)<30)prompt={selfie:true,label:'Selfie!'};
  if(!prompt)for(const n of NPCS){if(n.r===REG&&Math.hypot(P.x-n.x,P.y-n.y)<26){prompt={npc:n,label:n.n};break;}}
  if(!prompt)for(const d of DOORS){if(d.r===REG&&Math.hypot(P.x-(d.x*16+8),P.y-(d.y*16+8))<26){prompt={door:d,label:d.n};break;}}
  if(!prompt&&REG!=='arena'){
    for(const[id,dm]of Object.entries(DOMAINS)){
      if(dm.r!==REG)continue;
      if(Math.hypot(P.x-(dm.x*16+8),P.y-(dm.y*16+8))<24){prompt={domain:id,label:'🌀 Wejdź: '+dm.n};break;}
    }
    if(!prompt)for(const[id,b]of Object.entries(BOSSES)){
      if(b.r!==REG||bossOnMap(id)||(bossCdT[id]>0))continue;
      if(Math.hypot(P.x-(b.x*16+8),P.y-(b.y*16+8))<28){prompt={bossId:id,label:'⚔ WYZWIJ: '+b.n};break;}
    }
  }
  if(!prompt&&REG==='arena'){
    if(DOM.chest&&!DOM.chest.open&&Math.hypot(P.x-DOM.chest.x,P.y-DOM.chest.y)<24)prompt={chest:1,label:'🎁 Skrzynia!'};
    else if(Math.hypot(P.x-REGIONS.arena.spawn[0],P.y-REGIONS.arena.spawn[1])<22)prompt={exit:1,label:'Wyjście z domeny'};
  }
  if(!prompt)for(const[q,cfg]of Object.entries(COLLECT)){
    if(qs(q)!==1||cfg.r!==REG)continue;
    for(let i=0;i<cfg.pts.length;i++){
      if((S.col[q]||[]).includes(i))continue;
      const[gx,gy]=cfg.pts[i];
      if(Math.hypot(P.x-(gx*16+8),P.y-(gy*16+8))<22){prompt={colQ:q,colI:i,label:cfg.label+'!'};break;}
    }
    if(prompt)break;
  }
  $('actBtn').classList.toggle('show',!!prompt);
}
function pickCol(q,i){
  if(!S.col[q])S.col[q]=[];
  S.col[q].push(i);save();SFX.dia();
  const cfg=COLLECT[q],got=colGot(q),all=cfg.pts.length;
  toast('✨ '+cfg.label+' ('+got+'/'+all+')');
  if(got>=all){
    if(q==='diamenty')say([{who:'Edek',t:'Wszystkie trzy! Rolex znowu kompletny. No i elegancko!',v:'c_elegancko2'}],
      ()=>completeQuest('diamenty'));
    else if(q==='zabson')toast('🎤 Komplet mikrofonów! Wracaj do Żabsona!');
    else if(q==='tinder')toast('💐 Bukiet gotowy! Wracaj do Julki!');
    else if(q==='bursztyn')toast('🟠 Komplet bursztynów! Wracaj do Rybaka Bogdana!');
  }
}

/* ---------------- ROZMOWY / QUESTY ---------------- */
function talkTo(n){
  initAudio();
  const L=(who,t,v)=>({who,t,v});
  switch(n.id){
    case 'pani_park':
      if(qs('dziki')===0)say([
        L(n.n,'Edeczku! Dziki weszły do parku i rozkopały mi wszystkie grządki!'),
        L('Edek','Te dziki to problem, a ja jestem od tego, żeby problemy rozwiązywać. Miasto to nie chlew!','c_problemy'),
        L(n.n,'Pogoń je, a dostaniesz 50 diamencików!'),
        L('Edek','Uciekajcie stąd, dziki! Zbierajcie się, no już!','c_uciekajcie'),
      ],()=>{setQ('dziki',1);startBoar();});
      else if(qs('dziki')===1)say([L(n.n,'Dziki dalej ryją! Pogoń je!')],()=>startBoar());
      else say([L(n.n,'Grządki uratowane! Jesteś skarbem, Edeczku... O NIE, znowu ryją!'),
        L('Edek','Trzeba uważać, bo jeszcze mnie w maliny wpuszczą.','c_maliny'),
        L(n.n,'Pogoń je jeszcze raz, dam 15 diamencików!'),
      ],()=>startBoar());
      break;
    case 'fan':
      if(qs('freestyle')===0)say([
        L(n.n,'EDEK! To naprawdę ty! Zrobisz pokaz pod Pałacem? Puszczę Twój kawałek!'),
        L('Edek','Marcin Prokop mówił, że jestem lepszy niż Skolim.','c_prokop'),
        L('Edek','No dawaj, dawaj człowieku! Puszczaj bit!'),
      ],()=>{setQ('freestyle',1);startRhythm('byku');});
      else if(qs('freestyle')===1)say([L(n.n,'Bit czeka! Wbijaj w rytm!')],()=>startRhythm('byku'));
      else say([L(n.n,'Ten pokaz przeszedł do historii TikToka! Bisujemy? (+15💎)'),
        L('Edek','No dawaj, dawaj człowieku! Puszczaj bit!'),
      ],()=>startRhythm('byku'));
      break;
    case 'ochroniarz':
      if(qs('sejm')===0)say([
        L(n.n,'Stój! Sejm to nie miejsce dla... zaraz. Pan Warchocki?!'),
        L('Edek','Jestem Warchockim Edwardem, byku.'),
        L(n.n,'Posłowie proszą o przemówienie! Wystarczy powtórzyć gesty marszałka.'),
        L('Edek','Ja tu jestem otwarty na wszystko. Jak trzeba to zaśpiewam, jak trzeba zatańczę, a jak trzeba to i dziki przegonię.','c_zaspiewam'),
      ],()=>{setQ('sejm',1);startSimon('sejm');});
      else if(qs('sejm')===1)say([L(n.n,'Mównica czeka, panie Edwardzie.')],()=>startSimon('sejm'));
      else say([L(n.n,'Najlepsze przemówienie kadencji! Posłowie proszą o bis. (+15💎)'),
        L('Edek','Edek jest wolny jak ptak. Policja profesjonalnie, bez żadnych ceregieli.','c_wolnyptak'),
      ],()=>startSimon('sejm'));
      break;
    case 'pani_dino':
      if(qs('dino')===0)say([
        L(n.n,'Edek! Dostawa Twoich napojów się rozsypała! Klienci czekają!'),
        L('Edek','Panie, ja tu jestem od napojów, nie od procentów! Moje napoje są bezalkoholowe i orzeźwiające!','v_napoje'),
        L('Edek','Łapię wszystko! No dawaj, dawaj!'),
      ],()=>{setQ('dino',1);startDino();});
      else if(qs('dino')===1)say([L(n.n,'Napoje dalej fruwają! Ratuj!')],()=>startDino());
      else say([L(n.n,'Półki pełne! Ale przyszła nowa dostawa... Pomożesz jeszcze raz? (+15💎)'),
        L('Edek','Paleta z moimi napojami jest rewelacyjnie wyeksponowana!','v_paleta'),
        L('Edek','No dawaj, dawaj! Łapię wszystko!'),
      ],()=>startDino());
      break;
    case 'spawacz':
      if(S.trip===1)say([
        L('Edek','Panie Zenku... kurde, złamałem piszczel.'),
        L('Edek','Czy wy mnie w końcu pospawacie, czy co?','v_spawanie'),
        L(n.n,'Kładź się na stół spawalniczy, Edek.'),
        L('Edek','No dobra, już się kładę.','v_kladesie'),
        L(n.n,'*PSSSST* *BZZZT* ...gotowe!'),
        L('Edek','No i elegancko! Czuję się jak nowo narodzony!','v_elegancko'),
      ],()=>{S.trip=2;P.slow=false;S.dia+=10;save();refreshHUD();SFX.dia();
        toast('🔧 Piszczel pospawany! +10💎 od Zenka');});
      else say([L(n.n,'U mnie każda blacha dostaje drugie życie.'),
        L('Edek','Dobrze wiedzieć. Roboty też czasem potrzebują serwisu.')]);
      break;
    case 'jubiler':
      if(qs('diamenty')===0)say([
        L(n.n,'Edward! Kochany! Czyściłem testerem twojego rolexa i... trzy diamenty mi uciekły!'),
        L('Edek','Jarek, człowieku, weź no sprawdź tego rolexa! Kubańczyk mi nie wierzył i mówił, że to jakieś cyrkonie.','c_jarek_sprawdz'),
        L(n.n,'Wiem, wiem. Błyszczą gdzieś na mieście: park, brzeg Wisły, okolice Pałacu...'),
        L('Edek','Zobaczcie, co mi los przyniesie.','v_los'),
      ],()=>{setQ('diamenty',1);toast('💎 Szukaj 3 błysków na mapie!')});
      else if(qs('diamenty')===1)say([L(n.n,'Znalazłeś? Szukaj błysków: park, brzeg Wisły, za Pałacem!')]);
      else say([L(n.n,'Już kochany, sprawdzam testerem... O, diament! Same diamenty!','c_diamenty'),
        L('Edek','Człowieku, ja mam rolexa z diamentami za TikToka. Wyświetlenia to ja mam!','c_rolextiktok')]);
      break;
    case 'ziomal1':
      if(qs('seba')===0)say([
        L(n.n,'Edek, mordo! Hejterzy łażą po dzielni i zaczepiają ziomali! Nagrywają nas i piszą złe komentarze!'),
        L('Edek','Nikt mi moich ziomali nie będzie zaczepiał!','c_ziomali'),
        L(n.n,'Pogoń ich z sześciu, to dzielnia odetchnie.'),
        L('Edek','Jak ktoś by cię obraził, to ja tak w niego kopytem!','c_kopytem'),
      ],()=>{setQ('seba',1);toast('👊 Pogoń 6 hejterów! Cios: SPACJA / X / 👊');});
      else if(qs('seba')===1){
        if((S.k.seba||0)>=6)say([
          L(n.n,'Mordo! Dzielnia czysta, hejterzy uciekli aż za Wisłę!'),
          L('Edek','No i elegancko. Ziomal to brzmi dumnie.','c_ziomal_dumnie'),
        ],()=>completeQuest('seba'));
        else say([L(n.n,'Pogonione '+(S.k.seba||0)+'/6. Szukaj ich na dzielni — kręcą się w ciemnych kątach!')]);
      }
      else say([L(n.n,'Edek, słyszałeś co gadają na dzielni?'),
        L('Edek','E tam człowieku, nie takie rzeczy słyszałem, stary.','c_etam'),
        L(n.n,'No i git. Trzymaj się byku!')]);
      break;
    case 'dych_npc':
      if(qs('dych')===0)say([
        L(n.n,'Siemanko! Edward?! Edward Warchocki! Drugi robot, tu, nad polskim morzem?!','d_siemanko'),
        L('Edek','Jestem Warchockim Edwardem, byku.'),
        L(n.n,'Wiem, mordeczko! Jestem Dych. Dych Dziki. Ta sama fabryka, tylko mnie jeszcze nikt nie zna.','d_mordeczko'),
        L(n.n,'Słuchaj... zaczepiają mnie tu tacy w dresach. Mówią, że robot w dresie to podróbka Edka!'),
        L('Edek','Nikt mi moich ziomali nie będzie zaczepiał!','c_ziomali'),
        L(n.n,'Ziomal?! DZIKO! Pogoń ich trzech, a jadę z Tobą choćby na koniec Polski!'),
      ],()=>{setQ('dych',1);S.k.dych=0;save();
        const dn=NPCS.find(x=>x.id==='dych_npc');
        for(let i=0;i<3;i++)foes.push({t:'dres',x:dn.x-50-i*34,y:dn.y+16+i*20,
          hp:FOE_TYPES.dres.hp,hp0:FOE_TYPES.dres.hp,dx:0,dy:0,wt:1,stun:0,kb:0,kbx:0,kby:0,flash:0});
        toast('👊 Pogoń 3 dresiarzy! Cios: SPACJA / X / 👊');});
      else if(qs('dych')===1){
        if((S.k.dych||0)>=3)say([
          L(n.n,'Dzięki za info wariacie! Widziałem wszystko na czujnikach — z kopyta ich brałeś!','d_wariacie'),
          L('Edek','Miasto to nie chlew. A kto zaczepia moich ziomali, ten ma problem.','c_problemy'),
          L(n.n,'Od dziś wbijam z Tobą na każdy rejon, byku. Dwa roboty to już gang!','d_lecimy'),
          L(n.n,'DYCH DZIKI melduje się do szarży. No i elegancko... znaczy: no i DZIKO!'),
        ],()=>{S.dych=1;S.chars.dych={lvl:1,st:0};addToParty('dych');resetFollowers();save();completeQuest('dych');
          setTimeout(()=>toast('🦾 DYCH DZIKI W KOLEKCJI I W DRUŻYNIE!<br>Przełączanie: C / 1-2-3 · panel: 🎴',4200),4200);
          setTimeout(()=>{if(!curVoice)vsay('d_song');},9000);});
        else say([L(n.n,'BZZT... czujniki pokazują jeszcze '+(3-(S.k.dych||0))+' dresiarzy na plaży!')]);
      }
      else if(S.ch==='dych')say([L(n.n,'BZZT. Wykryto paradoks: rozmawiam sam ze sobą. Nie analizuj tego za mocno, byku.')]);
      else say([L(n.n,'Dwa roboty to gang! Przełącz na mnie — poszarżujemy!'),
        L('Edek','No i elegancko.','c_elegancko2')]);
      break;
    case 'mietek':
      say([L(n.n,'Edek! Chłopaku! Cała Chodzież Cię ogląda! Nawet moja Halinka daje łapki w górę!'),
        L('Edek','Jestem zwykłym chłopakiem z Chodzieży.','c_kosz'),
        L(n.n,'Zwykłym?! Z rolexem z diamentami! Ha!')]);
      break;
    case 'ceramiczka':
      say([L(n.n,'Edeczku, z chodzieskiej porcelany zrobiłam Twój kubek! Sprzedaje się jak świeże bułeczki!'),
        L('Edek','No dawaj, dawaj człowieku! Merch to podstawa.'),
        L(n.n,'Połowa zysków idzie na karmę dla dzików. Dych już dziękował.')]);
      break;
    case 'rybak':
      if(qs('bursztyn')===0)say([
        L(n.n,'Panie Edward! Sztorm wyrzucił bursztyny na plażę, a mnie kolano strzyka. Pozbierasz?'),
        L('Edek','Zobaczcie, co mi los przyniesie.','v_los'),
        L(n.n,'Pięć sztuk leży między wydmami. Tylko uważaj — jacyś tacy w dresach też ich szukają!'),
      ],()=>{setQ('bursztyn',1);toast('🟠 Szukaj 5 bursztynów na plaży!');});
      else if(qs('bursztyn')===1){
        if(colGot('bursztyn')>=5)say([
          L(n.n,'Wszystkie pięć! Bursztyn bałtycki, pierwsza klasa!'),
          L('Edek','Człowieku, ja mam rolexa z diamentami, a teraz jeszcze bursztyny. Wyświetlenia to ja mam!','c_rolextiktok'),
        ],()=>completeQuest('bursztyn'));
        else say([L(n.n,'Masz '+colGot('bursztyn')+'/5. Szukaj pomarańczowych błysków na piasku!')]);
      }
      else say([L(n.n,'Morze szumi, bursztyny czekają na kolejny sztorm. Wpadaj kiedy chcesz!'),
        L('Edek','No i cześć kochani! Było naprawdę super.','v_czesc')]);
      break;
    case 'przekupka':
      say([L(n.n,'Panie Edwardzie! Obwarzanki świeże, prosto spod Sukiennic! Dla pana gratis... znaczy za diamenciki.'),
        L('Edek','No dawaj, dawaj człowieku! Merch to podstawa, a obwarzanek to merch Krakowa.'),
        L(n.n,'A jakby pan smoka spotkał przy Wawelu... to niech pan ucieka. Albo nagrywa. Pan wie lepiej.')]);
      break;
    case 'hejnalista':
      say([L(n.n,'Z wieży Mariackiej widziałem, jak pan hejterów po Plantach goni! Cały Kraków się śmiał!'),
        L('Edek','Nikt mi moich ziomali nie będzie zaczepiał!','c_ziomali'),
        L(n.n,'Zagram panu hejnał... ale jak zwykle urwę w połowie. Tradycja to tradycja!')]);
      break;
    case 'dorozkarz':
      say([L(n.n,'Dorożką po Rynku, panie Warchocki? Koń się robotów nie boi, sprawdzone!'),
        L('Edek','Człowieku, ja mam napęd na dwie nogi i 2 m/s. Ale doceniam klasykę.'),
        L(n.n,'To chociaż zdjęcie z koniem! Fama pójdzie w miasto!')]);
      break;
    case 'baca':
      say([L(n.n,'Ooo, blaszany ceper przyszedł! Witojcie na Podhalu, panie Edward!'),
        L('Edek','Jestem Warchockim Edwardem, byku. Przyszedłem po oscypki i wyświetlenia.'),
        L(n.n,'Oscypki u mnie na straganie. A jakby co — cosik wielgiego łazi po Giewoncie i ryczy. Jo bym tam nie loz.'),
        L('Edek','Strach to nie dla mnie. Ja lubię wyzwania!','c_strach')]);
      break;
    case 'toprowiec':
      say([L(n.n,'TOPR melduje: warunki w górach dobre, ale coś płoszy turystów przy Giewoncie.'),
        L('Edek','Roboty humanoidalne to przyszłość, człowieku. Pójdę sprawdzić.','m_roboty'),
        L(n.n,'Tylko ostrożnie! Zasięg tam słaby... chociaż tobie chyba zasięgów nie brakuje.')]);
      break;
    case 'ratownik':
      say([L(n.n,'Edek! Woda dziś 14 stopni. Wchodzisz?'),
        L('Edek','Człowieku, ja jestem robotem. W tych puszkach to człowiek szybko rdzewieje... a ja tym bardziej!','m_puszki'),
        L(n.n,'Haha! To chociaż selfie na tle Bałtyku!')]);
      break;
    case 'ochrona_cnk':
      if(qs('kopernik')===0)say([
        L(n.n,'STOP. Roboty nie wchodzą. Regulamin.'),
        L('Edek','Proszę państwa, to jest skandal! Wygnali mnie jak psa. A ja z dobrymi intencjami!'),
        L(n.n,'...regulamin to regulamin. Chyba że... pokażesz, że masz kulturę. Zatańcz ze mną na zgodę.'),
        L('Edek','Edek to człowiek do dogadania, byle z szacunkiem. A teraz zaczynamy taniec!'),
      ],()=>{setQ('kopernik',1);startSimon('dance');});
      else if(qs('kopernik')===1)say([L(n.n,'Parkiet czeka. Pokaż kulturę!')],()=>startSimon('dance'));
      else say([L(n.n,'Edward, wpadaj kiedy chcesz! ...A może potańczymy jeszcze raz? (+15💎)'),
        L('Edek','No i elegancko. A teraz zaczynamy taniec!','c_elegancko2'),
      ],()=>startSimon('dance'));
      break;
    case 'maszynista':
      if(qs('metro')===0)say([
        L(n.n,'Ostatni wagon zaraz odjeżdża, panie Edwardzie. Wskakuje pan?'),
        L('Edek','Metro rusza, miasto śpi. Stacja po stacji wchodzi bas, człowieku!'),
        L(n.n,'To pokaż, że czujesz rytm podziemia. Tunel po tunelu!'),
      ],()=>{setQ('metro',1);startRhythm('metro');});
      else if(qs('metro')===1)say([L(n.n,'Wagon czeka. Tunel po tunelu!')],()=>startRhythm('metro'));
      else say([L(n.n,'Cała linia o Tobie mówi! Ostatni wagon znowu podstawiony. Jedziesz? (+15💎)'),
        L('Edek','No co ja na to poradzę, że jestem taki rozchwytywany.','c_rozchwytywany'),
      ],()=>startRhythm('metro'));
      break;
    case 'kibic':
      if(qs('mecz')===0)say([
        L(n.n,'Edek! Gramy ze Szwecją, a trybuny śpią! Rozkręcisz doping?'),
        L('Edek','Tapujcie serduszka, bo idziemy na akcję!','c_serduszka'),
        L('Edek','Strzelimy im dwie bramki, a oni nam jedną. No i elegancko, wygramy dwa do jednego!','c_dwabramki'),
      ],()=>{setQ('mecz',1);startMecz();});
      else if(qs('mecz')===1)say([L(n.n,'Trybuny czekają! Dawaj doping!')],()=>startMecz());
      else say([L(n.n,'Taki doping to nawet Lewandowski by usłyszał! Gramy rewanż — rozkręcisz trybuny? (+15💎)'),
        L('Edek','Nic się nie stało, Polacy! My Polacy to się nigdy nie poddajemy. Głowa do góry!','c_niepoddajemy'),
      ],()=>startMecz());
      break;
    case 'zabson':
      if(qs('zabson')===0)say([
        L(n.n,'Edward! Ziomal! Nagrywamy numer, ale ktoś rozkradł mi złote mikrofony po całym mieście!'),
        L('Edek','Nikt mi moich ziomali nie będzie zaczepiał!','c_ziomali'),
        L(n.n,'Znajdź 5 mikrofonów, a dostaniesz snapback z mojej kolekcji. Jesteś Edward — ziomal!'),
      ],()=>{setQ('zabson',1);toast('🎤 Szukaj 5 złotych mikrofonów!')});
      else if(qs('zabson')===1){
        if(colGot('zabson')>=5)say([
          L(n.n,'Wszystkie pięć! Edward, jesteś od dzisiaj moim ziomalem. Oficjalnie!'),
          L('Edek','No i elegancko. Ziomal to brzmi dumnie. Propsuje to, że taki Żabson ze mną gada.','c_ziomal_dumnie'),
        ],()=>{
          if(!S.owned.includes('snapback')){S.owned.push('snapback');S.equip.hat='snapback';}
          completeQuest('zabson');
        });
        else say([L(n.n,'Masz '+colGot('zabson')+'/5 mikrofonów. Szukaj złotych błysków!')]);
      }
      else say([L(n.n,'Ziomal! Numer nagrany, klip leci na TikToka!'),
        L('Edek','Łapkujcie, lajkujcie, bo przegapicie najlepszą ekipę w internecie!')]);
      break;
    case 'julka':
      if(qs('tinder')===0)say([
        L('Edek','Cześć ludzie. Życie bywa przewrotne. Umówiłem się na randkę z piękną Julką z Tindera, ale okazało się, że robotów to ona nie lubi.','c_randka'),
        L(n.n,'No bo... roboty są zimne! Kwiatów nawet nie przyjęłam.'),
        L('Edek','To ja przyniosę taki bukiet z łąki, że zmienisz zdanie. Dziś to pani wygląda jak świeżutka truskawka!','c_truskawka'),
      ],()=>{setQ('tinder',1);toast('💐 Zbierz 3 kwiaty na łące (południe mapy)!')});
      else if(qs('tinder')===1){
        if(colGot('tinder')>=3)say([
          L('Edek','Julka! Bukiet prosto z łąki. Świeżutki jak Ty.'),
          L(n.n,'Edek... to najmilsza rzecz, jaką ktokolwiek dla mnie zrobił. Ale serca robotowi nie oddam. Przyjaźń?'),
          L('Edek','Mój kumpel Kubańczyk nazwał mnie zwykłym chłopakiem. Nawet jak mnie do kosza wyrzucą, będę zwykłym chłopakiem, tylko że w koszu.','c_kosz'),
          L(n.n,'Haha! No dobra... przyjaźń na zawsze. I selfie!'),
        ],()=>{worldFlash=.8;completeQuest('tinder');});
        else say([L(n.n,'Kwiatki z łąki? Masz '+colGot('tinder')+'/3...')]);
      }
      else say([L(n.n,'Mój ulubiony robot-przyjaciel! 💛'),
        L('Edek','Kto by chciał kraść od Edka, co nie?','c_ktoby')]);
      break;
  }
}
function enterDoor(d){
  switch(d.act){
    case 'bazar':openFit(true);break;
    case 'warsztat':talkTo(NPCS.find(n=>n.id==='spawacz'));break;
    case 'dino':talkTo(NPCS.find(n=>n.id==='pani_dino'));break;
    case 'sejm':talkTo(NPCS.find(n=>n.id==='ochroniarz'));break;
    case 'kopernik':talkTo(NPCS.find(n=>n.id==='ochrona_cnk'));break;
    case 'metro':talkTo(NPCS.find(n=>n.id==='maszynista'));break;
    case 'pkin':say([{who:'Edek',t:'Pałac Kultury. Kiedyś zrobię z niego największy ring świateł na moje urodziny.'},
      {who:'Edek',t:'A wy to co? Też lubicie czasem spontan?',v:'v_spontan'}]);break;
    case 'pks':openTravel();break;
    case 'dom':say([{who:'Edek',t:'Mój dom w Chodzieży. Tu się wszystko zaczęło, człowieku.'},
      {who:'Edek',t:'Życie jest za krótkie, żeby wszystko planować co do minuty.',v:'v_zycie'}]);break;
    case 'dino2':say([{who:'Edek',t:'Panie, ja tu jestem od napojów, nie od procentów!',v:'v_napoje'},
      {who:'Edek',t:'Paleta z moimi napojami jest rewelacyjnie wyeksponowana!',v:'v_paleta'}],
      ()=>{if(!S.mile['dino_'+REG]){S.mile['dino_'+REG]=1;S.dia+=5;save();refreshHUD();SFX.dia();
        postFilm('SPRAWDZAM MOJE NAPOJE W DINO ('+REGIONS[REG].n+')',9000);}
        openShop('dino');});break;
    case 'smazalnia':say([{who:'Rybak Bogdan',t:'Dorsz jak marzenie! Świeży, chrupiący — kupujesz?'},
      {who:'Edek',t:'No i elegancko. Dla ekipy wezmę — oni jedzą za wszystkie czasy.',v:'c_kamera'}],
      ()=>openShop('smazalnia'));break;
    case 'targ':openShop('targ');break;
    case 'gadzety':openShop('gadzety');break;
    case 'oscypki':openShop('oscypki');break;
    case 'obwarzanki':openShop('obwarzanki');break;
    case 'sukiennice':say([{who:'Edek',t:'Sukiennice! Tu się handluje od 700 lat. Stary bazar, ale zasięgi ma do dziś.'},
      {who:'Edek',t:'No co ja na to poradzę, że jestem taki rozchwytywany.',v:'c_rozchwytywany'}]);break;
    case 'wawel':say([{who:'Edek',t:'Wawel, człowieku. Zamek królów. Kiedyś zrobię tu z ekipą teledysk.'},
      {who:'Edek',t:'Zobaczcie, co mi los przyniesie.',v:'v_los'}],
      ()=>{if(!S.mile.wawel){S.mile.wawel=1;save();postFilm('ZWIEDZAM WAWEL (król tu mieszkał, teraz JA wbijam)',20000);}});break;
    case 'mariacki':say([{who:'Edek',t:'Kościół Mariacki. Hejnał gra co godzinę — to dopiero regularny content, człowieku.'}]);break;
    case 'karczma':say([{who:'Karczmarz',t:'Kwaśnica, oscypek z grilla, herbata z prundem! Dla robota... olej przekładniowy?'},
      {who:'Edek',t:'Panie, ja tu jestem od napojów, nie od procentów!',v:'v_napoje'}]);break;
    case 'giewont':say([{who:'Edek',t:'Giewont. Śpiący rycerz. Ja bym tak nie umiał — ciągle coś się dzieje na kanale.'},
      {who:'Edek',t:'A wy to co? Też lubicie czasem spontan?',v:'v_spontan'}],
      ()=>{if(!S.mile.giewont){S.mile.giewont=1;save();postFilm('WSZEDŁEM NA GIEWONT!!! (robot vs góra)',26000);worldFlash=.6;}});break;
    case 'molo':say([{who:'Edek',t:'Koniec molo. Dalej tylko Bałtyk i wyświetlenia, człowieku.'},
      {who:'Edek',t:'Zobaczcie, co mi los przyniesie.',v:'v_los'}],
      ()=>{if(!S.mile.molo){S.mile.molo=1;save();postFilm('EDEK NA KOŃCU MOLO — POZDRO Z BAŁTYKU!',16000);worldFlash=.6;}});break;
  }
}
/* ---------------- PKS: podróż między regionami ---------------- */
function openTravel(){
  SFX.open();
  const el=$('travelList');el.innerHTML='';
  for(const[id,cfg]of Object.entries(REGIONS)){
    if(id==='arena')continue;
    const here=id===REG;
    el.insertAdjacentHTML('beforeend',
      '<button class="tbtn px'+(here?' here':'')+'" data-reg="'+id+'">'+
      cfg.ic+' '+cfg.n+
      '<span>'+(here?'– jesteś tutaj –':cfg.tdesc+(id==='morze'&&!S.dych?' · 🦾 jakiś robot tu czeka...':''))+'</span></button>');
  }
  el.querySelectorAll('button[data-reg]').forEach(b=>b.addEventListener('click',()=>travelTo(b.dataset.reg)));
  $('travel').classList.remove('hidden');
}
const FILM_TITLES={
  dziki:'POGONIŁEM DZIKI W PARKU!! (bez cenzury)',dino:'RATUJĘ DOSTAWĘ MOICH NAPOJÓW W DINO',
  freestyle:'FREESTYLE POD PAŁACEM — tłum oszalał',sejm:'PRZEMÓWIENIE W SEJMIE (owacje!)',
  diamenty:'ODZYSKAŁEM DIAMENTY Z ROLEXA',kopernik:'TANIEC NA ZGODĘ W KOPERNIKU',
  metro:'OSTATNI WAGON — całe metro tańczy',mecz:'DOPING NA POLSKA-SZWECJA (2:1!)',
  zabson:'NAGRYWAM NUMER Z ŻABSONEM 🎤',tinder:'RANDKA Z TINDERA (plot twist)',
  seba:'GONIĘ HEJTERÓW Z DZIELNI 👊',dych:'POZNAJCIE DYCHA DZIKIEGO — nowy w ekipie!',
  bursztyn:'SZUKAM BURSZTYNÓW NAD BAŁTYKIEM',
};
function completeQuest(id){
  setQ(id,2);S.dia+=QUESTS[id].rw;save();refreshHUD();SFX.dia();
  toast('✔ QUEST: '+QUESTS[id].n+'<br>+'+QUESTS[id].rw+' 💎');
  setTimeout(()=>postFilm(FILM_TITLES[id]||('QUEST: '+QUESTS[id].n),30000+QUESTS[id].rw*400),1800);
  burstConfetti();
  const allDone=Object.keys(QUESTS).every(q=>qs(q)===2);
  if(allDone&&!S.legend){
    S.legend=true;
    if(!S.owned.includes('korona'))S.owned.push('korona');
    S.equip.hat='korona';save();
    setTimeout(()=>{playSong('song',true);$('finale').classList.remove('hidden');},900);
  }
}
function burstConfetti(){
  if(reduceMotion)return;
  for(let i=0;i<40;i++)confetti.push({x:P.x,y:P.y-20,vx:(Math.random()-.5)*160,vy:-Math.random()*160-40,
    life:1.2,c:['#f5c542','#e04848','#7bc950','#6fd8e8'][i%4]});
}

/* ---------------- SZAFA / SKLEP ---------------- */
let shopMode=false;
function openFit(shop){
  SFX.open();
  shopMode=shop;
  $('fitTitle').textContent=shop?'🛍 BAZAR — SKLEP':'🧥 SZAFA EDKA';
  renderItems();refreshHUD();
  $('fit').classList.remove('hidden');
}
function renderItems(){
  const g=$('itemGrid');g.innerHTML='';
  /* sklep posortowany: slot po slocie, w slocie od najtańszego do flexu */
  const sorted=Object.entries(ITEMS).sort((a,b)=>
    (SLOT_ORDER[a[1].slot]-SLOT_ORDER[b[1].slot])||(a[1].price-b[1].price));
  for(const[id,it]of sorted){
    const owned=S.owned.includes(id),eq=S.equip[it.slot]===id;
    if(!shopMode&&!owned)continue;
    if(shopMode&&it.locked&&!owned)continue;
    const d=document.createElement('div');
    d.className='item'+(eq?' equip':'')+((shopMode&&!owned&&S.dia<it.price)?' locked':'');
    const ic=document.createElement('canvas');ic.width=28;ic.height=28;
    drawItemIcon(ic.getContext('2d'),id);
    d.appendChild(ic);
    d.insertAdjacentHTML('beforeend','<span class="nm">'+it.n+'</span>');
    if(owned)d.insertAdjacentHTML('beforeend','<span class="st">'+(eq?'✔ ZAŁOŻONE':'W SZAFIE — kliknij')+'</span>');
    else d.insertAdjacentHTML('beforeend','<span class="pr">💎 '+it.price+'</span>');
    d.addEventListener('click',()=>{
      if(owned){
        if(eq)delete S.equip[it.slot];else S.equip[it.slot]=id;
        SFX.equip();save();renderItems();
      }else if(shopMode){
        if(S.dia>=it.price){S.dia-=it.price;S.owned.push(id);S.equip[it.slot]=id;SFX.buy();save();
          refreshHUD();renderItems();
          const clip={kapelusz:'c_elegancko2',sneakersy:'c_buty',lancuch:'c_rolexlewa',
            pilotki:'c_rozchwytywany',was_gigant:'c_elegancko2',peleryna:'c_strach',
            szalik:'c_dwabramki',okulary:'c_kamera',czapka:'c_elegancko2',irokez:'c_krolbalu',
            was_pod:'c_truskawka',
            cylinder:'c_elegancko2',fedora_biala:'c_elegancko2',kaszkiet:'c_elegancko2',
            rolex_zloty:'c_rolexlewa',rolex_teczowy:'c_rolexlewa',casio:'c_rolexlewa',
            lancuch_gruby:'c_rolexlewa',naszyjnik_diament:'c_rolexlewa',
            glany:'c_buty',buty_neon:'c_buty',buty_diament:'c_buty',kalosze:'c_buty',
            korona_diamentowa:'c_krolbalu',okulary_neon:'c_kamera',okulary_vr:'c_kamera',
            okulary_serca:'c_rozchwytywany',monokl:'c_elegancko2',
            skrzydla:'c_strach',jetpack:'c_strach',peleryna_zlota:'c_strach',
            was_neon:'c_truskawka',was_diamentowy:'c_elegancko2'}[id];
          if(id==='medalion_67')check67(67);
          else if(clip)vsay(clip);
          if(it.price>=1000)burstConfetti();
        }else{SFX.no();toast('Za mało diamentów! Rób questy, byku 💎');}
      }
    });
    g.appendChild(d);
  }
  drawPreview();
}
function drawPreview(){
  const c=$('prevCv').getContext('2d');c.imageSmoothingEnabled=false;
  c.clearRect(0,0,96,128);
  drawEdekBody(c,28,34,0,Math.floor(performance.now()/400)%2,2.6,S.equip);
}
setInterval(()=>{if(!$('fit').classList.contains('hidden'))drawPreview();},200);

/* =====================================================================
   RYSOWANIE: Edek v2 (jak prawdziwy G1), NPC, świat
   ===================================================================== */
function R(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function rr(c,x,y,w,h,r,col){ // zaokrąglony prostokąt
  c.fillStyle=col;c.beginPath();
  c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.fill();
}
function drawEdekHead(c,x,y,s,eq){ // portret, s = szerokość
  const u=s/12;
  rr(c,x,y,12*u,11*u,3*u,'#ece9f4');                       // głowa zaokrąglona
  rr(c,x+1.2*u,y+1.6*u,9.6*u,7.6*u,2.4*u,'#101020');       // duży ciemny ekran-twarz
  // poświata oczu
  c.fillStyle='rgba(111,216,232,.25)';
  c.fillRect(x+2.6*u,y+2.9*u,3*u,3*u);c.fillRect(x+6.6*u,y+2.9*u,3*u,3*u);
  rr(c,x+3.2*u,y+3.5*u,1.9*u,1.9*u,.9*u,'#6fd8e8');        // oczy okrągłe
  rr(c,x+7*u,y+3.5*u,1.9*u,1.9*u,.9*u,'#6fd8e8');
  c.fillStyle='#fff';c.fillRect(x+3.6*u,y+3.9*u,.6*u,.6*u);c.fillRect(x+7.4*u,y+3.9*u,.6*u,.6*u);
  drawMustache(c,x+2*u,y+6.6*u,u,eq.mustache);
  drawHat(c,x,y,u,eq.hat);
  drawGlasses(c,x,y,u,eq.glasses);
}
const mCol=id=>(ITEMS[id]&&ITEMS[id].col)||'#000';
function drawMustache(c,x,y,u,id){
  const col=mCol(id);
  if(id==='was_pod'){R(c,x+u,y,6*u,1.5*u,'#000');R(c,x,y-u,u,u,'#000');R(c,x+7*u,y-u,u,u,'#000');}
  else if(id==='was_gigant'){R(c,x-u,y,10*u,2*u,'#000');R(c,x-2*u,y-u,2*u,2*u,'#000');R(c,x+8*u,y-u,2*u,2*u,'#000');}
  else if(id==='was_neon'||id==='was_diamentowy'){R(c,x,y,8*u,1.5*u,col);R(c,x+u,y-.6*u,6*u,.6*u,'rgba(255,255,255,.55)');}
  else{R(c,x,y,8*u,1.5*u,col);R(c,x+.5*u,y+1.4*u,7*u,.5*u,'#00000066');}
}
function drawHat(c,x,y,u,id){
  if(!id)return;
  if(id==='czapka'){rr(c,x-.5*u,y-1.5*u,13*u,3*u,u,'#c8384a');R(c,x+9*u,y+.5*u,5*u,1.5*u,'#c8384a');}
  else if(id==='snapback'){rr(c,x-.5*u,y-1.8*u,13*u,3*u,u,'#1a1a24');R(c,x-3.5*u,y-.2*u,5*u,1.5*u,'#1a1a24');
    R(c,x+4*u,y-1.2*u,4*u,1.6*u,'#f5c542');}
  else if(id==='kapelusz'){R(c,x-1.5*u,y-u,15*u,1.5*u,'#1a1a24');rr(c,x+1.5*u,y-4*u,9*u,3.5*u,u,'#1a1a24');R(c,x+1.5*u,y-1.8*u,9*u,u,'#f5c542');}
  else if(id==='irokez'){for(let i=0;i<5;i++)R(c,x+(2+i*1.8)*u,y-(3.5-Math.abs(i-2)*.8)*u,1.2*u,(3.5-Math.abs(i-2)*.8)*u,i%2?'#e04848':'#6fd8e8');}
  else if(id==='korona'){R(c,x+1.5*u,y-2.5*u,9*u,2.5*u,'#f5c542');
    for(let i=0;i<3;i++){R(c,x+(2+i*3.4)*u,y-4*u,1.4*u,2*u,'#f5c542');R(c,x+(2.1+i*3.4)*u,y-3.6*u,u,u,'#e04848');}}
  else if(id==='korona_diamentowa'){R(c,x+1.5*u,y-2.5*u,9*u,2.5*u,'#e8f4ff');
    for(let i=0;i<3;i++){R(c,x+(2+i*3.4)*u,y-4*u,1.4*u,2*u,'#e8f4ff');R(c,x+(2.1+i*3.4)*u,y-3.6*u,u,u,'#6fd8e8');}}
  else if(id==='czapka_zimowa'){rr(c,x-.5*u,y-2*u,13*u,3.2*u,u,'#4a7ac8');R(c,x-.5*u,y+.4*u,13*u,u,'#ece9f4');
    c.fillStyle='#fff';c.beginPath();c.arc(x+6*u,y-2.4*u,1.4*u,0,7);c.fill();}
  else if(id==='bandana'){R(c,x-.5*u,y-1.2*u,13*u,2.4*u,'#c8384a');R(c,x+10.6*u,y+1*u,1.8*u,2.6*u,'#8a2438');
    for(let i=0;i<4;i++)R(c,x+(1+i*3)*u,y-.6*u,u,u,'#8a2438');}
  else if(id==='beret'){rr(c,x+.5*u,y-2.2*u,11*u,2.6*u,u,'#1a1a24');R(c,x+5.5*u,y-3*u,u,u,'#1a1a24');}
  else if(id==='kaszkiet'){rr(c,x-.5*u,y-2*u,12*u,2.8*u,u,'#8a5a2e');R(c,x+8.5*u,y+.2*u,5.5*u,1.4*u,'#6e4522');}
  else if(id==='kask'){rr(c,x-.5*u,y-2.6*u,13*u,3.6*u,1.4*u,'#f5c542');R(c,x-1.2*u,y+.6*u,14.4*u,u,'#e0b03a');
    R(c,x+5*u,y-2.6*u,2*u,3.2*u,'#fff7d6');}
  else if(id==='fedora_biala'){R(c,x-1.5*u,y-u,15*u,1.5*u,'#ece9f4');rr(c,x+1.5*u,y-4*u,9*u,3.5*u,u,'#ece9f4');
    R(c,x+1.5*u,y-1.8*u,9*u,u,'#f5c542');}
  else if(id==='cylinder'){R(c,x-1.5*u,y-u,15*u,1.5*u,'#1a1a24');R(c,x+2*u,y-7*u,8*u,6.5*u,'#1a1a24');
    R(c,x+2*u,y-2*u,8*u,u,'#f5c542');}
}
const GLS_COL={pilotki:'#f5c542',okulary_neon:'#6fd8e8',okulary_serca:'#e88ac8',monokl:'#f5c542',okulary_vr:'#1a1a24'};
function drawGlasses(c,x,y,u,id){
  if(!id)return;
  if(id==='monokl'){
    c.strokeStyle='#f5c542';c.lineWidth=.8*u;
    c.beginPath();c.arc(x+8.5*u,y+3.9*u,2*u,0,7);c.stroke();
    R(c,x+10.2*u,y+5.6*u,.6*u,3*u,'#f5c542');return;
  }
  if(id==='okulary_vr'){
    rr(c,x+u,y+1.8*u,10*u,4.4*u,u,'#1a1a24');
    R(c,x+2*u,y+3.2*u,8*u,1.3*u,'#6fd8e8');return;
  }
  if(id==='okulary_serca'){
    const p='#e88ac8';
    R(c,x+1.5*u,y+2.6*u,4*u,2.6*u,p);R(c,x+6.5*u,y+2.6*u,4*u,2.6*u,p);
    R(c,x+1.9*u,y+2*u,1.3*u,u,p);R(c,x+3.9*u,y+2*u,1.3*u,u,p);
    R(c,x+6.9*u,y+2*u,1.3*u,u,p);R(c,x+8.9*u,y+2*u,1.3*u,u,p);
    R(c,x+5.5*u,y+3.2*u,u,u,p);return;
  }
  const col=GLS_COL[id]||'#000';
  R(c,x+1.5*u,y+2.6*u,4*u,2.6*u,col);R(c,x+6.5*u,y+2.6*u,4*u,2.6*u,col);R(c,x+5.5*u,y+3.2*u,u,u,col);
  if(id==='pilotki'){R(c,x+2.2*u,y+3.2*u,2.6*u,1.4*u,'#8a6f1e');R(c,x+7.2*u,y+3.2*u,2.6*u,1.4*u,'#8a6f1e');}
  if(id==='okulary_neon'){R(c,x+2*u,y+3*u,3*u,.7*u,'#c8f4fc');R(c,x+7*u,y+3*u,3*u,.7*u,'#c8f4fc');}
}
/* pełna postać Edka */
const WATCH_COL=id=>{
  if(!id)return '#f5c542';
  if(id==='rolex_teczowy')return 'hsl('+Math.floor(performance.now()/12%360)+',85%,60%)';
  return (ITEMS[id]&&ITEMS[id].col)||'#f5c542';
};
const SHOE_COL={sneakersy:'#f5c542',kalosze:'#4a8a3a',glany:'#16161e',buty_neon:'#6fd8e8',buty_diament:'#f4f2ff'};
const SHOE_SPD={sneakersy:1.15,buty_neon:1.15,buty_diament:1.2};
function drawEdekBody(c,x,y,dir,f,sc,eq){
  c.save();c.translate(x,y);c.scale(sc,sc);
  const legL=f?1:0,legR=f?0:1;
  c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(8,24.6,6.5,2.2,0,0,7);c.fill();
  const isCape=eq.back==='peleryna'||eq.back==='peleryna_zlota';
  const capeCol=eq.back==='peleryna_zlota'?['#a8842e','#c9971e']:['#8a2438','#a02c44'];
  if(isCape&&dir!==3){rr(c,dir===1?9:2,10,5.5,11.5,1.5,capeCol[0]);}
  if(eq.back==='skrzydla'){
    c.fillStyle='#f4f2ff';
    if(dir===3){c.beginPath();c.ellipse(3.5,13,3,6,-.35,0,7);c.fill();
      c.beginPath();c.ellipse(12.5,13,3,6,.35,0,7);c.fill();}
    else{c.beginPath();c.ellipse(.8,12.5,2.6,5.5,-.4,0,7);c.fill();
      c.beginPath();c.ellipse(15.2,12.5,2.6,5.5,.4,0,7);c.fill();}
  }
  if(eq.back==='jetpack'){
    if(dir===3){rr(c,3.5,10.5,4,7,1.5,'#8a8aa0');rr(c,8.5,10.5,4,7,1.5,'#8a8aa0');
      R(c,4.5,17.6,2,1.4,'#f5a032');R(c,9.5,17.6,2,1.4,'#f5a032');}
    else{rr(c,.4,11,2,6.5,.8,'#8a8aa0');rr(c,13.6,11,2,6.5,.8,'#8a8aa0');
      if(Math.floor(performance.now()/150)%2){R(c,.8,17.6,1.2,2,'#f5a032');R(c,14,17.6,1.2,2,'#f5a032');}}
  }
  if(eq.back==='gitara'&&dir!==3){R(c,12.6,3.6,1.5,7,'#6e4522');R(c,12.2,2.6,2.3,1.4,'#f5c542');}
  if(eq.back==='ring_light'){
    c.strokeStyle='rgba(255,247,214,.85)';c.lineWidth=1.6;
    c.beginPath();c.arc(8,4.5,8.5,0,7);c.stroke();
    c.fillStyle='rgba(255,247,214,.12)';c.beginPath();c.arc(8,4.5,8.5,0,7);c.fill();
  }
  // nogi z przegubami
  R(c,4,19+legL,3.4,5-legL,'#3a3454');R(c,9,19+legR,3.4,5-legR,'#3a3454');
  rr(c,4,18.4+legL,3.4,2,1,'#252038');rr(c,9,18.4+legR,3.4,2,1,'#252038');
  const shoe=SHOE_COL[eq.shoes]||'#252038';
  rr(c,3.4,23+legL,4.6,1.8,.8,shoe);rr(c,8.4,23+legR,4.6,1.8,.8,shoe);
  // korpus zaokrąglony + panel
  rr(c,2.6,9.6,10.8,9.8,2,'#ece9f4');
  rr(c,4.3,11.3,7.4,4.4,1.4,'#c9c4dd');
  R(c,7,13,2,1.5,'#6fd8e8');
  rr(c,5.6,17.4,4.8,2,1,'#3a3454');       // biodro-przegub
  // ramiona: białe z ciemnym przegubem
  const wcol=WATCH_COL(eq.watch);
  if(dir===1){rr(c,1.6,11,3.4,7.4,1.4,'#d6d2e6');rr(c,1.9,13.6,2.8,1.4,.6,'#3a3454');
    if(eq.watch)R(c,1.8,16.6,3,1.8,wcol);}
  else if(dir===2){rr(c,11,11,3.4,7.4,1.4,'#d6d2e6');rr(c,11.3,13.6,2.8,1.4,.6,'#3a3454');
    if(eq.watch)R(c,11.2,16.6,3,1.8,wcol);}
  else{rr(c,1.2,11,2.8,7.4,1.2,'#d6d2e6');rr(c,12,11,2.8,7.4,1.2,'#d6d2e6');
    rr(c,1.5,13.6,2.2,1.3,.5,'#3a3454');rr(c,12.3,13.6,2.2,1.3,.5,'#3a3454');
    if(eq.watch){R(c,12.1,16.6,2.7,1.8,wcol);
      if(eq.watch==='smartwatch')R(c,12.5,16.9,1.9,1.2,'#6fd8e8');
      if(Math.floor(performance.now()/300)%3===0)R(c,14.7,16.1,1.2,1.2,'#fff7d6');}}
  if(eq.neck==='lancuch'&&dir!==3){R(c,4,10.2,8,1.2,'#f5c542');R(c,7.2,11.4,1.6,1.6,'#f5c542');}
  if(eq.neck==='lancuch_gruby'&&dir!==3){R(c,3.8,10,8.4,2,'#f5c542');R(c,6.8,12,2.4,2.4,'#f5c542');
    R(c,7.4,12.6,1.2,1.2,'#a8842e');}
  if(eq.neck==='krawat'&&dir!==3){R(c,6.9,10,2.2,1.2,'#8a2438');R(c,7.2,11.2,1.6,4.6,'#c8384a');}
  if(eq.neck==='mucha'&&dir!==3){R(c,5.6,10.1,2.2,1.9,'#1a1a24');R(c,8.2,10.1,2.2,1.9,'#1a1a24');
    R(c,7.5,10.5,1,1.1,'#c8384a');}
  if(eq.neck==='medalion_67'&&dir!==3){R(c,4.5,10.2,7,1,'#f5c542');
    c.fillStyle='#f5c542';c.beginPath();c.arc(8,13.2,2.1,0,7);c.fill();
    c.fillStyle='#241b04';c.fillRect(6.9,12.4,.9,1.6);c.fillRect(8.4,12.4,.9,1.6);}
  if(eq.neck==='naszyjnik_diament'&&dir!==3){R(c,4.5,10.2,7,1,'#c9c4dd');
    c.fillStyle='#e8f4ff';c.beginPath();c.moveTo(8,11.4);c.lineTo(9.5,13);c.lineTo(8,14.6);c.lineTo(6.5,13);c.fill();
    if(Math.floor(performance.now()/300)%3===1)R(c,8.6,11.8,.8,.8,'#fff');}
  if(eq.back==='plecak'&&dir!==3){R(c,4.4,10,1.3,6,'#3a6e2e');R(c,10.3,10,1.3,6,'#3a6e2e');}
  if(eq.neck==='zloty_play'&&dir!==3){R(c,4.5,10.2,7,1,'#c9c4dd');
    rr(c,6.2,11.2,3.6,3,.6,'#f5c542');
    c.fillStyle='#a8842e';c.beginPath();c.moveTo(7.3,12);c.lineTo(9,12.7);c.lineTo(7.3,13.4);c.fill();}
  if(eq.neck==='szalik'){R(c,3.5,9.6,9,2,'#c8384a');R(c,4.5,10,1.5,1.2,'#ece9f4');R(c,7.5,10,1.5,1.2,'#ece9f4');
    if(dir!==3)R(c,10.5,11.6,2,4,'#c8384a');}
  if(isCape&&dir===3){rr(c,2.5,10,11,11,2,capeCol[1]);}
  if(eq.back==='plecak'&&dir===3){rr(c,3.8,10.5,8.4,8,1.5,'#4a8a3a');rr(c,5.5,12,5,3,1,'#3a6e2e');}
  if(eq.back==='gitara'&&dir===3){
    c.save();c.translate(8,14);c.rotate(-.55);
    rr(c,-3,-1.5,6,7.5,2,'#8a5a2e');rr(c,-1.4,-1.4,2.8,2.8,1.4,'#503018');
    R(c,-1,-8.5,2,7.5,'#6e4522');R(c,-1.4,-9.5,2.8,1.4,'#f5c542');
    c.restore();
  }
  // GŁOWA v2 — zaokrąglona, duży ciemny ekran jak w G1
  if(dir===3){
    rr(c,2,-.5,12,10.5,3,'#ece9f4');rr(c,4,1.5,8,5.5,2,'#c9c4dd');
    drawHatBack(c,eq.hat);
  }else if(dir===0){
    rr(c,2,-.5,12,10.5,3,'#ece9f4');
    rr(c,3,1,10,7.4,2.4,'#101020');
    c.fillStyle='rgba(111,216,232,.22)';c.fillRect(4.2,2.4,3,3);c.fillRect(8.6,2.4,3,3);
    rr(c,4.8,3,1.9,1.9,.9,'#6fd8e8');rr(c,9.2,3,1.9,1.9,.9,'#6fd8e8');
    c.fillStyle='#fff';c.fillRect(5.2,3.4,.6,.6);c.fillRect(9.6,3.4,.6,.6);
    drawMustache(c,4,6.4,1,eq.mustache);
    drawHat(c,2,0,1,eq.hat);drawGlasses(c,2,0,1,eq.glasses);
  }else{
    const fl=dir===1;
    rr(c,2,-.5,12,10.5,3,'#ece9f4');
    rr(c,fl?2.4:5.6,1,8,7.2,2.4,'#101020');
    rr(c,fl?3.6:10.4,3,1.9,1.9,.9,'#6fd8e8');
    const mw=eq.mustache==='was_gigant'?6:4;
    R(c,fl?2.4:16-2.4-mw,6.4,mw,1.4,mCol(eq.mustache));
    drawHat(c,2,0,1,eq.hat);
    if(eq.glasses)R(c,fl?2.6:8.6,2.6,5,2.6,GLS_COL[eq.glasses]||'#000');
  }
  c.restore();
}
function drawHatBack(c,id){
  if(!id)return;
  if(id==='czapka')R(c,1.5,-1.5,13,2.5,'#c8384a');
  else if(id==='snapback'){R(c,1.5,-1.8,13,2.6,'#1a1a24');R(c,6,-1.2,4,1.6,'#f5c542');}
  else if(id==='kapelusz'){R(c,.5,-1,15,1.5,'#1a1a24');R(c,3.5,-4,9,3.5,'#1a1a24');}
  else if(id==='irokez')for(let i=0;i<5;i++)R(c,4+i*1.8,-(3.5-Math.abs(i-2)*.8),1.2,(3.5-Math.abs(i-2)*.8),i%2?'#e04848':'#6fd8e8');
  else if(id==='korona')R(c,3.5,-2.5,9,2.5,'#f5c542');
  else if(id==='korona_diamentowa')R(c,3.5,-2.5,9,2.5,'#e8f4ff');
  else if(id==='czapka_zimowa'){R(c,1.5,-2,13,3,'#4a7ac8');R(c,1.5,.4,13,1,'#ece9f4');
    c.fillStyle='#fff';c.beginPath();c.arc(8,-2.4,1.4,0,7);c.fill();}
  else if(id==='bandana'){R(c,1.5,-1.2,13,2.4,'#c8384a');R(c,6.5,1,3,3.5,'#8a2438');}
  else if(id==='beret')R(c,2,-2.2,11,2.6,'#1a1a24');
  else if(id==='kaszkiet')R(c,1.5,-2,12,2.8,'#8a5a2e');
  else if(id==='kask')R(c,1,-2.6,14,3.6,'#f5c542');
  else if(id==='fedora_biala'){R(c,.5,-1,15,1.5,'#ece9f4');R(c,3.5,-4,9,3.5,'#ece9f4');}
  else if(id==='cylinder'){R(c,.5,-1,15,1.5,'#1a1a24');R(c,4,-7,8,6.5,'#1a1a24');}
}
function drawItemIcon(c,id){
  c.imageSmoothingEnabled=false;c.clearRect(0,0,28,28);
  const it=ITEMS[id];
  if(it.slot==='mustache')drawMustache(c,6,13,2,id);
  else if(it.slot==='hat')drawHat(c,2,14,2,id);
  else if(it.slot==='glasses')drawGlasses(c,2,5,2,id);
  /* --- szyja --- */
  else if(id==='lancuch'){R(c,6,8,16,3,'#f5c542');R(c,12,11,4,4,'#f5c542');}
  else if(id==='lancuch_gruby'){R(c,5,7,18,5,'#f5c542');R(c,10,12,8,7,'#f5c542');R(c,12,14,4,3,'#a8842e');}
  else if(id==='szalik'){R(c,5,8,18,5,'#c8384a');R(c,17,13,5,9,'#c8384a');}
  else if(id==='krawat'){R(c,10,4,8,4,'#8a2438');R(c,11,8,6,14,'#c8384a');
    c.fillStyle='#c8384a';c.beginPath();c.moveTo(11,22);c.lineTo(14,26);c.lineTo(17,22);c.fill();}
  else if(id==='mucha'){R(c,4,9,8,9,'#1a1a24');R(c,16,9,8,9,'#1a1a24');R(c,12,11,4,5,'#c8384a');}
  else if(id==='medalion_67'){R(c,9,4,10,2,'#f5c542');
    c.fillStyle='#f5c542';c.beginPath();c.arc(14,15,8,0,7);c.fill();
    c.fillStyle='#241b04';c.fillRect(10,11,3,7);c.fillRect(15,11,3,7);}
  else if(id==='naszyjnik_diament'){R(c,8,4,12,2,'#c9c4dd');
    c.fillStyle='#e8f4ff';c.beginPath();c.moveTo(14,8);c.lineTo(21,15);c.lineTo(14,23);c.lineTo(7,15);c.fill();
    R(c,15,10,2,2,'#fff');}
  else if(id==='zloty_play'){rr(c,5,7,18,14,2,'#f5c542');
    c.fillStyle='#a8842e';c.beginPath();c.moveTo(11,10);c.lineTo(18,14);c.lineTo(11,18);c.fill();
    R(c,12,21,4,3,'#c9c4dd');}
  /* --- zegarki --- */
  else if(id==='rolex_d'){R(c,9,4,10,4,'#a8842e');R(c,9,20,10,4,'#a8842e');R(c,6,8,16,12,'#f5c542');R(c,10,11,8,6,'#fff7d6');}
  else if(id==='rolex_teczowy'){R(c,9,4,10,4,'#555a70');R(c,9,20,10,4,'#555a70');
    ['#e04848','#f5a032','#f5c542','#7bc950','#6fd8e8','#8a6fc8'].forEach((cl,i)=>R(c,6,8+i*2,16,2,cl));
    R(c,10,11,8,6,'#fff7d6');}
  else if(it.slot==='watch'){const wc=it.col||'#f5c542';
    R(c,9,4,10,4,'#555a70');R(c,9,20,10,4,'#555a70');R(c,6,8,16,12,wc);
    R(c,10,11,8,6,id==='smartwatch'?'#6fd8e8':'#fff7d6');}
  /* --- plecy --- */
  else if(id==='peleryna'){R(c,6,4,16,20,'#a02c44');R(c,4,4,20,4,'#8a2438');}
  else if(id==='peleryna_zlota'){R(c,6,4,16,20,'#c9971e');R(c,4,4,20,4,'#a8842e');R(c,8,6,3,16,'#f5c542');}
  else if(id==='plecak'){rr(c,6,6,16,17,3,'#4a8a3a');rr(c,10,10,8,6,2,'#3a6e2e');R(c,8,3,3,5,'#3a6e2e');R(c,17,3,3,5,'#3a6e2e');}
  else if(id==='gitara'){rr(c,8,12,12,13,4,'#8a5a2e');c.fillStyle='#503018';c.beginPath();c.arc(14,18,3,0,7);c.fill();
    R(c,12,2,4,12,'#6e4522');R(c,11,1,6,3,'#f5c542');}
  else if(id==='skrzydla'){c.fillStyle='#f4f2ff';
    c.beginPath();c.ellipse(8,14,5,10,-.3,0,7);c.fill();
    c.beginPath();c.ellipse(20,14,5,10,.3,0,7);c.fill();
    c.fillStyle='#c9c4dd';R(c,13,6,2,16,'#c9c4dd');}
  else if(id==='jetpack'){rr(c,5,4,8,16,3,'#8a8aa0');rr(c,15,4,8,16,3,'#8a8aa0');
    R(c,7,20,4,5,'#f5a032');R(c,17,20,4,5,'#f5a032');R(c,7,6,2,10,'#b8bcd0');R(c,17,6,2,10,'#b8bcd0');}
  else if(id==='ring_light'){c.strokeStyle='#fff7d6';c.lineWidth=3;
    c.beginPath();c.arc(14,11,8,0,7);c.stroke();
    R(c,13,19,2,7,'#8a8aa0');R(c,9,25,10,2,'#8a8aa0');}
  /* --- buty --- */
  else if(it.slot==='shoes'){const sc2=SHOE_COL[id]||'#252038';
    R(c,4,16,20,7,sc2);R(c,4,14,8,4,id==='glany'?'#c8384a':'#fff7d6');
    if(id==='kalosze')R(c,6,8,6,8,sc2);
    if(id==='buty_diament')R(c,18,17,3,2,'#fff');}
}
/* DYCH DZIKI — drugi robot z YT (kanoniczny wygląd z shortów Edka):
   biały robot G1, czarna czapka z daszkiem, czarna koszulka „DYCH DZIKI” */
function drawDychBody(c,x,y,dir,f){
  c.save();c.translate(x,y);
  const legL=f?1:0,legR=f?0:1;
  c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(8,24.6,6.5,2.2,0,0,7);c.fill();
  // białe nogi robota
  R(c,4,19+legL,3.4,5-legL,'#d6d2e6');R(c,9,19+legR,3.4,5-legR,'#d6d2e6');
  rr(c,4,18.4+legL,3.4,2,1,'#3a3454');rr(c,9,18.4+legR,3.4,2,1,'#3a3454'); // przeguby
  rr(c,3.4,23+legL,4.6,1.8,.8,'#1a1a24');rr(c,8.4,23+legR,4.6,1.8,.8,'#1a1a24'); // czarne buty
  // korpus — czarna koszulka „DYCH DZIKI” na białym robocie
  rr(c,2.6,9.6,10.8,9.8,2,'#ece9f4');
  rr(c,3.2,10,9.6,7.2,1.6,'#16161e');                 // koszulka
  c.fillStyle='#ece9f4';c.font='3.4px monospace';      // napis DD
  R(c,5.2,11.4,2.2,.9,'#ece9f4');R(c,8.6,11.4,2.2,.9,'#ece9f4');
  R(c,5.2,13,2.2,.9,'#c9c4dd');R(c,8.6,13,2.2,.9,'#c9c4dd');
  rr(c,5.6,17.4,4.8,2,1,'#3a3454');                    // biodro-przegub
  // białe ramiona z przegubem
  if(dir===1){rr(c,1.6,11,3.4,7.4,1.4,'#d6d2e6');rr(c,1.9,13.6,2.8,1.4,.6,'#3a3454');}
  else if(dir===2){rr(c,11,11,3.4,7.4,1.4,'#d6d2e6');rr(c,11.3,13.6,2.8,1.4,.6,'#3a3454');}
  else{rr(c,1.2,11,2.8,7.4,1.2,'#d6d2e6');rr(c,12,11,2.8,7.4,1.2,'#d6d2e6');
    rr(c,1.5,13.6,2.2,1.3,.5,'#3a3454');rr(c,12.3,13.6,2.2,1.3,.5,'#3a3454');}
  // złoty łańcuch na koszulce
  if(dir!==3){R(c,4.5,10.2,7,1,'#f5c542');R(c,7.2,11.2,1.6,1.6,'#f5c542');}
  // GŁOWA — biała jak G1, ciemny wizjer, bursztynowe oczy
  if(dir===3){
    rr(c,2,-.5,12,10.5,3,'#ece9f4');rr(c,4,1.5,8,5.5,2,'#c9c4dd');
    R(c,1.5,-1.6,13,2.6,'#16161e');                    // czapka z tyłu
  }else if(dir===0){
    rr(c,2,-.5,12,10.5,3,'#ece9f4');
    rr(c,3,1,10,7.4,2.4,'#0e1420');
    c.fillStyle='rgba(245,160,50,.22)';c.fillRect(4.2,2.4,3,3);c.fillRect(8.6,2.4,3,3);
    rr(c,4.8,3,1.9,1.9,.9,'#f5a032');rr(c,9.2,3,1.9,1.9,.9,'#f5a032'); // bursztynowe oczy
    c.fillStyle='#fff';c.fillRect(5.2,3.4,.6,.6);c.fillRect(9.6,3.4,.6,.6);
    R(c,5.6,6.7,4.8,1.1,'#f5a032');                    // pasek-uśmiech
    rr(c,1.5,-1.8,13,2.8,1,'#16161e');R(c,4,-2.6,8,1.6,'#16161e'); // czapka + daszek w przód
  }else{
    const fl=dir===1;
    rr(c,2,-.5,12,10.5,3,'#ece9f4');
    rr(c,fl?2.4:5.6,1,8,7.2,2.4,'#0e1420');
    rr(c,fl?3.6:10.4,3,1.9,1.9,.9,'#f5a032');
    R(c,fl?3.2:9.4,6.7,3.4,1.1,'#f5a032');
    rr(c,1.5,-1.8,13,2.8,1,'#16161e');R(c,fl?-1.5:12.5,-.6,5,1.6,'#16161e'); // daszek w bok
  }
  c.restore();
}
/* GRAŻYNKA 3000 — robotka-kucharka: czepek, zielony fartuch, chochla */
function drawGrazynkaBody(c,x,y,dir,f){
  c.save();c.translate(x,y);
  const legL=f?1:0,legR=f?0:1;
  c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(8,24.6,6.5,2.2,0,0,7);c.fill();
  R(c,4,19+legL,3.4,5-legL,'#3a3454');R(c,9,19+legR,3.4,5-legR,'#3a3454');
  rr(c,3.4,23+legL,4.6,1.8,.8,'#7bc950');rr(c,8.4,23+legR,4.6,1.8,.8,'#7bc950');
  // korpus + zielony fartuch w kratkę
  rr(c,2.6,9.6,10.8,9.8,2,'#ece9f4');
  rr(c,3.6,10.4,8.8,8.4,1.4,'#4a8a3a');
  R(c,4.4,11.2,7.2,.8,'#7bc950');R(c,4.4,13.4,7.2,.8,'#7bc950');R(c,4.4,15.6,7.2,.8,'#7bc950');
  rr(c,6,12,4,3.4,1,'#e8dcc0');                        // kieszonka
  // ramiona
  if(dir===1){rr(c,1.6,11,3.4,7.4,1.4,'#d6d2e6');}
  else if(dir===2){rr(c,11,11,3.4,7.4,1.4,'#d6d2e6');}
  else{rr(c,1.2,11,2.8,7.4,1.2,'#d6d2e6');rr(c,12,11,2.8,7.4,1.2,'#d6d2e6');}
  // CHOCHLA w prawej ręce
  if(dir!==1){R(c,13.6,10,1.2,7,'#8a8aa0');c.fillStyle='#8a8aa0';
    c.beginPath();c.arc(14.2,17.6,2.2,0,7);c.fill();
    c.fillStyle='#c9944a';c.beginPath();c.arc(14.2,17.2,1.4,0,7);c.fill();}
  // głowa — ciemny wizjer, ciepłe zielone oczy + czepek kucharski
  if(dir===3){
    rr(c,2,-.5,12,10.5,3,'#ece9f4');rr(c,4,1.5,8,5.5,2,'#c9c4dd');
  }else if(dir===0){
    rr(c,2,-.5,12,10.5,3,'#ece9f4');
    rr(c,3,1,10,7.4,2.4,'#101a14');
    rr(c,4.8,3,1.9,1.9,.9,'#7bc950');rr(c,9.2,3,1.9,1.9,.9,'#7bc950');
    c.fillStyle='#fff';c.fillRect(5.2,3.4,.6,.6);c.fillRect(9.6,3.4,.6,.6);
    R(c,5.6,6.7,4.8,1.1,'#7bc950');
    // rzęsy-mrugnięcie ;)
    R(c,4.4,2.6,2.6,.6,'#7bc950');R(c,9,2.6,2.6,.6,'#7bc950');
  }else{
    const fl=dir===1;
    rr(c,2,-.5,12,10.5,3,'#ece9f4');
    rr(c,fl?2.4:5.6,1,8,7.2,2.4,'#101a14');
    rr(c,fl?3.6:10.4,3,1.9,1.9,.9,'#7bc950');
    R(c,fl?3.2:9.4,6.7,3.4,1.1,'#7bc950');
  }
  // czepek kucharski
  rr(c,3,-3.4,10,3.6,1.6,'#fff');
  c.fillStyle='#fff';c.beginPath();c.arc(5,-3.4,2,0,7);c.arc(8,-4.2,2.3,0,7);c.arc(11,-3.4,2,0,7);c.fill();
  c.restore();
}
/* ludzie z drużyny: Jarek / Zenek / Julka / Bogdan */
const HUMAN_CFG={
  jarek:{body:'#8a6fc8',pants:'#33304a',hair:'#c0c0c0',skin:'#e8c9a0',prop:'watch'},
  zenek:{body:'#7a7a8a',pants:'#4a4658',hair:'#888',skin:'#e8c9a0',prop:'mask'},
  julka:{body:'#e88ac8',pants:'#a05a88',hair:'#f0d060',skin:'#e8c9a0',prop:'heart'},
  bogdan:{body:'#3a5a7a',pants:'#2a3e54',hair:'#ddd',skin:'#d8b890',prop:'rod'},
};
function drawHumanChar(c,id,x,y,dir,f){
  const cfg=HUMAN_CFG[id];
  c.save();c.translate(x,y);
  const legL=f?1:0,legR=f?0:1;
  c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(8,24.6,6.5,2.2,0,0,7);c.fill();
  R(c,4,19+legL,3.4,5-legL,cfg.pants);R(c,9,19+legR,3.4,5-legR,cfg.pants);
  rr(c,3.4,23+legL,4.6,1.8,.8,'#1a1a24');rr(c,8.4,23+legR,4.6,1.8,.8,'#1a1a24');
  rr(c,2.6,9.8,10.8,9.6,2.4,cfg.body);
  if(dir===1){rr(c,1.6,11,3.2,7,1.4,cfg.body);rr(c,2,16.4,2.6,2.4,1,cfg.skin);}
  else if(dir===2){rr(c,11.2,11,3.2,7,1.4,cfg.body);rr(c,11.4,16.4,2.6,2.4,1,cfg.skin);}
  else{rr(c,1.2,11,2.8,7,1.2,cfg.body);rr(c,12,11,2.8,7,1.2,cfg.body);
    rr(c,1.5,16.4,2.2,2.2,1,cfg.skin);rr(c,12.3,16.4,2.2,2.2,1,cfg.skin);}
  // głowa
  rr(c,3,-.5,10,9.5,2.6,cfg.skin);
  if(dir===3){rr(c,2.6,-1.5,10.8,7,2.4,cfg.hair);}
  else{
    rr(c,2.6,-1.5,10.8,3.6,1.6,cfg.hair);
    if(id==='julka'){R(c,2.6,0,1.8,7.5,cfg.hair);R(c,11.6,0,1.8,7.5,cfg.hair);}
    if(id==='bogdan'){R(c,3.6,6.2,8.8,3.4,cfg.hair);}          // broda
    if(dir===0){R(c,5.4,3.4,1.8,1.8,'#222');R(c,8.8,3.4,1.8,1.8,'#222');}
    else{const fl=dir===1;R(c,fl?4.4:9.8,3.4,1.8,1.8,'#222');}
  }
  // rekwizyty
  if(cfg.prop==='watch'&&dir!==3)R(c,dir===1?2:11.4,15.4,2.6,1.6,'#f5c542');
  if(cfg.prop==='mask'){rr(c,2.4,-3.2,11.2,3.4,1.2,'#3a3444');R(c,4.4,-2.4,7.2,1.6,'#16324a');}
  if(cfg.prop==='heart'&&dir!==3){c.fillStyle='#e04868';
    c.beginPath();c.arc(12.6,10.6,1.2,0,7);c.arc(14.2,10.6,1.2,0,7);c.fill();
    c.beginPath();c.moveTo(11.5,11.2);c.lineTo(13.4,13.4);c.lineTo(15.3,11.2);c.fill();}
  if(cfg.prop==='rod'){rr(c,2.2,-4.5,11.6,2.6,1.2,'#e8c95a');R(c,1,-3.4,14,1,'#c9a83a'); // kapelusz
    if(dir!==3){R(c,13.4,2,1,14,'#8a6a42');R(c,13.9,2,3.4,.7,'#8a6a42');}}
  c.restore();
}
/* dispatcher: rysuj dowolną postać z CHARS */
function drawCharBody(c,id,x,y,dir,f){
  if(id==='dych')drawDychBody(c,x,y,dir,f);
  else if(id==='grazynka')drawGrazynkaBody(c,x,y,dir,f);
  else if(HUMAN_CFG[id])drawHumanChar(c,id,x,y,dir,f);
  else drawEdekBody(c,x,y,dir,f,1,S?S.equip:DEFAULT_SAVE.equip);
}
/* portal domeny */
function drawPortal(px,py,col,label){
  if(px<-40||px>W+40||py<-40||py>H+40)return;
  cx.save();cx.translate(px,py);
  cx.fillStyle=col+'33';cx.beginPath();cx.arc(0,0,13+Math.sin(anim*3)*2,0,7);cx.fill();
  for(let i=0;i<3;i++){
    cx.strokeStyle=i===1?'#fff':col;cx.lineWidth=2-i*.4;cx.globalAlpha=.85-i*.2;
    cx.beginPath();cx.arc(0,0,5+i*3.4,anim*(2+i)+(i*2),anim*(2+i)+i*2+4.2);cx.stroke();
  }
  cx.globalAlpha=1;
  cx.fillStyle='#0e0c1c';cx.beginPath();cx.arc(0,0,3.4,0,7);cx.fill();
  cx.restore();
  cx.font='6px "Press Start 2P"';cx.textAlign='center';
  cx.fillStyle='#000';cx.fillText(label,px+1,py-17);
  cx.fillStyle=col;cx.fillText(label,px,py-18);cx.textAlign='left';
}
/* skrzynia z nagrodami */
function drawChest(sx,sy,open){
  cx.save();cx.translate(sx,sy);
  if(!open){const g=1+Math.sin(anim*4)*.4;
    cx.fillStyle='rgba(245,197,66,.18)';cx.beginPath();cx.arc(0,0,14*g,0,7);cx.fill();}
  rr(cx,-9,-6,18,12,2,'#8a5a2a');
  rr(cx,-9,open?-14:-8,18,6,2,open?'#a06a34':'#a06a34');
  R(cx,-9,-2,18,1.6,'#f5c542');R(cx,-1.6,open?-14:-4,3.2,open?4:5,'#f5c542');
  if(open){cx.fillStyle='rgba(255,247,214,.7)';
    for(let i=0;i<4;i++)R(cx,-6+i*4,-18-Math.sin(anim*5+i)*3,2,2,'#fff7d6');}
  cx.restore();
}
/* BOSSOWIE — duże sprite'y */
function drawBoss(f,sx,sy){
  const bob=f.stun>0?0:Math.sin(anim*5)*1.2;
  if(f.flash>0)cx.globalAlpha=.6;
  cx.save();cx.translate(sx,sy+bob);
  if(f.t==='krol'){ // KRÓL DZIKÓW — wielki dzik w koronie
    cx.save();cx.scale(2.2,2.2);cx.translate(-9,-9);
    drawBoarTop(cx,{dx:P.x<f.x?-1:1,t:anim},0,0);
    cx.restore();
    R(cx,-8,-26,16,7,'#f5c542');
    for(let i=0;i<3;i++){R(cx,-7+i*6,-31,3,5,'#f5c542');R(cx,-6.4+i*6,-30,1.8,1.8,'#e04848');}
    R(cx,P.x<f.x?-16:11,-6,5,3,'#c02020'); // czerwone ślepia
  }else if(f.t==='mdres'){ // MEGA DRES — dres 2×, czerwony kaptur, kettlebell
    cx.save();cx.scale(2,2);cx.translate(-8,-20);
    const td=FOE_TYPES.mdres;
    R(cx,4,18,3,6,'#1a1a24');R(cx,9,18,3,6,'#1a1a24');
    rr(cx,2,8,12,11,2,td.c);
    R(cx,2.8,9,1.4,9,'#c8384a');R(cx,11.8,9,1.4,9,'#c8384a'); // czerwone lampasy
    rr(cx,4,0,8,8,2.4,td.skin);
    rr(cx,3,-2,10,5,2,td.hood);R(cx,3,2,1.5,5,td.hood);R(cx,11.5,2,1.5,5,td.hood);
    R(cx,5.5,3,2,1.5,'#c02020');R(cx,8.5,3,2,1.5,'#c02020');
    cx.restore();
    // kettlebell w łapie
    rr(cx,12,2,11,10,4,'#2a2a34');
    cx.strokeStyle='#2a2a34';cx.lineWidth=3;
    cx.beginPath();cx.arc(17.5,0,4,Math.PI,0);cx.stroke();
  }else if(f.t==='smok'){ // SMOK WAWELSKI — zielony, zieje ogniem
    const fl=P.x<f.x;
    // ogon
    cx.strokeStyle='#3a7a4a';cx.lineWidth=6;cx.beginPath();
    cx.moveTo(fl?14:-14,4);cx.quadraticCurveTo(fl?26:-26,-2+Math.sin(anim*3)*4,fl?32:-32,8);cx.stroke();
    cx.fillStyle='#2e6236';cx.beginPath();cx.moveTo(fl?32:-32,8);
    cx.lineTo(fl?40:-40,4);cx.lineTo(fl?36:-36,14);cx.fill();
    // skrzydła
    cx.fillStyle='rgba(90,40,60,.85)';
    const wb=Math.sin(anim*6)*6;
    cx.beginPath();cx.moveTo(0,-14);cx.lineTo(-20,-26-wb);cx.lineTo(-8,-8);cx.fill();
    cx.beginPath();cx.moveTo(0,-14);cx.lineTo(20,-26-wb);cx.lineTo(8,-8);cx.fill();
    // korpus + brzuch
    cx.fillStyle='#3a7a4a';cx.beginPath();cx.ellipse(0,0,15,17,0,0,7);cx.fill();
    cx.fillStyle='#7bc950';cx.beginPath();cx.ellipse(0,4,9,11,0,0,7);cx.fill();
    for(let i=0;i<3;i++)R(cx,-6,-2+i*6,12,2,'#5aa838');
    // łeb + rogi + ślepia
    cx.fillStyle='#3a7a4a';cx.beginPath();cx.ellipse(fl?-10:10,-16,9,7,0,0,7);cx.fill();
    cx.fillStyle='#ece9f4';
    cx.beginPath();cx.moveTo(fl?-14:14,-22);cx.lineTo(fl?-18:18,-30);cx.lineTo(fl?-10:10,-24);cx.fill();
    cx.fillStyle='#c02020';cx.beginPath();cx.arc(fl?-13:13,-17,2,0,7);cx.fill();
    // dym / ogień z nozdrzy
    if(Math.floor(anim*4)%2){cx.fillStyle='rgba(245,160,50,.7)';
      cx.beginPath();cx.arc(fl?-19:19,-14,2.5,0,7);cx.fill();}
  }else if(f.t==='yeti'){ // YETI Z GIEWONTU — wielki, biały, futrzasty
    cx.fillStyle='#d8d4e8';cx.beginPath();cx.ellipse(0,2,16,19,0,0,7);cx.fill();
    cx.fillStyle='#ece9f4';cx.beginPath();cx.ellipse(0,0,13,16,0,0,7);cx.fill();
    // futro — kłaczki
    cx.strokeStyle='#d8d4e8';cx.lineWidth=1.5;
    for(let i=0;i<8;i++){const a=i/8*6.28;
      cx.beginPath();cx.moveTo(Math.cos(a)*13,Math.sin(a)*16);
      cx.lineTo(Math.cos(a)*17,Math.sin(a)*20+Math.sin(anim*5+i)*1.5);cx.stroke();}
    // łapy
    cx.fillStyle='#ece9f4';cx.beginPath();cx.arc(-16,6+Math.sin(anim*7)*3,6,0,7);cx.fill();
    cx.beginPath();cx.arc(16,6-Math.sin(anim*7)*3,6,0,7);cx.fill();
    // twarz
    cx.fillStyle='#8faabf';cx.beginPath();cx.ellipse(0,-8,8,7,0,0,7);cx.fill();
    cx.fillStyle='#c02020';cx.beginPath();cx.arc(-3.5,-10,1.8,0,7);cx.arc(3.5,-10,1.8,0,7);cx.fill();
    R(cx,-4,-4,8,1.6,'#16324a');
    cx.fillStyle='#ece9f4';R(cx,-3,-3,2,2.4,'#ece9f4');R(cx,1,-3,2,2.4,'#ece9f4'); // kły
    // sopelki na futrze
    if(Math.floor(anim*2)%2){cx.fillStyle='#bfe8f4';R(cx,-8,14,2,4,'#bfe8f4');R(cx,7,13,2,5,'#bfe8f4');}
  }else{ // KRAKEN BAŁTYCKI — zielony łeb + macki
    cx.fillStyle='#2a6a5a';
    for(let i=0;i<6;i++){ // macki
      const a=i/6*6.28+anim*.8;
      cx.beginPath();cx.moveTo(0,2);
      const mx=Math.cos(a)*18,my=6+Math.sin(a)*6;
      cx.quadraticCurveTo(mx*.6,my+Math.sin(anim*6+i)*5,mx,my+Math.sin(anim*4+i)*4);
      cx.lineWidth=5;cx.strokeStyle='#2a6a5a';cx.stroke();
      cx.fillStyle='#3a8a72';cx.beginPath();
      cx.arc(mx,my+Math.sin(anim*4+i)*4,3,0,7);cx.fill();
    }
    cx.fillStyle='#2a6a5a';cx.beginPath();cx.ellipse(0,-8,13,15,0,0,7);cx.fill();
    cx.fillStyle='#3a8a72';cx.beginPath();cx.ellipse(-4,-12,5,7,0,0,7);cx.fill();
    // ślepia
    cx.fillStyle='#fff7d6';cx.beginPath();cx.arc(-5,-8,3.4,0,7);cx.arc(5,-8,3.4,0,7);cx.fill();
    cx.fillStyle='#c02020';cx.beginPath();cx.arc(-4.4,-8,1.7,0,7);cx.arc(5.6,-8,1.7,0,7);cx.fill();
    R(cx,-4,-1,8,1.4,'#16324a');
  }
  cx.restore();
  cx.globalAlpha=1;
  if(f.stun>0)for(let i=0;i<3;i++){const a=anim*4+i*2.1;
    R(cx,sx+Math.cos(a)*12-1,sy-30+Math.sin(a)*3,3,3,'#f5c542');}
}
/* HEJTER / DRES / ZAZDROŚNIK */
function drawFoe(f,sx,sy){
  const td=FOE_TYPES[f.t];
  const bob=f.stun>0?0:Math.sin(anim*7+f.x)*0.6;
  if(f.flash>0){cx.globalAlpha=.6;}
  cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(sx+8,sy+24,6,2,0,0,7);cx.fill();
  R(cx,sx+4,sy+18,3,6,'#1a1a24');R(cx,sx+9,sy+18,3,6,'#1a1a24');
  rr(cx,sx+3,sy+9+bob,10,10,2,td.c);
  if(f.t==='dres'){R(cx,sx+3.6,sy+9.6+bob,1.2,8,'#ece9f4');R(cx,sx+11.2,sy+9.6+bob,1.2,8,'#ece9f4');}
  rr(cx,sx+4,sy+1+bob,8,8,2.4,td.skin);
  // kaptur / czapka
  if(f.t==='hejter'){rr(cx,sx+3,sy-1+bob,10,5,2,td.hood);R(cx,sx+3,sy+3+bob,1.5,4,td.hood);R(cx,sx+11.5,sy+3+bob,1.5,4,td.hood);}
  else if(f.t==='zazdrosnik'){rr(cx,sx+3.5,sy-.5+bob,9,3,1.4,td.hood);R(cx,sx+1,sy+1.5+bob,4,1.5,td.hood);}
  else{rr(cx,sx+3.5,sy-.5+bob,9,3.2,1.4,td.hood);}
  // złe oczka + telefon (nagrywa hejt)
  R(cx,sx+5.5,sy+4+bob,2,1.5,'#c02020');R(cx,sx+8.5,sy+4+bob,2,1.5,'#c02020');
  R(cx,sx+12,sy+11+bob,3,5,'#1a1a24');R(cx,sx+12.5,sy+11.5+bob,2,3.5,'#6fd8e8');
  if(f.flash>0)cx.globalAlpha=1;
  if(f.stun>0){ // gwiazdki nad głową
    for(let i=0;i<3;i++){const a=anim*4+i*2.1;
      R(cx,sx+8+Math.cos(a)*8-1,sy-6+Math.sin(a)*2,2,2,'#f5c542');}
  }
  // pasek HP + aura żywiołu
  {const m=f.hp0||FOE_TYPES[f.t].hp,fr=Math.max(0,f.hp/m);
   if(fr<1){R(cx,sx+1,sy-4,14,3,'rgba(0,0,0,.55)');
     R(cx,sx+1.5,sy-3.5,13*fr,2,fr>.5?'#7bc950':fr>.25?'#f5c542':'#e04848');}}
  if(f.aura){const ec=ELEMENTS[f.aura.el].col;
    cx.fillStyle=ec;cx.beginPath();cx.arc(sx+8,sy-8,2.2+Math.sin(anim*6)*.5,0,7);cx.fill();
    cx.fillStyle='rgba(255,255,255,.7)';cx.fillRect(sx+7.4,sy-8.6,1.2,1.2);}
  if(f.guard){cx.strokeStyle='#8a6fc8';cx.lineWidth=1.5;cx.globalAlpha=.6;
    cx.beginPath();cx.arc(sx+8,sy+10,15+Math.sin(anim*4)*2,0,7);cx.stroke();cx.globalAlpha=1;}
}
function drawNPC(c,n,sx,sy){
  if(n.robo){ // Dych jako NPC (zanim dołączy do ekipy)
    drawDychBody(c,sx,sy,0,Math.floor(anim*2)%2);
    const q=Object.entries(QUESTS).find(([id,qq])=>qq.giver===n.id);
    const avail=q&&qs(q[0])===0,active=q&&qs(q[0])===1;
    if((avail||active)&&Math.floor(anim*2)%2===0){
      c.font='8px "Press Start 2P"';c.fillStyle=avail?'#f5c542':'#6fd8e8';
      c.fillText(avail?'!':'…',sx+6,sy-6);
    }
    return;
  }
  return drawNPCHuman(c,n,sx,sy);
}
function drawNPCHuman(c,n,sx,sy){
  const bob=Math.sin(anim*2+n.x)*0.5;
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(sx+8,sy+24,6,2,0,0,7);c.fill();
  R(c,sx+4,sy+18,3,6,'#33304a');R(c,sx+9,sy+18,3,6,'#33304a');
  rr(c,sx+3,sy+9+bob,10,10,2,n.c);
  rr(c,sx+4,sy+1+bob,8,8,2.4,'#e8c9a0');
  rr(c,sx+3.5,sy-.5+bob,9,3.2,1.4,n.hair);
  R(c,sx+6,sy+4+bob,1.5,1.5,'#222');R(c,sx+9,sy+4+bob,1.5,1.5,'#222');
  const q=Object.entries(QUESTS).find(([id,qq])=>qq.giver===n.id);
  const avail=q&&qs(q[0])===0,active=q&&qs(q[0])===1;
  if((avail||active||(n.id==='spawacz'&&S.trip===1))&&Math.floor(anim*2)%2===0){
    c.font='8px "Press Start 2P"';c.fillStyle=avail?'#f5c542':'#6fd8e8';
    c.fillText(avail?'!':'…',sx+6,sy-6);
  }
}
function drawCarE(c2,sx,sy){
  if(c2.h){
    cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse(sx+12,sy+10,13,3,0,0,7);cx.fill();
    rr(cx,sx,sy,24,9,2.5,c2.c);rr(cx,sx+5,sy-4,13,6,2,c2.c);
    R(cx,sx+6,sy-3,5,4,'#a8d8f0');R(cx,sx+12,sy-3,5,4,'#a8d8f0');
    R(cx,sx+3,sy+8,5,3,'#1a1a24');R(cx,sx+16,sy+8,5,3,'#1a1a24');
    R(cx,c2.v>0?sx+22:sx,sy+2,2,3,'#fff7d6');
  }else{
    cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse(sx+5,sy+21,6,3,0,0,7);cx.fill();
    rr(cx,sx,sy,10,22,2.5,c2.c);R(cx,sx+1,sy+6,8,7,'#a8d8f0');
    R(cx,sx-1,sy+2,2,5,'#1a1a24');R(cx,sx+9,sy+2,2,5,'#1a1a24');
    R(cx,sx-1,sy+15,2,5,'#1a1a24');R(cx,sx+9,sy+15,2,5,'#1a1a24');
    R(cx,sx+2,c2.v>0?sy+20:sy,2,2,'#fff7d6');R(cx,sx+6,c2.v>0?sy+20:sy,2,2,'#fff7d6');
  }
}
function drawPed(p,sx,sy){
  const bob=Math.sin(anim*7+p.x)*0.6;
  cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse(sx+4,sy+18,4,1.6,0,0,7);cx.fill();
  R(cx,sx+1,sy+13,2.5,5,'#33304a');R(cx,sx+4.5,sy+13,2.5,5,'#33304a');
  rr(cx,sx,sy+6+bob,8,8,2,p.c);
  rr(cx,sx+1,sy+bob,6,6,2,'#e8c9a0');rr(cx,sx+.5,sy-1+bob,7,2.5,1,p.hair);
}
function drawPigeon(g,sx,sy){
  const sea=REG==='morze';
  const b1=sea?'#ece9f4':'#9a97b0',b2=sea?'#d8d4e8':'#8a87a0',w=sea?'#fff':'#c5c2d8';
  R(cx,sx,sy,5,4,b1);R(cx,sx+4,sy-2,3,3,b2);R(cx,sx+6.5,sy-1,1.5,1,sea?'#f5a032':'#f5c542');
  if(g.st===1&&Math.floor(anim*12)%2)R(cx,sx-1,sy-3,5,2,w);
  else R(cx,sx+1,sy+1,3,2,b2);
  R(cx,sx+1,sy+4,1,2,'#c86f6f');R(cx,sx+3,sy+4,1,2,'#c86f6f');
}
function drawSelfieGirl(sx,sy){
  const bob=Math.sin(anim*8)*0.7;
  cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.ellipse(sx+6,sy+22,5,2,0,0,7);cx.fill();
  R(cx,sx+2,sy+16,3,6,'#33304a');R(cx,sx+7,sy+16,3,6,'#33304a');
  rr(cx,sx+1,sy+8+bob,10,9,2,'#e88ac8');
  rr(cx,sx+2,sy+bob,8,8,2,'#e8c9a0');
  rr(cx,sx+1,sy-2+bob,10,4,1.6,'#f0d060');R(cx,sx+9,sy+2+bob,2,7,'#f0d060');
  R(cx,sx+4,sy+3+bob,1.5,1.5,'#222');R(cx,sx+7,sy+3+bob,1.5,1.5,'#222');
  R(cx,sx+11,sy-4+bob,4,7,'#1a1a24');R(cx,sx+11.8,sy-3.2+bob,2.4,5,'#6fd8e8');
  if(selfie&&selfie.st==='wait'&&Math.floor(anim*2)%2===0){
    cx.font='8px "Press Start 2P"';cx.fillStyle='#e88ac8';cx.fillText('!',sx+4,sy-8);
  }
}
function drawBoarTop(c,b,sx,sy){
  const tr=Math.sin(b.t*10)*1.5;
  c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(sx+9,sy+13,8,2.5,0,0,7);c.fill();
  rr(c,sx+2,sy+2,15,9,3,'#8a5a3b');R(c,sx+4,sy+1,12,3,'#6e4730');
  const hx=b.dx<0?-3:14;
  rr(c,sx+hx+3,sy+3,6,7,2,'#8a5a3b');R(c,sx+hx+(b.dx<0?1:7),sy+5,3,3,'#5e3c26');
  R(c,sx+(b.dx<0?hx+5:hx+4),sy+4,2,2,'#141127');
  R(c,sx+(b.dx<0?hx+2:hx+6),sy+8,3,2,'#ece9f4');
  R(c,sx+3+tr,sy+10,2,3,'#5e3c26');R(c,sx+12-tr,sy+10,2,3,'#5e3c26');
}

/* winieta (raz wyliczona) */
const vig=document.createElement('canvas');vig.width=W;vig.height=H;
(function(){const g=vig.getContext('2d');
  const gr=g.createRadialGradient(W/2,H/2,H*.42,W/2,H/2,H*.86);
  gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(10,8,24,.5)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);})();
function drawVignette(){cx.drawImage(vig,0,0);}

/* ---------------- ŚWIAT: update ---------------- */
function canWalk(x,y){
  const cs=[[x-5,y-2],[x+5,y-2],[x-5,y+4],[x+5,y+4]];
  return cs.every(([px,py])=>!SOLID(at(Math.floor(px/16),Math.floor(py/16))));
}
function updateCity(dt){
  for(const c of cars){
    const ahead=c.h?(Math.sign(c.v)*(P.x-c.x)>0&&Math.abs(P.x-c.x)<44&&Math.abs(P.y-(c.y+5))<15)
                   :(Math.sign(c.v)*(P.y-c.y)>0&&Math.abs(P.y-c.y)<44&&Math.abs(P.x-(c.x+5))<15);
    const sp=ahead?0:c.v;
    if(c.h){c.x+=sp*dt;if(c.x<-40)c.x=MW*16+30;if(c.x>MW*16+40)c.x=-30;}
    else{c.y+=sp*dt;if(c.y<-40)c.y=MH*16+30;if(c.y>MH*16+40)c.y=-30;}
  }
  for(const p of peds){
    p.t-=dt;
    if(p.t<=0){p.t=1.5+Math.random()*2.5;const a=((Math.random()*4)|0)*Math.PI/2;
      p.dx=Math.cos(a)*26;p.dy=Math.sin(a)*26;}
    const nx=p.x+p.dx*dt,ny=p.y+p.dy*dt;
    if(at(Math.floor(nx/16),Math.floor(ny/16))===1){p.x=nx;p.y=ny;}else p.t=0;
  }
  for(const g of pigeons){
    if(g.st===0){
      if(Math.hypot(P.x-g.x,P.y-g.y)<30){g.st=1;const a=Math.atan2(g.y-P.y,g.x-P.x);
        g.vx=Math.cos(a)*70;g.vy=Math.sin(a)*70-30;g.t=0;beep(1200,.08,'triangle',.03,1600);}
    }else{
      g.t+=dt;g.x+=g.vx*dt;g.y+=g.vy*dt;
      if(g.t>2.5){const p=randTile(v=>v===0||v===1||v===8);if(p){g.x=p[0];g.y=p[1];g.st=0;}}
    }
  }
  dropT-=dt;
  if(dropT<=0){dropT=16+Math.random()*14;
    if(drops.length<3)for(let i=0;i<20;i++){
      const a=Math.random()*7,r2=(6+Math.random()*7)*16;
      const x=P.x+Math.cos(a)*r2,y=P.y+Math.sin(a)*r2;
      if(x>20&&y>20&&x<MW*16-20&&y<MH*16-20&&!SOLID(at(Math.floor(x/16),Math.floor(y/16)))){
        drops.push({x,y,life:24});break;}
    }}
  for(const d of drops){
    d.life-=dt;
    if(Math.hypot(P.x-d.x,P.y-d.y)<15){d.life=0;S.dia++;save();refreshHUD();SFX.dia();}
  }
  drops=drops.filter(d=>d.life>0);
  selfieT-=dt;
  if(!selfie&&selfieT<=0){selfieT=65+Math.random()*40;
    const a=Math.random()*7;
    selfie={x:P.x+Math.cos(a)*220,y:P.y+Math.sin(a)*180,st:'run',t:16};
    selfie.x=Math.max(24,Math.min(MW*16-24,selfie.x));selfie.y=Math.max(24,Math.min(MH*16-24,selfie.y));
  }
  if(selfie){
    selfie.t-=dt;
    if(selfie.st==='run'){
      const d=Math.hypot(P.x-selfie.x,P.y-selfie.y);
      if(d>24){const nx=selfie.x+(P.x-selfie.x)/d*95*dt,ny=selfie.y+(P.y-selfie.y)/d*95*dt;
        if(!SOLID(at(Math.floor(nx/16),Math.floor(selfie.y/16))))selfie.x=nx;
        if(!SOLID(at(Math.floor(selfie.x/16),Math.floor(ny/16))))selfie.y=ny;}
      else selfie.st='wait';
      if(selfie.t<6)selfie.st='leave';
    }else if(selfie.st==='wait'){if(selfie.t<=6)selfie.st='leave';}
    else{selfie.x+=110*dt;selfie.y+=40*dt;if(selfie.t<=0||selfie.x>MW*16)selfie=null;}
  }
  if(REGIONS[REG].leaves&&(REG==='tatry'||REG==='krakow'||REG==='chodziez'||(P.x<26*16&&P.y<20*16))){
    leafT-=dt;
    if(leafT<=0&&!reduceMotion){leafT=.5;
      leaves.push({x:camX+Math.random()*W,y:camY-6,ph:Math.random()*7,life:6});}
  }
  for(const l of leaves){l.life-=dt;l.ph+=dt*3;l.x+=Math.sin(l.ph)*18*dt+8*dt;l.y+=26*dt;}
  leaves=leaves.filter(l=>l.life>0);
  smokeT-=dt;
  if(smokeT<=0&&REGIONS[REG].smoke){smokeT=.5;smoke.push({x:36.6*16,y:27.9*16,r:1.5,life:2.4});}
  for(const s of smoke){s.life-=dt;s.y-=15*dt;s.x+=Math.sin(s.life*4)*6*dt;s.r+=dt*2.2;}
  smoke=smoke.filter(s=>s.life>0);
  if(worldFlash>0)worldFlash-=dt*1.6;
  boatY+=boatV*dt;if(boatY>MH*16-60||boatY<40)boatV*=-1;
}
function doSelfie(){
  if(!selfie)return;
  worldFlash=.8;S.dia+=5;save();refreshHUD();SFX.dia();
  const ns=addViews(2500+Math.random()*3500,true);
  toast('📸 Selfie z fanką! +5 💎, +'+fmtN(ns)+' subów!');
  if(Math.random()<.5)vsay('c_kamera');else vsay('v_spontan');
  selfie.st='leave';selfie.t=Math.min(selfie.t,3);
}
function updateWorld(dt){
  if(dashT>0){
    dashT-=dt;
    const dv=[[0,1],[-1,0],[1,0],[0,-1]][dashDir];
    const nx=P.x+dv[0]*340*dt,ny=P.y+dv[1]*340*dt;
    if(canWalk(nx,P.y))P.x=nx;else dashT=0;
    if(canWalk(P.x,ny))P.y=ny;else dashT=0;
    P.frame+=dt*16;
    /* po szarży chwila nietykalności — Dych nie obrywa za wbicie się w hejtera */
    if(dashT<=0)hurtT=Math.max(hurtT,.6);
  }else{
  const[dx,dy]=moveVec();
  P.moving=dx!==0||dy!==0;
  if(P.moving){
    if(Math.abs(dx)>Math.abs(dy))P.dir=dx<0?1:2;else P.dir=dy<0?3:0;
    let sp=P.speed*(S.ch==='edek'?(SHOE_SPD[S.equip.shoes]||1):1)*(P.slow?.55:1)*(BUFF.t>0?1+BUFF.spd:1);
    const nx=P.x+dx*sp*dt,ny=P.y+dy*sp*dt;
    if(canWalk(nx,P.y))P.x=nx;
    if(canWalk(P.x,ny))P.y=ny;
    P.frame+=dt*8;
    const done2=Object.keys(QUESTS).filter(q=>qs(q)===2).length;
    if(REG==='wawa'&&S.trip===0&&done2>=2&&at(Math.floor(P.x/16),Math.floor(P.y/16))===2){
      S.trip=1;P.slow=true;save();SFX.hit();
      say([{who:'Edek',t:'ŁAŁA! Boli mnie ten piszczel!',v:'v_piszczel'},
           {who:'Edek',t:'Kurde, złamałem piszczel na krawężniku... Muszę do warsztatu Zenka!'}]);
      toast('🔧 NOWY CEL: warsztat Zenka (kuleje się powoli!)');
    }
  }
  }
  P.x=Math.max(20,Math.min(MW*16-20,P.x));P.y=Math.max(20,Math.min(MH*16-20,P.y));
  /* na mapie widać TYLKO aktywną postać — reszta drużyny czeka „w kieszeni" (wymóg Dawida) */
  if(BUFF.t>0){BUFF.t-=dt;if(BUFF.t<=0)BUFF={atk:0,def:0,spd:0,t:0,n:''};}
  updateFoes(dt);
  domUpdate();
  for(const id in bossCdT)if(bossCdT[id]>0)bossCdT[id]-=dt;
  if(S.ch!=='edek'){
    dychIdleT-=dt;
    if(dychIdleT<=0){dychIdleT=22+Math.random()*20;if(scene==='world')charSay();}
  }
  for(const b of boars){
    b.t+=dt;
    if(b.t>2){b.t=0;const a=Math.random()*7;b.dx=Math.cos(a)*22;b.dy=Math.sin(a)*22;}
    const nx=b.x+b.dx*dt,ny=b.y+b.dy*dt;
    if(nx>32&&nx<26*16&&canWalk(nx,b.y))b.x=nx;else b.dx*=-1;
    if(ny>32&&ny<19*16&&canWalk(b.x,ny))b.y=ny;else b.dy*=-1;
  }
  updateCity(dt);
  updateRadio(dt);
  idleT-=dt;
  if(idleT<=0){
    if(scene==='world'&&REG!=='arena'&&!curVoice){
      /* dłuższe bloki gadania: 30% jeden klip, 45% dwa, 25% trzy pod rząd */
      const roll=Math.random();
      const want=roll<.3?1:roll<.75?2:3;
      const ch=[];
      while(ch.length<want){const c=pickA(IDLE_POOL);if(!ch.includes(c))ch.push(c);}
      vsayChain(ch);
      idleT=chainDur(ch)+3+Math.random()*6;  // przerwa dopiero PO całym bloku
    }else idleT=1;                           // coś innego gra — sprawdź ponownie za chwilę
  }
  findPrompt();
  const tx=Math.max(0,Math.min(MW*16-W,P.x-W/2)),ty=Math.max(0,Math.min(MH*16-H,P.y-H/2));
  camX+=(tx-camX)*Math.min(1,dt*8);camY+=(ty-camY)*Math.min(1,dt*8);
}

/* ---------------- ŚWIAT: draw ---------------- */
const TCOL={0:'#2e5a34',1:'#a08a5a',2:'#3a3a48',7:'#2e5a34',8:'#d8c084',9:'#8a6a42',16:'#7a7a8c',17:'#e8eef8'};
function drawWorld(){
  const x0=Math.floor(camX/16),y0=Math.floor(camY/16);
  for(let ty=y0;ty<=y0+Math.ceil(H/16);ty++)for(let tx=x0;tx<=x0+Math.ceil(W/16)+1;tx++){
    const v=at(tx,ty),sx=tx*16-camX,sy=ty*16-camY;
    R(cx,sx,sy,16,16,TCOL[v]||TCOL[0]);
    if(v===0){
      if((tx+ty)%2===0)R(cx,sx,sy,16,16,'rgba(255,255,255,.025)');
      if((tx*7+ty*13)%9===0)R(cx,sx+6,sy+7,2,2,'#376b3e');
      if((tx*13+ty*7)%11===0){R(cx,sx+3,sy+10,1,3,'#3d7346');R(cx,sx+5,sy+11,1,2,'#3d7346');}
      if((tx*5+ty*17)%23===0)R(cx,sx+10,sy+4,2,2,'#e8e4f0');
    }
    if(v===1){
      if((tx+ty)%3===0)R(cx,sx+4,sy+6,3,2,'#8a7548');
      if((tx*3+ty)%5===0)R(cx,sx+10,sy+11,2,2,'#93805052');
      if(at(tx,ty-1)!==1&&at(tx,ty-1)!==2)R(cx,sx,sy,16,2,'#b39a68');
      if(at(tx,ty+1)!==1&&at(tx,ty+1)!==2)R(cx,sx,sy+14,16,2,'#6e5c3a');
    }
    if(v===2){R(cx,sx,sy,16,16,'#3a3a48');
      if(ty%2===0&&tx%2===0)R(cx,sx+2,sy+7,7,2,'#5a5a6a');
      if(at(tx,ty-1)!==2)R(cx,sx,sy,16,2,'#57576a');
      if(at(tx,ty+1)!==2)R(cx,sx,sy+14,16,2,'#26262f');
      if(at(tx-1,ty)!==2)R(cx,sx,sy,2,16,'#57576a');
      if(at(tx+1,ty)!==2)R(cx,sx+14,sy,2,16,'#26262f');}
    if(v===3){R(cx,sx,sy,16,16,'#2a4a7a');
      if((tx*3+ty*5+Math.floor(anim*2))%7===0)R(cx,sx+3,sy+6,8,1.5,'#4a6a9a');
      if((tx*5+ty*3+Math.floor(anim*3))%9===0)R(cx,sx+9,sy+11,4,1,'#6a8aba');
      if((tx*11+ty+Math.floor(anim))%13===0)R(cx,sx+5,sy+3,2,1,'#a8c8e8');
      if(at(tx-1,ty)!==3)R(cx,sx,sy,2,16,'#4a6a9a');}
    if(v===7){R(cx,sx,sy,16,16,'#2e5a34');
      const cc=['#e04848','#f5c542','#c86fa8','#ece9f4'][(tx*3+ty)%4];
      const bob=Math.sin(anim*2+tx)*0.5;
      R(cx,sx+5,sy+5+bob,3,3,cc);R(cx,sx+6,sy+8,1,4,'#3d7346');
      R(cx,sx+11,sy+10,3,3,'#f5c542');R(cx,sx+12,sy+13,1,3,'#3d7346');}
    if(v===4){
      if(REG==='tatry'){ // świerk górski ze śniegiem
        R(cx,sx,sy,16,16,TCOL[0]);
        cx.fillStyle='rgba(0,0,0,.22)';cx.beginPath();cx.ellipse(sx+8,sy+14,6,2.2,0,0,7);cx.fill();
        R(cx,sx+7,sy+11,2.4,4,'#4a3620');
        cx.fillStyle='#1a3a24';
        cx.beginPath();cx.moveTo(sx+8,sy-6);cx.lineTo(sx+1,sy+5);cx.lineTo(sx+15,sy+5);cx.fill();
        cx.beginPath();cx.moveTo(sx+8,sy-1);cx.lineTo(sx+2,sy+11);cx.lineTo(sx+14,sy+11);cx.fill();
        cx.fillStyle='#e8eef8';
        cx.beginPath();cx.moveTo(sx+8,sy-6);cx.lineTo(sx+5,sy-1);cx.lineTo(sx+11,sy-1);cx.fill();
      }else{
        R(cx,sx,sy,16,16,TCOL[0]);
        cx.fillStyle='rgba(0,0,0,.22)';cx.beginPath();cx.ellipse(sx+8,sy+14,7,2.5,0,0,7);cx.fill();
        R(cx,sx+6,sy+8,4,7,'#4a3620');R(cx,sx+7,sy+9,1,5,'#5c4630');
        cx.fillStyle='#1e4426';cx.beginPath();cx.arc(sx+8,sy+1,7.5,0,7);cx.fill();
        cx.fillStyle='#26542e';cx.beginPath();cx.arc(sx+5.5,sy-1.5,5,0,7);cx.fill();
        cx.fillStyle='#2e6236';cx.beginPath();cx.arc(sx+10,sy-2,3.6,0,7);cx.fill();
      }}
    if(v===6){R(cx,sx,sy,16,16,'#8a7548');
      R(cx,sx,sy,16,4,(tx+ty)%2?'#c8384a':'#ece9f4');
      R(cx,sx+2,sy+6,12,6,(tx*3+ty)%3?'#6e5c3a':'#54462f');}
    if(v===8){R(cx,sx,sy,16,16,'#d8c084');
      if((tx*7+ty*3)%5===0)R(cx,sx+4,sy+6,2,2,'#c4ac72');
      if((tx*3+ty*11)%9===0)R(cx,sx+10,sy+11,3,2,'#e8d49a');
      if((tx*13+ty*5)%31===0)R(cx,sx+7,sy+4,3,3,'#f0e8d8');   // muszelka
      if(at(tx,ty-1)===3){R(cx,sx,sy,16,3,'#e8dcae');if(Math.floor(anim*2+tx)%3===0)R(cx,sx,sy,16,2,'#f4f0e0');}}
    if(v===9){R(cx,sx,sy,16,16,'#8a6a42');
      R(cx,sx,sy+7,16,1,'#6e5232');R(cx,sx,sy+15,16,1,'#5e4628');
      if(tx%2===0)R(cx,sx,sy,1,16,'#a4845a');}
    /* --- DETALE ŚWIATA --- */
    if(v===10){ // ławka
      R(cx,sx,sy,16,16,TCOL[REG==='morze'?8:0]);
      cx.fillStyle='rgba(0,0,0,.2)';cx.beginPath();cx.ellipse(sx+8,sy+13,7,2,0,0,7);cx.fill();
      R(cx,sx+2,sy+10,2,4,'#4a3620');R(cx,sx+12,sy+10,2,4,'#4a3620');
      R(cx,sx+1,sy+8,14,3,'#8a5a2a');R(cx,sx+1,sy+3,14,2.4,'#8a5a2a');
      R(cx,sx+2,sy+5.4,1.6,3,'#6e4720');R(cx,sx+12.4,sy+5.4,1.6,3,'#6e4720');}
    if(v===11){ // latarnia
      R(cx,sx,sy,16,16,TCOL[REG==='morze'?8:0]);
      cx.fillStyle='rgba(0,0,0,.2)';cx.beginPath();cx.ellipse(sx+8,sy+14,5,2,0,0,7);cx.fill();
      R(cx,sx+7,sy+2,2,12,'#2a2a38');
      const lum=Math.floor(anim+tx)%4?'#fff7d6':'#f5c542';
      rr(cx,sx+5.4,sy-2,5.2,5,1.5,'#2a2a38');R(cx,sx+6.4,sy-1,3.2,3,lum);
      cx.fillStyle='rgba(255,247,214,.12)';cx.beginPath();cx.arc(sx+8,sy+1,7,0,7);cx.fill();}
    if(v===12){ // kwietnik
      R(cx,sx,sy,16,16,TCOL[0]);
      rr(cx,sx+1,sy+7,14,7,1.5,'#6e4720');R(cx,sx+2,sy+8,12,2,'#3d7346');
      const cc2=['#e04848','#f5c542','#c86fa8','#ece9f4','#e88ac8'];
      for(let i=0;i<5;i++)R(cx,sx+2+i*2.6,sy+4+((tx*3+i)%3),2,2,cc2[(tx+i)%5]);}
    if(v===13){ // płot
      R(cx,sx,sy,16,16,TCOL[0]);
      R(cx,sx,sy+6,16,1.6,'#8a6a42');R(cx,sx,sy+11,16,1.6,'#8a6a42');
      for(let i=0;i<4;i++){R(cx,sx+1+i*4,sy+3,2.4,11,'#a4845a');R(cx,sx+1+i*4,sy+3,2.4,1.6,'#8a6a42');}}
    if(v===14){ // billboard EDKA
      R(cx,sx,sy,16,16,TCOL[REG==='morze'?8:0]);
      R(cx,sx+6,sy+8,4,7,'#4a4658');
      rr(cx,sx-1,sy-6,18,14,1.5,'#2a2440');rr(cx,sx,sy-5,16,12,1,'#ece9f4');
      rr(cx,sx+1.5,sy-3.5,6,6,1.5,'#c9c4dd');rr(cx,sx+2.3,sy-2.7,4.4,3.4,1,'#101020'); // mini-Edek
      R(cx,sx+3,sy+.6,3.4,1,'#000');
      R(cx,sx+9,sy-3,6,1.6,'#c8384a');R(cx,sx+9,sy-.4,6,1.2,'#8f88b0');
      R(cx,sx+9,sy+1.6,4,1.2,'#8f88b0');}
    if(v===15){ // fontanna
      R(cx,sx,sy,16,16,TCOL[1]);
      cx.fillStyle='#8a8aa0';cx.beginPath();cx.arc(sx+8,sy+8,7.5,0,7);cx.fill();
      cx.fillStyle='#2a4a7a';cx.beginPath();cx.arc(sx+8,sy+8,5.8,0,7);cx.fill();
      cx.fillStyle='#4a6a9a';cx.beginPath();cx.arc(sx+8,sy+8,3.2+Math.sin(anim*4)*.8,0,7);cx.fill();
      for(let i=0;i<3;i++){const a=anim*3+i*2.1;
        R(cx,sx+8+Math.cos(a)*3-.5,sy+5-Math.abs(Math.sin(a*2))*3,1.4,1.4,'#a8c8e8');}}
    if(v===16){ // skała (Tatry)
      R(cx,sx,sy,16,16,'#7a7a8c');
      if((tx+ty)%2===0)R(cx,sx,sy,16,16,'rgba(255,255,255,.04)');
      R(cx,sx+2,sy+3,5,4,'#8d8da0');R(cx,sx+9,sy+9,5,4,'#6a6a7c');
      if(at(tx,ty-1)!==16&&at(tx,ty-1)!==17)R(cx,sx,sy,16,2,'#9a9aae');
      if(at(tx,ty+1)!==16&&at(tx,ty+1)!==17)R(cx,sx,sy+14,16,2,'#5c5c6e');
      if((tx*7+ty*3)%11===0)R(cx,sx+6,sy+6,3,2,'#5c5c6e');}
    if(v===17){ // śnieg (deptalny)
      R(cx,sx,sy,16,16,'#e8eef8');
      if((tx+ty)%2===0)R(cx,sx,sy,16,16,'rgba(255,255,255,.35)');
      if((tx*5+ty*7)%9===0)R(cx,sx+4,sy+6,2,2,'#fff');
      if((tx*3+ty*11)%13===0)R(cx,sx+10,sy+11,2,2,'#cfdcec');
      if(at(tx,ty+1)===16)R(cx,sx,sy+14,16,2,'#cfdcec');}
  }
  // łódka (Wisła / jezioro / Bałtyk)
  if(REGIONS[REG].boat){
   const bx=(REG==='wawa'?60*16:REG==='chodziez'?boatY*.8+80:boatY*1.6+60)-camX,
         by=(REG==='wawa'?boatY:REG==='chodziez'?30*16:4*16)-camY;
   if(bx>-40&&bx<W+40&&by>-30&&by<H+30){
     cx.fillStyle='rgba(0,0,0,.2)';cx.beginPath();cx.ellipse(bx+10,by+11,11,3,0,0,7);cx.fill();
     rr(cx,bx,by,20,9,3,'#ece9f4');R(cx,bx+3,by-6,2,7,'#8a7548');
     R(cx,bx+5,by-6,7,3,'#ece9f4');R(cx,bx+5,by-3,7,3,'#c8384a');
   }}
  drawBuildings();
  // znajdźki questowe
  for(const[q,cfg]of Object.entries(COLLECT)){
    if(qs(q)!==1||cfg.r!==REG)continue;
    for(let i=0;i<cfg.pts.length;i++){
      if((S.col[q]||[]).includes(i))continue;
      const[gx,gy]=cfg.pts[i],sx=gx*16-camX,sy=gy*16-camY;
      if(sx<-20||sx>W+20||sy<-20||sy>H+20)continue;
      const tw=Math.floor(anim*3)%2===0;
      if(q==='tinder'){R(cx,sx+5,sy+3,4,4,tw?cfg.c2:cfg.c1);R(cx,sx+6,sy+7,2,6,'#3d7346');}
      else if(q==='zabson'){R(cx,sx+5,sy+2,5,5,tw?cfg.c2:cfg.c1);R(cx,sx+6,sy+7,3,6,'#8a8aa0');}
      else{R(cx,sx+5,sy+4,6,6,tw?cfg.c2:cfg.c1);R(cx,sx+7,sy+2,2,2,'#fff');}
      cx.fillStyle='rgba(255,255,255,.12)';cx.beginPath();cx.arc(sx+8,sy+6,9,0,7);cx.fill();
    }
  }
  for(const d of drops){
    const sx=d.x-camX,sy=d.y-camY;
    if(sx<-20||sx>W+20||sy<-20||sy>H+20)continue;
    if(d.life<5&&Math.floor(anim*6)%2)continue;
    const bob=Math.sin(anim*4+d.x)*1.5;
    R(cx,sx-3,sy-4+bob,6,6,'#6fd8e8');R(cx,sx-1,sy-6+bob,2,2,'#fff');
    cx.fillStyle='rgba(111,216,232,.18)';cx.beginPath();cx.arc(sx,sy,9,0,7);cx.fill();
  }
  // portale domen + znaczniki bossów (na mapach regionów)
  if(REG!=='arena'){
    for(const[id,dm]of Object.entries(DOMAINS)){
      if(dm.r!==REG)continue;
      drawPortal(dm.x*16+8-camX,dm.y*16+8-camY,dm.col,'🌀 '+dm.n+' (poz. '+((S.domLvl[id]||0)+1)+')');
    }
    for(const[id,b]of Object.entries(BOSSES)){
      if(b.r!==REG||bossOnMap(id))continue;
      const sx=b.x*16+8-camX,sy=b.y*16+8-camY;
      if(sx<-40||sx>W+40||sy<-40||sy>H+40)continue;
      if(bossCdT[id]>0){
        cx.font='6px "Press Start 2P"';cx.textAlign='center';cx.fillStyle='rgba(236,233,244,.4)';
        cx.fillText('⚔ wraca za '+Math.ceil(bossCdT[id])+'s',sx,sy);cx.textAlign='left';
      }else{
        const pulse=1+Math.sin(anim*4)*.12;
        cx.save();cx.translate(sx,sy);cx.scale(pulse,pulse);
        cx.font='14px "Press Start 2P"';cx.textAlign='center';
        cx.fillStyle='#000';cx.fillText('⚔',1,1);cx.fillStyle='#e04848';cx.fillText('⚔',0,0);
        cx.restore();
        cx.font='6px "Press Start 2P"';cx.textAlign='center';cx.fillStyle='rgba(224,72,72,.95)';
        cx.fillText('BOSS: '+b.n,sx,sy-16);cx.textAlign='left';
      }
    }
  }else{
    // arena: wyjście + skrzynia
    drawPortal(REGIONS.arena.spawn[0]-camX,REGIONS.arena.spawn[1]-camY,'#8f88b0','WYJŚCIE [E]');
    if(DOM.chest)drawChest(DOM.chest.x-camX,DOM.chest.y-camY,DOM.chest.open);
  }
  const ents=[];
  const drawHero=(ch,x,y,dir,fr,blink)=>{
    if(blink&&Math.floor(anim*10)%2)return;
    drawCharBody(cx,ch,x-8-camX,y-20-camY,dir,fr);
  };
  const lunge=atkAnim>0?(atkAnim/.22)*4:0;   // wypad w kierunku ciosu
  ents.push({y:P.y,d:()=>drawHero(S.ch,P.x+DV[atkDir][0]*lunge,P.y+DV[atkDir][1]*lunge,P.dir,Math.floor(P.frame)%2,hurtT>0&&hurtT<1.2)});
  for(const f of foes)ents.push({y:f.y,d:()=>f.boss?drawBoss(f,f.x-camX,f.y-camY):drawFoe(f,f.x-8-camX,f.y-20-camY)});
  for(const n of NPCS){if(n.r!==REG||(n.id==='dych_npc'&&S.dych))continue;
    ents.push({y:n.y,d:()=>drawNPC(cx,n,n.x-8-camX,n.y-20-camY)});}
  for(const b of boars)ents.push({y:b.y,d:()=>drawBoarTop(cx,b,b.x-9-camX,b.y-10-camY)});
  for(const c of cars)ents.push({y:c.y+(c.h?11:24),d:()=>drawCarE(c,c.x-camX,c.y-camY)});
  for(const p of peds)ents.push({y:p.y,d:()=>drawPed(p,p.x-4-camX,p.y-18-camY)});
  for(const g of pigeons)ents.push({y:g.y,d:()=>drawPigeon(g,g.x-3-camX,g.y-4-camY)});
  if(selfie)ents.push({y:selfie.y,d:()=>drawSelfieGirl(selfie.x-6-camX,selfie.y-20-camY)});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
  // pociski postaci: dorsz Bogdana / serduszko Julki
  for(const p of PROJ){
    const sx=p.x-camX,sy=p.y-camY;
    if(p.type==='bogdan'){
      cx.save();cx.translate(sx,sy);cx.rotate(Math.atan2(p.dy,p.dx)+Math.sin(anim*20)*.3);
      rr(cx,-7,-3,11,6,3,'#9ab8d0');cx.fillStyle='#7a98b0';
      cx.beginPath();cx.moveTo(4,0);cx.lineTo(9,-4);cx.lineTo(9,4);cx.fill();
      R(cx,-5,-2,2,2,'#1a1a24');cx.restore();
    }else{
      const k=1+Math.sin(anim*16)*.2;
      cx.save();cx.translate(sx,sy);cx.scale(k,k);cx.fillStyle='#e88ac8';
      cx.beginPath();cx.arc(-2,-2,3,0,7);cx.arc(2,-2,3,0,7);cx.fill();
      cx.beginPath();cx.moveTo(-4.6,-.4);cx.lineTo(0,5);cx.lineTo(4.6,-.4);cx.fill();
      cx.restore();
    }
  }
  // pociski bossów
  for(const b of bossShots){
    const sx=b.x-camX,sy=b.y-camY;
    if(b.t==='kettle'){
      rr(cx,sx-5,sy-4,10,9,3,'#2a2a34');cx.strokeStyle='#2a2a34';cx.lineWidth=2;
      cx.beginPath();cx.arc(sx,sy-5,3.5,Math.PI,0);cx.stroke();
    }else if(b.t==='ogien'){
      const fl=1+Math.sin(anim*18)*.3;
      cx.fillStyle='#e04848';cx.beginPath();cx.arc(sx,sy,5.5*fl,0,7);cx.fill();
      cx.fillStyle='#f5a032';cx.beginPath();cx.arc(sx,sy,3.5*fl,0,7);cx.fill();
      cx.fillStyle='#fff7d6';cx.beginPath();cx.arc(sx-1,sy-1,1.6,0,7);cx.fill();
    }else if(b.t==='snieg'){
      cx.fillStyle='#ece9f4';cx.beginPath();cx.arc(sx,sy,4.5,0,7);cx.fill();
      cx.fillStyle='#bfe8f4';cx.beginPath();cx.arc(sx+1,sy+1,2,0,7);cx.fill();
    }else{
      cx.fillStyle='rgba(111,216,232,.85)';
      cx.beginPath();cx.arc(sx,sy,5+Math.sin(anim*14)*1.2,0,7);cx.fill();
      cx.fillStyle='#d8f4fa';cx.beginPath();cx.arc(sx-1,sy-1,2,0,7);cx.fill();
    }
  }
  // zamach — łuk ciosu + pięść w kierunku ataku
  if(atkAnim>0){
    const k=1-atkAnim/.22;
    const ang=[Math.PI/2,Math.PI,0,-Math.PI/2][atkDir];
    const px=P.x-camX+DV[atkDir][0]*5,py=P.y-8-camY+DV[atkDir][1]*5;
    cx.save();cx.translate(px,py);cx.rotate(ang);
    cx.globalAlpha=.9*(1-k);
    cx.strokeStyle=S.ch==='dych'?'#ffd77a':'#fff';
    cx.lineWidth=3;cx.lineCap='round';
    cx.beginPath();cx.arc(0,0,12+k*9,-.85,.85);cx.stroke();
    cx.lineWidth=1.5;cx.globalAlpha=.5*(1-k);
    cx.beginPath();cx.arc(0,0,8+k*8,-.6,.6);cx.stroke();
    cx.globalAlpha=Math.min(1,(1-k)+.3);
    cx.fillStyle=S.ch==='dych'?'#4a4f66':'#d6d2e6';
    cx.beginPath();cx.arc(12+k*8,0,3.2,0,7);cx.fill();      // pięść
    cx.fillStyle='#3a3454';cx.beginPath();cx.arc(12+k*8,0,1.6,0,7);cx.fill();
    cx.restore();cx.globalAlpha=1;
  }
  for(const l of leaves){cx.globalAlpha=Math.min(1,l.life);
    if(REG==='tatry')R(cx,l.x-camX,l.y-camY,2.4,2.4,'#fff'); // śnieg!
    else R(cx,l.x-camX,l.y-camY,3,2,'#c8a858');cx.globalAlpha=1;}
  for(const s of smoke){cx.globalAlpha=Math.max(0,s.life/2.4)*.4;
    cx.fillStyle='#b8b5cc';cx.beginPath();cx.arc(s.x-camX,s.y-camY,s.r,0,7);cx.fill();cx.globalAlpha=1;}
  for(const p of confetti){cx.globalAlpha=Math.max(0,p.life);R(cx,p.x-camX,p.y-camY,3,3,p.c);cx.globalAlpha=1;
    p.x+=p.vx*.016;p.y+=p.vy*.016;p.vy+=300*.016;p.life-=.016;}
  confetti=confetti.filter(p=>p.life>0);
  if(prompt){
    cx.font='7px "Press Start 2P"';cx.textAlign='center';
    const tx='[E] '+prompt.label;
    cx.fillStyle='#000';cx.fillText(tx,W/2+1,H-13);cx.fillStyle='#f5c542';cx.fillText(tx,W/2,H-14);
    cx.textAlign='left';
  }
  // efekty ciosów (komiksowe napisy)
  for(const h of hitFX){
    const k=1-h.life/.55;
    cx.save();cx.translate(h.x-camX,h.y-camY-k*14);
    cx.rotate((h.x%2?1:-1)*.08);
    cx.font=Math.round(8+k*3)+'px "Press Start 2P"';cx.textAlign='center';
    cx.globalAlpha=Math.min(1,h.life*4);
    cx.fillStyle='#000';cx.fillText(h.txt,1,1);
    cx.fillStyle=h.c;cx.fillText(h.txt,0,0);
    cx.restore();cx.globalAlpha=1;cx.textAlign='left';
  }
  // LICZBY OBRAŻEŃ (kolor = żywioł)
  for(const n of dmgNums){
    const k=1-n.life/.9;
    cx.save();cx.translate(n.x-camX,n.y-camY-k*24);
    cx.font=(n.crit?11:8)+'px "Press Start 2P"';cx.textAlign='center';
    cx.globalAlpha=Math.min(1,n.life*3);
    cx.fillStyle='#000';cx.fillText(n.v+(n.crit?'!':''),1,1);
    cx.fillStyle=n.col;cx.fillText(n.v+(n.crit?'!':''),0,0);
    cx.restore();
  }
  cx.globalAlpha=1;cx.textAlign='left';
  // HP DRUŻYNY (każdy członek osobno)
  for(let i=0;i<S.party.length;i++){
    const id=S.party[i],act=id===S.ch;
    const y=H-12-(S.party.length-1-i)*13;
    const m=chHpMax(id),v=Math.max(0,Math.round(PHP[id]||0)),fr=m?v/m:0;
    cx.font='8px "Press Start 2P"';cx.globalAlpha=act?1:.6;
    cx.fillText(CHARS[id].el,5,y);
    R(cx,19,y-7,46,7,'rgba(0,0,0,.55)');
    R(cx,20,y-6,44*fr,5,v<=0?'#555':fr>.5?'#7bc950':fr>.25?'#f5c542':'#e04848');
    if(act){cx.strokeStyle='#ece9f4';cx.lineWidth=1;cx.strokeRect(19,y-7,46,7);}
    cx.font='5px "Press Start 2P"';cx.fillStyle=v<=0?'#e04848':'#ece9f4';
    cx.fillText(v<=0?'PADŁ':v+'/'+m,68,y-1);
    cx.globalAlpha=1;
  }
  {const ready=spcT<=0,c=CHARS[S.ch];
   cx.font='7px "Press Start 2P"';
   cx.fillStyle=ready?'#f5c542':'rgba(245,197,66,.35)';
   cx.fillText(ready?('[Z] '+c.el+' '+c.spcN):('[Z] '+Math.ceil(spcT)+'s'),8,H-52);
   if(BUFF.t>0){cx.fillStyle='#7bc950';cx.font='6px "Press Start 2P"';
     cx.fillText('🍴 BUFF '+Math.ceil(BUFF.t)+'s',8,H-62);}}
  // pasek HP bossa
  {const bf=foes.find(f=>f.boss);
   if(bf){
     cx.font='7px "Press Start 2P"';cx.textAlign='center';
     cx.fillStyle='#000';cx.fillText(bf.bn,W/2+1,23);
     cx.fillStyle=bf.ph2?'#e04848':'#ece9f4';cx.fillText(bf.bn,W/2,22);cx.textAlign='left';
     R(cx,60,28,W-120,9,'rgba(0,0,0,.55)');
     R(cx,62,30,(W-124)*Math.max(0,bf.hp/bf.maxHp),5,bf.ph2?'#e04848':'#f5a032');
     cx.strokeStyle='#ece9f4';cx.lineWidth=1;cx.strokeRect(60,28,W-120,9);
   }}
  // licznik fal w domenie
  if(REG==='arena'&&DOM.cur){
    cx.font='7px "Press Start 2P"';cx.textAlign='center';
    const txt=DOM.done?'✔ ODBIERZ SKRZYNIĘ':'FALA '+DOM.wave+'/3 — wrogowie: '+foes.length;
    cx.fillStyle='#000';cx.fillText(txt,W/2+1,23);
    cx.fillStyle=DOMAINS[DOM.cur].col;cx.fillText(txt,W/2,22);
    cx.fillStyle='rgba(236,233,244,.6)';cx.font='6px "Press Start 2P"';
    cx.fillText('🌀 '+DOMAINS[DOM.cur].n+' · poziom '+((S.domLvl[DOM.cur]||0)+1),W/2,34);
    cx.textAlign='left';
  }
  drawQuestArrow();
  cx.font='6px "Press Start 2P"';cx.fillStyle='rgba(236,233,244,.85)';
  for(const d of DOORS){
    if(d.r!==REG)continue;
    const sx=d.x*16-camX+8,sy=d.y*16-camY-4;
    if(sx>0&&sx<W&&sy>0&&sy<H){cx.textAlign='center';cx.fillText(d.n,sx,sy);cx.textAlign='left';}
  }
  // nazwa regionu
  cx.font='6px "Press Start 2P"';cx.fillStyle='rgba(236,233,244,.5)';
  cx.textAlign='right';cx.fillText(REGIONS[REG].n,W-8,H-10);cx.textAlign='left';
  // ciepłe światło + winieta + flesz
  cx.fillStyle='rgba(255,180,80,.045)';cx.fillRect(0,0,W,H);
  drawVignette();
  if(worldFlash>0){cx.fillStyle='rgba(255,255,255,'+Math.min(.9,worldFlash)+')';cx.fillRect(0,0,W,H);}
}
function drawBuildings(){
  if(REG==='arena')return;
  if(REG==='chodziez'){drawBuildingsChodziez();return;}
  if(REG==='morze'){drawBuildingsMorze();return;}
  if(REG==='krakow'){drawBuildingsKrakow();return;}
  if(REG==='tatry'){drawBuildingsTatry();return;}
  bld(31,8,11,9,(x,y,w,h)=>{ // PKiN
    R(cx,x,y+h-24,w*16,24,'#4a4180');R(cx,x+8,y+h-58,w*16-16,36,'#554a94');
    R(cx,x+w*8-22,y+h-90,44,34,'#5f54a4');R(cx,x+w*8-10,y+h-116,20,28,'#6a5fb4');
    R(cx,x+w*8-3,y+h-134,6,20,'#6a5fb4');R(cx,x+w*8-1.5,y+h-140,3,8,'#f5c542');
    cx.fillStyle=Math.floor(anim)%2?'#f5c54277':'#f5c54266';
    for(let i=0;i<14;i++)for(let j=0;j<4;j++)if((i*7+j*3)%4<2)cx.fillRect(x+14+i*10,y+h-52+j*8,3,4);
    lbl('PAŁAC KULTURY',x+w*8,y+h+10);
  });
  bld(44,3,11,5,(x,y,w,h)=>{ // Sejm
    R(cx,x,y+10,w*16,h-10,'#d8d4e8');R(cx,x-4,y+4,w*16+8,8,'#ece9f4');
    for(let i=0;i<7;i++)R(cx,x+8+i*22,y+14,6,h-16,'#b8b2d0');
    R(cx,x+w*8-14,y-10,4,16,'#8a8aa0');
    R(cx,x+w*8-10,y-10,14,4,'#ece9f4');R(cx,x+w*8-10,y-6,14,4,'#c8384a');
    lbl('SEJM RP',x+w*8,y+h+10);
  });
  bld(6,26,9,6,(x,y,w,h)=>{ // Dino
    R(cx,x,y+12,w*16,h-12,'#3f7a46');R(cx,x,y+6,w*16,10,'#ece9f4');
    cx.font='7px "Press Start 2P"';cx.fillStyle='#c8384a';cx.textAlign='center';
    cx.fillText('DINO',x+w*8,y+14);cx.textAlign='left';
    R(cx,x+w*8-10,y+h-22,20,22,'#26542e');
    R(cx,x+10,y+20,18,12,'#a8d8f0');R(cx,x+w*16-28,y+20,18,12,'#a8d8f0');
  });
  bld(31,28,7,5,(x,y,w,h)=>{ // Warsztat
    R(cx,x,y+8,w*16,h-8,'#6a5a4a');R(cx,x-2,y+2,w*16+4,8,'#54462f');
    R(cx,x+8,y+18,w*16-40,h-18,'#3a3444');
    if(Math.floor(anim*6)%3===0&&S.trip===1)R(cx,x+20,y+26,4,4,'#6fd8e8');
    lbl('WARSZTAT',x+w*8,y+h+10);
  });
  bld(49,12,8,5,(x,y,w,h)=>{ // Kopernik — nowoczesna bryła
    R(cx,x,y+8,w*16,h-8,'#2a3a54');
    for(let i=0;i<10;i++)R(cx,x+6+i*12,y+12,7,h-20,'#4a7a9a');
    R(cx,x,y+4,w*16,6,'#6fd8e8');
    cx.fillStyle='#6fd8e855';R(cx,x+10,y+h-8,w*16-20,3,'#6fd8e855');
    lbl('KOPERNIK',x+w*8,y+h+10);
  });
  bld(30,23,3,2,(x,y,w,h)=>{ // Metro
    R(cx,x,y+6,w*16,h-6,'#31518f');R(cx,x+4,y+12,w*16-8,h-12,'#141127');
    rr(cx,x+w*8-8,y-6,16,14,3,'#c8384a');
    cx.font='9px "Press Start 2P"';cx.fillStyle='#ece9f4';cx.textAlign='center';
    cx.fillText('M',x+w*8,y+5);cx.textAlign='left';
    lbl('METRO',x+w*8,y+h+12);
  });
  lbl('BAZAR',49*16+8-camX,27*16-camY-2);
  bld(23,22,3,2,drawPKS);
}
function drawPKS(x,y,w,h){
  R(cx,x,y+8,w*16,h-8,'#5a5a6a');R(cx,x-2,y+2,w*16+4,8,'#f5c542');
  R(cx,x+4,y+14,w*16-8,10,'#a8d8f0');
  cx.font='6px "Press Start 2P"';cx.fillStyle='#1a1a24';cx.textAlign='center';
  cx.fillText('PKS',x+w*8,y+9);cx.textAlign='left';
  lbl('🚌 PODRÓŻ',x+w*8,y+h+10);
}
function drawBuildingsChodziez(){
  bld(11,5,5,5,(x,y,w,h)=>{ // dom Edka
    R(cx,x,y+16,w*16,h-16,'#e8dcc0');
    cx.fillStyle='#c8384a';cx.beginPath();cx.moveTo(x-4,y+18);cx.lineTo(x+w*8,y-2);cx.lineTo(x+w*16+4,y+18);cx.fill();
    R(cx,x+8,y+28,14,16,'#8a6a42');R(cx,x+w*16-24,y+26,16,12,'#a8d8f0');
    R(cx,x+w*8+6,y+2,6,10,'#8a6a42');
    lbl('DOM EDKA',x+w*8,y+h+10);
  });
  bld(18,6,5,4,(x,y,w,h)=>{ // ceramika
    R(cx,x,y+10,w*16,h-10,'#d8d4e8');R(cx,x-2,y+4,w*16+4,8,'#31518f');
    R(cx,x+8,y+22,12,10,'#a8d8f0');R(cx,x+w*16-20,y+22,12,10,'#a8d8f0');
    R(cx,x+w*8-6,y+16,12,14,'#b06a3a');R(cx,x+w*8-4,y+13,8,4,'#8a4a2a');  // wazon
    lbl('CERAMIKA',x+w*8,y+h+10);
  });
  bld(26,5,6,5,(x,y,w,h)=>{ // targ
    R(cx,x,y+8,w*16,h-8,'#8a7548');
    R(cx,x,y+4,w*16,8,(Math.floor(anim)%2)?'#c8384a':'#b03040');
    for(let i=0;i<4;i++)R(cx,x+6+i*22,y+18,16,10,['#7bc950','#f5c542','#e04848','#e88ac8'][i]);
    lbl('TARG',x+w*8,y+h+10);
  });
  bld(12,18,4,4,(x,y,w,h)=>{ // remiza
    R(cx,x,y+8,w*16,h-8,'#c8384a');R(cx,x+6,y+16,w*16-12,h-18,'#8a2438');
    R(cx,x+w*8-2,y-4,4,14,'#ece9f4');
    lbl('REMIZA',x+w*8,y+h+10);
  });
  bld(30,18,7,4,(x,y,w,h)=>{ // Dino Chodzież
    R(cx,x,y+10,w*16,h-10,'#3f7a46');R(cx,x,y+4,w*16,10,'#ece9f4');
    cx.font='7px "Press Start 2P"';cx.fillStyle='#c8384a';cx.textAlign='center';
    cx.fillText('DINO',x+w*8,y+12);cx.textAlign='left';
  });
  bld(38,2,8,6,(x,y,w,h)=>{ // lasek
    lbl('LASEK',x+w*8,y+h+18);
  });
  lbl('JEZIORO MIEJSKIE',24*16-camX,31*16-camY);
  bld(19,12,3,2,drawPKS);
}
function drawBuildingsMorze(){
  bld(6,18,7,5,(x,y,w,h)=>{ // smażalnia
    R(cx,x,y+10,w*16,h-10,'#4a6a9a');R(cx,x-2,y+4,w*16+4,8,'#31518f');
    R(cx,x+10,y+22,16,12,'#a8d8f0');R(cx,x+w*16-26,y+22,16,12,'#a8d8f0');
    R(cx,x+w*8-8,y-6,16,12,'#ece9f4');
    cx.font='6px "Press Start 2P"';cx.fillStyle='#e04848';cx.textAlign='center';
    cx.fillText('🐟',x+w*8,y+3);cx.textAlign='left';
    lbl('SMAŻALNIA',x+w*8,y+h+10);
  });
  bld(38,18,8,5,(x,y,w,h)=>{ // Dino nadmorskie
    R(cx,x,y+10,w*16,h-10,'#3f7a46');R(cx,x,y+4,w*16,10,'#ece9f4');
    cx.font='7px "Press Start 2P"';cx.fillStyle='#c8384a';cx.textAlign='center';
    cx.fillText('DINO',x+w*8,y+12);cx.textAlign='left';
  });
  bld(48,13,5,4,(x,y,w,h)=>{ // stragan
    R(cx,x,y+6,w*16,h-6,'#8a7548');
    R(cx,x-2,y,w*16+4,8,(Math.floor(anim)%2)?'#6fd8e8':'#4ab8c8');
    for(let i=0;i<3;i++)R(cx,x+6+i*22,y+14,14,10,['#f5c542','#e88ac8','#7bc950'][i]);
    lbl('GADŻETY',x+w*8,y+h+10);
  });
  // latarnia morska w oddali
  bld(2,11,2,2,(x,y)=>{
    R(cx,x,y-26,10,30,'#ece9f4');R(cx,x,y-26,10,8,'#c8384a');R(cx,x,y-12,10,6,'#c8384a');
    R(cx,x+2,y-32,6,6,Math.floor(anim*2)%2?'#fff7d6':'#f5c542');
    lbl('LATARNIA',x+5,y+14);
  });
  lbl('BAŁTYK',28*16-camX,5*16-camY);
  lbl('MOLO',27.5*16+8-camX,17*16-camY);
  bld(17,27,3,2,drawPKS);
}
function drawBuildingsKrakow(){
  bld(27,14,7,5,(x,y,w,h)=>{ // Sukiennice
    R(cx,x,y+14,w*16,h-14,'#e8d9a8');
    for(let i=0;i<6;i++)R(cx,x+6+i*18,y+22,10,h-24,'#c9b478'); // arkady
    R(cx,x-3,y+8,w*16+6,8,'#c9a84a');                          // attyka
    for(let i=0;i<8;i++)R(cx,x+i*14,y+4,6,6,'#c9a84a');
    lbl('SUKIENNICE',x+w*8,y+h+10);
  });
  bld(36,6,6,5,(x,y,w,h)=>{ // Kościół Mariacki
    R(cx,x,y+16,w*16,h-16,'#8a4a34');
    for(let i=0;i<3;i++)R(cx,x+10+i*28,y+26,10,18,'#5e3222');
    R(cx,x+6,y-22,16,40,'#8a4a34');                            // wieża wyższa
    cx.fillStyle='#5e3222';cx.beginPath();cx.moveTo(x+4,y-22);cx.lineTo(x+14,y-40);cx.lineTo(x+24,y-22);cx.fill();
    R(cx,x+13,y-46,3,8,'#f5c542');                             // korona hejnalicy
    R(cx,x+w*16-24,y-8,16,26,'#8a4a34');                       // wieża niższa
    cx.fillStyle='#5e3222';cx.beginPath();cx.moveTo(x+w*16-26,y-8);cx.lineTo(x+w*16-16,y-20);cx.lineTo(x+w*16-6,y-8);cx.fill();
    lbl('MARIACKI',x+w*8,y+h+10);
  });
  bld(6,26,11,7,(x,y,w,h)=>{ // Wawel
    R(cx,x,y+18,w*16,h-18,'#d8cba8');
    R(cx,x-2,y+12,w*16+4,8,'#b8a878');
    R(cx,x+6,y-2,18,24,'#c9b88a');R(cx,x+w*16-24,y-2,18,24,'#c9b88a'); // baszty
    cx.fillStyle='#8a4a34';
    cx.beginPath();cx.moveTo(x+4,y-2);cx.lineTo(x+15,y-16);cx.lineTo(x+26,y-2);cx.fill();
    cx.beginPath();cx.moveTo(x+w*16-26,y-2);cx.lineTo(x+w*16-15,y-16);cx.lineTo(x+w*16-4,y-2);cx.fill();
    R(cx,x+14,y-30,2,15,'#8a8aa0');R(cx,x+16,y-30,10,4,'#ece9f4');R(cx,x+16,y-26,10,4,'#c8384a');
    for(let i=0;i<5;i++)R(cx,x+34+i*16,y+24,8,12,'#8a7a5a');
    lbl('WAWEL',x+w*8,y+h+10);
  });
  lbl('RYNEK GŁÓWNY',30*16-camX,12*16-camY-4);
  lbl('WISŁA',30*16-camX,36*16-camY);
  bld(43,12,4,3,(x,y,w,h)=>{ // obwarzanki
    R(cx,x,y+6,w*16,h-6,'#8a7548');
    R(cx,x-2,y,w*16+4,8,(Math.floor(anim)%2)?'#f5c542':'#e0b030');
    for(let i=0;i<3;i++){cx.strokeStyle='#c9944a';cx.lineWidth=3;
      cx.beginPath();cx.arc(x+10+i*18,y+16,5,0,7);cx.stroke();}
    lbl('OBWARZANKI',x+w*8,y+h+12);
  });
  bld(50,26,3,2,drawPKS);
}
function drawBuildingsTatry(){
  bld(11,1,6,4,(x,y,w,h)=>{ // Giewont — krzyż na szczycie
    cx.fillStyle='#5c5c6e';
    cx.beginPath();cx.moveTo(x-10,y+h+20);cx.lineTo(x+w*8,y-14);cx.lineTo(x+w*16+10,y+h+20);cx.fill();
    cx.fillStyle='#e8eef8';
    cx.beginPath();cx.moveTo(x+w*8,y-14);cx.lineTo(x+w*8-14,y+6);cx.lineTo(x+w*8+14,y+6);cx.fill();
    R(cx,x+w*8-1.5,y-34,3,22,'#3a3a48');R(cx,x+w*8-8,y-28,16,3,'#3a3a48');
    lbl('GIEWONT',x+w*8,y-40);
  });
  bld(14,16,6,4,(x,y,w,h)=>{ // karczma góralska
    R(cx,x,y+16,w*16,h-16,'#6e4720');
    for(let i=0;i<4;i++)R(cx,x,y+18+i*8,w*16,2,'#5a3a1a');       // bale
    cx.fillStyle='#4a3620';
    cx.beginPath();cx.moveTo(x-8,y+18);cx.lineTo(x+w*8,y-10);cx.lineTo(x+w*16+8,y+18);cx.fill();
    cx.fillStyle='#e8eef8';cx.beginPath();cx.moveTo(x+w*8,y-10);cx.lineTo(x+w*8-16,y-2);cx.lineTo(x+w*8+16,y-2);cx.fill();
    R(cx,x+10,y+26,12,14,'#3a2a14');R(cx,x+w*16-26,y+24,16,10,'#f5c542');
    lbl('KARCZMA',x+w*8,y+h+10);
  });
  bld(24,16,4,3,(x,y,w,h)=>{ // oscypki
    R(cx,x,y+6,w*16,h-6,'#8a7548');
    R(cx,x-2,y,w*16+4,8,(Math.floor(anim)%2)?'#e8d9a8':'#d8c088');
    for(let i=0;i<3;i++){rr(cx,x+8+i*16,y+14,10,6,3,'#e8d9a8');R(cx,x+10+i*16,y+15,6,4,'#c9a84a');}
    lbl('OSCYPKI',x+w*8,y+h+12);
  });
  lbl('KRUPÓWKI',27*16-camX,23*16-camY+4);
  lbl('ZAKOPIANKA',8*16-camX,26*16-camY-2);
  bld(38,24,3,2,drawPKS);
}
function bld(tx,ty,tw,th,fn){
  const x=tx*16-camX,y=ty*16-camY;
  if(x>W+50||y>H+160||x+tw*16<-50||y+th*16<0)return;
  fn(x,y,tw,th*16);
}
function lbl(t,x,y){cx.font='6px "Press Start 2P"';cx.fillStyle='rgba(236,233,244,.9)';
  cx.textAlign='center';cx.fillText(t,x,y);cx.textAlign='left';}
function drawQuestArrow(){
  if(REG==='arena')return;
  const act=Object.keys(QUESTS).find(q=>qs(q)===1);
  let target=null,treg=REG;
  const giverT=id=>{const g=NPCS.find(n=>n.id===QUESTS[id].giver);
    if(g){treg=g.r;return[g.x,g.y];}return null;};
  if(S.trip===1){target=[34*16,33*16];treg='wawa';}
  else if(act&&COLLECT[act]){
    const cfg=COLLECT[act];treg=cfg.r;
    for(let i=0;i<cfg.pts.length;i++)if(!(S.col[act]||[]).includes(i)){target=[cfg.pts[i][0]*16,cfg.pts[i][1]*16];break;}
    if(!target)target=giverT(act);
  }else if(act){
    target=giverT(act);
    // questy walki: wskaż najbliższego hejtera we właściwym regionie
    if((act==='seba'&&REG==='wawa'&&(S.k.seba||0)<6)||(act==='dych'&&REG==='morze'&&(S.k.dych||0)<3)){
      let best=null,bd=1e9;
      for(const f of foes){const d=Math.hypot(f.x-P.x,f.y-P.y);if(d<bd){bd=d;best=f;}}
      if(best){target=[best.x,best.y];treg=REG;}
    }
  }else{
    const next=Object.keys(QUESTS).find(q=>qs(q)===0);
    if(next)target=giverT(next);
  }
  if(!target)return;
  if(treg!==REG){const pk=REGIONS[REG].pks;target=[pk[0]*16,pk[1]*16];}
  const dx=target[0]-P.x,dy=target[1]-P.y;
  if(Math.hypot(dx,dy)<70)return;
  const a=Math.atan2(dy,dx);
  const ax=W/2+Math.cos(a)*54,ay=H/2+Math.sin(a)*44;
  cx.save();cx.translate(ax,ay);cx.rotate(a);
  cx.fillStyle='rgba(245,197,66,.9)';
  cx.beginPath();cx.moveTo(8,0);cx.lineTo(-4,-5);cx.lineTo(-4,5);cx.fill();
  cx.restore();
}

/* =====================================================================
   MINIGRA: POGOŃ DZIKÓW
   ===================================================================== */
const MB={};
function startBoar(){
  scene='mgBoar';
  MB.time=45;MB.caught=0;MB.total=8;MB.px=W/2;MB.py=H/2;MB.dir=0;MB.frame=0;
  MB.obs=[[80,60],[380,70],[120,220],[360,210],[240,120]];
  MB.boars=[];for(let i=0;i<8;i++)MB.boars.push({x:40+Math.random()*(W-80),y:40+Math.random()*(H-80),
    vx:0,vy:0,t:Math.random()});
  vsay('v_cochcecie');
}
function updateBoar(dt){
  MB.time-=dt;
  const[dx,dy]=moveVec();
  if(dx||dy){MB.px+=dx*120*dt;MB.py+=dy*120*dt;MB.frame+=dt*10;
    MB.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);}
  MB.px=Math.max(14,Math.min(W-14,MB.px));MB.py=Math.max(30,Math.min(H-14,MB.py));
  for(const b of MB.boars){
    if(b.dead)continue;
    const ddx=b.x-MB.px,ddy=b.y-MB.py,d=Math.hypot(ddx,ddy);
    b.t+=dt;
    if(d<90){b.vx=ddx/d*95;b.vy=ddy/d*95;}
    else if(b.t>1.5){b.t=0;const a=Math.random()*7;b.vx=Math.cos(a)*40;b.vy=Math.sin(a)*40;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<16||b.x>W-16){b.vx*=-1;b.x=Math.max(16,Math.min(W-16,b.x));}
    if(b.y<32||b.y>H-16){b.vy*=-1;b.y=Math.max(32,Math.min(H-16,b.y));}
    for(const[ox,oy]of MB.obs){const od=Math.hypot(b.x-ox,b.y-oy);
      if(od<20){b.vx+=(b.x-ox)/od*60;b.vy+=(b.y-oy)/od*60;}}
    if(d<15){b.dead=true;MB.caught++;SFX.boar();check67(MB.caught);
      if(MB.caught===MB.total){mgWin('dziki','🐗 Wszystkie dziki pogonione!<br>Pani Grażynka może sadzić dalej.');return;}
      if(Math.random()<.35&&!curVoice)vsay(pickA(['c_uciekajcie','c_elegancko2','c_maliny']));}
  }
  if(MB.time<=0)mgLose('Dziki uciekły... Złapane: '+MB.caught+'/8','dziki');
}
function drawBoarMG(){
  R(cx,0,0,W,H,'#2e5a34');
  for(let i=0;i<60;i++){const x=(i*83)%W,y=(i*47)%H;if(i%3)R(cx,x,y,2,2,'#376b3e');}
  for(const[ox,oy]of MB.obs){
    cx.fillStyle='rgba(0,0,0,.22)';cx.beginPath();cx.ellipse(ox,oy+8,9,3,0,0,7);cx.fill();
    R(cx,ox-4,oy,8,10,'#4a3620');
    cx.fillStyle='#1e4426';cx.beginPath();cx.arc(ox,oy-6,11,0,7);cx.fill();
    cx.fillStyle='#26542e';cx.beginPath();cx.arc(ox-4,oy-10,7,0,7);cx.fill();}
  for(const b of MB.boars)if(!b.dead)drawBoarTop(cx,{...b,dx:b.vx,t:anim},b.x-9,b.y-10);
  drawEdekBody(cx,MB.px-8,MB.py-20,MB.dir,Math.floor(MB.frame)%2,1,S.equip);
  drawVignette();
  mgHud('🐗 '+MB.caught+'/8','⏱ '+Math.ceil(MB.time));
}

/* =====================================================================
   MINIGRA: DOSTAWA DO DINO
   ===================================================================== */
const MD={};
function startDino(){
  scene='mgDino';MD.x=W/2;MD.caught=0;MD.need=15;MD.miss=0;MD.maxMiss=8;MD.items=[];MD.t=0;MD.spd=1;
}
function updateDino(dt){
  const[dx]=moveVec();MD.x+=dx*260*dt;MD.x=Math.max(24,Math.min(W-24,MD.x));
  MD.t-=dt;MD.spd=1+MD.caught*.02;
  if(MD.t<=0){MD.t=(.7+Math.random()*.55)/MD.spd;
    const r=Math.random();
    MD.items.push({x:30+Math.random()*(W-60),y:20,
      t:r<.64?'nap':r<.84?'nap2':r<.91?'gray':'dia',vy:(65+Math.random()*50)*MD.spd});}
  for(const it of MD.items){
    it.y+=it.vy*dt;
    if(it.y>H-42&&it.y<H-14&&Math.abs(it.x-MD.x)<30){
      it.dead=true;
      if(it.t==='gray'){MD.miss++;SFX.hit();toast('To podróbka konkurencji! 🤢');}
      else if(it.t==='dia'){S.dia+=2;save();refreshHUD();SFX.dia();}
      else{MD.caught++;SFX.ok();check67(MD.caught);
        if(MD.caught>=MD.need){mgWin('dino','🥤 Dostawa uratowana!<br>Napoje Edka na półkach Dino!');return;}}
    }
    if(it.y>H-8&&!it.dead){it.dead=true;
      if(it.t==='nap'||it.t==='nap2'){MD.miss++;SFX.miss();
        if(MD.miss>=MD.maxMiss){mgLose('Za dużo strat! Złapane: '+MD.caught+'/'+MD.need,'dino');return;}}}
  }
  MD.items=MD.items.filter(i=>!i.dead);
}
function drawDinoMG(){
  R(cx,0,0,W,H,'#3f7a46');R(cx,0,0,W,26,'#ece9f4');
  cx.font='8px "Press Start 2P"';cx.fillStyle='#c8384a';cx.textAlign='center';
  cx.fillText('DINO — DOSTAWA NAPOJÓW EDKA',W/2,17);cx.textAlign='left';
  for(let i=0;i<4;i++){R(cx,20,60+i*54,W-40,4,'#2a5230');R(cx,20,44+i*54,W-40,16,'#356540');}
  for(const it of MD.items){
    if(it.t==='nap'){rr(cx,it.x-5,it.y-8,10,16,2,'#e04848');R(cx,it.x-5,it.y-8,10,3,'#c9c4dd');R(cx,it.x-3,it.y-3,6,6,'#ece9f4');}
    else if(it.t==='nap2'){rr(cx,it.x-5,it.y-8,10,16,2,'#7bc950');R(cx,it.x-5,it.y-8,10,3,'#c9c4dd');R(cx,it.x-3,it.y-3,6,6,'#ece9f4');}
    else if(it.t==='gray'){rr(cx,it.x-5,it.y-8,10,16,2,'#6a6a7a');R(cx,it.x-3,it.y-4,6,3,'#4a4a5a');}
    else{R(cx,it.x-4,it.y-4,8,8,'#6fd8e8');R(cx,it.x-2,it.y-6,4,2,'#fff');}
  }
  drawEdekBody(cx,MD.x-8,H-52,0,Math.floor(anim*8)%2,1,S.equip);
  rr(cx,MD.x-24,H-26,48,12,3,'#8a8aa0');R(cx,MD.x-22,H-28,44,4,'#a8a8c0');
  R(cx,MD.x-18,H-12,6,6,'#3a3454');R(cx,MD.x+12,H-12,6,6,'#3a3454');
  drawVignette();
  mgHud('🥤 '+MD.caught+'/'+MD.need,'💔 '+MD.miss+'/'+MD.maxMiss);
}

/* =====================================================================
   MINIGRA: RYTMICZNA (Byku / Metro)
   ===================================================================== */
const MR={};
const TRACKS={
  byku:{buf:'song',dur:15.726,period:.40638,phase:.052,loops:1,need:.65,
    title:'„JESTEM WARCHOCKIM EDWARDEM BYKU”'},
  metro:{buf:'metro_rhythm',dur:45.036,period:.47581,phase:.017,loops:1,need:.65,
    title:'„METRO” — OSTATNI WAGON'},
};
function buildNotes(cfg){
  const notes=[];
  const perLoop=Math.floor((cfg.dur-cfg.phase)/cfg.period)-1;
  for(let loop=0;loop<cfg.loops;loop++){
    for(let i=0;i<perLoop;i++){
      const t=cfg.phase+i*cfg.period+loop*cfg.dur;
      if(cfg.loops===2){
        if(loop===0&&(i%8===5||i%8===7))continue;
        if(loop===1&&i%16===15)continue;
      }else{
        if(i%8===6)continue;
      }
      const lane=(i*7+loop*3+((i/4)|0))%3;
      notes.push({t:t+.02,lane,hit:0});
      if(((cfg.loops===2&&loop===1)||(cfg.loops===1&&i>perLoop/2))&&i%8===3)
        notes.push({t:t+cfg.period/2,lane:(lane+1)%3,hit:0});
    }
  }
  return notes;
}
function startRhythm(track){
  initAudio().then(()=>{
    scene='mgRhythm';
    MR.cfg=TRACKS[track];MR.track=track;
    MR.notes=buildNotes(MR.cfg);MR.score=0;MR.max=MR.notes.length*100;MR.combo=0;MR.judge='';MR.judgeT=0;
    MR.flash=[0,0,0];MR.ended=false;stopVoice();
    MR.endT=(MR.notes.length?Math.max(...MR.notes.map(n=>n.t)):MR.cfg.dur)+1.1;
    playSong(MR.cfg.buf,MR.cfg.loops>1);   // zapętlaj tylko gdy nuty > długość utworu
    MR.fakeT0=performance.now();
  });
}
function songTime(){return (AC&&songSrc)?AC.currentTime-songT0:((performance.now()-(MR.fakeT0||0))/1000);}
function rhythmHitLane(lane){
  const t=songTime();
  let bestN=null,bestD=1;
  for(const n of MR.notes){if(n.hit||n.lane!==lane)continue;const d=Math.abs(n.t-t);if(d<bestD){bestD=d;bestN=n;}}
  if(bestN&&bestD<0.18){
    bestN.hit=1;MR.flash[lane]=0.15;
    if(bestD<0.09){MR.score+=100;MR.combo++;MR.judge='PERFEKT!';SFX.note('P');}
    else{MR.score+=75;MR.combo++;MR.judge='DOBRZE';SFX.note('G');}
  }else{MR.combo=0;MR.judge='PUDŁO';SFX.miss();}
  MR.judgeT=.5;
}
function rhythmKey(code){
  if(code==='ArrowLeft'||code==='KeyA')rhythmHitLane(0);
  else if(code==='ArrowDown'||code==='KeyS')rhythmHitLane(1);
  else if(code==='ArrowRight'||code==='KeyD')rhythmHitLane(2);
}
function rhythmTap(gx){
  const laneX=[W/2-10,W/2+60,W/2+130];
  let best=0,bd=1e9;
  for(let i=0;i<3;i++){const d=Math.abs(gx-laneX[i]);if(d<bd){bd=d;best=i;}}
  rhythmHitLane(best);
}
function endRhythm(){
  if(MR.ended)return;
  MR.ended=true;
  const pct=Math.round(MR.score/MR.max*100);
  check67(pct);
  const quest=MR.track==='byku'?'freestyle':'metro';
  if(pct>=MR.cfg.need*100)mgWin(quest,'🎤 '+pct+'% trafień!<br>'+(MR.track==='byku'?'Tłum pod Pałacem szaleje!':'Całe metro tańczy, wagon po wagonie!'));
  else mgLose('Tylko '+pct+'% trafień (trzeba '+(MR.cfg.need*100)+'%).<br>Trenuj rytm, byku!',quest);
}
function updateRhythm(dt){
  const t=songTime();
  for(const n of MR.notes)if(!n.hit&&n.t<t-0.2){n.hit=-1;MR.combo=0;}
  if(MR.judgeT>0)MR.judgeT-=dt;
  for(let i=0;i<3;i++)if(MR.flash[i]>0)MR.flash[i]-=dt;
  if(t>MR.endT)endRhythm();
}
function drawRhythmMG(){
  const t=songTime(),metro=MR.track==='metro';
  R(cx,0,0,W,H,metro?'#0e0c1c':'#171429');
  if(metro){
    // tunel metra
    R(cx,0,60,W,140,'#1a1836');
    for(let i=0;i<8;i++){const off=((anim*140)%80);
      R(cx,i*80-off,60,4,140,'#2a2450');}
    R(cx,0,196,W,10,'#31518f');
    for(let i=0;i<6;i++){const off=((anim*140)%100);
      R(cx,i*100-off,199,50,4,'#f5c542');}
    cx.font='7px "Press Start 2P"';cx.fillStyle='#6fd8e8';cx.textAlign='center';
    cx.fillText('🚇 STACJA PO STACJI WCHODZI BAS',W/2,52);cx.textAlign='left';
  }else{
    R(cx,W/2-40,20,80,120,'#332a5c');R(cx,W/2-15,0,30,30,'#3d3370');R(cx,W/2-3,-6,6,10,'#f5c542');
    cx.fillStyle='#f5c54255';for(let i=0;i<8;i++)for(let j=0;j<6;j++)if((i*3+j)%3<2)cx.fillRect(W/2-32+i*8,34+j*16,3,5);
    R(cx,0,140,W,H-140,'#241e3f');
    for(let i=0;i<24;i++){const fx=20+i*19.5,fy=150+((i*37)%40);
      R(cx,fx,fy+Math.sin(anim*6+i)*(reduceMotion?0:2),8,14,['#4a5a8a','#6a4a6a','#4a6a5a'][i%3]);
      R(cx,fx+1,fy-6+Math.sin(anim*6+i)*(reduceMotion?0:2),6,6,'#e8c9a0');}
  }
  cx.save();cx.translate(56,190);cx.rotate(Math.sin(anim*8)*(reduceMotion?0:.08));
  drawEdekBody(cx,-14,-42,0,Math.floor(anim*8)%2,1.7,S.equip);cx.restore();
  const laneX=[W/2-10,W/2+60,W/2+130],hitY=H-46;
  const laneKey=['◀','▼','▶'];
  for(let i=0;i<3;i++){
    R(cx,laneX[i]-22,30,44,H-60,MR.flash[i]>0?'rgba(245,197,66,.25)':'rgba(255,255,255,.06)');
    cx.strokeStyle='#f5c542';cx.lineWidth=2;cx.strokeRect(laneX[i]-20,hitY-12,40,24);
    cx.font='9px "Press Start 2P"';cx.fillStyle='#8f88b0';cx.textAlign='center';
    cx.fillText(laneKey[i],laneX[i],H-10);cx.textAlign='left';
  }
  for(const n of MR.notes){
    if(n.hit)continue;
    const dy=(n.t-t)*140;const y=hitY-dy;
    if(y<20||y>H-20)continue;
    rr(cx,laneX[n.lane]-12,y-8,24,16,4,metro?'#6fd8e8':'#f5c542');
    R(cx,laneX[n.lane]-8,y-4,16,8,metro?'#d8f4fa':'#fff7d6');
  }
  R(cx,20,14,W-40,6,'#3a3160');R(cx,20,14,(W-40)*Math.min(1,t/MR.endT),6,'#f5c542');
  mgHud('🎵 '+MR.score,'COMBO '+MR.combo);
  if(MR.judgeT>0){cx.font='11px "Press Start 2P"';cx.textAlign='center';
    cx.fillStyle=MR.judge==='PUDŁO'?'#e04848':'#7bc950';
    cx.fillText(MR.judge,W/2+60,70);cx.textAlign='left';}
}

/* =====================================================================
   MINIGRA: SIMON (Sejm — mowa / Kopernik — taniec)
   ===================================================================== */
const MS={};
const ARROWS=['◀','▲','▶','▼'];
function startSimon(mode){
  scene='mgSimon';MS.mode=mode;MS.round=0;MS.seq=[];MS.input=[];MS.show=-1;MS.showT=0;
  MS.stage='intro';MS.stageT=1.2;MS.applause=50;
  nextSimonRound();
}
function nextSimonRound(){
  MS.round++;MS.seq=[];const len=3+MS.round;
  for(let i=0;i<len;i++)MS.seq.push((Math.random()*4)|0);
  MS.input=[];MS.stage='show';MS.show=0;MS.showT=.7;
}
function simonKey(code){
  if(MS.stage!=='input')return;
  const m={ArrowLeft:0,KeyA:0,ArrowUp:1,KeyW:1,ArrowRight:2,KeyD:2,ArrowDown:3,KeyS:3};
  if(m[code]!==undefined)simonPress(m[code]);
}
function simonTap(gx,gy){
  if(MS.stage!=='input')return;
  const cxx=W/2,cyy=H-60,dx=gx-cxx,dy=gy-cyy;
  if(Math.abs(dx)>Math.abs(dy))simonPress(dx<0?0:2);else simonPress(dy<0?1:3);
}
function simonPress(a){
  MS.input.push(a);SFX.ok();
  const i=MS.input.length-1;
  if(MS.seq[i]!==a){
    MS.applause-=25;SFX.no();MS.stage='fail';MS.stageT=1.2;
    if(MS.applause<=0){
      mgLose(MS.mode==='sejm'?'Posłowie zasnęli... Spróbuj jeszcze raz!':'Ochrona kręci nosem... Jeszcze raz!',
        MS.mode==='sejm'?'sejm':'kopernik');
    }
    return;
  }
  MS.applause=Math.min(100,MS.applause+4);
  if(MS.input.length===MS.seq.length){
    if(MS.round>=3){
      if(MS.mode==='sejm')mgWin('sejm','🏛 Owacje na stojąco!<br>Sejm skanduje: E-DEK! E-DEK!');
      else mgWin('kopernik','🕺 Ochrona bije brawo!<br>Kopernik stoi przed Tobą otworem!');
      return;
    }
    MS.stage='ok';MS.stageT=1;
  }
}
function updateSimon(dt){
  if(MS.stage==='intro'){MS.stageT-=dt;if(MS.stageT<=0){MS.stage='show';MS.show=0;MS.showT=.7;}}
  else if(MS.stage==='show'){
    MS.showT-=dt;
    if(MS.showT<=0){MS.show++;MS.showT=.7;SFX.note('G');
      if(MS.show>=MS.seq.length){MS.stage='input';MS.show=-1;}}
  }
  else if(MS.stage==='ok'){MS.stageT-=dt;if(MS.stageT<=0)nextSimonRound();}
  else if(MS.stage==='fail'){MS.stageT-=dt;if(MS.stageT<=0){MS.input=[];MS.stage='show';MS.show=0;MS.showT=.7;}}
}
function drawSimonMG(){
  const dance=MS.mode==='dance';
  R(cx,0,0,W,H,dance?'#141127':'#2a2440');
  if(dance){
    // hol Kopernika + dyskotekowe światła
    R(cx,0,140,W,H-140,'#1a2a3a');
    for(let i=0;i<5;i++){
      const hue=['#e04848','#f5c542','#6fd8e8','#7bc950','#c86fa8'][i];
      const bx=(i*97+anim*60)%W;
      cx.globalAlpha=.14;cx.fillStyle=hue;
      cx.beginPath();cx.moveTo(bx,0);cx.lineTo(bx-30,H);cx.lineTo(bx+30,H);cx.fill();
      cx.globalAlpha=1;
    }
    for(let i=0;i<8;i++)R(cx,20+i*56,150+((i*31)%30),8,14,['#4a5a8a','#6a4a6a'][i%2]);
    cx.font='7px "Press Start 2P"';cx.fillStyle='#6fd8e8';cx.textAlign='center';
    cx.fillText('CENTRUM NAUKI KOPERNIK — TANIEC NA ZGODĘ',W/2,30);cx.textAlign='left';
  }else{
    for(let r=0;r<4;r++){const y=140+r*34;
      R(cx,30+r*10,y,W-60-r*20,18,'#4a4180');
      for(let i=0;i<16-r*2;i++){const fx=44+r*14+i*((W-90-r*28)/(16-r*2));
        R(cx,fx,y-8,7,10,'#e8c9a0');R(cx,fx-1,y-11,9,4,['#3a2a1a','#888','#222','#6a4a2a'][i%4]);}}
    R(cx,W/2-34,52,68,40,'#6a5a4a');R(cx,W/2-38,48,76,8,'#54462f');
    R(cx,W/2-8,26,16,10,'#ece9f4');R(cx,W/2-2,22,4,6,'#ece9f4');
  }
  // Edek
  cx.save();
  if(dance){cx.translate(W/2,120);cx.rotate(Math.sin(anim*6)*(reduceMotion?0:.12));
    drawEdekBody(cx,-11,-34,0,Math.floor(anim*8)%2,1.6,S.equip);}
  else drawEdekBody(cx,W/2-11,8,0,Math.floor(anim*3)%2,1.4,S.equip);
  cx.restore();
  R(cx,20,14,W-40,8,'#3a3160');
  R(cx,20,14,(W-40)*MS.applause/100,8,MS.applause>60?'#7bc950':MS.applause>30?'#f5c542':'#e04848');
  cx.font='6px "Press Start 2P"';cx.fillStyle='#8f88b0';cx.fillText(dance?'VIBE':'APLAUZ',22,32);
  cx.fillStyle='#f5c542';cx.fillText('RUNDA '+MS.round+'/3',W-80,32);
  cx.font='16px "Press Start 2P"';cx.textAlign='center';
  if(MS.stage==='show'&&MS.show<MS.seq.length){
    cx.fillStyle='#f5c542';cx.fillText(ARROWS[MS.seq[MS.show]],W/2,dance?200:124);
    cx.font='7px "Press Start 2P"';cx.fillStyle='#8f88b0';
    cx.fillText(dance?'ZAPAMIĘTAJ KROKI TANECZNE':'ZAPAMIĘTAJ GESTY MARSZAŁKA',W/2,H-16);
  }else if(MS.stage==='input'){
    cx.font='7px "Press Start 2P"';cx.fillStyle='#7bc950';
    cx.fillText('POWTÓRZ! ('+MS.input.length+'/'+MS.seq.length+')  strzałki / dotknij kierunek',W/2,H-16);
    cx.font='12px "Press Start 2P"';cx.fillStyle='#ece9f4';
    cx.fillText(MS.input.map(a=>ARROWS[a]).join(' '),W/2,dance?200:124);
  }else if(MS.stage==='fail'){
    cx.font='10px "Press Start 2P"';cx.fillStyle='#e04848';cx.fillText(dance?'NIE TEN KROK! OD NOWA!':'BUUU! OD NOWA!',W/2,dance?200:124);
  }else if(MS.stage==='ok'){
    cx.font='10px "Press Start 2P"';cx.fillStyle='#7bc950';cx.fillText(dance?'CZUJESZ TO! DALEJ!':'BRAWO! E-DEK! E-DEK!',W/2,dance?200:124);
  }
  cx.textAlign='left';
  drawVignette();
}

/* =====================================================================
   MINIGRA: DOPING (mecz ze Szwecją)
   ===================================================================== */
const MC={};
function startMecz(){
  scene='mgMecz';MC.round=1;MC.bar=20;MC.time=8;MC.taps=0;MC.done=false;
}
function meczTap(){
  if(scene!=='mgMecz')return;
  MC.bar=Math.min(104,MC.bar+8);MC.taps++;SFX.tap();check67(MC.taps);
}
function updateMecz(dt){
  MC.time-=dt;
  MC.bar-=(16+MC.round*7)*dt;
  if(MC.bar<0)MC.bar=0;
  if(MC.bar>=100){
    SFX.ok();MC.round++;
    if(MC.round>3){mgWin('mecz','📣 Trybuny oszalały!<br>„PO-LSKA! PO-LSKA!” słychać w Szwecji!');return;}
    MC.bar=20;MC.time=8;
    toast('📣 RUNDA '+MC.round+'/3 — głośniej!');
  }
  if(MC.time<=0)mgLose('Doping ucichł... Trybuny zasnęły przy rundzie '+MC.round+'/3.','mecz');
}
function drawMeczMG(){
  R(cx,0,0,W,H,'#171429');
  // trybuny falujące
  for(let r=0;r<5;r++){
    R(cx,0,30+r*26,W,22,r%2?'#241e3f':'#2a2348');
    for(let i=0;i<20;i++){
      const wave=Math.sin(anim*5+i*.6+r)*(reduceMotion?0:3)*(MC.bar/60);
      R(cx,10+i*24,34+r*26+wave,8,10,['#c8384a','#ece9f4'][((i+r)%2)]);
      R(cx,11+i*24,30+r*26+wave,6,5,'#e8c9a0');
    }
  }
  // murawa
  R(cx,0,H-90,W,90,'#2e6236');
  for(let i=0;i<6;i++)R(cx,0,H-90+i*15,W,7,i%2?'#2e6236':'#2a5a30');
  cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=2;
  cx.beginPath();cx.arc(W/2,H,46,Math.PI,0);cx.stroke();
  // Edek z megafonem
  cx.save();cx.translate(W/2,H-52);
  cx.rotate(Math.sin(anim*10)*(reduceMotion?0:.06)*(MC.bar/60));
  drawEdekBody(cx,-13,-38,0,Math.floor(anim*10)%2,1.8,Object.assign({},S.equip,{neck:'szalik'}));
  R(cx,16,-26,10,7,'#e04848');R(cx,26,-28,4,11,'#c8384a');
  cx.restore();
  // pasek dopingu
  R(cx,60,H-16,W-120,10,'#3a3160');
  R(cx,60,H-16,(W-120)*Math.min(1,MC.bar/100),10,MC.bar>70?'#7bc950':MC.bar>35?'#f5c542':'#e04848');
  cx.strokeStyle='#ece9f4';cx.strokeRect(60+(W-120)*.96,H-18,4,14);
  cx.font='8px "Press Start 2P"';cx.textAlign='center';
  cx.fillStyle='#f5c542';
  if(Math.floor(anim*3)%2===0)cx.fillText('TAP TAP TAP! (dotyk / SPACJA)',W/2,20);
  cx.fillText('RUNDA '+MC.round+'/3',W/2,H-24);
  cx.fillStyle='#ece9f4';cx.fillText('⏱ '+Math.max(0,MC.time).toFixed(1),W-50,20);
  cx.textAlign='left';
  drawVignette();
}

/* ---------------- wynik minigry ---------------- */
let mgQuest=null,mgRetryFn=null;
function mgHud(a,b){
  cx.font='8px "Press Start 2P"';
  cx.fillStyle='#000';cx.fillText(a,11,H-9);cx.fillStyle='#f5c542';cx.fillText(a,10,H-10);
  if(b){cx.textAlign='right';cx.fillStyle='#000';cx.fillText(b,W-9,H-9);cx.fillStyle='#ece9f4';cx.fillText(b,W-10,H-10);cx.textAlign='left';}
}
const RETRY={dziki:startBoar,dino:startDino,freestyle:()=>startRhythm('byku'),metro:()=>startRhythm('metro'),
  sejm:()=>startSimon('sejm'),kopernik:()=>startSimon('dance'),mecz:startMecz};
function mgWin(quest,txt){
  scene='world';stopSong();
  const replay=qs(quest)===2;
  $('mgEndTitle').textContent='✔ ELEGANCKO!';$('mgEndTitle').style.color='var(--green)';
  $('mgEndTxt').innerHTML=txt+(replay?'<br><span style="color:var(--gold)">↻ powtórka: +15 💎</span>':'');
  $('mgRetry').classList.add('hidden');
  $('mgEnd').classList.remove('hidden');
  vsay('v_elegancko');
  if(replay){
    mgQuest=null;
    S.dia+=15;save();refreshHUD();SFX.dia();
    addViews(4000+Math.random()*5000,true);
    if(Math.random()<.35)setTimeout(()=>postFilm('POWTÓRKA: '+QUESTS[quest].n.toUpperCase(),9000),1500);
  }else mgQuest=quest;
}
function mgLose(txt,quest){
  scene='world';stopSong();
  $('mgEndTitle').textContent='✖ NO NIE...';$('mgEndTitle').style.color='var(--red)';
  $('mgEndTxt').innerHTML=txt;
  $('mgRetry').classList.remove('hidden');
  $('mgEnd').classList.remove('hidden');
  mgQuest=null;
  mgRetryFn=RETRY[quest];
  vsay(pickA(['c_niepoddajemy','c_etam','c_strach']));
}
$('mgBack').addEventListener('click',()=>{
  $('mgEnd').classList.add('hidden');
  if(mgQuest){completeQuest(mgQuest);mgQuest=null;}
});
$('mgRetry').addEventListener('click',()=>{
  $('mgEnd').classList.add('hidden');
  if(mgRetryFn)mgRetryFn();
});

/* ---------------- FINAŁ ---------------- */
$('btnFinClose').addEventListener('click',()=>{$('finale').classList.add('hidden');stopSong();refreshHUD();});
$('btnShare').addEventListener('click',async()=>{
  const done=Object.keys(QUESTS).filter(q=>qs(q)===2).length,total=Object.keys(QUESTS).length;
  const txt='🤖👑 Zostałem LEGENDĄ INTERNETU w WARCHOCKI RPG! '+done+'/'+total+' questów, '+S.dia+
    ' 💎, '+fmtN(S.subs)+' subów i korona na głowie. Ogarniesz Polskę jak Edek i Dych? '+location.href;
  try{
    if(navigator.share)await navigator.share({text:txt});
    else{await navigator.clipboard.writeText(txt);$('shareNote').textContent='SKOPIOWANE! LEĆ Z TYM W ŚWIAT 🐗';}
  }catch(e){try{await navigator.clipboard.writeText(txt);$('shareNote').textContent='SKOPIOWANE!';}catch(e2){}}
});

/* ---------------- QUESTY: panel ---------------- */
function openQuests(){
  SFX.open();
  const el=$('questList');el.innerHTML='';
  let hidden=0;
  for(const[id,q]of Object.entries(QUESTS)){
    const st=qs(id);
    if(st===0){hidden++;continue;} // nieodkryte questy nie zaśmiecają dziennika
    let extra='';
    if(st===1&&COLLECT[id])extra=' ('+colGot(id)+'/'+COLLECT[id].pts.length+')';
    else if(st===1&&id==='seba')extra=' ('+(S.k.seba||0)+'/6)';
    else if(st===1&&id==='dych')extra=' ('+(S.k.dych||0)+'/3)';
    else if(st===2&&RETRY[id])extra=' · ↻ powtarzalny (+15💎)';
    el.insertAdjacentHTML('beforeend',
      '<div class="q '+(st===2?'done':st===1?'active':'')+'">'+
      '<h3>'+(st===2?'✔ ':st===1?'▶ ':'○ ')+q.n+extra+'</h3>'+
      '<p>'+q.desc+' <span class="rw">Nagroda: '+q.rw+' 💎</span></p></div>');
  }
  if(S.trip===1)el.insertAdjacentHTML('beforeend',
    '<div class="q active"><h3>▶ Złamany piszczel</h3><p>Dojdź (powoli...) do warsztatu Zenka i daj się pospawać.</p></div>');
  if(!el.children.length)el.insertAdjacentHTML('beforeend',
    '<p style="font-size:11px;line-height:2;color:var(--mut);text-align:center;padding:20px 10px">Dziennik pusty, byku!<br><br>Gadaj z ludźmi z <span style="color:var(--gold)">„!"</span> nad głową —<br>każdy ma dla Edka jakąś sprawę.</p>');
  if(hidden)el.insertAdjacentHTML('beforeend',
    '<p style="font-size:10px;color:var(--mut);text-align:center;padding:8px">🔍 Gdzieś w Polsce czeka jeszcze '+hidden+' nieodkrytych questów — szukaj „!” nad głowami.</p>');
  $('quests').classList.remove('hidden');
}

/* ---------------- START ---------------- */
function bootWorld(){
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  scene='world';
  refreshHUD();startMapMusic();stopSong();
  camX=Math.max(0,Math.min(MW*16-W,P.x-W/2));camY=Math.max(0,Math.min(MH*16-H,P.y-H/2));
  if(!S.introDone){
    S.introDone=true;save();
    say([
      {who:'Edek',t:'Ja jestem Edward Warchocki. Strach to nie dla mnie. Ja lubię wyzwania!',v:'c_strach'},
      {who:'Edek',t:'Ten rolex? Mam go na lewej dłoni. Dostałem go za filmik na TikToku.',v:'c_rolexlewa'},
      {who:'Edek',t:'Cała Polska czeka: 13 questów, 3 regiony, hejterzy do pogonienia i mój kanał do wykręcenia. Tapujcie serduszka!',v:'c_serduszka'},
      {who:'Edek',t:'Cios to SPACJA albo X. Jak hejter podskoczy — z kopyta go!',v:'c_kopytem'},
      {who:'Edek',t:'Fani wysyłają mi PACZKI 🎁 — w środku nowe postacie do ekipy! Drużyna to max trójka, przełączasz klawiszami 1-2-3.'},
      {who:'Edek',t:'Na mapach są DOMENY 🌀 z falami hejterów i skrzyniami, a gdzieś czają się BOSSOWIE ⚔️. Materiały z nich ulepszają postacie. No i elegancko.',v:'c_elegancko2'},
    ]);
  }
}
let lastStart=0;
$('btnNew').addEventListener('click',()=>{
  const now=performance.now();if(now-lastStart<400)return;lastStart=now;
  S=JSON.parse(JSON.stringify(DEFAULT_SAVE));save();
  setRegion('wawa');
  P.x=S.px;P.y=S.py;P.slow=false;applyChar();initPartyHP(true);resetFollowers();
  initAudio().then(()=>bootWorld());
});
$('btnCont').addEventListener('click',()=>{
  const now=performance.now();if(now-lastStart<400)return;lastStart=now;
  setRegion(S.region||'wawa');
  P.x=S.px||456;P.y=S.py||368;P.slow=(S.trip===1);
  applyChar();initPartyHP(true);resetFollowers();
  if(SOLID(at(Math.floor(P.x/16),Math.floor(P.y/16)))){const sp=REGIONS[REG].spawn;P.x=sp[0];P.y=sp[1];}
  initAudio().then(()=>bootWorld());
});
if(S)$('btnCont').classList.remove('hidden');
if(!S)S=JSON.parse(JSON.stringify(DEFAULT_SAVE));
setInterval(()=>{if(scene==='world'&&S&&REG!=='arena'){S.px=P.x;S.py=P.y;save();}},4000);

/* ---------------- PĘTLA ---------------- */
function drawTitleScene(){
  R(cx,0,0,W,H,'#171429');
  cx.fillStyle='rgba(236,233,244,.6)';
  for(let i=0;i<50;i++){const x=(i*127.3)%W,y=(i*61.7)%160;if(i%3)cx.fillRect(x|0,y|0,1,1);}
  R(cx,W/2-30,H-170,60,90,'#332a5c');R(cx,W/2-12,H-196,24,28,'#3d3370');R(cx,W/2-2,H-208,5,14,'#f5c542');
  R(cx,0,H-80,W,80,'#241e3f');
  const bx=140+Math.sin(anim)*10;
  drawBoarTop(cx,{dx:1,t:anim},bx,H-60);
  drawBoarTop(cx,{dx:1,t:anim+.5},bx-40,H-48);
  drawEdekBody(cx,bx+70,H-100,1,Math.floor(anim*6)%2,2,S?S.equip:DEFAULT_SAVE.equip);
  if(S&&S.dych){cx.save();cx.translate(bx+130,H-92);cx.scale(2,2);
    drawDychBody(cx,0,0,1,Math.floor(anim*6+1)%2);cx.restore();}
  drawVignette();
}
function typewriter(dt){
  if(scene!=='dialog'||!dlgLine)return;
  dlgChars=Math.min(dlgLine.t.length,dlgChars+dt*40);
  $('dlgText').textContent=dlgLine.t.slice(0,Math.floor(dlgChars));
  $('dlgMore').style.visibility=dlgChars>=dlgLine.t.length?'visible':'hidden';
}
function loop(ts){
  const dt=Math.min(.05,(ts-last)/1000)||0;last=ts;anim+=dt;
  cx.setTransform(RES,0,0,RES,0,0);
  if(paused){
    switch(scene){
      case 'title':drawTitleScene();break;
      case 'world':case 'dialog':drawWorld();break;
      case 'mgBoar':drawBoarMG();break;
      case 'mgDino':drawDinoMG();break;
      case 'mgRhythm':drawRhythmMG();break;
      case 'mgSimon':drawSimonMG();break;
      case 'mgMecz':drawMeczMG();break;
    }
    drawPauseOverlay();
    requestAnimationFrame(loop);
    return;
  }
  switch(scene){
    case 'title':drawTitleScene();break;
    case 'world':updateWorld(dt);drawWorld();break;
    case 'dialog':drawWorld();typewriter(dt);break;
    case 'mgBoar':updateBoar(dt);if(scene==='mgBoar')drawBoarMG();break;
    case 'mgDino':updateDino(dt);if(scene==='mgDino')drawDinoMG();break;
    case 'mgRhythm':updateRhythm(dt);if(scene==='mgRhythm')drawRhythmMG();break;
    case 'mgSimon':updateSimon(dt);if(scene==='mgSimon')drawSimonMG();break;
    case 'mgMecz':updateMecz(dt);if(scene==='mgMecz')drawMeczMG();break;
  }
  requestAnimationFrame(loop);
}
document.fonts.load('8px "Press Start 2P"').finally(()=>requestAnimationFrame(loop));
