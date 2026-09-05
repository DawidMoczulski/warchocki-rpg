#!/bin/bash
# test_dzwiek.sh — czy ustawienia dźwięku w menu MAJĄ CO ściszać.
#
# Ten test musi iść przez HTTP i z odblokowanym autoplayem, bo sprawdza rzecz,
# której nie widać w DOM-ie: czy po wejściu na zakładkę „Dźwięk” faktycznie
# RUSZA muzyka menu. Suwaki potrafią poprawnie ustawiać zmienne i zapisywać
# ustawienia, a i tak być dla gracza martwe — bo nic nie gra.
# Przez file:// klipy się nie wczytają (fetch), więc zwykły sprawdz.sh to minie.
set -e
G="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8731
cd "$G"
python3 -m http.server $PORT >/dev/null 2>&1 &
SERW=$!
trap 'kill $SERW 2>/dev/null || true; rm -f "$G/_audio.html"' EXIT
sleep 2
python3 - <<'PY'
src=open('index.html',encoding='utf-8').read()
inj='''<script>
addEventListener('load',function(){setTimeout(function(){
  document.querySelector('.menuTab[data-tab="dzwiek"]').click();
  setTimeout(function(){
    var zle=[];
    if(!AC||AC.state!=='running')zle.push('AudioContext nie wstal ('+(AC?AC.state:'brak')+')');
    if(!BUFS['song'])zle.push('utwor menu sie nie wczytal');
    if(!songSrc)zle.push('MUZYKA NIE GRA — suwak muzyki nie ma czego sciszac');
    var sl=document.getElementById('menuVolMusic');
    sl.value=30; sl.dispatchEvent(new Event('input',{bubbles:true}));
    if(Math.abs(musicVol-0.30)>0.01)zle.push('suwak nie zmienil musicVol ('+musicVol+')');
    var d=document.createElement('div');d.id='WYNIK';
    d.textContent=zle.length?('BLEDY: '+zle.join(' ;; ')):'OK — muzyka gra, suwak steruje glosnoscia';
    document.body.appendChild(d);
  },2600);
},500);});
</script>'''
open('_audio.html','w',encoding='utf-8').write(src.replace('</body>',inj+'</body>'))
PY
WYNIK=$(timeout 150 flatpak run --filesystem="$G" com.google.Chrome --headless=new --disable-gpu \
  --no-sandbox --autoplay-policy=no-user-gesture-required --force-prefers-reduced-motion \
  --virtual-time-budget=12000 --window-size=1400,900 --dump-dom "http://localhost:$PORT/_audio.html" 2>/dev/null \
  | python3 -c "import sys,re,html
s=sys.stdin.read();m=re.search(r'id=\"WYNIK\">(.*?)</div>',s,re.S)
print(html.unescape(m.group(1)) if m else 'BRAK WYNIKU — test sie nie wykonal')")
echo "$WYNIK"
case "$WYNIK" in OK*) exit 0;; *) exit 1;; esac
