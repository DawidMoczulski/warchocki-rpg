/* MENU GŁÓWNE — czy da się z niego wejść do gry i czy ustawienia są spójne.
   Uruchamianie: ./testy/sprawdz.sh test_menu.js                              */

T('menu stoi na wierzchu i zajmuje cały ekran',()=>{
  const m=document.getElementById('title');
  ok(!m.classList.contains('hidden'),'menu ma byc widoczne na starcie');
  const st=getComputedStyle(m);
  eq(st.position,'fixed','menu musi byc fixed, zeby wyjsc poza scene 16:10');
  const r=m.getBoundingClientRect();
  ok(r.width>=window.innerWidth-2&&r.height>=window.innerHeight-2,
     'menu nie wypelnia okna: '+Math.round(r.width)+'x'+Math.round(r.height));
});

T('cztery kanaly monitora, jeden aktywny',()=>{
  const t=[...document.querySelectorAll('.menuTab')];
  eq(t.length,4,'zakladek');
  eq(t.filter(b=>b.getAttribute('aria-selected')==='true').length,1,'aktywnych zakladek');
});

T('przelaczanie zakladek pokazuje dokladnie jeden panel',()=>{
  for(const n of ['graj','jak','ster','dzwiek']){
    menuTab(n);
    const widoczne=[...document.querySelectorAll('.menuPane')].filter(p=>!p.classList.contains('hidden'));
    eq(widoczne.length,1,'widocznych paneli przy "'+n+'"');
    eq(widoczne[0].dataset.pane,n,'pokazal sie zly panel');
  }
});

T('sterowanie mozna zmieniac wprost z menu glownego',()=>{
  menuTab('ster');
  const wiersze=document.querySelectorAll('#menuKeys .kbrow');
  ok(wiersze.length>=8,'za malo akcji do przypisania: '+wiersze.length);
  ok(document.querySelectorAll('#menuKeys .kbkey').length===wiersze.length,'kazda akcja ma klawisz');
});

T('lista klawiszy w menu i w pauzie pokazuja to samo',()=>{
  const stare=KEYMAP.attack;
  KEYMAP.attack='KeyB'; renderKeybind();
  const a=document.querySelector('#menuKeys .kbkey').parentElement.parentElement;
  const wMenu=[...document.querySelectorAll('#menuKeys .kbkey')].map(b=>b.textContent).join('|');
  const wPauzie=[...document.querySelectorAll('#keybindList .kbkey')].map(b=>b.textContent).join('|');
  eq(wMenu,wPauzie,'obie listy musza pokazywac ten sam KEYMAP');
  KEYMAP.attack=stare; renderKeybind();
});

T('suwaki dzwieku w menu i w panelu gry sa zsynchronizowane',()=>{
  const stare=voiceVol;
  voiceVol=0.42; syncAudioUI();
  eq($('menuVolVoice').value,'42','suwak w menu');
  eq($('volVoice').value,'42','suwak w panelu gry');
  eq($('menuVolVoiceVal').textContent,'42%','podpis w menu');
  voiceVol=stare; syncAudioUI();
});

T('opis zapisu nie klamie swiezemu graczowi',()=>{
  /* bez zapisu w pamieci przegladarki nie ma o czym pisac */
  const el=$('saveInfo');
  if(!store.get('wrpg')) ok(el.classList.contains('hidden'),
    'bez zapisu nie wolno pokazywac "W zapisie: ..."');
  else ok(!el.classList.contains('hidden'),'zapis jest, a opisu brak');
});

T('opis zapisu nie sklada sie kropkami',()=>{
  const el=$('saveInfo');
  ok(el.textContent.indexOf(' · ')<0,'srodkowe kropki to sklejka, nie zdanie');
});

T('Edek ma wlasne plotno i CALKOWITA skale pikseli',()=>{
  drawMenuHero();
  ok(heroBox.w>0,'plotno Edka nie zostalo zmierzone');
  eq(heroBox.sc,Math.floor(heroBox.sc),'skala pikselartu musi byc calkowita');
  ok(heroBox.sc>=4,'Edek za maly: skala '+heroBox.sc);
});

T('plotno gry ma rozdzielczosc dobrana do ekranu',()=>{
  eq(cv.width,W*RES,'szerokosc backing store');
  eq(cv.height,H*RES,'wysokosc backing store');
  ok(RES>=3&&RES<=4,'RES poza zakresem: '+RES);
});

/* UWAGA: kliknięcie „Nowa gra" NIE przechodzi do gry od razu — najpierw leci
   initAudio(), a bootWorld() odpala się dopiero w .then(). Test synchroniczny
   sprawdzałby stan sprzed przejścia, więc sprawdzamy samo przejście. */
T('wejscie do gry chowa menu i oddaje przewijanie strony',()=>{
  S=JSON.parse(JSON.stringify(DEFAULT_SAVE));
  setRegion('wawa');
  bootWorld();
  /* na świeżym zapisie bootWorld od razu odpala scenkę powitalną Edka,
     więc scena to 'dialog' — jedno i drugie znaczy „jesteśmy już w grze" */
  ok(scene==='world'||scene==='dialog','ma sie zaczac gra, jest: '+scene);
  ok($('title').classList.contains('hidden'),'menu ma zniknac');
  ok(!document.body.classList.contains('menuOpen'),'strona ma odzyskac przewijanie');
  ok(!$('hud').classList.contains('hidden'),'HUD ma sie pokazac');
});

T('przycisk Nowa gra jest podpiety',()=>{
  ok($('btnNew'),'brak przycisku');
  ok(!$('btnNew').disabled,'przycisk wylaczony');
});
