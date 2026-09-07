/* REGIONY — czy da się DOJŚĆ tam, gdzie gra każe iść.
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
