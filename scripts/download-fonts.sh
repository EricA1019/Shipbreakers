#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGETS=(public ship-breakers/public)
for target in "${TARGETS[@]}"; do
  mkdir -p "$target/fonts/jetbrains-mono" "$target/fonts/noto-cjk"
done

# Source URLs (woff2/ttf/otf)
JETBRAINS_WOFF2="https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/webfonts/JetBrainsMono-Regular.woff2"
JETBRAINS_TTF="https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf"
NOTO_OTF="https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/Mono/NotoSansMonoCJKsc-Regular.otf"

download_all() {
  local src="$1" dest="$2"
  for target in "${TARGETS[@]}"; do
    echo "Downloading $src -> $target/$dest"
    curl -L -o "$target/$dest" "$src" || true
  done
}

download_all "$JETBRAINS_WOFF2" "fonts/jetbrains-mono/JetBrainsMono-Regular.woff2"
download_all "$JETBRAINS_TTF" "fonts/jetbrains-mono/JetBrainsMono-Regular.ttf"
download_all "$NOTO_OTF" "fonts/noto-cjk/NotoSansMonoCJKsc-Regular.otf"

for target in "${TARGETS[@]}"; do
  cat > "$target/fonts/README.md" <<'EOF'
Place self-hosted font files here if automatic download fails.
Recommended fonts:
- JetBrains Mono (woff2/ttf) -> https://www.jetbrains.com/lp/mono/
- Noto Sans Mono CJK SC (otf/ttf) -> https://github.com/googlefonts/noto-cjk

Licensing: Verify licenses before redistribution.
EOF
done

echo "Fonts download script finished. Verify files in public/fonts/ and ship-breakers/public/fonts/."