# 🧪 Testowanie gry — skróty i przydatne komendy

**Sterowanie (nowe):** `SHIFT` (trzymany) = SPRINT. Pomarańczowy pasek wytrzymałości
pokazuje się pod postacią; po wyczerpaniu jest krótka ZADYSZKA. Klawisz można zmienić
w menu Esc → STEROWANIE.

**Regeneracja:** podejście do dowolnego **przystanku PKS** leczy całą drużynę do pełna
(także padniętych) — zielone plusiki i podświetlenie pasków HP.

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
| `?test=klaunica` | POLSKIE MORZE, tuż przed bramą STREFY IMPREZY — wejdź na arenę, żeby odpalić scenkę i walkę z KLAUNICĄ Z FESTIWALU |
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
s.quests.policja = 0;                                  // 0 = nieodkryty, 1 = w toku, 2 = zrobiony
localStorage.setItem('wrpg', JSON.stringify(s)); location.reload();
```

Klucze zapisu: `quests`, `col` (znajdźki), `mile` (nagrane miejsca), `dych`, `party`,
`chars` (poziomy), `dia`, `subs`, `region`, `px`/`py`, `domLvl`, `bossLvl`.

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
