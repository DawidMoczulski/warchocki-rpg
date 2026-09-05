#!/bin/bash
# scena.sh <nazwa> <kod-js> — ustawia scenę, rysuje JEDNĄ klatkę i robi zrzut.
#
# Po co: testy logiczne mówią, że kafel stoi we właściwym miejscu, ale nie
# powiedzą, czy to wygląda jak brama. Jakość obrazu sprawdza się patrzeniem.
#
# Sztuczka polega na tym, że rysujemy klatkę SYNCHRONICZNIE (zanim poleci `load`)
# i zamrażamy pętlę — dzięki temu `--screenshot` łapie gotowy obraz i nie trzeba
# walczyć z `requestAnimationFrame`.
#
#   ./testy/scena.sh brama 'S.quests={przyczepa:2,policja:1};bootWorld();setRegion("trasa");P.x=608;P.y=488;'
#
# UWAGA: w kodzie sceny używaj apostrofów pojedynczych na zewnątrz i podwójnych
# w środku — inaczej bash zje $(...) jako podstawienie polecenia.
# Zrzut ląduje w katalogu gry jako _<nazwa>.png (Chrome z Flatpaka NIE zapisze do /tmp).
set -e
G="$(cd "$(dirname "$0")/.." && pwd)"
NAZWA="$1"; KOD="$2"
cd "$G"
python3 - "$KOD" <<'PY'
import sys
src=open('index.html',encoding='utf-8').read()
inject='''<script>
window.addEventListener('load',function(){
  try{
    scene='world';
    %s
    if(typeof frame==='function')frame(performance.now());  // wymuś jedną klatkę
    window.requestAnimationFrame=function(){};              // i zamroź pętlę
  }catch(e){document.title='BLAD: '+e.message;console.log('BLAD',e);}
});
</script>''' % sys.argv[1]
open('_scena.html','w',encoding='utf-8').write(src.replace('</body>',inject+'</body>'))
PY
# --force-prefers-reduced-motion jest KONIECZNE: pod wirtualnym czasem animacje
# CSS nie dobiegają końca i elementy z `animation: ... both` zastygają w klatce
# startowej (u nas: całe menu główne wychodziło przezroczyste albo puste).
# Gra i tak honoruje to ustawienie, więc zrzut pokazuje prawidłowy stan końcowy.
timeout 180 flatpak run --filesystem="$G" com.google.Chrome --headless=new --disable-gpu --no-sandbox \
  --force-prefers-reduced-motion --virtual-time-budget=9000 --window-size=1000,700 --hide-scrollbars \
  --screenshot="$G/_$NAZWA.png" "file://$G/_scena.html" 2>/dev/null || true
rm -f "$G/_scena.html"
ls -la "$G/_$NAZWA.png"
