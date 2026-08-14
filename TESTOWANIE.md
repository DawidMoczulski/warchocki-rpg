# 🧪 Testowanie gry — skróty i przydatne komendy

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
`region`, `px`/`py`, `domLvl`, `bossLvl`.

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

## Testy automatyczne (bez przeglądarki)

Harness w Node uruchamia `game.js` w `vm` z atrapą DOM/canvas i sprawdza m.in.
przejezdność map, przebieg minigier i całą obławę policji:

```bash
node /tmp/claude-1000/.../scratchpad/test_trasa.js   # ścieżkę podaje Claude przy uruchomieniu
```

## Wypchnięcie zmian na żywo

```bash
cd "/home/dawid/DYSK/Gry AI/GRA_EDWARD_WARCHOCKI/web"
git add -A && git commit -m "opis zmiany" && git push
# GitHub Pages odświeża się po ~1 minucie
```
