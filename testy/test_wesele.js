/* WESELE W REMIZIE — pięć ręcznych plansz, goście weselni i PAŃSTWO MŁODZI.
   Uruchamianie: ./testy/sprawdz.sh test_wesele.js

   Powód istnienia: ta domena stoi na rzeczach, których `node --check` nie
   ruszy — na kałużach, które muszą ZOSTAĆ do końca walki, na beczkach, które
   przewracają się co 25% HP, i na jednym warunku, od którego zależy cała
   druga faza: czy panna młoda wpadnie w rozlany spirytus i czy on się zapali. */

function wejdz(){
  scene='world';dlgQ=null;domAlways=1;
  enterDomain('wesele');scene='world';dlgQ=[];
}
function pietro(i){wejdz();domLoadFloor(i);scene='world';dlgQ=[];}
function przewin(n){for(let i=0;i<n;i++)updateWorld(1/60);}
/* PUŁAPKA: wejście bossa woła addHitStop(), a hit-stop ROBI `return` na wejściu
   updateWorld. Dwie klatki po scence to wciąż zamrożony świat — stąd `oddech`. */
function oddech(){przewin(20);}
function nieumieralny(){for(const id of S.party)PHP[id]=999999;hurtT=0;}
function przeklikaj(){for(let i=0;i<40&&scene==='dialog';i++)nextLine();scene='world';}
const KAFLE_WESELA=[88,89,90,91,92,93,94,95,96,97,98,99,100];

S.introDone=true;
bootWorld();

/* ---------------- KAFLE ---------------- */
T('kafle wesela maja rysunek, kolor i kolor na minimapie',()=>{
  for(const v of KAFLE_WESELA){
    ok(TILES[v]&&typeof TILES[v].paint==='function','kafel '+v+' bez rysunku');
    ok(TCOL[v],'kafel '+v+' bez koloru podkladu');
    ok(MAPCOL[v],'kafel '+v+' bez koloru na minimapie');
  }
});
T('tablice wlasciwosci siegaja nowych kafli (a nie koncza sie na 96)',()=>{
  ok(SOLIDF.length>=101,'SOLIDF ma tylko '+SOLIDF.length+' pozycji');
  ok(TILE_ANIM.length>=101,'TILE_ANIM ma tylko '+TILE_ANIM.length+' pozycji');
  for(const v of [90,91,92,93,94,95,97,98,99,100])ok(SOLID(v),'kafel '+v+' mial blokowac');
  for(const v of [88,89,96])ok(!SOLID(v)&&!PIT(v),'kafel '+v+' mial byc deptalny');
});
T('kazdy kafel wesela DA SIE narysowac',()=>{
  const c=document.createElement('canvas');c.width=c.height=64;
  const g=c.getContext('2d');
  for(const v of KAFLE_WESELA)TILES[v].paint(g,0,0,3,5);
});

