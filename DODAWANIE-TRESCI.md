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

## 🌀 Nowa domena

**1. Wpis w `DOMAINS`:**

```js
kotlownia:{r:'wawa',dni:1,x:52,y:18,n:'KOTŁOWNIA POD BLOKIEM',col:'#f5a032',
  floor:2,acc:9,wall:20,                  // motyw kafli: podłoga, akcent, ściana
  pietra:['przedsionek','krata','komnaty','zapadnia','skarbiec'],  // klucze FLOOR_KINDS
  foes:['hejter','pies','dron'],          // hałastra
  elite:'rycerz',                          // strażnik komnat
  mini:['soltys','betoniarz','komornik'],  // JAWNA pula mini-bossów (progi 2/5/10)
  ing:['grzyb','ziemniak']},               // co się zbiera po drodze
```

- **`dni`** to indeks w `DOM_DAYS`: `0` = PON+CZW, `1` = WT+PT, `2` = ŚR+SOB.
  W niedzielę otwarte jest wszystko, doba skacze o **4:00** (`DOM_RESET_H`).
- **`pietra`** decydują o długości. Suma `min` z `FLOOR_KINDS` ma wyjść **10–15 minut**.
  Domena z **ręcznymi planszami** (`js/mapy.js`) tego pola **nie ma** — piętra
  bierze z mapy, żeby nie było dwóch źródeł prawdy.
- Postęp na piętrze blokują **KLUCZE i KŁÓDKI** (pole `klucze` w `FLOOR_KINDS`),
  a nie bramy „po wyczyszczeniu komnaty" — tamtych już nie ma.
- **`mini` musi być jawne.** Kiedyś pula liczyła się z `FOE_TYPES` po fladze `mini`
  i wpadał do niej komendant z obławy policyjnej — od 1. poziomu domeny.

**2. Wpis w `DOM_MATS`** — każda domena daje **jeden unikalny surowiec**, przypisany
do jednej postaci. Bez niego nie ma jej wzniesienia i nie da się go zdobyć nigdzie indziej:

```js
rura:{n:'RURA Z PIONU',ic:'🔧',col:'#f5a032',ch:'kaska',dom:'kotlownia',
  d:'Ukręcona w kotłowni. Ciepła nawet w lipcu.'},
```

**3. Portal** postawi się sam — wystarczy, że `x`/`y` wskazują **przechodni i osiągalny**
kafel regionu. Pilnuje tego test `test_surowce.js`.

---

## 🎨 Ręcznie rysowana plansza domeny

**To jest domyślny sposób robienia domen.** Losowy generator zostaje tylko dla
tych, których jeszcze nie przerysowano — plansza losowa jest poprawna, ale nijaka:
jeden korytarz przez środek, zero kompozycji, kłódka tam, gdzie akurat wypadło.
Domena, do której gracz wraca co tydzień, ma być MIEJSCEM: wodospad zawsze w tym
samym rogu, regały pod tą samą ścianą, skrót, który się zna i przechodzi coraz
szybciej.

Plansze siedzą w **`js/mapy.js`** — jeden znak = jeden kafel:

```js
var MAPY={
  piwnica:[
    {kind:'przedsionek',n:'ZALANA PRALNIA',
     opis:'Pękł pion. Woda spływa przez halę do kratki — idź pod prąd.',
     limit:0,                      // zegar piętra (pomiń = weź z FLOOR_KINDS)
     mapa:[
       '########################################',
       '###WW......|####LLL.LTLL.TL.############',
       …
     ]},
  ]
};
```

**Szkielet planszy** (te znaki są w każdej domenie):

| znak | | znak | | znak | |
|---|---|---|---|---|---|
| `#` | ściana | `.` | podłoga | `,` | podłoga akcentowa |
| `S` | start gracza | `>` | schody (na ostatnim piętrze: komnata finałowa) | `A`–`H` | środek komnaty |
| `k` `r` `b` | klucz złoty / czerwony / niebieski | `1` `2` `3` | KŁÓDKA w tych kolorach | `M` | maszyna bombowa |
| `X` | skrzynia (cios) | `O` | beczka (wybucha) | `=` | pustak (TYLKO bomba) |
| `I` | filar (wieczny) | `-` | krucha płyta | ` ` | przepaść |
| `_` | dno rozpadliny z wodą (też przepaść!) | `*` | kryształ domeny | `%` | surowiec do zebrania |

**Wyposażenie wnętrz** (piwnica, ruiny):

| znak | | znak | | znak | |
|---|---|---|---|---|---|
| `W` | wodospad | `~` | woda | `o` | kratka ściekowa |
| `L` | regał z książkami | `p` | zielsko | `G` | głaz |
| `T` | kaganek | `:` | gruz | `\|` | rury pod stropem |
| `+` | kamienna posadzka | `e` | ruina muru | | |

**Wyposażenie lasu** (część kafli była w grze od dawna — te wpisy tylko dają im znak):

| znak | | znak | | znak | |
|---|---|---|---|---|---|
| `d` | dąb | `q` | klon | `s` | stary świerk (sypie szyszkami) |
| `y` | brzoza | `x` | krzak z jagodami | `g` | gęstwina (ściana lasu) |
| `m` | mech | `f` | paproć | `z` | łąka kwietna |
| `u` | pieniek | `n` | stos drewna | `j` | szałas drwali |
| `i` | ognisko (świeci) | `w` | ścieżka leśna | `c` | kamyki |
| `v` | trzcina | `Q` | staw | `l` | drogowskaz |

Zasady, których pilnuje test `test_mapy.js` (i sama gra — krzyczy do konsoli):

