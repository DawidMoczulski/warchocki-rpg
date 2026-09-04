#!/bin/bash
# sprawdz.sh <plik-testu.js> — uruchamia test W PRAWDZIWEJ GRZE (headless Chrome).
#
# Dlaczego w przeglądarce, a nie w Node+vm: gra rysuje po canvasie, czyta paletę
# przez getComputedStyle i ładuje dźwięk — atrapa tego wszystkiego rozjeżdża się
# z rzeczywistością przy każdej większej zmianie. Tu testujemy to, co naprawdę
# leci graczowi, a wynik wracamy przez DOM (--dump-dom).
set -e
G="$(cd "$(dirname "$0")/.." && pwd)"
TEST="$1"
[ -f "$TEST" ] || TEST="$G/testy/$1"
[ -f "$TEST" ] || { echo "nie ma pliku testu: $1"; exit 2; }
cd "$G"
python3 - "$TEST" <<'PY'
import sys
kod=open(sys.argv[1],encoding='utf-8').read()
src=open('index.html',encoding='utf-8').read()
ramka='''<script>
window.__W=[];
function T(nazwa,f){try{f();window.__W.push('  OK   '+nazwa);}
  catch(e){window.__W.push('  BLAD '+nazwa+' -> '+(e&&e.message||e));}}
function ok(w,m){if(!w)throw new Error(m||'oczekiwano prawdy');}
function eq(a,b,m){if(a!==b)throw new Error((m||'')+' jest '+a+', ma byc '+b);}
window.addEventListener('load',function(){
  try{ %s }catch(e){window.__W.push('  BLAD wywrotka calego testu -> '+(e&&e.message||e));}
  var d=document.createElement('div');d.id='WYNIK';
  var zle=window.__W.filter(function(w){return w.indexOf('BLAD')>=0;}).length;
  d.textContent='\\n'+window.__W.join('\\n')+'\\n\\n'+window.__W.length+' testow, bledow: '+zle+'\\n';
  document.body.appendChild(d);
});
</script>''' % kod
open('_test.html','w',encoding='utf-8').write(src.replace('</body>',ramka+'</body>'))
PY
WYNIK=$(timeout 180 flatpak run --filesystem="$G" com.google.Chrome --headless=new --disable-gpu \
  --no-sandbox --virtual-time-budget=12000 --dump-dom "file://$G/_test.html" 2>/dev/null \
  | python3 -c "import sys,re,html
s=sys.stdin.read()
m=re.search(r'id=\"WYNIK\">(.*?)</div>',s,re.S)
print(html.unescape(m.group(1)) if m else 'BRAK WYNIKU — test sie nie wykonal')")
rm -f "$G/_test.html"
echo "$WYNIK"
echo "$WYNIK" | grep -q "bledow: 0" || exit 1
