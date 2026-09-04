# 🐗 WARCHOCKI RPG — Warchocki Impact

Przygodowa gra akcji o **Edwardzie Warchockim** — pierwszym polskim robocie-influencerze.
Fanowska parodia z prawdziwymi klipami głosowymi i autorską mechaniką w stylu action-RPG.

**▶ Graj w przeglądarce** — desktop i mobile (dotyk), bez instalacji.

## Co w grze

- **7 grywalnych postaci** z żywiołami i unikalnymi supermocami (Edek, Dych Dziki, Grażynka 3000, Jarek Zegarek, Zenek Spawacz, Julka z Tindera, Rybak Bogdan)
- **21 reakcji żywiołów** — łącz aury jak w prawdziwym action-RPG
- **6 regionów Polski**: Warszawa, Chodzież, Polskie Morze, Kraków, Tatry, Trasa na Poland Rocka
- **WESELE W REMIZIE** — domena Grażynki 3000: parkiet, beczki i DJ, który nie odpuszcza
- **Domeny z ręcznie rysowanymi planszami** — poziomy, które wyglądają tak samo przy każdym
  wejściu i są po to, żeby je poznać:
  **PIWNICA HEJTERÓW** (kaskada z pękniętego pionu i strumień przez całą halę, kotłownia pełna
  betonu, biblioteka ze starymi regałami, zawalony strop, skarbiec pod ścianą wody) oraz
  **DZIKI LAS** (skraj lasu ze strumieniem, wyrąb z obozowiskiem drwali i skrzynkami dynamitu,
  stary bór iglasty sypiący szyszkami, jar z rzeczką na dnie i przeprawami po spróchniałych
  kładkach, na końcu ruiny leśniczówki). Wszystko z dźwiękiem: szum wodospadu, wiatr w koronach
  i ptaki — syntezowane w locie, bez jednego pliku audio
- **7 domen (Genshin × Bomberman)** — 5 pięter pod rząd na 10–15 minut: rozwalasz skrzynie i beczki,
  betonowe pustaki bierzesz bombą przyniesioną z maszyny (lont tyka od podniesienia!), a podłoga
  potrafi zawalić się pod stopami. Każda otwarta **dwa dni w tygodniu**, w niedzielę wszystkie —
  i każda daje **jeden unikalny surowiec**, bez którego nie ma wzniesienia przypisanej postaci
- **6 bossów regionalnych** z arenami i fazami szału (z PANEM LAWETĄ 3000 włącznie)
- **Życzenia** — dwa banery naraz (postać + jej sygnaturowa broń 5★), waluta: Złote Rolexy (150💎), gwarancja na 90. życzeniu
- **Kanał Edka** — nagrywaj filmiki, zbieraj wyświetlenia i subskrypcje
- **Seria „SIEMA ODJAZD"** — 5 questów pod rząd: pakujemy graty, łapiemy stopa, ładujemy baterie na stacji,
  łapiemy kampera z przyczepą i jedziemy na pole Poland Rocka (3 nowe minigry)
- Szafa, ekwipunek, jedzenie z buffami, questy, minigry rytmiczne

## Uwaga dla utrzymania

Pliki `../warchocki-rpg.backup-v*.html` to **archiwalne monolity** z wklejoną
starą kopią CSS i JS. Nie są synchronizowane z katalogiem `web/` i nie należy
robić w nich „tych samych" zmian — wyprodukuje to trzecią, rozjechaną paletę.

Paleta interfejsu żyje wyłącznie w `:root` w `css/style.css`; szczegóły
i pułapki opisane w `TESTOWANIE.md`.

## Sterowanie

| Akcja | Klawisz |
|---|---|
| Ruch | WASD / strzałki / dotyk |
| Interakcja | E |
| Cios | Spacja / X / 👊 |
| Supermoc | Z / ⚡ |
| Zmiana postaci | 1-2-3 / C |
| Szybka przekąska | Q |
| Pauza | P |
| Pełny ekran | F / ⛶ |

🎧 **Graj z dźwiękiem** — Edek gada swoim prawdziwym głosem!

## Uruchomienie lokalne

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

(Zwykłe otwarcie `index.html` z dysku nie zadziała — audio ładuje się przez fetch.)

---

*Fanowska parodia. Głos i muzyka: prawdziwe fragmenty z przygód Edka.*
