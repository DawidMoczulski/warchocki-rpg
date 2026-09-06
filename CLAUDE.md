# WARCHOCKI RPG — mapa dla następnej sesji

Stan na 05.09.2026, commit `c1cec96`. Ten plik ma jeden cel: żeby nie odkrywać
drugi raz rzeczy, które już raz kosztowały pół dnia. Wizja gry i teksty Edka
siedzą w `../CLAUDE.md` — tamten plik jest od TEGO, CO robimy, ten od TEGO, JAK.

## Gdzie co stoi

**Kanonem jest ten katalog (`web/`)** — i tylko on. To repo gitowe.
`../warchocki-rpg.html` i `*.backup-v*.html` w katalogu wyżej to nieaktualne
zabytki, nie tykać.

| | |
|---|---|
| na żywo | https://dawidmoczulski.github.io/warchocki-rpg/ |
| repo | `DawidMoczulski/warchocki-rpg`, gałąź `main` |
| **deploy** | **`git push` — nic więcej.** Pages mieli ~40–60 s, dwa pierwsze `curl` po pushu dają 404 i to jest normalne |
| test lokalny | `python3 -m http.server` — przez `file://` audio nie wstanie (fetch) |

```
web/
  index.html        szkielet + menu główne + wszystkie panele (325 linii)
  css/style.css     paleta w :root, style UI (760)
  js/game.js        cała gra (12 900) — patrz „Jak się poruszać po game.js”
  js/mapy.js        RĘCZNIE rysowane plansze domen (376) — ładowany PRZED game.js
  assets/audio/     158 klipów mp3 (33 MB): głosy Edka i Dycha + muzyka
  assets/fonts/     Jersey 25 + Space Grotesk (woff2, latin + latin-ext)
  testy/            testy i narzędzia — patrz TESTOWANIE.md
```

## Jak się poruszać po `game.js`

12 900 linii w jednym pliku, ale poukładanych. **Nie czytaj od góry — grepuj po
kotwicach.** Numery linii się przesuwają, nazwy nie:

- `const CHARS=` postacie · `const QUESTS=` zadania · `const REGIONS=` regiony
- `const DOMAINS=` domeny · `const BOSSES=` bossowie · `const FOE_TYPES=` wrogowie
- `const TILES=` rysunki kafli · `const NPCS=` postacie niezależne · `const WEAPONS=` bronie
- sekcje mają banery w komentarzach: `grep -n "^/\* -\+ [A-ZŻŁĄ]" js/game.js`

**Rejestry treści = jeden wpis, nie łatka w pięciu miejscach.** Nowa postać,
kafel, wróg czy boss to dopisanie obiektu do właściwego rejestru. Jeśli łapiesz
się na dopisywaniu `if (id==='...')` w kilku funkcjach — robisz to źle, rejestr
już istnieje.

## Twarde zasady

