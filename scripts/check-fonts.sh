#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

check_dir() {
  local dir="$1"
  echo "Checking $dir"
  ls -lh "$dir/fonts" || return 0
  ls -lh "$dir/fonts/jetbrains-mono" || true
  ls -lh "$dir/fonts/noto-cjk" || true

  local jet_woff jet_ttf noto_otf
  jet_woff=$(stat -c%s "$dir/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2" 2>/dev/null || echo 0)
  jet_ttf=$(stat -c%s "$dir/fonts/jetbrains-mono/JetBrainsMono-Regular.ttf" 2>/dev/null || echo 0)
  noto_otf=$(stat -c%s "$dir/fonts/noto-cjk/NotoSansMonoCJKsc-Regular.otf" 2>/dev/null || echo 0)

  echo "JetBrains Mono woff2 size: $jet_woff bytes"
  echo "JetBrains Mono ttf size:   $jet_ttf bytes"
  echo "Noto Sans Mono CJK otf size: $noto_otf bytes"

  if [ "$noto_otf" -gt 1500000 ]; then
    echo "Warning: Noto Sans CJK is large (>1.5MB). Consider subsetting or serving with compression."
  fi
}

check_dir public
check_dir ship-breakers/public