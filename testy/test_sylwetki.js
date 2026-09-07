/* SYLWETKI — czy KAŻDY przeciwnik rysuje się TAM, GDZIE STOI.
   Uruchamianie: ./testy/sprawdz.sh test_sylwetki.js

   Powód istnienia: wujek weselny „odlatywał od własnego cienia" — obracał się
   wokół punktu, ale wracał skróconym wektorem (`translate(-8,-22)` zamiast
   `translate(-(sx+8),-(sy+22))`), więc reszta sylwetki, rysowana we
   współrzędnych ekranu, lądowała w miejscu podwojonym. Cios trafiał w cień,
   bo cień był w dobrym miejscu, a rysunek nie.

   `node --check` tego nie zobaczy, żaden test logiki też nie — to widać
   DOPIERO NA PIKSELACH. Więc test rysuje każdą sylwetkę na prawdziwym płótnie
   i sprawdza, gdzie faktycznie wylądowały piksele.                            */

const RAMKA=cv.getContext('2d');
/* prostokąt, w którym NAPRAWDĘ coś narysowano (we współrzędnych logicznych) */
function obrys(){
  const d=RAMKA.getImageData(0,0,cv.width,cv.height).data;
  let x0=1e9,y0=1e9,x1=-1,y1=-1;
  for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){
    if(d[(y*cv.width+x)*4+3]<24)continue;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
  }
  if(x1<0)return null;
  return{x0:x0/RES,y0:y0/RES,x1:x1/RES,y1:y1/RES};
}
function czysto(){
  cx.setTransform(1,0,0,1,0,0);
  cx.clearRect(0,0,cv.width,cv.height);
  cx.setTransform(RES,0,0,RES,0,0);
}
function makieta(t){
  return{t,x:0,y:0,hp:50,hp0:100,maxHp:100,dx:0,dy:0,wt:0,stun:0,kb:0,kbx:0,kby:0,flash:0,atk:10};
}

bootWorld();
scene='world';

/* Rysujemy na środku ekranu i patrzymy, czy sylwetka trzyma się swojego miejsca.
   Zapas jest hojny (sprite'y mają balony, butelki i kije nad głową), ale
   podwojone współrzędne wypadają z niego z ogromnym zapasem.                  */
const X=110,Y=110;
for(const t of Object.keys(FOE_DRAW))T('sylwetka '+t+' rysuje się tam, gdzie stoi',()=>{
  const f=makieta(t);
  f.x=X+8;f.y=Y+20;
  P.x=f.x+40;P.y=f.y;                       // patrzy w prawo — obrót w jedną stronę
  czysto();
  drawFoe(f,X,Y);
  const o=obrys();
  ok(o,'sylwetka '+t+' nie narysowała ANI JEDNEGO piksela');
  ok(o.x0>X-40&&o.x1<X+56,t+': poziomo wyszła poza swoje miejsce ('+
     Math.round(o.x0)+'…'+Math.round(o.x1)+', a stoi w '+X+')');
  ok(o.y0>Y-40&&o.y1<Y+60,t+': pionowo wyszła poza swoje miejsce ('+
     Math.round(o.y0)+'…'+Math.round(o.y1)+', a stoi w '+Y+')');
});
/* to samo dla bossów — one rysują się od STÓP, więc ramka jest wyższa */
for(const t of Object.keys(BOSS_DRAW))T('sylwetka bossa '+t+' rysuje się tam, gdzie stoi',()=>{
  const f=makieta(t);
  f.x=X;f.y=Y;f.bn='TEST';f.boss=true;
  P.x=f.x+40;P.y=f.y;
  czysto();
  drawBoss(f,X,Y);
  const o=obrys();
  ok(o,'boss '+t+' nie narysował ANI JEDNEGO piksela');
  ok(o.x0>X-90&&o.x1<X+90,t+': poziomo wyszedł poza swoje miejsce ('+
     Math.round(o.x0)+'…'+Math.round(o.x1)+', a stoi w '+X+')');
  ok(o.y0>Y-110&&o.y1<Y+40,t+': pionowo wyszedł poza swoje miejsce ('+
     Math.round(o.y0)+'…'+Math.round(o.y1)+', a stoi w '+Y+')');
});
/* KAFLE ANIMOWANE też rysują po ekranie (są poza upieczonym cache), więc
   podlegają dokładnie temu samemu błędowi — gość weselny na arenie miał go
   razem z wujkiem. */
T('animowane kafle rysują się w swoim kaflu',()=>{
  for(let v=0;v<TILE_ANIM.length;v++){
    if(!TILE_ANIM[v]||!TILES[v])continue;
    czysto();
    TILES[v].paint(cx,X,Y,7,5);
    const o=obrys();
    if(!o)continue;                          // kafel może w tej klatce nic nie rysować
    ok(o.x0>X-24&&o.x1<X+40,'kafel '+v+': poziomo wyszedł poza kafel ('+
       Math.round(o.x0)+'…'+Math.round(o.x1)+', a kafel jest w '+X+')');
    ok(o.y0>Y-30&&o.y1<Y+40,'kafel '+v+': pionowo wyszedł poza kafel ('+
       Math.round(o.y0)+'…'+Math.round(o.y1)+', a kafel jest w '+Y+')');
  }
});
