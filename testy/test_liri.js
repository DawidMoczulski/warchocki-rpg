/* KARMAZYNOWA LIRI — umiejętności, kosy i rejestr bursta.
   Uruchamianie: ./testy/sprawdz.sh test_liri.js

   Powód istnienia: `KOSA_ZYCIE` raz już zniknęło przy przepisywaniu sąsiedniego
   bloku i [Q] wywalało się dopiero PRZY UŻYCIU. `node --check` tego nie widzi —
   brakująca stała to poprawna składnia. Ten test odpala każdą umiejętność
   naprawdę, więc następnym razem złapie to przed Dawidem.                     */

function przygotuj(){
  /* bootWorld odpala intro Edka i scena robi sie 'dialog', a trySpecial
     i tryBurst dzialaja TYLKO w 'world' — bez tego test bada martwy stan. */
  scene='world';dlgQ=null;
  S.chars.liri={lvl:90,asc:6,con:6,tal:{n:10,e:10,q:10}};
  if(!S.party.includes('liri'))S.party.push('liri');
  S.gearOwn.kosamCiekla=1;
  S.gear.liri={w:'kosamCiekla',a:[null,null,null]};
  initPartyHP(true);            // switchTo odmawia postaci z zerowym HP
  switchTo('liri');
  KOSY=[];CIECIA=[];burstBlasts=[];burstCut=0;burstDance=0;spcT=0;
}
function przewin(klatki){for(let i=0;i<klatki;i++)updateWorld(1/60);}

S.introDone=true;
bootWorld();

T('[E] wypuszcza trzy fale ciecia, ostatnia zawija',()=>{
  przygotuj();
  trySpecial();
  eq(CIECIA.length,3,'skill od razu ustawia trzy fale w kolejce');
  eq(CIECIA.filter(c=>c.zawija).length,1,'dokladnie ostatnia fala zawija');
  eq(CIECIA.filter(c=>c.op>0).length,2,'dwie dalsze fale czekaja na swoja kolej');
  przewin(16);                      // 0,27 s — ostatnia fala zdazyla wyjsc
  ok(CIECIA.every(c=>c.op<=0),'po 0,27 s wszystkie trzy fale sa juz w powietrzu');
});

T('ciecia gasna i nie zostaja na ekranie',()=>{
  przygotuj();
  trySpecial();
  przewin(60);                      // 1 s — zycie luku to 0,3 s
  eq(CIECIA.length,0,'luki musza wygasnac, inaczej zostaja na mapie na zawsze');
});

T('[Q] wypuszcza kosy i nie rzuca wyjatkiem',()=>{
  przygotuj();
  burstE.liri=100;
  tryBurst();
  eq(burstChar,'liri','burst musi byc podpisany na Liri, nie na Edka');
  przewin(215);                     // przerywnik + wyjscie kos
  eq(KOSY.length,10,'C6 KOSIARNIA podwaja piatke kos');
});

T('kosy znikaja po swoim czasie',()=>{
  przygotuj();
  spawnKosy(5);
  eq(KOSY.length,5,'piec kos bez konstelacji');
  przewin(Math.ceil(KOSA_ZYCIE*60)+10);
  eq(KOSY.length,0,'po KOSA_ZYCIE kosy musza zniknac');
});

T('kazda postac z burstem ma komplet wpisow w rejestrze',()=>{
  for(const id of Object.keys(CHARS)){
    const B=CHARS[id].burst;
    if(!B)continue;
    ok(typeof B.plan==='function',id+': brak burst.plan — dostanie choreografie Edka');
    ok(typeof B.pose==='function',id+': brak burst.pose — w scence pokaze sie Edek');
    ok(B.txt&&B.txt.length===2,id+': burst.txt musi miec dwa wiersze okrzyku');
  }
});

T('kazda postac odpala [E] i [Q] bez wyjatku',()=>{
  for(const id of Object.keys(CHARS)){
    if(!S.chars[id])S.chars[id]=newChar();
    if(!S.party.includes(id))S.party.push(id);
    initPartyHP(true);
    switchTo(id);
    spcT=0;
    trySpecial();                   // wyjatek w skill() wywali test tutaj
    przewin(30);
    if(CHARS[id].burst){
      burstE[id]=100;
      tryBurst();
      przewin(260);
    }
    ok(true,id+': [E] i [Q] przechodza bez wyjatku');
  }
});

T('Ciekla Kosa dokłada obrazenia tylko Liri',()=>{
  przygotuj();
  const zKosa=chATK('liri');
  S.gear.liri.w=null;
  const bezKosy=chATK('liri');
  ok(zKosa>bezKosy,'bron musi podnosic ATK');
  S.gear.liri.w='kosamCiekla';
});

T('kazda postac ma rysowane ikony [E]/[Q] i zadna nie rzuca wyjatkiem',()=>{
  const pom=document.createElement('canvas');pom.width=pom.height=64;
  const g=pom.getContext('2d');
  for(const id of Object.keys(CHARS)){
    const C=CHARS[id];
    ok(C.ico&&typeof C.ico.e==='function',id+': brak rysowanej ikony [E]');
    g.save();g.translate(32,32);C.ico.e(g,14);g.restore();   // wyjatek wywali test
    if(C.burst){
      ok(typeof C.ico.q==='function',id+': ma [Q], wiec musi miec ikone [Q]');
      g.save();g.translate(32,32);C.ico.q(g,14);g.restore();
    }
    /* ikona nie ma prawa zostawic po sobie zmienionego stanu plotna —
       inaczej kolejny element HUD rysuje sie w trybie „lighter" albo poloprzezroczysty */
    eq(g.globalCompositeOperation,'source-over',id+': ikona zostawila zmieniony tryb rysowania');
    eq(g.globalAlpha,1,id+': ikona zostawila zmienione globalAlpha');
  }
});