/* ---------------- PLANSZE ---------------- */
T('domena ma piec RECZNYCH pieter — od parkingu po parkiet',()=>{
  ok(domReczna('wesele'),'wesele musi jechac z recznych plansz');
  eq(domPietra('wesele').join(','),'przedsionek,krata,komnaty,zapadnia,skarbiec');
});
for(let i=0;i<5;i++)T('pietro '+(i+1)+' przechodzi kontrole planszy w GRZE',()=>{
  pietro(i);
  const bledy=domSprawdzMape();
  ok(bledy.length===0,'plansza zglasza: '+bledy.join(' | '));
});
T('kazde pietro ma wlasna palete — remiza, kuchnia, sala, garaz, parkiet',()=>{
  const pal=[];
  for(let i=0;i<5;i++){pietro(i);pal.push(DOM.fk.floor+'/'+DOM.fk.wall);}
  eq(pal[0],'37/13','pietro 1 to chodnik za plotem — jeszcze na dworze');
  eq(pal[2],'88/90','pietro 3 to parkiet w scianie remizy');
  eq(pal[4],'88/90','pietro 5 to parkiet');
  ok(new Set(pal).size>=3,'piec pieter nie moze wygladac tak samo');
});
T('sala ma stoly, krzesla, tort i wieze; garaz ma kanal',()=>{
  const ile=v=>{let n=0;for(let i=0;i<MW*MH;i++)if(M[i]===v)n++;return n;};
  pietro(2);
  ok(ile(91)>40,'stoly weselne');ok(ile(92)>60,'krzesla');
  ok(ile(97)>0,'tort weselny');ok(ile(95)>0,'wieza');
  ok(ile(96)>30,'girlandy pod stropem');
  pietro(3);
  let pit=0;for(let i=0;i<MW*MH;i++)if(PIT(M[i]))pit++;
  ok(pit>200,'kanal naprawczy ma byc duzy, jest '+pit+' kafli');
  ok(ile(98)>6,'wozy strazackie w boksach');
  ok(DOM.tLimit>0,'zapadnia bez zegara to nie zapadnia');
});
T('arena oczepin: wielki parkiet, sciana gosci i CZTERY beczki',()=>{
  pietro(4);
  const ile=v=>{let n=0;for(let i=0;i<MW*MH;i++)if(M[i]===v)n++;return n;};
  ok(ile(88)>600,'parkiet ma byc wielki, jest '+ile(88));
  ok(ile(94)>30,'goscie maja stac dookola, jest '+ile(94));
  eq(ile(93),4,'na arenie maja stac DOKLADNIE cztery beczki');
});

/* ---------------- GOŚCIE ---------------- */
T('goscie weselni to pelnoprawni przeciwnicy z wlasnymi sylwetkami',()=>{
  for(const t of ['wujek','ciotka','druhna','dzieciak','swiadek']){
    ok(FOE_TYPES[t],'brak typu '+t);
    ok(FOE_DRAW[t],'brak sylwetki '+t);
  }
  eq(DOMAINS.wesele.elite,'swiadek','elita wesela to swiadek z butelka');
  ok(FOE_TYPES.swiadek.elite&&FOE_TYPES.swiadek.en,'swiadek ma byc elita z nazwa');
});
T('butelka swiadka ROZBIJA sie i zostawia kaluze',()=>{
  pietro(2);KALUZE=[];bossShots=[];
  bossShots.push({x:P.x+40,y:P.y,dx:0,dy:0,life:.01,t:'wodka',atk:20});
  przewin(4);
  eq(KALUZE.length,1,'po butelce ma zostac kaluza');
  ok(KALUZE[0].t<Infinity,'kaluza po butelce ma wsiakac');
});
T('stanie w kaluzy BOLI, i to rytmicznie (a nie raz na 1,2 s)',()=>{
  pietro(2);KALUZE=[];nieumieralny();foes=[];
  kaluzaDodaj(P.x,P.y,30,10,9);
  const hp0=PHP[S.ch];
  przewin(90);                                  // 1,5 s = kilka tyknięć
  ok(PHP[S.ch]<hp0-10,'kaluza ma podgryzac co pol sekundy, ubylo '+(hp0-PHP[S.ch]));
});
T('kaluza daleko od gracza nie ma prawa go dosiegnac',()=>{
  pietro(2);KALUZE=[];nieumieralny();foes=[];
  kaluzaDodaj(P.x+260,P.y+180,30,10,9);
  const hp0=PHP[S.ch];
  przewin(60);
  eq(PHP[S.ch],hp0);
});

