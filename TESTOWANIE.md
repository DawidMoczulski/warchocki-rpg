# 🧪 Testowanie gry — skróty i przydatne komendy

## 🌀 DOMENY 3.0 (Genshin × Bomberman)

Domena to teraz **5 pięter** ładowanych po kolei (`PRZEDSIONEK → KRATA → KOMNATY →
ZAPADNIA → SKARBIEC`), razem **10–15 minut**. Wipe drużyny, przekroczony czas
albo wyjście = **CAŁA domena od nowa** (wyjście pyta drugim `[E]`).

### Plansze są RĘCZNIE RYSOWANE (od v22)

**PIWNICA HEJTERÓW** i **DZIKI LAS** mają po pięć plansz narysowanych znak po znaku
w `js/mapy.js` — takich samych przy każdym wejściu:

| | PIWNICA HEJTERÓW | DZIKI LAS |
|---|---|---|
| 1 | ZALANA PRALNIA — kaskada z pękniętego pionu | SKRAJ LASU — ścieżka, strumień, drogowskaz |
| 2 | KOTŁOWNIA — beton i dwie kłódki | WYRĄB — karpy, stosy, skrzynki dynamitu |
| 3 | BIBLIOTEKA PIWNICZNA — regały i sadzawka | STARY BÓR — świerki, mech, kręgi grzybów |
| 4 | ZAWALONY STROP — przepaść i kruche płyty | JAR — rzeczka na dnie, spróchniałe kładki |
| 5 | SALA POD KASKADĄ — strażnik | RUINY LEŚNICZÓWKI — mury, sadzawka, strażnik |

Legenda znaków i zasady autorskie: `DODAWANIE-TRESCI.md`.
Dźwięk domeny jest **syntezowany**: w piwnicy szum kaskady, w lesie dodatkowo
wiatr w koronach i ptaki (`amb:{wiatr,ptaki}` we wpisie domeny).

Pozostałe pięć domen **nadal się losuje** — do czasu, aż dostaną swoje mapy.
Opis niżej dotyczy właśnie ich.

Piętro losowane to **LABIRYNT komnat na siatce** (`siatka:[kolumny,rzędy]`) —
losowe drzewo korytarzy plus kilka pętli, więc wykorzystany jest cały prostokąt
mapy, a nie jeden korytarz przez środek. Postęp blokują **KLUCZE i KŁÓDKI**:
klucz podnosisz samym dotknięciem, a kłódka puszcza, gdy podejdziesz do niej
z właściwym kolorem. Klucz **zawsze** leży w części labiryntu osiągalnej PRZED
swoją kłódką — i najchętniej w bocznej odnodze, żeby było po co zwiedzać.
Kłódka, którą dałoby się **obejść** pętlą, jest po zbudowaniu planszy usuwana
razem ze swoim kluczem (`domZweryfikujZamki`) — udawana bramka wygląda jak
zepsuta gra. Przy losowaniu odpadało tak ponad **połowa** kłódek.

| Kolor | Kłódka |
|---|---|
| 🔑 ZŁOTY | kafel 48 |
| 🗝️ CZERWONY | kafel 49 |
| 🔐 NIEBIESKI | kafel 50 |

Na **ZAPADNI** część przepraw prowadzi WYŁĄCZNIE po kruchych płytach — kładka
zawala się pod stopami, ale odrasta po 7 s, więc nieudana próba kosztuje HP
i nerwy, nigdy przejścia.

**Co jest na piętrach:**

| Kafel | Co to | Jak to rozwalić |
|---|---|---|
| 🟫 skrzynia | sypie 🔩⚙️💎 i jedzeniem | zwykły **CIOS** |
| 🛢 beczka | detonuje jak bomba, robi łańcuch | cios albo wybuch |
| 🧱 pustak | – | **TYLKO BOMBA** (cios się odbija) |
| ⬛ filar | nic go nie ruszy | – |
| 🕳 przepaść | −12 % HP i cofnięcie na twardy grunt | wroga **wepchniętego** odrzutem zabija |
| ▨ krucha płyta | zawala się 0,65 s po wejściu, wraca po 7 s | – |
| 🏭 maszyna bombowa | co 14 s wypluwa bombę | – |

