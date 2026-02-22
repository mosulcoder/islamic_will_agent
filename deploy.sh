#!/usr/bin/env bash
# deploy.sh — Build and watch the Islamic Will skill zip package
#
# Usage:
#   ./deploy.sh           # build once
#   ./deploy.sh watch     # build then watch for changes and auto-rebuild
#
# For watch mode, install fswatch for instant detection (recommended):
#   brew install fswatch
# Without fswatch, the script falls back to polling every 3 seconds.

set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$SCRIPT_DIR/skills/islamic-will"
ZIP_OUTPUT="$SCRIPT_DIR/islamic-will-skill.zip"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'


# ── Watched paths (for fswatch / polling) ────────────────────────────────────
WATCH_PATHS=(
    "$SCRIPT_DIR/reference"
    "$SKILL_DIR/SKILL.md"
    "$SCRIPT_DIR/README.md"
)

# ── Build ─────────────────────────────────────────────────────────────────────
build() {
    echo -e "${BLUE}[build]${NC} Packaging zip..."
    rm -f "$ZIP_OUTPUT"
    cd "$SCRIPT_DIR"
    
    # Add SKILL.md at the root of the zip
    zip -j "$ZIP_OUTPUT" "$SKILL_DIR/SKILL.md" -q
    
    # Add focused reference files only — exclude large PDF-converted textbooks
    # and developer scripts that are not needed inside the skill
    zip -r "$ZIP_OUTPUT" \
        reference/ \
        -q \
        -x "reference/INHERITANCE-IN-ISLAM.md" \
        -x "reference/Islamic_Inheritance_A_Beginners_Guide.md"

    # Add only the data files from script/ (not dev scripts or cache)
    zip -r "$ZIP_OUTPUT" \
        script/calculate_shares.py \
        script/generate_docs.js \
        script/will_data_template.json \
        package.json \
        -q

    local size
    size=$(ls -lh "$ZIP_OUTPUT" | awk '{print $5}')
    echo -e "${GREEN}[build]${NC} ${BOLD}islamic-will-skill.zip${NC} ($size) — $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# ── Checksum of all watched source files (for polling) ───────────────────────
watched_checksum() {
    find "${WATCH_PATHS[@]}" -type f -name "*.md" 2>/dev/null \
        | sort \
        | xargs stat -f "%m %N" 2>/dev/null \
        | md5
}

# ── Polling fallback (no fswatch) ────────────────────────────────────────────
poll_watch() {
    local interval=3
    echo -e "${YELLOW}[watch]${NC} Polling for changes every ${interval}s..."
    echo -e "        (install ${BOLD}fswatch${NC} for instant detection: brew install fswatch)"
    echo ""

    local last_hash
    last_hash=$(watched_checksum)

    while true; do
        sleep "$interval"
        local current_hash
        current_hash=$(watched_checksum)
        if [ "$current_hash" != "$last_hash" ]; then
            echo -e "${YELLOW}[watch]${NC} Change detected — rebuilding..."
            build
            last_hash="$current_hash"
        fi
    done
}

# ── fswatch mode ─────────────────────────────────────────────────────────────
fswatch_watch() {
    echo -e "${BLUE}[watch]${NC} Watching for changes (fswatch)..."
    echo -e "        Paths: reference/  skills/islamic-will/SKILL.md  README.md"
    echo ""

    fswatch -o "${WATCH_PATHS[@]}" | while read -r; do
        echo -e "${YELLOW}[watch]${NC} Change detected — rebuilding..."
        build
    done
}

# ── Watch (auto-select fswatch or poll) ──────────────────────────────────────
watch_mode() {
    build  # Always do an initial build first
    if command -v fswatch &>/dev/null; then
        fswatch_watch
    else
        poll_watch
    fi
}

# ── Header ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}Islamic Will Skill — Deploy Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Entry point ──────────────────────────────────────────────────────────────
case "${1:-build}" in
    build)
        build
        ;;
    watch)
        trap 'echo -e "\n${YELLOW}[watch]${NC} Stopped."; exit 0' INT TERM
        watch_mode
        ;;
    *)
        echo "Usage: $0 [build|watch]"
        echo ""
        echo "  build  — sync reference files and rebuild zip (default)"
        echo "  watch  — build then watch for changes and auto-rebuild"
        echo ""
        echo "Optional: brew install fswatch   (for instant file change detection)"
        exit 1
        ;;
esac
