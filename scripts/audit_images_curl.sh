#!/usr/bin/env bash
# Audit all /images/* referenced in src/ via curl against /_next/image
set -euo pipefail

BASE="http://localhost:3000"
PASS=0
FAIL=0
TOTAL=0

check() {
  local img="$1"
  local url="${BASE}/_next/image?url=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$img")&w=384&q=75"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  TOTAL=$((TOTAL+1))
  if [[ "$status" -lt 400 ]]; then
    printf "  [OK  %s] %s\n" "$status" "$img"
    PASS=$((PASS+1))
  else
    printf "  [FAIL %s] %s\n" "$status" "$img"
    FAIL=$((FAIL+1))
  fi
}

echo "====================================================================="
echo "AUDIT DES IMAGES via curl + /_next/image"
echo "Serveur : $BASE"
echo "====================================================================="
echo ""

echo "--- Hero & génériques ---"
check "/images/hero/commerce-moderne.jpg"
check "/images/driver-courier.jpg"
check "/images/vendor-hero.jpg"

echo ""
echo "--- Produits ---"
for f in $(ls public/images/products/*.jpg 2>/dev/null | sed 's|public||'); do
  check "$f"
done

echo ""
echo "--- Boutiques ---"
for f in $(ls public/images/shops/*.jpg 2>/dev/null | sed 's|public||'); do
  check "$f"
done

echo ""
echo "====================================================================="
printf "BILAN : %d OK, %d FAIL, %d TOTAL\n" "$PASS" "$FAIL" "$TOTAL"
echo "====================================================================="

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
else
  echo ""
  echo "🎉 Aucune image en erreur !"
fi