**Bomba:** podchodzisz do maszyny, `[E]` bierze bombę, **lont tyka od podniesienia**
(5,5 s). Niesiesz ją nad głową, bez sprintu i wolniej; `[E]` upuszcza w miejscu
(przyciąga do środka kafla). Wybuch to **okrąg**, który rani też Ciebie.

**Kalendarz:** każda domena stoi otworem w **dwa dni tygodnia**, w niedzielę
otwarte jest wszystko, doba skacze o **4:00 rano** czasu lokalnego.

| Dzień | Otwarte |
|---|---|
| PON · CZW | PIWNICA HEJTERÓW (Edek) · SMOCZA JAMA (Zenek) · WESELE W REMIZIE (Grażynka) |
| WT · PT | DZIKI LAS (Dych) · LODOWA GROTA (Jarek) |
| ŚR · SOB | ZATOPIONE MOLO (Bogdan) · POLE NAMIOTOWE (Julka) |
| NIEDZIELA | wszystko |

Każda domena daje **jeden unikalny surowiec**, wymagany przy wzniesieniach
przypisanej postaci (pierwszy próg to poz. 20, potem 40 i dalej). Nie ma go
w sklepach ani u bossów — tylko w skrzyni na końcu domeny i w jej kryształach.

**Skróty i komendy (konsola, F12):**

```js
DOM.mam = {zloty:1, czerwony:1, niebieski:1};   // wszystkie klucze w kieszeni
DOM.zamki.forEach(z=>{z.open=true; z.cells.forEach(c=>set(c[0],c[1],DOMAINS[DOM.cur].floor));});
domAlways = 1;              // wszystkie domeny otwarte, bez czekania na dzień
domOffset = 86400;          // przeskocz o dobę (2*86400 = pojutrze…)
domDayOpen('las');          // czy DZIKI LAS jest dziś czynny
fmtLeft(domNextOpen('las'));// ile do otwarcia
domOtwarteDzis();           // lista domen otwartych w tej dobie
S.dmats.szlif = 99;         // surowiec wzniesienia Edka
```

`domAlways` i `domOffset` żyją do odświeżenia strony i nie zapisują się do `wrpg`.


**Sterowanie (nowe):** `SHIFT` (trzymany) = SPRINT. Pomarańczowy pasek wytrzymałości
pokazuje się pod postacią; po wyczerpaniu jest krótka ZADYSZKA. Klawisz można zmienić
w menu Esc → STEROWANIE.

**Regeneracja:** podejście do dowolnego **przystanku PKS** leczy całą drużynę do pełna
(także padniętych) — zielone plusiki i podświetlenie pasków HP.

**Życzenia (v15):** panel `⌚` zamiast paczek. Dwa banery naraz — POSTAĆ i BROŃ —
z jedną promowaną postacią 5⭐ i jej sygnaturową bronią 5⭐. Waluta to **Złoty Rolex**
(150💎 = 1 życzenie). Baner stoi **14 dni (2 tygodnie)**, panel pokazuje dni i zegar
z tykającymi sekundami. Grafikę banera podmieniasz plikiem w `assets/banners/`
— szczegóły w `assets/banners/README.md`.

**Gwiazdki postaci (v15.3):** 5⭐ = Edek, Dych, Grażynka, Zenek, Julka (te stają
na banerach). 4⭐ = **Jarek Zegarek i Rybak Bogdan** — wchodzą z gwarancji
**co najwyżej co 15 życzeń**, która daje postać 4⭐ ALBO broń/artefakt 4⭐
(pół na pół). Dzięki temu ekipę da się zebrać bez trafiania 5⭐.