/* ---------------- PAN MŁODY ---------------- */
function obudzMlodych(){
  pietro(4);
  const i=DOM.wyjscie,rm=DOM.rooms[i];
  ok((rm.plan||[]).some(e=>e.boss==='mlodzi'),'w komnacie finalowej maja czekac mlodzi');
  domBossSpawn('mlodzi',rm,i);
  przeklikaj();
  const f=foes.find(x=>x.bid==='mlodzi');
  ok(f,'pan mlody sie nie pojawil');
  P.x=f.x+50;P.y=f.y;nieumieralny();
  return f;
}
T('walke otwiera PAN MŁODY, a na arenie stoja cztery beczki',()=>{
  const f=obudzMlodych();
  eq(f.t,'panmlody');eq(f.bn,'PAN MŁODY');
  eq(f.room,DOM.wyjscie,'bez `room` pietro zaliczyloby sie samo');
  eq(BECZKI.length,4,'beczki z planszy maja trafic do walki');
  ok(BECZKI.every(b=>!b.lezy),'na starcie wszystkie stoja');
  ok(BOSS_DRAW.panmlody&&BOSS_DRAW.pannamloda,'obie formy musza miec sylwetke');
});
T('oba ataki pana mlodego DA SIE odpalic',()=>{
  let f=obudzMlodych();bossShots=[];
  BOSS_MOVES.roze(f);
  ok(bossShots.filter(b=>b.t==='roza').length>=3,'roze maja polecec');
  przewin(70);
  ok(bossShots.some(b=>b.t==='platek'),'roza ma peknac na platki na wszystkie strony');
  f=obudzMlodych();
  BOSS_MOVES.skoki(f);
  ok(f.skok&&f.skok.faza==='przysiad','najpierw zgina nogi');
  przewin(200);
  ok(!f.skok,'seria skokow ma sie skonczyc, inaczej boss zostaje w powietrzu');
});
T('co 25% HP PANA MŁODEGO jedna beczka idzie na ziemie — na zawsze',()=>{
  const f=obudzMlodych();KALUZE=[];
  f.hp=f.maxHp*.7;oddech();
  eq(BECZKI.filter(b=>b.lezy).length,1,'przy 75% ma pojsc pierwsza beczka');
  eq(KALUZE.length,1,'…i zostac po niej kaluza');
  ok(KALUZE[0].t===Infinity,'kaluza z beczki ma ZOSTAC do konca walki');
  ok(KALUZE[0].r>36,'ma byc DUZA, jest '+KALUZE[0].r);
  f.hp=f.maxHp*.45;oddech();
  f.hp=f.maxHp*.2;oddech();
  eq(BECZKI.filter(b=>b.lezy).length,3,'przy 50% i 25% lecą kolejne dwie');
  eq(KALUZE.length,3);
});

