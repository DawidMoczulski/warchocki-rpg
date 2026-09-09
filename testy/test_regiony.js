/* REGIONY I DOMENY — czy da się DOJŚĆ tam, gdzie gra każe iść,
   i czy na podłodze leży dokładnie to, co ma leżeć.
   Uruchamianie: ./testy/sprawdz.sh test_regiony.js

   Powód istnienia: wschodnia Chodzież była odcięta pasem drzew i dojście do
   WESELA W REMIZIE wykuwała dopiero siatka bezpieczeństwa — jednokaflowym
   tunelem przez las, po którym nie było widać, że to droga. Dla gry „przejście
   istnieje", dla gracza „nie da się tam wejść". Ten test sprawdza jedno i drugie:
   czy cel jest osiągalny ORAZ czy droga do niego nie jest szczeliną.            */

function bfs(sx,sy){
  const w=new Int32Array(MW*MH).fill(-1),q=[sy*MW+sx];
  w[sy*MW+sx]=0;
  for(let i=0;i<q.length;i++){
    const p=q[i],x=p%MW,y=(p/MW)|0;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=MW||ny>=MH)continue;
      const j=ny*MW+nx;
      if(w[j]>=0||SOLID(M[j]))continue;
      w[j]=w[p]+1;q.push(j);
    }
  }
  return w;
}
const REGIONY=['wawa','chodziez','morze','krakow','tatry','trasa'];

bootWorld();

for(const id of REGIONY)T('w regionie '+id+' da sie dojsc do domen, drzwi i areny',()=>{
  /* na TRASIE brama pola festiwalowego jest zamknięta do końca serii „SIEMA
     ODJAZD" — sprawdzamy region tak, jak wygląda PO niej, bo inaczej test
     zgłasza jako usterkę coś, co jest zaprojektowaną blokadą */
  if(id==='trasa')S.quests=Object.assign({},S.quests,
    {dych:2,graty:2,stop1:2,bateria:2,stop2:2,przyczepa:2,policja:2});
  setRegion(id);
  const cfg=REGIONS[id];
  const sx=Math.floor(cfg.spawn[0]/16),sy=Math.floor(cfg.spawn[1]/16);
  const w=bfs(sx,sy);
  /* część wpisów ma współrzędne ułamkowe (drzwi na końcu mola), więc zaokrąglamy */
  const widzi=(fx,fy)=>{
    const x=Math.round(fx),y=Math.round(fy);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
      if(w[(y+dy)*MW+(x+dx)]>=0)return true;         // wystarczy stanąć OBOK
    return false;
  };
  for(const[k,dm]of Object.entries(DOMAINS))
    if(dm.r===id)ok(widzi(dm.x,dm.y),'domena '+k+' w ('+dm.x+','+dm.y+') nieosiagalna');
  for(const d of DOORS)
    if(d.r===id)ok(widzi(d.x,d.y),'drzwi „'+d.n+'" w ('+d.x+','+d.y+') nieosiagalne');
  for(const A of arenasOf(cfg))
    if(A.sign)ok(widzi(A.sign[0],A.sign[1]),'drogowskaz areny w ('+A.sign+') nieosiagalny');
});

T('szosa na wschod Chodziezy jest DROGA, a nie tunelem przez las',()=>{
  setRegion('chodziez');
  const sx=Math.floor(REGIONS.chodziez.spawn[0]/16),sy=Math.floor(REGIONS.chodziez.spawn[1]/16);
  const w=bfs(sx,sy),dm=DOMAINS.wesele;
  ok(w[dm.y*MW+dm.x]>=0,'remiza musi byc osiagalna WPROST, nie tylko z sasiedniego kafla');
  /* na całej długości szosy ma być czym oddychać: co najmniej trzy wolne kafle
     w pasie, po którym się idzie. Jeden wolny kafel = tunel wykopany awaryjnie. */
  let waskie=0;
  for(let x=48;x<=88;x++){
    let wolne=0;
    for(let y=12;y<=18;y++)if(!SOLID(at(x,y)))wolne++;
    if(wolne<3)waskie++;
  }
  eq(waskie,0,'kolumn szosy zwezonych do szczeliny');
  eq(at(60,14),2,'szosa ma byc asfaltem tam, gdzie kiedyś stał las');
  eq(at(86,25),1,'zjazd na remize ma byc drogą, nie wydeptana scieżką');
});

/* ---------------- DOMENY: nic do zbierania z podłogi ---------------- */
/* Zioła, miody i owoce zostają w ŚWIECIE — tam zbieranie jest zajęciem samym
   w sobie. W domenie rozpraszały: gracz w środku walki kucał nad ziółkiem.
   Jedyne, co ma leżeć na ziemi w domenie, to SKRZYNIE — te się rozwala. */
T('w ZADNEJ domenie i na zadnym pietrze nie ma nic do zbierania',()=>{
  domAlways=1;
  let ziola=0,krysztaly=0,pieter=0,gdzie=[];
  for(const id of Object.keys(DOMAINS)){
    scene='world';dlgQ=[];enterDomain(id);scene='world';dlgQ=[];
    for(let i=0;i<domPietra(id).length;i++){
      domLoadFloor(i);pieter++;
      if(forage.length||DOM.crystals.length)gdzie.push(id+' p.'+(i+1));
      ziola+=forage.length;krysztaly+=DOM.crystals.length;
    }
    exitDomain();
  }
  ok(pieter>=30,'test ma przejsc wszystkie pietra, przeszedl '+pieter);
  eq(ziola,0,'zbieralne surowce w domenach: '+gdzie.join(', '));
  eq(krysztaly,0,'krysztaly w domenach: '+gdzie.join(', '));
});
T('w SWIECIE zbieranie zostaje nietkniete',()=>{
  setRegion('chodziez');
  ok(forage.length>0,'na mapie swiata surowce maja rosnac dalej, jest '+forage.length);
});
T('skrzynia domeny placi za to, co dawaly krysztaly',()=>{
  domAlways=1;
  scene='world';dlgQ=[];enterDomain('wesele');scene='world';dlgQ=[];
  DOM.chest={x:P.x,y:P.y,open:false};
  const ch0=S.mats.ch,mk=matOfDom('wesele'),m0=matIle(mk);
  domOpenChest();
  ok(S.mats.ch-ch0>=6,'skrzynia ma przejac zysk z krysztalow, dala '+(S.mats.ch-ch0));
  ok(matIle(mk)>m0,'unikalny surowiec domeny dalej leci ze skrzyni');
});