**Ruch na ukos (v15.3):** przy skosie sylwetka patrzy w bok (nie sztywno w górę),
ma przechył w stronę pędu, a bieg wzdłuż ściany nie zwalnia.

Plik do kopiowania „na przyszłość” — otwórz w edytorze i bierz stąd, czego trzeba.

## Skróty testowe w adresie (bez konsoli)

Do adresu gry dopisz `?test=<etap>`, np.:

```
https://dawidmoczulski.github.io/warchocki-rpg/?test=policja
```

Po wejściu zrób **Ctrl+F5**, na ekranie tytułowym pojawi się plakietka
„🧪 TRYB TESTOWY” — kliknij **KONTYNUUJ**.

| Etap | Gdzie stawia gracza |
|---|---|
| `?test=seria` | początek serii SIEMA ODJAZD — Kuba przy PKS-ie na trasie |
| `?test=stop` | Dych na złym zjeździe (minigra łapania stopa) |
| `?test=bateria` | pod stacją ładowania (minigra ładowania) |
| `?test=przyczepa` | przy Panu Mirku z kamperem (jazda przyczepą) |
| `?test=policja` | pod bramkami — finałowa obława policji |
| `?test=pole` | wszystko zrobione, gracz stoi na polu festiwalowym |
| `?test=klaunica` | TRASA NA POLAND ROCK, tuż przed bramą STREFY IMPREZY (pod polem namiotowym) — wejdź na arenę, żeby odpalić scenkę i walkę z KLAUNICĄ Z FESTIWALU |
| `?test=horda` | KRAKÓW, tuż przed bramą PASIEKI (lewy dolny róg) — wejdź, żeby obudzić UL: 4 fazy roju, potem KRÓLOWA PSZCZÓŁ z 3 atakami |
| `?test=pasieka` | KRAKÓW, tuż za kładką na Wiśle — stąd ścieżka prowadzi przez wieś pszczelarską do pasieki |
| `?test=jezioro` | CHODZIEŻ, początek serii „Pływamy z Dych Dzikim" — gadaj z Sąsiadem Mietkiem |
| `?test=plaza` | CHODZIEŻ, od razu na plaży nad Jeziorem Miejskim (dwa pierwsze zadania zrobione) |
| `?test=torpeda` | CHODZIEŻ, przy Ratowniku Zbyszku — minigra SZALONY TORPEDA gotowa do odpalenia |
| `?test=domena` | WARSZAWA, pod portalem PIWNICY HEJTERÓW — ekipa poz. 50, wszystkie domeny otwarte |
| `?test=wesele` | CHODZIEŻ, pod portalem WESELA W REMIZIE (domena Grażynki) |
| `?test=las` | CHODZIEŻ, pod portalem DZIKIEGO LASU — ręcznie rysowane plansze, wiatr i ptaki |
| `?test=domenaboss` | jak `domena`, ale poziom 10 każdej domeny — pełna obsada mini-bossów |
| `?test=reset` | kasuje zapis (start od zera) |

Skrót nadpisuje zapis raz i dokłada: Dycha do ekipy, poziom 25 postaciom, 500 💎.
Żeby powtórzyć dany fragment — po prostu wejdź na ten adres jeszcze raz.

## Gra lokalnie (z dysku)

```bash
cd "/home/dawid/DYSK/Gry AI/GRA_EDWARD_WARCHOCKI/web"
python3 -m http.server 8000
# → http://localhost:8000/?test=policja
```

Samo otwarcie `index.html` z dysku nie zadziała — audio ładuje się przez `fetch`.

## Ręczne grzebanie w zapisie (konsola przeglądarki, F12)

Chrome przy pierwszym wklejeniu do konsoli wymaga wpisania `allow pasting`.

