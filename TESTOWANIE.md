# 🧪 Testowanie gry — skróty i przydatne komendy

**Sterowanie (nowe):** `SHIFT` (trzymany) = SPRINT. Pomarańczowy pasek wytrzymałości
pokazuje się pod postacią; po wyczerpaniu jest krótka ZADYSZKA. Klawisz można zmienić
w menu Esc → STEROWANIE.

**Regeneracja:** podejście do dowolnego **przystanku PKS** leczy całą drużynę do pełna
(także padniętych) — zielone plusiki i podświetlenie pasków HP.

**Życzenia (v15):** panel `⌚` zamiast paczek. Dwa banery naraz — POSTAĆ i BROŃ —
z jedną promowaną postacią i jej sygnaturową bronią 5⭐. Waluta to **Złoty Rolex**
(150💎 = 1 życzenie). Baner stoi **14 dni (2 tygodnie)**, panel pokazuje dni i zegar
z tykającymi sekundami. Grafikę banera podmieniasz plikiem w `assets/banners/`
— szczegóły w `assets/banners/README.md`.

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
s.pity = 89;                                           // następne życzenie = gwarancja
s.quests.policja = 0;                                  // 0 = nieodkryty, 1 = w toku, 2 = zrobiony
localStorage.setItem('wrpg', JSON.stringify(s)); location.reload();
```

Klucze zapisu: `quests`, `col` (znajdźki), `mile` (nagrane miejsca), `dych`, `party`,
`chars` (poziomy), `dia`, `rolex`, `pity`/`pityW` (gwarancje banerów), `subs`,
`region`, `px`/`py`, `domLvl`, `bossLvl`.

**Przeskok baneru bez czekania dwóch tygodni** (konsola, F12):

```js
banOffset = 14*86400;      // +1 baner (kolejny raz: 28*86400, 42*86400, ...)
bannerChar();              // kto jest teraz promowany
bannerLeft();              // ile sekund do zmiany
BANNER_ORDER;              // pełna kolejka: edek, dych, grazynka, jarek, zenek, julka, bogdan
```

`banOffset` żyje tylko do odświeżenia strony i nie zapisuje się do `wrpg`.

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
