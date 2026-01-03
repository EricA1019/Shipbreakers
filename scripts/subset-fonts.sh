#!/bin/bash
# Font Subsetting Script for Ship Breakers
# Reduces Noto Sans CJK SC from ~16MB to ~1-2MB by keeping only common characters
#
# Prerequisites:
#   pip install fonttools brotli
#
# This script subsets the Noto Sans Mono CJK SC font to include:
# - Basic Latin (ASCII)
# - Latin Extended A/B (European languages)
# - Common Chinese characters (GB2312 common set ~6,763 characters)
# - Common Japanese hiragana/katakana
# - Punctuation and symbols
#
# The resulting font will be smaller and converted to woff2 for better compression.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FONT_DIR="$PROJECT_ROOT/ship-breakers/public/fonts"
INPUT_FONT="$FONT_DIR/noto-cjk/NotoSansMonoCJKsc-Regular.otf"
OUTPUT_FONT="$FONT_DIR/noto-cjk/NotoSansMonoCJKsc-Regular-subset.woff2"

# Check if fonttools is installed
if ! command -v pyftsubset &> /dev/null; then
    echo "Error: pyftsubset not found. Install with: pip install fonttools brotli"
    exit 1
fi

# Check input file exists
if [ ! -f "$INPUT_FONT" ]; then
    echo "Error: Input font not found: $INPUT_FONT"
    exit 1
fi

echo "Subsetting font: $INPUT_FONT"
echo "Output: $OUTPUT_FONT"

# Unicode ranges to include:
# U+0000-00FF: Basic Latin + Latin-1 Supplement
# U+0100-017F: Latin Extended-A
# U+0180-024F: Latin Extended-B
# U+2000-206F: General Punctuation
# U+2070-209F: Superscripts and Subscripts
# U+20A0-20CF: Currency Symbols
# U+2100-214F: Letterlike Symbols
# U+2150-218F: Number Forms
# U+2190-21FF: Arrows
# U+2200-22FF: Mathematical Operators
# U+2300-23FF: Miscellaneous Technical
# U+25A0-25FF: Geometric Shapes
# U+2600-26FF: Miscellaneous Symbols
# U+3000-303F: CJK Symbols and Punctuation
# U+3040-309F: Hiragana
# U+30A0-30FF: Katakana
# U+4E00-9FFF: CJK Unified Ideographs (common subset)
# U+FF00-FFEF: Halfwidth and Fullwidth Forms

pyftsubset "$INPUT_FONT" \
    --output-file="$OUTPUT_FONT" \
    --flavor=woff2 \
    --unicodes="U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2150-218F,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+25A0-25FF,U+2600-26FF,U+3000-303F,U+3040-309F,U+30A0-30FF,U+4E00-9FFF,U+FF00-FFEF" \
    --layout-features='*' \
    --glyph-names \
    --symbol-cmap \
    --legacy-cmap \
    --notdef-glyph \
    --notdef-outline \
    --recommended-glyphs

# Show results
INPUT_SIZE=$(ls -lh "$INPUT_FONT" | awk '{print $5}')
OUTPUT_SIZE=$(ls -lh "$OUTPUT_FONT" | awk '{print $5}')

echo ""
echo "Font subsetting complete!"
echo "Original: $INPUT_SIZE"
echo "Subset:   $OUTPUT_SIZE"
echo ""
echo "Next steps:"
echo "1. Update ship-breakers/src/index.css to load the subset font:"
echo "   url('/fonts/noto-cjk/NotoSansMonoCJKsc-Regular-subset.woff2') format('woff2')"
echo "2. Test Chinese character rendering"
echo "3. Remove the original .otf file after verification"