- **wszystkie wiersze piętra równej długości** (z nich bierze się `MW`), max **64 × 32**;
- **każdy klucz da się wziąć PRZED** kłódką w swoim kolorze;
- **każda kłódka naprawdę coś odcina** — nie da się jej obejść bokiem;
- schody, komnaty, maszyny i klucze są osiągalne;
- kłódka musi zamykać **cały przekrój** przejścia (min. 2 kafle).

> **Uwaga na litery.** `G` (głaz) i `T` (kaganek) wpadają w zakres `A`–`H`,
> więc komnaty rozpoznaje jawna lista `MAPA_KOMNATY='ABCDEFH'`. Zanim ją wpisano,
> za każdą skałą robiła się komnata-widmo w litej ścianie.

Promień komnaty liczy się sam z kształtu mapy (`domPromienKomnaty`) — można go
nadpisać polem `promienie:{A:6,H:8}`, jeśli komnata ma budzić się wcześniej.

Klimat (spadająca woda, płomień kaganka, kropla z rury, refleksy na kałuży,
spadające szyszki, opadające liście, blask ogniska) rysuje `drawDomainDeko`
z list zebranych przy wczytaniu mapy — kafle zostają w upieczonym cache
i piętro pełne dekoracji nie kosztuje ani klatki więcej. Który znak trafia
do której listy, mówi `MAPA_DEKO`.

**Dźwięk i światło bierze się z wpisu domeny** — bez nowych plików audio:

```js
las:{…, amb:{wiatr:.5, ptaki:1},        // szum koron + ćwierkanie co 5–17 s
        mrok:.42, mrokCol:'10,26,14'},  // winieta: w lesie cień koron, w piwnicy ciemność
```

Szum wody włącza się sam, gdy na piętrze jest kaskada (`W`) — głośność i barwa
idą od odległości do najbliższej.

### 🎭 Skiny kafli — ta sama mechanika, inny wygląd

Pustak, filar, krucha płyta, przepaść i maszyna bombowa mają twarde reguły
i nie ma sensu ich mnożyć — ale betonowy pustak w środku lasu wygląda jak
pomyłka. Domena może przemalować dowolny kafel jednym wpisem w `SKINY`:

```js
const SKINY={
  las:{
    41(g,sx,sy,tx,ty){ /* pustak → GŁAZ NARZUTOWY */ },
    45(g,sx,sy,tx,ty){ /* maszyna → SKRZYNKA DYNAMITU */ },
    48(g,sx,sy,tx,ty,col){ /* kłódka → BRAMA Z ŻERDZI, `col` to kolor klucza */ },
  },
};
```

Kafel bez wpisu rysuje się domyślnie. Żeby kafel dało się skinować, jego `paint`
zaczyna się od `if(domSkin(NR,g,sx,sy,tx,ty))return;`.

---

## 🧱 Nowy rodzaj piętra

Jeden wpis w `FLOOR_KINDS` — generator (`domBuildFloor` + `domKrataOverlay`) jest wspólny
i czyta z niego wszystko:

```js
kotly:{n:'KOTŁY',w:60,h:30,siatka:[3,2],  // labirynt 3×2 komnat na całej planszy
  petle:1,      // ile skrótów ponad drzewo rozpinające (0 = czyste drzewo)
  klucze:2,     // ile KŁÓDEK na głównej trasie (max 3 — tyle jest kolorów)
  korytarz:3,   // szerokość korytarzy w kaflach
  walka:1,limit:80,min:3,
  gest:.3,      // ile podłogi zasypać rupieciami (0 = czysto)
  filary:1,     // krata filarów co drugi kafel (Bomberman)
  maszyn:2,     // maszyny bombowe — DOPIERO wtedy pojawiają się pustaki
  dziury:4,     // bąble przepaści + kładki z kruchych płyt
  mostki:3,     // przeprawy, przez które prowadzą WYŁĄCZNIE kruche płyty
  elita:1,      // elita w komnacie WYJŚCIOWEJ
  straz:1,      // STRAŻNIK (piętro finałowe)
  opis:'Gorąco, ciasno i tyka.'},
```

Cztery rzeczy dzieją się same:

| | |
|---|---|
| Miejsca święte | wejście, środki komnat, schody, klucze i kłódki są przedmuchiwane — nic tam nie stanie |
| Przejezdność | `domPrzekop` przerzuca most, jeśli krata albo przepaść coś odcięła |
| Dostępność kluczy | `domNaprawKlucze` sprawdza na GOTOWEJ mapie, czy każdy klucz da się wziąć przed swoją kłódką — jak nie, przenosi go |
| Powtarzalność | wszystko losuje `domRng` z `DOM.seed`, więc testy mielą setki układów |

> **Kolejność ma znaczenie.** Wejście i wyjście to najdalsza para komnat
> w labiryncie, kłódki siedzą na trasie między nimi, a klucz do kłódki nr `i`
> ląduje w części osiągalnej przy zamkniętych kłódkach `i…n`. Wszystko liczone
> po grafie, a na końcu **weryfikowane po kaflach** — bo krata i przepaście
> potrafią ten graf rozminąć.

> **Limit rozmiaru: 64 × 32 kafle.** Tyle mieści cache kawałków (`CHUNK_CAP`).
> Większe piętro zacznie się przepiekać co klatkę.

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
| Układ pięter domeny | ręczna mapa z `js/mapy.js`, a w jej braku `domBuildFloor` + `domKrataOverlay` |
| Kontrola ręcznej mapy | `domSprawdzMape` przy każdym wczytaniu piętra (błąd → konsola) |
| Kalendarz domen | `domDayOpen` / `domNextOpen` z pola `dni` |
| Koszt wzniesień | `ascCost(asc, id)` sam dokłada surowiec z `DOM_MATS` |
