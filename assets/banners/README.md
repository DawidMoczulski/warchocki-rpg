# 🎴 Grafiki banerów

Tu wrzucasz obrazki, które gra pokazuje na banerze życzeń. **Nic nie trzeba
zmieniać w kodzie** — wystarczy plik o właściwej nazwie, gra sama go podłapie.
Jak pliku nie ma, rysuje się zapasowy splash (postać w pikselach + promienie
w kolorze żywiołu).

## Nazwy plików

Gra próbuje najpierw `.svg`, potem `.png` — wystarczy jeden z nich.

| Plik | Gdzie się pokazuje |
|---|---|
| `dych.svg` ✅ | baner postaci — Dych Dziki (jest w repo) |
| `edek.svg` / `edek.png` | baner postaci — Edward Warchocki |
| `grazynka.*` | baner postaci — Grażynka 3000 |
| `jarek.*` | baner postaci — Jarek Zegarek |
| `zenek.*` | baner postaci — Zenek Spawacz |
| `julka.*` | baner postaci — Julka z Tindera |
| `bogdan.*` | baner postaci — Rybak Bogdan |

Baner broni bierze plik z sufiksem `_w`, np. `dych_w.svg` (Butelka Dzikiego).
Jak takiego pliku nie ma, baner broni rysuje sobie zapasową grafikę.

## Format

- **SVG** (polecany — skaluje się bez utraty ostrości i może być animowany)
  albo **PNG**.
- Proporcje **680 × 400** (17:10). Inne też wejdą — obrazek jest wpisywany
  `object-fit: contain`, więc nic nie zostanie ucięte, ale po bokach zostaną
  ciemne pasy.
- Lewy górny róg zasłania plakietka „🎴 PROMOWANA" / „🗡 SYGNATURA" —
  nie wsadzaj tam nic ważnego.

## Animacje w SVG

Działają, ale **`<style>` musi być w środku `<svg>`**, nie przed nim — plik jest
ładowany przez `<img>`, więc CSS spoza dokumentu SVG nie zadziała. Skrypty JS
w SVG są ignorowane, same animacje CSS/SMIL działają. Tak jest zrobiony `dych.svg`
(kołysanie, machanie ręką, iskry, obracające się promienie).
