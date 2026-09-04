/* RĘCZNE PLANSZE DOMEN — format i zdrowy rozsądek. Czysty Node, bez przeglądarki:
   js/mapy.js to sam opis plansz, więc nie potrzebuje ani canvasu, ani reszty gry.
   Uruchamianie:  node testy/test_mapy.js                                        */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ctx={}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js','mapy.js'),'utf8'),ctx);

let bledow=0, pieter=0;
const zle=(gdzie,co)=>{console.log('  BLAD '+gdzie+' -> '+co);bledow++;};

for(const id of Object.keys(ctx.MAPY)){
  ctx.MAPY[id].forEach((p,i)=>{
    pieter++;
    const gdzie=`${id}[${i}] "${p.n}"`;
    const dl=p.mapa.map(r=>[...r].length);
    const max=Math.max(...dl), min=Math.min(...dl);

    /* RÓWNE WIERSZE to nie kosmetyka: szerokość mapy bierze się z pierwszego
       wiersza, więc krótszy wiersz przesuwa CAŁĄ resztę planszy o jeden kafel. */
    if(max!==min) zle(gdzie,`wiersze maja rozna dlugosc: ${min}-${max}`);
    if(max>64||p.mapa.length>32) zle(gdzie,`${max}x${p.mapa.length} — limit to 64x32`);

    const tekst=p.mapa.join('');
    const ile=z=>[...tekst].filter(c=>c===z).length;
    if(ile('S')!==1) zle(gdzie,`startow "S": ${ile('S')} (ma byc dokladnie 1)`);
    if(ile('>')<1)   zle(gdzie,'brak schodow ">" — pietra nie da sie skonczyc');

    /* kłódka bez swojego klucza = plansza nie do przejścia */
    for(const [kl,zm,nazwa] of [['k','1','zloty'],['r','2','czerwony'],['b','3','niebieski']])
      if(ile(zm)>0 && ile(kl)===0) zle(gdzie,`klodka ${nazwa} bez klucza`);

    if(!p.n||!p.kind) zle(gdzie,'brak nazwy albo rodzaju pietra');
  });
}
console.log(`\n${pieter} pieter w ${Object.keys(ctx.MAPY).length} domenach, bledow: ${bledow}`);
process.exit(bledow?1:0);
