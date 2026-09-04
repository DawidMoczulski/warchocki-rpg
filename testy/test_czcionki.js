/* CZCIONKI — czy polskie znaki są narysowane POPRAWNIE, a nie tylko „są".
   Uruchamianie: ./testy/sprawdz.sh test_czcionki.js

   Skąd te akurat sprawdzenia: Press Start 2P miało komplet polskich glifów
   (fonts.check zwracało true!), a mimo to „PRZEPAŚĆ" wyglądało jak „PRZEPAść".
   Powód: akcenty i ogonki były WCIŚNIĘTE w pudełko wersalika — Ą nie miało
   podrzutu, a kreska nad Ś nie wychodziła ponad wysokość S. Sama obecność
   glifu niczego więc nie dowodzi; trzeba mierzyć, gdzie ten glif sięga.       */

const g = document.createElement('canvas').getContext('2d');
const K = 100;   // duży kegel = pomiar odporny na zaokrąglenia

function metr(znak, rodzina){
  g.font = K + 'px ' + rodzina;
  const m = g.measureText(znak);
  return {gora:m.actualBoundingBoxAscent, dol:m.actualBoundingBoxDescent, szer:m.width};
}
const PX = '"Jersey 25"', UI = '"Space Grotesk"';

T('krój pikselowy w ogóle się wczytał (a nie podmienił na zapasowy)',()=>{
  ok(document.fonts.check('16px "Jersey 25"','ŻÓŁĆ'),'brak kroju pikselowego');
  /* zapasowy monospace ma inne proporcje — sprawdzamy, że to NIE on */
  const a=metr('H',PX), b=metr('H','monospace');
  ok(Math.abs(a.szer-b.szer)>2,'renderuje sie zapasowy monospace, nie Jersey 25');
});

T('krój prozy się wczytał',()=>{
  ok(document.fonts.check('16px "Space Grotesk"','ŻÓŁĆ'),'brak kroju prozy');
});

T('size-adjust dowozi wysokosc wersalika starego kroju',()=>{
  /* Press Start 2P miał capH = pełny kegel. Bez size-adjust cały interfejs
     zrobiłby się o ~40% niższy i układy by się rozjechały. */
  const h=metr('H',PX).gora;
  ok(h>0.92*K && h<1.10*K,'capH='+h.toFixed(0)+' — mialo byc ~'+K);
});

T('tekst NIE jest szerszy niz byl (nic nie moze wyjsc poza ramki)',()=>{
  const w=metr('H',PX).szer;
  ok(w<=K,'advance='+w.toFixed(0)+' > '+K+' — tekst sie rozepchnie');
});

T('OGONKI schodza pod linie pisma',()=>{
  for(const z of ['ą','ę','Ą','Ę']){
    const m=metr(z,PX);
    ok(m.dol>2,'"'+z+'" nie ma podrzutu (dol='+m.dol.toFixed(1)+') — ogonek wciety w litere');
  }
});

T('KRESKI I KROPKI wychodza ponad litere',()=>{
  const pary=[['Ś','S'],['Ć','C'],['Ź','Z'],['Ż','Z'],['Ó','O'],['Ń','N'],
              ['ś','s'],['ć','c'],['ź','z'],['ż','z'],['ó','o'],['ń','n']];
  for(const [zn,baza] of pary){
    const a=metr(zn,PX), b=metr(baza,PX);
    ok(a.gora>b.gora+1,'"'+zn+'" nie jest wyzsze od "'+baza+'" — akcent wciety w litere');
  }
});

T('polskie litery maja te sama wysokosc co ich sasiedzi',()=>{
  /* to lapie krój, w którym „ł" jest prawdziwa minuskula, a reszta malych liter
     to kapitaliki — wtedy „Naladowac" wychodzi jako „NAlADOWAc" */
  const rowne=[['Ł','L'],['Ą','A'],['Ę','E'],['ł','l'],['ą','a'],['ę','e']];
  for(const [zn,baza] of rowne){
    const a=metr(zn,PX).gora, b=metr(baza,PX).gora;
    ok(Math.abs(a-b)<=2,'"'+zn+'" ma wysokosc '+a.toFixed(0)+', a "'+baza+'" '+b.toFixed(0)
       +' — w tekscie mieszanym zrobi sie list z wycinanek');
  }
});

T('to samo w kroju prozy',()=>{
  for(const z of ['ą','ę']) ok(metr(z,UI).dol>2,'"'+z+'" bez ogonka w kroju prozy');
  for(const [zn,baza] of [['ś','s'],['ó','o'],['ł','l'],['ć','c']]){
    const a=metr(zn,UI).gora, b=metr(baza,UI).gora;
    ok(a>=b-1,'"'+zn+'" nizsze od "'+baza+'" w kroju prozy');
  }
});

T('canvas gry dostaje ten sam krój co interfejs',()=>{
  /* w grze kegle na canvasie sa literalne ('7px "Jersey 25"') — gdyby ktos
     podmienil rodzine tylko w CSS, plansza i panele rozjechalyby sie stylem */
  const przed=cx.font;
  cx.font='7px "Jersey 25"';
  ok(cx.font.indexOf('Jersey')>=0,'canvas nie przyjal kroju pikselowego');
  cx.font=przed;
});