**Paleta.** `:root` w `css/style.css` to JEDYNE źródło prawdy (motyw
„SERWEROWNIA": chłodny błękit + fioletowa poświata). `--acc` jest **BŁĘKITNY**
(`#6fc9ff`). **Złoto (`--currency`) należy wyłącznie do waluty i 5⭐** — nie
używać go jako ogólnego akcentu. JS czyta te same tokeny przez `getComputedStyle`
do obiektu `UI`. Uwaga: `cx.fillStyle` nie rzuca błędu przy złym kolorze,
literówka po prostu znika z obrazu.

**Czcionki.** Dwie role, obie w `:root`: `--font-px` (Jersey 25 — nagłówki, HUD,
przyciski, canvas) i `--font-ui` (Space Grotesk — dialogi i opisy).
Kegle są zostawione w spokoju, bo krój skaluje `size-adjust:168%` w `@font-face`.
**Zmieniając krój, sprawdź tekst MIESZANY i CYFRY**, nie same wersaliki:
Silkscreen renderuje „Naładować" jako „NAłADOWAć", a Pixelify Sans ma „5"
nie do odróżnienia od „S". Pilnuje tego `test_czcionki.js`.

**Rozdzielczość.** `RES` (3 albo 4) ustala się **RAZ przy starcie** — pieczony
teren trzyma kawałki w tej skali i blituje 1:1, więc zmiana w locie unieważnia
cały cache. Logika gry zawsze chodzi w 480×300.

**Kafle.** Numer kafla = wpis w `TILES` + flagi w `SOLIDF`/`PITF` + kolor w
`TCOL` (podkład) i `MAPCOL` (minimapa). Pominięcie któregokolwiek daje kafel,
który wygląda dobrze, a zachowuje się dziwnie. Kafel rysujący coś większego
niż 16×16 musi ciąć rysunek NA KAFLE — teren jest pieczony na kawałki
i malowany po kolei, więc sąsiad zamaluje to, co wystaje.

**Zdarzenia interfejsu.** `#title` (menu główne) leży **wewnątrz `#stage`** —
jest `position:fixed`, więc wygląda na osobną warstwę, ale zdarzenia bąbelkują
do handlerów sterowania. Handler `pointerdown` na `#stage` przyjmuje **tylko to,
co pada na płótno** (`if(e.target!==cv)return;`). Nie wracać do listy wyjątków
„to nie jest gra" — właśnie na niej przejechało menu i suwaki głośności umarły.

**Umiejętności i super-hity.** Wszystko, co odróżnia postacie w walce, siedzi
w JEJ wpisie w `CHARS`: `skill()`, `burst.plan` (co wybucha), `burst.pose`
(sylwetka w przerywniku), `burst.txt` (okrzyk) i `ico` (rysowane ikony orbów
[E]/[Q]). Wcześniej stała tu drabinka `if(dych)…else`, gdzie „else" znaczyło
EDEK — każda nowa postać po cichu dziedziczyła jego choreografię, jego okrzyk
i jego obrażenia. Pilnuje tego `test_liri.js`.

**Zapis.** `DEFAULT_SAVE` dokłada brakujące pola przy KAŻDYM wczytaniu, więc
migracje sprawdzaj na obiekcie **wczytanym**, nie na scalonym — inaczej warunek
nigdy się nie odpali.

## Pułapki, które już kosztowały czas

- **`pkill -f` w Bashu zabija własny shell.** Zabijaj po PID.
- **`node --check` NIE wykryje brakującej stałej ani literówki w nazwie
  funkcji** — to poprawna składnia, wyjątek leci dopiero przy użyciu.
  Zmieniałeś umiejętność? Odpal `test_liri.js`, on je faktycznie uruchamia.
- Zrzuty przez własny skrypt: `--virtual-time-budget` **nie napędza pętli
  `requestAnimationFrame` tak jak `setTimeout`**. Jeśli sterujesz grą ręcznie,
  najpierw zamroź RAF, potem wołaj `updateWorld` w pętli, a `frame()` na końcu
  raz — inaczej klatki nakładają się i zrzut kłamie. Dolny HUD (paski HP, orby)
  i tak potrafi się w takim zrzucie nie pojawić: to ograniczenie harnessu,
  nie usterka gry.
- Zrzuty: pod `--virtual-time-budget` **animacje CSS nie dobiegają końca** —
  element z `animation: … both` zastyga w klatce startowej i zrzut kłamie.
  Dawać `--force-prefers-reduced-motion` (`testy/scena.sh` już ma).
- Flatpakowy Chrome **nie zapisze do `/tmp`** — zrzuty lecą do katalogu gry
  (`_*.png` są w `.gitignore`).
- **Syntetyczne zdarzenia nie ruszą `input[type=range]`** — Chrome reaguje tylko
  na zaufane. Prawdziwą mysz wstrzykuje się przez CDP
  (`--remote-debugging-port` + `Input.dispatchMouseEvent`).
- Testy przez `file://` **nie sprawdzą dźwięku** (fetch klipów pada), więc suwak
  głośności przechodzi każdy test na DOM-ie, będąc dla gracza martwy.
- Znak `G`/`T` w ręcznych mapach wpada w zakres komnat `A`–`H` — stąd osobna
  stała `MAPA_KOMNATY`.
- Kłódki domen (kafle 48–50) są `SOLID`, więc BFS kontrolny musi je przepuszczać
  jawnie, inaczej wszystko za nimi zgłasza się jako nieosiągalne.

## Testy i narzędzia

Pełny opis w `TESTOWANIE.md` (tam też skróty `?test=…` i komendy konsoli).

```bash
./testy/sprawdz.sh test_menu.js       # menu: zakładki, sterowanie, zapis, zdarzenia
./testy/sprawdz.sh test_brama.js      # brama Poland Rocka: widoczność i przejezdność
./testy/sprawdz.sh test_czcionki.js   # polskie znaki: ogonki, kreski, spójność
./testy/sprawdz.sh test_liri.js       # umiejętności KAŻDEJ postaci: [E], [Q], ikony orbów
./testy/test_dzwiek.sh                # czy dźwięk MA CO ściszać (własny serwer HTTP)
node testy/test_mapy.js               # ręczne plansze: format i zdrowy rozsądek
./testy/scena.sh <nazwa> '<js>'       # zrzut jednej klatki gry
```

`sprawdz.sh` uruchamia test **w prawdziwej grze** w bezgłowym Chrome — bez atrapy
canvasu, więc atrapa nie może się rozjechać z rzeczywistością. W teście masz
`T/ok/eq` i wszystkie globalne gry; zacznij od `bootWorld()`.

**Czego testy NIE złapią: jakości obrazu.** Czy brama wygląda jak brama, czy
plansza się nie sypie, czy tekst nie wychodzi za ramkę — to się sprawdza
ZRZUTAMI. Test powie tylko, że kafel 72 stoi w (38,32).

**Testy trzymamy w repo.** Poprzedni komplet mieszkał w katalogu tymczasowym
sesji i wyparował razem z nim, a dokumentacja przez tydzień wskazywała na pliki,
których nie było.

## Aktualny stan treści

8 postaci · 8 żywiołów · 24 zadania · 6 regionów + arena · 7 domen · 8 bossów ·
45 typów wrogów · 73 kafle · 37 NPC · 19 broni · 51 ubrań · 158 klipów audio.

- **Regiony:** Warszawa, Chodzież, Polskie Morze, Kraków, Tatry, Trasa na Poland Rock
- **Postacie:** Edek, Dych Dziki, Grażynka 3000, Jarek Zegarek, Zenek Spawacz, Julka z Tindera,
  Rybak Bogdan, Karmazynowa Liri (żywioł OSTRZE, kosa; baner po Edku)
- **Domeny:** Piwnica Hejterów, Dziki Las (obie z RĘCZNIE rysowanymi planszami po 5 pięter),
  Zatopione Molo, Smocza Jama, Lodowa Grota, Wesele w Remizie, Pole Namiotowe.
  Pozostałe pięć wciąż losuje piętra — do czasu, aż dostaną swoje mapy.
- **Bossowie:** Król Dzików, Mega Dres, Kraken, Horda Pszczół, Smok, Pan Laweta 3000,
  Klaunica, Yeti
- **Menu główne:** pełnoekranowe, koncept „plan zdjęciowy Edka" — Edek w zimnym
  świetle po lewej, monitor z zakładkami po prawej (Zagraj / Jak grać / Sterowanie / Dźwięk)

## Jak pracować

1. Zmiana → `node --check js/game.js` → właściwy test z `testy/` → **zrzut**, jeśli
   zmiana jest widoczna dla gracza.
2. Commit po polsku, w stylu poprzednich: tytuł mówi CO, treść mówi DLACZEGO
   i czego świadomie nie zrobiono. Stopka `Co-Authored-By: Claude Opus 5`.
3. `git push` = deploy. Potwierdź `curl`em, że nowa wersja faktycznie leci.
4. Dawid testuje na żywo i zgłasza uwagi. **Przy powtórnym zgłoszeniu tego samego
   objawu nie dokładaj kolejnej hipotezy — najpierw odtwórz usterkę u siebie.**
   Raz poszedłem na oślep i naprawiłem nie to, co trzeba.