/* ---------------- PANNA MŁODA ---------------- */
function pannaMloda(bezProgow){
  const f=obudzMlodych();
  if(!bezProgow){                               // przechodzimy przez progi beczek jak w grze
    f.hp=f.maxHp*.7;oddech();
    f.hp=f.maxHp*.45;oddech();
    f.hp=f.maxHp*.2;oddech();
  }
  f.hp=1;dealDmg(f,'edek',9);                   // pan mlody pada -> scenka -> panna mloda
  przeklikaj();
  const p2=foes.find(x=>x.bid==='mlodzi'&&x.stage2);
  ok(p2,'po panu mlodym ma wyjsc PANNA MŁODA');
  P.x=p2.x+60;P.y=p2.y;nieumieralny();
  return p2;
}
T('po panu mlodym wychodzi PANNA MŁODA i leci czwarta beczka',()=>{
  const f=pannaMloda();
  eq(f.t,'pannamloda');eq(f.bn,'PANNA MŁODA');
  eq(f.room,DOM.wyjscie,'druga forma MUSI dziedziczyc komnate');
  oddech();
  eq(BECZKI.filter(b=>b.lezy).length,4,'jej wejscie przewraca ostatnia beczke');
  ok(BOSSES.mlodzi.next.intro.some(l=>l[2]==='w_howdare'),'jej wejscie ma glos z pliku');
  ok(AUDIO_KEYS.includes('w_howdare'),'klip panny mlodej musi byc w rejestrze audio');
});
T('kaluze z pierwszej fazy PRZECHODZA do drugiej',()=>{
  pannaMloda();
  oddech();
  ok(KALUZE.filter(k=>k.duza).length>=4,
     'caly rozlany spirytus ma zostac na parkiecie, jest '+KALUZE.filter(k=>k.duza).length);
});
T('welon lezy, a potem wychodza z niego kolce',()=>{
  const f=pannaMloda();
  bossShots=[];WELONY=[];miniBlasts=[];
  BOSS_MOVES.welon(f);
  ok(bossShots.some(b=>b.t==='welon'),'welon ma polecec');
  /* kolce ZNIKAJA po wybiciu, wiec nie da sie ich sprawdzic „na koncu" —
     patrzymy klatka po klatce, czy w ogole sie pojawily */
  let lezal=false,kolce=0;
  for(let i=0;i<160;i++){
    przewin(1);
    if(WELONY.length)lezal=true;
    kolce=Math.max(kolce,miniBlasts.filter(b=>b.kolec).length);
  }
  ok(lezal,'welon ma wyladowac i przez chwile LEZEC');
  ok(kolce>=5,'z welonu ma wyjsc SERIA kolcow, wyszlo '+kolce);
});
T('po piruecie panna mloda STOI i da sie ja bic mocniej',()=>{
  const f=pannaMloda(true);
  KALUZE=[];                                    // bez kaluz: piruet konczy sie normalnie
  BOSS_MOVES.piruet(f);
  przewin(50);
  ok(f.piruet,'po telegrafie ma ruszyc w piruecie');
  przewin(140);
  ok(!f.piruet&&f.wyczerp>0,'piruet ma sie konczyc zawrotem glowy');
  ok(f.slaby>1,'to jest okno na obrazenia — cios ma bolec bardziej');
  const zwykly=Math.round(chATK('edek'));
  const zadane=dealDmg(f,'edek',1);
  ok(zadane>zwykly*.9,'w oknie ma isc WIECEJ obrazen, poszlo '+zadane);
});
T('piruet w KAŁUŻĘ = wywrotka, ogien i obrazenia dla NIEJ',()=>{
  const f=pannaMloda(true);
  KALUZE=[];
  const k=kaluzaDodaj(f.x+70,f.y,50,7,Infinity,{duza:true,pojaw:0});
  P.x=f.x+150;P.y=f.y;                          // gracz USTAWIA sie tak, zeby wjechala w kaluze
  const hp0=f.hp;
  BOSS_MOVES.piruet(f);
  przewin(180);
  ok(k.ogien,'kaluza ma sie ZAPALIC');
  ok(f.hp<hp0,'wywrotka ma ja zaboleć');
  ok(f.upadek>0||f.wsciekla,'ma sie wywrocic, a potem wstac wsciekla');
});
T('palacy sie spirytus parzy OBOJE',()=>{
  const f=pannaMloda(true);
  KALUZE=[];nieumieralny();
  const k=kaluzaDodaj(f.x,f.y,60,8,Infinity,{duza:true,pojaw:0});
  kaluzaZapal(k);
  P.x=f.x;P.y=f.y;
  const hpF=f.hp,hpP=PHP[S.ch];
  przewin(80);
  ok(f.hp<hpF,'ogien ma brac takze panne mloda');
  ok(PHP[S.ch]<hpP,'…i gracza, ktory w nim stoi');
});
T('suknia brudzi sie progami HP',()=>{
  const f=pannaMloda();
  oddech();eq(f.brud,0);
  f.hp=f.maxHp*.7;oddech();eq(f.brud,1);
  f.hp=f.maxHp*.45;oddech();eq(f.brud,2);
  f.hp=f.maxHp*.2;oddech();eq(f.brud,3);
});
T('pokonani mlodzi placa jak boss i konczy sie pietro',()=>{
  const f=pannaMloda(true);
  S.gearOwn[BOSSES.mlodzi.drop[1]]=0;
  const dia=S.dia;
  f.hp=1;dealDmg(f,'edek',9);
  przeklikaj();
  ok(S.dia>dia,'boss ma sypnac diamentami');
  ok(S.gearOwn.obraczki,'pierwsze przejscie daje lup');
  DOM.grace=0;DOM.rooms[DOM.wyjscie].spawned=true;
  domUpdate(.1);
  ok(DOM.done&&DOM.chest,'po mlodych ma lecieć skrzynia');
});
