/* SKRÓTY TESTOWE (?test=…) — czy każdy wpis wskazuje na coś, co ISTNIEJE.
   Uruchamianie: ./testy/sprawdz.sh test_skroty.js

   Powód istnienia: skrót testowy nie ma jak się zepsuć głośno. Literówka
   w id broni czy artefaktu nie rzuca błędem — po prostu postać wchodzi do
   walki z pustą ręką, a człowiek myśli, że tak ma być i testuje nie to,
   co chciał. Ten test czyta rejestr skrótów i sprawdza każdy wpis.        */

bootWorld();

T('każdy skrót celuje w istniejący region i miejsce na jego planszy',()=>{
  for(const[k,t]of Object.entries(TEST_SETUPS)){
    ok(REGIONS[t.reg],'skrót '+k+': nie ma regionu '+t.reg);
    ok(t.at&&t.at.length===2,'skrót '+k+': brak punktu startu');
    ok(t.at[0]>0&&t.at[0]<REGIONS[t.reg].w&&t.at[1]>0&&t.at[1]<REGIONS[t.reg].h,
       'skrót '+k+': punkt ('+t.at+') leży poza planszą '+t.reg);
  }
});
T('bronie i artefakty ze skrótów istnieją — i pasują do swoich slotów',()=>{
  for(const[k,t]of Object.entries(TEST_SETUPS)){
    for(const[id,w]of Object.entries(t.bron||{})){
      ok(CHARS[id],'skrót '+k+': nie ma postaci '+id);
      ok(WEAPONS[w],'skrót '+k+': nie ma broni '+w);
    }
    for(const[id,lista]of Object.entries(t.art||{})){
      ok(CHARS[id],'skrót '+k+': nie ma postaci '+id);
      lista.forEach((a,i)=>{
        if(!a)return;
        ok(ARTS[a],'skrót '+k+': nie ma artefaktu '+a);
        eq(ARTS[a].slot,i,'skrót '+k+': artefakt '+a+' wsadzony w zły slot');
      });
    }
    for(const id of(t.ekipa||[]))ok(CHARS[id],'skrót '+k+': nie ma postaci '+id);
    if(t.gra)ok(CHARS[t.gra],'skrót '+k+': nie ma postaci '+t.gra);
  }
});
T('skrót „moc" naprawdę daje mocną ekipę, a nie samą deklarację',()=>{
  const t=TEST_SETUPS.moc;
  eq(t.lvl,40,'poziom z zamówienia Dawida');
  eq(t.tal,10,'talenty na maksa');
  eq(t.con,6,'konstelacje na maksa');
  for(const id of ['edek','liri']){
    ok(t.bron[id],'brak broni dla '+id);
    eq(WEAPONS[t.bron[id]].star,5,'broń dla '+id+' ma być 5⭐');
    eq(CHARS[id].sig,t.bron[id],id+' ma dostać SWOJĄ sygnaturę');
    eq((t.art[id]||[]).filter(Boolean).length,3,'komplet trzech artefaktów dla '+id);
    for(const a of t.art[id])eq(ARTS[a].star,5,'artefakt '+a+' ma być 5⭐');
  }
  ok(t.zawsze,'domeny mają być otwarte niezależnie od dnia tygodnia');
  ok(t.asc>=ascFromLvl(t.lvl),'wzniesienie nie może być NIŻSZE, niż wymaga poziom');
  ok(ascCap(t.asc)>=t.lvl,'wzniesienie '+t.asc+' nie dopuszcza poziomu '+t.lvl);
});
T('poziom 40 dostaje wzniesienie, które go w ogóle dopuszcza',()=>{
  const a=ascFromLvl(40);
  ok(a>0,'poziom 40 wymaga wzniesienia, wyszlo '+a);
  ok(ASC_CAP[a]>=40,'wzniesienie '+a+' nie dopuszcza poziomu 40 (cap '+ASC_CAP[a]+')');
});