```js
const s = JSON.parse(localStorage.getItem('wrpg'));   // podejrzyj zapis
s.dia = 9999;                                          // diamenty
s.rolex = 200;                                         // Złote Rolexy = życzenia
s.pity = 79;                                           // następne życzenie = gwarancja 5⭐
s.pity4 = 14;                                          // następne życzenie = gwarancja 4⭐
s.guar = 1;                                            // następna 5⭐ NA PEWNO z baneru (wygrane 50/50)
s.guarW = 1;                                           // następna 5⭐ broń NA PEWNO sygnaturowa
s.quests.policja = 0;                                  // 0 = nieodkryty, 1 = w toku, 2 = zrobiony
localStorage.setItem('wrpg', JSON.stringify(s)); location.reload();
```

Klucze zapisu: `quests`, `col` (znajdźki), `mile` (nagrane miejsca), `dych`, `party`,
`chars` (poziomy), `dia`, `rolex`, `pity`/`pityW` (gwarancje 5⭐),
`pity4`/`pity4W` (gwarancje 4⭐), `guar`/`guarW` (50/50 i ścieżka marzeń), `subs`,
`region`, `px`/`py`, `domLvl`, `bossLvl`, `dmats` (unikalne surowce domen).

**Stawki życzeń** (jak w Genshinie, tylko gwarancja ściągnięta na 80.):
baza 0,6% na postać (broń 0,7%), miękka gwarancja od 65. życzenia (broń: 63.),
twarda na 80. Trafiona 5⭐ przechodzi przez 50/50 — przegrana daje innego
ziomala z ekipy, ale zapala `guar`, więc następna jest pewna. W długim biegu
**2 z 3 piątek to postać z baneru**, średnio **~85 życzeń** na promowaną.

**Przeskok baneru bez czekania dwóch tygodni** (konsola, F12):

```js
banOffset = 14*86400;      // +1 baner (kolejny raz: 28*86400, 42*86400, ...)
bannerChar();              // kto jest teraz promowany
bannerLeft();              // ile sekund do zmiany
BANNER_ORDER;              // pełna kolejka 5⭐: dych, edek, grazynka, zenek, julka
                           // (Jarek i Bogdan to 4⭐ — lecą z gwarancji, nie z baneru)
```

`banOffset` żyje tylko do odświeżenia strony i nie zapisuje się do `wrpg`.

## Kolory — jak zmienić motyw

Cała paleta interfejsu siedzi w jednym bloku `:root` na górze `css/style.css`.
**Zmiana motywu to edycja tych ~40 wartości i nic więcej** — reguły CSS nie mają
zahardkodowanych kolorów, a `js/game.js` czyta te same tokeny do obiektu `UI`.

Trzy pułapki, w które łatwo wdepnąć:

1. **Tokeny czytane przez JS muszą być dosłownym hexem.** `var()` i `color-mix()`
   wracają z `getPropertyValue` nierozwinięte, a `canvas` takiego koloru nie
   sparsuje — **nie rzuci błędu**, tylko po cichu narysuje poprzednim kolorem.
   Most `UI` sprawdza to regexem i krzyczy w konsoli.
2. **Nigdy nie rób globalnego find-replace hexa w `game.js`.** Samo `#f5c542`
   występuje tam ~200 razy, z czego interfejs to ~27 — reszta to łańcuch Edka,
   Rolex, iskry i wrogowie. Kolory żywiołów (`ELEMENTS`) i świata (`TCOL`,
   `MAPCOL`) mają nad sobą komentarze-bariery.
3. **Akcent trzymaj z dala od 165–230°** na kole barw — tam siedzą żywioły
   CZAS (turkus) i BAŁTYK (granat). Inaczej orby Jarka i Bogdana zleją się z UI.

### Porównywarka zrzutów

`scratchpad/shots.js` robi 47 zrzutów (świat, HUD, orby każdej postaci osobno,
wszystkie panele, stany hover) i porównuje je piksel po pikselu z bazą:

```bash
node shots.js base        # zrzuty odniesienia
node shots.js po-zmianie  # zrzuty + raport różnic
node shots.js po --only=hud   # tylko sceny z „hud" w nazwie
```

