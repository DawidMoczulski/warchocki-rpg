/* SMOCZA JAMA — pięć ręcznych plansz + WAWELIN.
   Uruchamianie: ./testy/sprawdz.sh test_jama.js

   Powód istnienia: plansza może przejść `node testy/test_mapy.js` (format się
   zgadza), a mimo to nie dać się przejść w GRZE — bo kafel nie ma flagi
   kolizji, paleta piętra nie zadziałała albo klucz leży za swoją kłódką.
   A boss ma osobny problem: jego ataki to funkcje, których `node --check`
   nigdy nie uruchomi. Ten test odpala jedno i drugie naprawdę.               */

function wejdz(){
  scene='world';dlgQ=null;
  domAlways=1;                        // domena otwarta niezależnie od dnia tygodnia
  enterDomain('jama');
  scene='world';dlgQ=null;
}
function pietro(i){wejdz();domLoadFloor(i);scene='world';dlgQ=null;}
function przewin(n){for(let i=0;i<n;i++)updateWorld(1/60);}
/* Bez tego test bada nie to, co trzeba: gracz ginie od pierwszej fali skal,
   domena resetuje sie i miniBlasts znika razem z nia. Interesuje nas ATAK,
   a nie to, ile Edek wytrzyma. */
function nieumieralny(){for(const id of S.party)PHP[id]=999999;hurtT=0;}
const KAFLE_JAMY=[74,75,76,77,78,79,80,81,82,83,84,85,86,87];

S.introDone=true;
bootWorld();

/* ---------------- KAFLE ---------------- */
T('kazdy nowy kafel gor i jamy ma rysunek, kolor i kolor na minimapie',()=>{
  for(const v of KAFLE_JAMY){
    ok(TILES[v]&&typeof TILES[v].paint==='function','kafel '+v+' nie ma rysunku');
    ok(TCOL[v],'kafel '+v+' nie ma koloru podkladu (TCOL)');
    ok(MAPCOL[v],'kafel '+v+' nie ma koloru na minimapie (MAPCOL)');
  }
});
T('kolizje kafli zgadzaja sie z tym, po czym ma sie chodzic',()=>{
  for(const v of [74,77,78,80,82,84,85])ok(SOLID(v),'kafel '+v+' mial blokowac');
  for(const v of [75,76,79,81,83,86,87])ok(!SOLID(v)&&!PIT(v),'kafel '+v+' mial byc deptalny');
});
T('kazdy nowy kafel daje sie NARYSOWAC (rysunek to kod, nie deklaracja)',()=>{
  const c=document.createElement('canvas');c.width=c.height=64;
  const g=c.getContext('2d');
  for(const v of KAFLE_JAMY)TILES[v].paint(g,0,0,3,5);
});

/* ---------------- PLANSZE ---------------- */
T('domena ma piec RECZNYCH pieter w zaplanowanej kolejnosci',()=>{
  const pie=domPietra('jama');
  eq(pie.length,5,'piec pieter');
  eq(pie.join(','),'przedsionek,krata,komnaty,zapadnia,skarbiec');
  ok(domReczna('jama'),'jama musi jechac z recznych plansz, nie z generatora');
});
for(let i=0;i<5;i++)T('pietro '+(i+1)+' przechodzi kontrole planszy w GRZE',()=>{
  pietro(i);
  const bledy=domSprawdzMape();
  ok(bledy.length===0,'plansza zglasza: '+bledy.join(' | '));
  ok(DOM.rooms.length>0,'plansza bez komnat');
  ok(DOM.wejscieXY,'brak punktu startu');
});
T('kazde pietro ma WLASNA palete — droga idzie z lasu w skaly i do jamy',()=>{
  const pal=[];
  for(let i=0;i<5;i++){pietro(i);pal.push(DOM.fk.floor+'/'+DOM.fk.wall);}
  eq(pal[0],'69/68','pietro 1 to sciolka w gestwinie (las pod Wawelem)');
  eq(pal[3],'75/74','pietro 4 to piarg w skale gorskiej');
  eq(pal[4],'86/85','pietro 5 to dno jamy w scianie jaskini');
  eq(new Set(pal).size>=3,true,'piec pieter nie moze wygladac tak samo');
});
T('paleta pietra naprawde ladzi na mapie, a nie tylko we wpisie',()=>{
  pietro(4);
  ok(at(Math.floor(DOM.wejscieXY[0]/16),Math.floor(DOM.wejscieXY[1]/16))===86,
     'pod startem w jamie ma byc dno jamy (86)');
  pietro(0);
  ok(at(Math.floor(DOM.wejscieXY[0]/16),Math.floor(DOM.wejscieXY[1]/16))===69,
     'pod startem w lesie ma byc sciolka (69)');
});
T('pietro z mostami ma przepasc, kladki i zegar',()=>{
  pietro(3);
  let pit=0,most=0;
  for(let i=0;i<MW*MH;i++){if(PIT(M[i]))pit++;if(M[i]===79)most++;}
  ok(pit>200,'przepasc ma byc duza, jest '+pit+' kafli');
  ok(most>20,'kladek ma byc widac, jest '+most);
  ok(DOM.tLimit>0,'zapadnia bez zegara to nie zapadnia');
});
T('jama ma skarb, kosci, jaja i zarzace sie szczeliny',()=>{
  pietro(4);
  const ile=v=>{let n=0;for(let i=0;i<MW*MH;i++)if(M[i]===v)n++;return n;};
  ok(ile(82)>10,'skarb smoka');ok(ile(81)>5,'kosci');
  ok(ile(84)>3,'smocze jaja');ok(ile(83)>10,'zarzace sie szczeliny');
  ok(DOM.deko.zar.length>10,'szczeliny musza trafic na liste animowanych');
  ok(DOM.deko.blask.length>10,'skarb musi trafic na liste animowanych');
});

