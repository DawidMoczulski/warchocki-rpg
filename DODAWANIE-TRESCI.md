# 🧱 Dodawanie treści — szablony

Gra jest zbudowana na **rejestrach**: żeby dorzucić region, bossa, postać albo
teren, wypełniasz jeden wpis w słowniku. Nie dopisujesz `case`, nie dokładasz
gałęzi `if` do wspólnych funkcji.

Po każdej zmianie odpal test kompletności — powie, czego brakuje:

```bash
python3 -m http.server 8123          # w katalogu web/
node …/scratchpad/tresc.js           # bossowie, regiony, kafle
node …/scratchpad/postacie.js        # umiejętności i sylwetki postaci
```

---

## 🗺 Nowy region

**1. Wpis w `REGIONS`** (`js/game.js`):

```js
gdansk:{n:'GDAŃSK',w:120,h:80,build:buildGdansk,spawn:[40*16,30*16],pks:[38,28],ic:'⚓',
  tdesc:'stare miasto · żurawie · Neptun',        // podpis w panelu podróży
  cars:true,boars:false,leaves:true,smoke:true,boat:true,
  foesMax:8,foeTypes:['hejter','mewa','krab','dron'],   // muszą istnieć w FOE_TYPES
  zones:[[4,40,116,76],[60,4,116,36]],                  // gdzie rodzą się wrogowie
  arena:{...}},                                          // opcjonalnie: arena bossa
```

**2. Funkcja budująca** — maluje kafle przez `rect()` / `set()`:

```js
function buildGdansk(){
  rect(0,0,MW-1,MH-1,0);          // podkład: trawa
  rect(0,30,MW-1,34,2);           // droga
  // …budynki, woda, ścieżki
}
```

**3. Dorzuć treść, oznaczając ją regionem** — wpisy same się podłączą:
`NPCS` (`r:'gdansk'`), `DOORS`, `COLLECT`, `DOMAINS`, `FORAGE_POOL`, `SHOPS`.

Reszta dzieje się sama: `setRegion` woła `cfg.build()`, dorzuca dziki teren,
buduje arenę bossa, sprawdza przejezdność i przelicza kolizje.

---

## 👑 Nowy boss

**1. Wpis w `BOSSES`:**

```js
neptun:{drop:['art','trojzab'],r:'gdansk',x:96,y:57,t:'neptun',
  n:'NEPTUN Z DŁUGIEGO TARGU',batk:'fala',
  film:'ZACZEPIŁEM NEPTUNA I ZROBIŁ SIĘ NERWOWY',
  moves:['fala','wir','grzmot'],                 // klucze z BOSS_MOVES
  intro:[['NEPTUN','KTO ŚMIE?'],['Edek','Jestem Warchockim Edwardem, byku.','c_ziomali']],
  next:{...}},                                    // opcjonalnie: drugi etap
```

**2. Statystyki w `FOE_TYPES`** pod tym samym kluczem co `t:`.

**3. Sylwetka w `BOSS_DRAW`:**

```js
neptun(g,f){
  g.fillStyle='#2a6a5a';
  // …rysowanie w układzie już przesuniętym na pozycję bossa
},
```

**4. Ataki w `BOSS_MOVES`**, jeśli potrzebujesz nowych.

> **Uwaga na klucze.** `drop` musi siedzieć we wpisie bossa, bo gra czyta go
> po **id bossa**, nie po typie wroga. Na tym poległ Kettlebell Seby — był
> wpisany pod `mdres` (typ), a szukany pod `seba` (id), przez co przez długi
> czas był w ogóle nie do zdobycia. Test `tresc.js` teraz to wyłapuje.

---

## 🎴 Nowa postać grywalna

Wszystko w **jednym wpisie** w `CHARS`:

```js
kaska:{n:'Kaśka z Osiedla',elId:'swojskosc',star:5,
  spd:84,batk:24,rng:25,atk:'melee',
  spcN:'TRZEPAK 3000',spcCd:11,spcD:'wykręca hejterów na trzepaku',
  hitTxt:['ŁUP!','TRZEPAK!'],
  desc:'Królowa podwórka. Zna każdego i każdy zna ją.',
  how:'⌚ Życzenia — własny baner',
  sig:'trzepakZ',                                  // sygnaturowa broń 5⭐
  c6:{n:'CAŁE OSIEDLE',d:'TRZEPAK łapie dwa razy więcej wrogów'},
  burst:{jingle:'…',col:'#7bc950',bar:'#7bc950',   // opcjonalnie: super-hit [Q]
    ready:'[Q] 💥 …',full:'…',cut:1.4},
  /* [E] — UMIEJĘTNOŚĆ. `skM` to mnożnik obrażeń z talentu i konstelacji. */
  skill(skM){
    fxRing(P.x,P.y-8,90,'#7bc950',{life:.5,w:3});
    for(const f of foes)if(Math.hypot(f.x-P.x,f.y-P.y)<70)dealDmg(f,'kaska',1.4*skM);
    toast('🧺 TRZEPAK 3000!');
  }},
```

Sylwetka: albo wpis w `HUMAN_CFG` (wspólna rysowalka postaci „ludzkich"),
albo własna funkcja podpięta jako `CHARS.kaska.draw`.

Poziomy, wzniesienia, talenty, konstelacje C1–C5 i statystyki **liczą się same**
ze wspólnych krzywych — nie trzeba nic dopisywać.

---

## 🌱 Nowy teren

**1. Kolor podkładu w `TCOL`** (albo pomiń, jeśli kafel maluje własne tło).
**2. Kolizja w `SOLIDF`**, jeśli ma blokować ruch.
**3. Wpis w `TILES`:**

```js
41:{paint(g,sx,sy,tx,ty){
    if((tx*7+ty*13)%9===0)R(g,sx+6,sy+7,2,2,'#376b3e');   // detal wg pozycji kafla
    if(at(tx,ty+1)!==41)R(g,sx,sy+14,16,2,'#6e5c3a');     // krawędź przy sąsiedzie
  }},
```

Dwie zasady, które trzeba znać:

- **`anim:true`** ustaw tylko wtedy, gdy kafel zmienia się w czasie (używa `anim`).
  Takie kafle NIE trafiają do upieczonych kawałków mapy i kosztują co klatkę —
  reszta jest malowana raz i wklejana gotowa.
- **Detale muszą zależeć wyłącznie od `tx`/`ty`**, nigdy od `Math.random()`.
  Kafel jest malowany raz przy pieczeniu kawałka; losowość dałaby inny wygląd
  po każdym powrocie do regionu.
- Rysowanie **poza kratkę** (korona drzewa nad kaflem) jest dozwolone do
  16 pikseli — tyle wynosi zapas kawałka.

---

## Co się dzieje samo

| | |
|---|---|
| Kolizje | z `SOLIDF`, przeliczane przy budowie regionu |
| Przejezdność mapy | `ensureConnectivity` przekopuje drogę do drzwi i bossów |
| Dziki teren | `wildFill` sam rozstawia drzewa, głazy, stawy |
| Arena bossa | `buildBossArena` z pola `arena` w regionie |
| Skalowanie bossa | `bossScale()` względem średniej siły drużyny |
| Paleta kolorów | `:root` w `css/style.css` → obiekt `UI` w JS |
| Rysowanie terenu | pieczone kawałki, koszt niezależny od wielkości mapy |