Determinizm wymaga czterech rzeczy naraz: zamrożenia pętli (`requestAnimationFrame`
podmienione na pustą funkcję), wyłączenia animacji CSS wstrzykniętym arkuszem,
wyczyszczenia świata (auta, przechodnie, cząsteczki) i **wyłączenia cache
przeglądarki** — bez tego strona potrafi wciągnąć stary `game.js` i cały pomiar
kłamie.

## Testy automatyczne — katalog `testy/`

**Testy mieszkają w REPO.** Wcześniej pisało się je w katalogu tymczasowym sesji
i przy budowie DOMEN 3.0 wyłapały mnóstwo błędów — po czym zniknęły razem z tym
katalogiem, a `TESTOWANIE.md` przez jakiś czas wymieniało komendy do plików,
których już nie było. Cokolwiek ma przeżyć do jutra, ląduje w `testy/`.

```bash
./testy/sprawdz.sh test_menu.js       # menu główne: zakładki, zapis, sterowanie, wejście do gry
./testy/test_dzwiek.sh                # czy ustawienia dźwięku MAJĄ CO ściszać (własny serwer HTTP)
./testy/sprawdz.sh test_brama.js      # brama pola: widoczność, przejezdność, patrol
./testy/sprawdz.sh test_czcionki.js   # polskie znaki: ogonki, kreski, spójność wysokości
node testy/test_mapy.js               # ręczne plansze domen: format i zdrowy rozsądek
```

**Prawdziwa mysz.** Syntetyczne zdarzenia nie ruszą natywnego suwaka — Chrome
reaguje tylko na zdarzenia zaufane. Żeby odtworzyć przeciąganie, trzeba wstrzyknąć
je przez CDP (`--remote-debugging-port` + `Input.dispatchMouseEvent`). Tak
właśnie potwierdziłem usterkę suwaków: `value` zostawało na 100. W testach
wystarcza jednak tańszy odpowiednik — wysłać `pointerdown` z `cancelable:true`
i sprawdzić `defaultPrevented`; to łapie dokładnie tę klasę błędu bez CDP.

```bash
```

`sprawdz.sh` uruchamia test **w prawdziwej grze** — wstrzykuje go do kopii
`index.html`, odpala bezgłowego Chrome i wyciąga wynik z DOM-u. Nie ma atrapy
canvasu ani audio, więc nie ma też ryzyka, że atrapa rozjedzie się z grą.
W teście masz do dyspozycji `T(nazwa, fn)`, `ok(warunek, komunikat)` i
`eq(masz, ma_byc, komunikat)` oraz **wszystkie globalne gry** (`S`, `at`,
`SOLID`, `setRegion`, `NPCS`, `talkTo`, `cx`…). Kod ruszą po `load`, więc
zaczynaj od `bootWorld()`.

`test_mapy.js` idzie czystym Node, bo `js/mapy.js` to sam opis plansz —
nie potrzebuje ani canvasu, ani reszty gry.