/* ---------------- WAWELIN ---------------- */
function obudzSmoka(){
  pietro(4);
  const i=DOM.wyjscie,rm=DOM.rooms[i];
  ok((rm.plan||[]).some(e=>e.boss==='wawelin'),'w komnacie finalowej ma czekac boss');
  domBossSpawn('wawelin',rm,i);
  scene='world';dlgQ=null;                      // scenka nas tu nie interesuje
  const f=foes.find(x=>x.bid==='wawelin');
  ok(f,'smok sie nie pojawil');
  P.x=f.x+40;P.y=f.y;                           // gracz w zasiegu ataku
  nieumieralny();
  return f;
}
T('komnata finalowa ma BOSSA zamiast straznika i nikogo wiecej',()=>{
  pietro(4);
  const plan=DOM.rooms[DOM.wyjscie].plan||[];
  eq(plan.length,1,'walka z bossem ma byc czysta — sam boss w planie');
  eq(plan[0].boss,'wawelin');
  ok(!plan.some(e=>e.straz),'straznik ustepuje miejsca smokowi');
});
T('smok wchodzi z wlasnym HP, tozsamoscia i trzema atakami',()=>{
  const f=obudzSmoka();
  eq(f.t,'wawelin');eq(f.bn,'WAWELIN, PRADAWNY SMOK');
  ok(f.maxHp>2000,'boss konca domeny ma byc gruby, ma '+f.maxHp+' HP');
  eq(f.moves.length,3,'trzy rodzaje atakow');
  eq(f.room,DOM.wyjscie,'bez `room` pietro zaliczyloby sie samo');
  ok(BOSS_DRAW[f.t],'smok bez sylwetki');
});
T('kazdy atak smoka DA SIE ODPALIC i cos po nim zostaje',()=>{
  for(const mv of ['ogniokrag','ogienszarza','podniebny']){
    const f=obudzSmoka();
    bossShots=[];miniBlasts=[];
    BOSS_MOVES[mv](f);
    if(mv==='ogniokrag')ok(bossShots.length>=13,'pierscien ma leciec na wszystkie strony');
    if(mv==='ogienszarza'){ok(bossShots.length>=3,'wachlarz ognia');
      eq(f.telMv,'smokszarza','po ogniu ma isc szarza');}
    if(mv==='podniebny')ok(f.lot&&f.lot.faza==='wzlot','smok mial poderwac sie w gore');
  }
});
T('pierscien ognia zostawia LUKI — inaczej nie da sie go uniknac',()=>{
  const f=obudzSmoka();
  bossShots=[];
  BOSS_MOVES.ogniokrag(f);
  const katy=bossShots.map(b=>Math.atan2(b.dy,b.dx)).sort((a,b)=>a-b);
  let naj=0;
  for(let i=1;i<katy.length;i++)naj=Math.max(naj,katy[i]-katy[i-1]);
  ok(naj>0.3,'najwieksza szpara miedzy pociskami to '+naj.toFixed(2)+' rad — za ciasno');
});
T('PODNIEBNY OSTRZAL: smok znika, sypie skalami i wraca',()=>{
  const f=obudzSmoka();
  miniBlasts=[];
  BOSS_MOVES.podniebny(f);
  przewin(80);                                  // 1,3 s — wzlot dobiegl konca
  ok(f.gone,'po wzlocie smok ma zniknac z areny');
  eq(f.lot.faza,'deszcz');
  przewin(120);                                 // 2 s deszczu
  ok(miniBlasts.filter(b=>b.rock).length>0,'na plansze maja leciec glazy');
  ok(miniBlasts.every(b=>!b.rock||b.warn0>0),'kazdy glaz ma miec ostrzezenie');
  const hp=f.hp;
  eq(dealDmg(f,'edek',1),0,'w powietrzu smok jest NIETYKALNY');
  eq(f.hp,hp,'…i nie traci HP');
  przewin(700);                                 // ~11,7 s — deszcz + ladowanie
  ok(!f.gone,'smok musi wrocic na arene');
  ok(!f.lot,'lot ma sie skonczyc, inaczej boss zostaje w powietrzu na zawsze');
  ok(f.hp<hp||dealDmg(f,'edek',1)>0,'po wyladowaniu znowu da sie go bic');
});
T('glaz z nieba naprawde bije — i tylko w swoim promieniu',()=>{
  obudzSmoka();
  foes=[];bossShots=[];                         // badamy SAM glaz, bez smoka nad karkiem
  miniBlasts=[];hurtT=0;
  const hp0=PHP[S.ch];
  mbRock(P.x,P.y,26,40,.2);
  przewin(30);
  ok(PHP[S.ch]<hp0,'glaz trafiony w gracza ma zabolec');
  miniBlasts=[];nieumieralny();
  const hp1=PHP[S.ch];
  mbRock(P.x+200,P.y+200,26,40,.2);
  przewin(30);
  eq(PHP[S.ch],hp1,'glaz daleko od gracza nie ma prawa go dosiegnac');
});
T('dlugi atak ma wlasny odstep — nie wraca co drugi raz',()=>{
  ok(MOVE_CD.podniebny>=15,'podniebny ostrzal trwa 10 s, wiec musi miec odstep');
  const f=obudzSmoka();
  ok(f.mvT&&f.mvT.podniebny>anim,'na otwarcie walki smok nie odlatuje');
});
T('faza szalu przyspiesza WSZYSTKIE ataki',()=>{
  const f=obudzSmoka();
  bossShots=[];BOSS_MOVES.ogniokrag(f);
  const spokoj=bossShots.length;
  f.ph2=true;bossShots=[];BOSS_MOVES.ogniokrag(f);
  ok(bossShots.length>spokoj,'w szale pierscien ma byc gestszy');
  ok((f.cd2||1.7)<(f.cd||2.6),'w szale odstep miedzy atakami ma byc krotszy');
  f.ph2=false;bossShots=[];BOSS_MOVES.ogienszarza(f);
  const tSpokoj=f.telT;
  f.ph2=true;bossShots=[];BOSS_MOVES.ogienszarza(f);
  ok(f.telT<tSpokoj,'w szale szarza ma ruszac szybciej');
  ok(TEL_SZARZA.smokszarza.sp[1]>TEL_SZARZA.smokszarza.sp[0],'…i jechac mocniej');
});
T('smok ma lup, film i wlasny wpis w rejestrze bossow',()=>{
  const b=BOSSES.wawelin;
  ok(b&&b.drop&&ARTS[b.drop[1]],'lup musi istniec w rejestrze artefaktow');
  ok(b.film,'bez filmu bossDefeated wywala sie na postFilm');
  ok(!REGIONS[b.r],'`r` bossa domeny NIE moze wskazywac regionu — inaczej stanie na mapie');
  ok(FOE_TYPES.wawelin,'typ przeciwnika');
});
T('pokonany smok placi jak boss',()=>{
  const f=obudzSmoka();
  S.gearOwn[BOSSES.wawelin.drop[1]]=0;
  const dia=S.dia,lvl=S.bossLvl.wawelin||0;
  f.hp=1;dealDmg(f,'edek',9);
  ok(f.dead,'smok mial paść');
  ok(S.dia>dia,'boss ma sypnac diamentami');
  eq(S.bossLvl.wawelin,lvl+1,'poziom rewanzu ma isc w gore');
  ok(S.gearOwn.serceSmoka,'pierwsze przejscie daje lup');
});
T('po smoku komnata jest czysta i pietro sie konczy',()=>{
  const f=obudzSmoka();
  f.hp=1;dealDmg(f,'edek',9);
  DOM.grace=0;
  DOM.rooms[DOM.wyjscie].spawned=true;
  domUpdate(.1);
  ok(DOM.done,'po bossie ma leciec skrzynia i wyjscie');
  ok(DOM.chest,'brak skrzyni na koniec domeny');
});
