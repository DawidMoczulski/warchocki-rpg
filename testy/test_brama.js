/* BRAMA POLA FESTIWALOWEGO — czy widać, czy puszcza i czy patrol stoi na miejscu.
   Uruchamianie: ./testy/sprawdz.sh test_brama.js                                */

const Q_PRZED = {dych:2,graty:2,stop1:2,bateria:2,stop2:2,przyczepa:2,policja:1};
const Q_PO    = {dych:2,graty:2,stop1:2,bateria:2,stop2:2,przyczepa:2,policja:2};
const Q_WCZES = {dych:2,graty:2,stop1:2};      // przyczepy jeszcze nie ma

function ustaw(quests){ S.quests=Object.assign({},quests); setRegion('trasa'); }

/* czy da się dojść z polnej drogi (38,29) na środek pola (30,40) */
function daSiePrzejsc(){
  const start=[38,29], meta=[30,40], byl=new Set(), kol=[start];
  byl.add(start.join(','));
  while(kol.length){
    const [x,y]=kol.shift();
    if(x===meta[0]&&y===meta[1])return true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx, ny=y+dy, k=nx+','+ny;
      if(nx<1||ny<1||nx>=MW-1||ny>=MH-1||byl.has(k))continue;
      if(SOLID(at(nx,ny)))continue;
      byl.add(k); kol.push([nx,ny]);
    }
  }
  return false;
}

bootWorld();

T('brama stoi z czterech kafli: slupek-skrzydlo-skrzydlo-slupek',()=>{
  ustaw(Q_PRZED);
  eq(at(37,32),71,'lewy slupek');
  eq(at(40,32),71,'prawy slupek');
});

T('przed oblawa brama jest ZAMKNIETA i nie przepuszcza',()=>{
  ustaw(Q_PRZED);
  eq(at(38,32),72,'lewe skrzydlo');
  eq(at(39,32),72,'prawe skrzydlo');
  ok(SOLID(at(38,32))&&SOLID(at(39,32)),'zamknieta brama musi blokowac');
  ok(!daSiePrzejsc(),'na pole NIE wolno wejsc przed oblawa');
});

T('po oblawie brama jest OTWARTA i puszcza na pole',()=>{
  ustaw(Q_PO);
  eq(at(38,32),73,'lewe skrzydlo odchylone');
  eq(at(39,32),73,'prawe skrzydlo odchylone');
  ok(!SOLID(at(38,32))&&!SOLID(at(39,32)),'otwarta brama musi przepuszczac');
  ok(daSiePrzejsc(),'z drogi na pole musi byc przejscie');
});

T('slupki i skrzydla to NIE zwykla barierka (kafel 34)',()=>{
  ustaw(Q_PRZED);
  ok(at(38,32)!==34&&at(37,32)!==34,'brama ma wlasne kafle, inaczej znika w plocie');
});

T('polna droga dochodzi do bramy i wychodzi po drugiej stronie',()=>{
  ustaw(Q_PO);
  eq(at(38,31),23,'droga przed brama');
  eq(at(38,33),23,'droga za brama');
});

T('siatka bezpieczenstwa nie przekopuje bramy',()=>{
  /* setRegion odpala wildFill + ensureConnectivity; gdyby brama nie byla
     chroniona, ktorys z czterech kafli zamienilby sie w sciezke albo trawe */
  for(let i=0;i<8;i++){
    ustaw(Q_PRZED);
    ok(at(37,32)===71&&at(40,32)===71&&at(38,32)===72&&at(39,32)===72,
       'brama rozjechala sie przy przebudowie regionu');
  }
});

T('patrol stoi przy bramce dokladnie w oknie questa',()=>{
  const pat=NPCS.filter(n=>n.id==='policjant_bramy'||n.id==='policjantka_bramy');
  eq(pat.length,2,'maja byc dwie osoby patrolu');
  ustaw(Q_PRZED); ok(pat.every(n=>n.when()),'przed oblawa patrol MUSI byc widoczny');
  ustaw(Q_PO);    ok(pat.every(n=>!n.when()),'po oblawie patrolu juz nie ma');
  ustaw(Q_WCZES); ok(pat.every(n=>!n.when()),'bez przyczepy patrolu jeszcze nie ma');
});

T('patrol stoi PRZY bramie, nie gdzies w polu',()=>{
  const pat=NPCS.filter(n=>n.id==='policjant_bramy'||n.id==='policjantka_bramy');
  for(const n of pat){
    const d=Math.hypot(n.x-39*16,n.y-32*16);
    ok(d<90,'patrol za daleko od bramy: '+Math.round(d)+' px');
    ok(!SOLID(at(Math.floor(n.x/16),Math.floor(n.y/16))),'patrol stoi w scianie');
  }
});

T('patrol nie zaslania podpowiedzi ochroniarza',()=>{
  const wszyscy=NPCS.filter(n=>n.r==='trasa');
  for(let i=0;i<wszyscy.length;i++)for(let j=i+1;j<wszyscy.length;j++){
    const a=wszyscy[i],b=wszyscy[j];
    ok(Math.hypot(a.x-b.x,a.y-b.y)>26,
       'NPC-e stoja za blisko ('+a.id+' / '+b.id+') — podpowiedz [E] zlapie tylko jednego');
  }
});

T('zagadanie patrolu odpala oblawe',()=>{
  ustaw(Q_PRZED);
  POL.on=false;
  talkTo(NPCS.find(n=>n.id==='policjant_bramy'));
  ok(dlgQ&&dlgQ.length>0,'po zagadaniu patrolu musi ruszyc scenka');
});