**Pułapka: menu leży WEWNĄTRZ `#stage`.** `#title` jest `position:fixed`, więc
wygląda na osobną warstwę, ale w drzewie DOM to dziecko sceny gry — zdarzenia
z menu **bąbelkują do handlerów sterowania**. Handler `pointerdown` na `#stage`
miał listę wyjątków („to nie jest gra: `button`, `.panel`, `#dlg`, `.ov`") i menu
do niej nie trafiło: przy CIOSIE przypisanym do myszy wołał `preventDefault()`
na wciśnięciu w suwak głośności i zabijał natywne przeciąganie. Przyciski
działały, suwaki nie. Warunek jest teraz **odwrócony** — liczy się tylko to, co
pada na płótno (`if(e.target!==cv)return;`) — więc nowy element interfejsu nie
wymaga już dopisywania kolejnego wyjątku.

**Czego testy w `sprawdz.sh` NIE złapią:** dźwięku. Idą przez `file://`, więc
`fetch` klipów pada i nic nigdy nie gra — suwak głośności przechodzi każdy test
na DOM-ie, choć dla gracza jest martwy. Dokładnie tak przeszła usterka zgłoszona
po v24: suwaki poprawnie ustawiały zmienne i zapisywały ustawienia, tylko muzyka
menu w ogóle nie ruszała. Od tego jest `test_dzwiek.sh` — stawia serwer HTTP
i odblokowuje autoplay, żeby sprawdzić, czy po wejściu na zakładkę „Dźwięk"
cokolwiek naprawdę gra.

**Czego nie złapią też:** jakości obrazu. Czy brama wygląda jak brama, czy
plansza się nie sypie, czy tekst nie wychodzi za ramkę — to się sprawdza
ZRZUTAMI (patrz niżej). Test powie tylko, że kafel 72 stoi w (38,32).

### Czego pilnuje `test_czcionki.js` (i dlaczego akurat tego)

Press Start 2P **miało** komplet polskich glifów — `document.fonts.check`
zwracało `true`. A mimo to „PRZEPAŚĆ" wyglądało jak „PRZEPAść", bo akcenty
i ogonki były wciśnięte w pudełko wersalika: Ą nie miało podrzutu pod linię
pisma, a kreska nad Ś nie wychodziła ponad wysokość S. **Obecność glifu niczego
nie dowodzi — trzeba mierzyć, dokąd ten glif sięga.** Test porównuje więc każdą
polską literę z jej odpowiednikiem bez znaku diakrytycznego.

Drugi próg wziął się z odrzuconych kandydatów na krój:

| Krój | Co było nie tak | Które sprawdzenie to łapie |
|---|---|---|
| Press Start 2P | ogonki i kreski wciśnięte w wersalik | podrzut Ą, wysokość Ś vs S |
| Silkscreen | minuskuły to kapitaliki, ale „ł" i „ć" są prawdziwymi małymi literami — „Naładować" wychodzi jako „NAłADOWAć" | równa wysokość ł vs l, ą vs a |
| Pixelify Sans | polszczyzna bez zarzutu, ale „5" nie do odróżnienia od „S" — „KRYT 55%" czyta się „KRYT SS%" | **żadne — to widać tylko okiem, na zrzucie z cyframi** |

Morał: krój sprawdza się na tekście **mieszanym** i na **cyfrach**, nie na samych
wersalikach. Sama próbka „ŻÓŁĆ GĘŚLĄ JAŹŃ" przepuściła dwa złe kroje z trzech.

Co te testy faktycznie wyłapały przy budowie DOMEN 3.0:

- piętro bez walki (PRZEDSIONEK) nigdy się nie kończyło — schody się nie
  odblokowywały i gracz zostawał na dole **na zawsze**;
- maszyny bombowe (kafel SOLID) lądowały na spawnie, na schodach i na środkach
  komnat — start w ścianie i nieosiągalne wyjście;
- surowce i kryształy rodziły się na wysepkach odciętych przepaścią;
- droga do ostatniej komnaty potrafiła prowadzić wyłącznie przez kruchą płytę,
  która zawala się pod stopami;
- wyrównanie dla starych zapisów nigdy się nie naliczało, bo `DEFAULT_SAVE`
  dokłada `dmats` przy każdym wczytaniu (warunek trzeba sprawdzać na
  **wczytanym** obiekcie, nie na scalonym);
- po wprowadzeniu labiryntu: kładka nad przepaścią kładła się WZDŁUŻ przecięcia
  zamiast w poprzek (kierunek korytarza zgadywany z położenia komnat zamiast
  odczytany z mapy), dwie kładki obok siebie rozjeżdżały się o jeden rząd,
  BFS siatki bezpieczeństwa startował z `rooms[0]` zamiast z komnaty wejściowej,
  a kłódka potrafiła odciąć komnatę z kluczem **do samej siebie**;
- kłódka na dziesięć kafli: promień otwierania liczony od jej środka sprawiał,
  że stojąc przy jej końcu nie dało się jej otworzyć (teraz liczymy do
  NAJBLIŻSZEGO kafla bariery);
- **ponad połowa (52 %) losowanych kłódek dawała się obejść** pętlą labiryntu —
  zamknięta, a wyjście i tak osiągalne dookoła;
- przy ręcznych mapach: znak `G` (głaz) wpadał w zakres `A`–`H` i za każdą skałą
  robiła się komnata-widmo w litej ścianie, a BFS kontrolny traktował kłódkę jak
  ścianę **nawet otwartą**, przez co wszystko za nią zgłaszało się jako
  nieosiągalne;
- przy DZIKIM LESIE (wyłapane okiem na zrzutach, nie przez test):
  hasz rozsypujący detale `(x*7 + y*13) % 7` **nie zależy od `x`** (7x mod 7 = 0),
  więc mech kładł się całymi rzędami przez pół planszy — teraz idzie przez xorshift;
  stare kafle świata (staw, pieniek, ognisko) malowały pod sobą `baseCol()`, czyli
  **trawę regionu**, i przynosiły zielony kwadrat w środek strumienia — od tego jest
  `podklad()`, który w domenie kładzie JEJ podłogę;
  wnęka z czerwonym kluczem dotykała rogiem półki ze schodami i całą kłódkę dawało
  się obejść bokiem (skrypt autorski to złapał, zanim mapa trafiła do gry);
  kładki nad jarem kładzione PRZED dekoracjami — rozsypany świerk siadał dokładnie
  na zejściu z kładki i odcinał daleki brzeg.

### Podgląd sylwetki bez odpalania gry

```bash
node podglad.py     # wycina rysowanie postaci z game.js i robi stronę-podgląd
```

### Zrzut z prawdziwej gry

`testy/scena.sh` dokleja do kopii `index.html` skrypt ustawiający scenę, rysuje
**jedną klatkę synchronicznie** (czyli zanim poleci `load`) i zamraża pętlę —
dzięki temu `--screenshot` łapie gotowy obraz i nie trzeba walczyć z `rAF`:

```bash
./testy/scena.sh krata 'domAlways=1;setRegion("wawa");enterDomain("piwnica");domLoadFloor(1);'
./testy/scena.sh brama 'S.quests={dych:2,graty:2,stop1:2,bateria:2,stop2:2,przyczepa:2,policja:1};bootWorld();setRegion("trasa");P.x=608;P.y=488;camX=Math.max(0,P.x-W/2);camY=Math.max(0,P.y-H/2+40);'
```

Flatpakowy Chrome **nie zapisze do `/tmp`** — zrzut leci do katalogu gry
i dopiero potem jest przenoszony.

**Pułapka, która kosztowała jeden fałszywy alarm:** pod `--virtual-time-budget`
animacje CSS **nie dobiegają końca**. Element z `animation: … both` zastyga
w klatce startowej — menu główne wyszło na zrzucie przezroczyste, a monitor
po prawej w ogóle się nie pojawił, choć w przeglądarce działał bez zarzutu.
Dlatego `scena.sh` podaje `--force-prefers-reduced-motion`; gra honoruje to
ustawienie i rysuje stan końcowy. Robiąc zrzut ręcznie, dodaj tę flagę.

## Wypchnięcie zmian na żywo

```bash
cd "/home/dawid/DYSK/Gry AI/GRA_EDWARD_WARCHOCKI/web"
git add -A && git commit -m "opis zmiany" && git push
# GitHub Pages odświeża się po ~1 minucie
```

## `?test=liri` — Karmazynowa Liri

Liri w drużynie na poz. 90 (C6, talenty 10) z Ciekłą Kosą w ręce, ustawiona jako
aktywna postać, start w Warszawie pod PIWNICĄ HEJTERÓW. Do sprawdzania jej
umiejętności [E]/[Q], poświaty w ruchu i sylwetki.

    http://localhost:8000/?test=liri
