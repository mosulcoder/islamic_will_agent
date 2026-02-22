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

# ── Source → Destination map ─────────────────────────────────────────────────
# Each entry: "source_path|destination_filename_in_skill_dir"
SYNC_FILES=(
    "reference/Islamic_Will_Core_Metadata.md|Islamic_Will_Core_Metadata.md"
    "reference/Madhhab_Comparison_Shares.md|Madhhab_Comparison_Shares.md"
    "reference/Islamic_Will_Edge_Cases.md|Islamic_Will_Edge_Cases.md"
    "reference/Glossary.md|Glossary.md"
    "reference/Modern_Assets_Guide.md|Modern_Assets_Guide.md"
    "reference/Tennessee/Tennessee_Legal_Requirements.md|Tennessee_Legal_Requirements.md"
    "reference/Tennessee/Tennessee_Will_Template.md|Tennessee_Will_Template.md"
    "reference/Tennessee/Tennessee_waiver_of_elective_share_template.md|Tennessee_Waiver_of_Elective_Share.md"
    "reference/Tennessee/Tennessee_Execution_Checklist.md|Tennessee_Execution_Checklist.md"
)

# ── Watched paths (for fswatch / polling) ────────────────────────────────────
WATCH_PATHS=(
    "$SCRIPT_DIR/reference"
    "$SKILL_DIR/SKILL.md"
    "$SCRIPT_DIR/README.md"
)

# ── Build ─────────────────────────────────────────────────────────────────────
build() {
    echo -e "${BLUE}[build]${NC} Syncing reference files → skills/islamic-will/"

    local errors=0
    for entry in "${SYNC_FILES[@]}"; do
        local src="${entry%%|*}"
        local dst_name="${entry##*|}"
        local src_path="$SCRIPT_DIR/$src"
        local dst_path="$SKILL_DIR/$dst_name"

        if [ ! -f "$src_path" ]; then
            echo -e "  ${RED}✗${NC} Missing: $src"
            errors=$((errors + 1))
            continue
        fi

        cp "$src_path" "$dst_path"
        echo -e "  ${GREEN}✓${NC} $src → $dst_name"
    done

    if [ "$errors" -gt 0 ]; then
        echo -e "${RED}[build]${NC} $errors file(s) missing — fix paths above before zipping."
        return 1
    fi

    echo -e "${BLUE}[build]${NC} Packaging zip..."
    rm -f "$ZIP_OUTPUT"
    cd "$SCRIPT_DIR"
    zip -r "$ZIP_OUTPUT" skills/islamic-will/ README.md -q

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
