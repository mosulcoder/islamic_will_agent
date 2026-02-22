# Islamic Will Agent — Project Memory

## Project Overview
Islamic Will AI skill for Sunni Muslims in Tennessee. Covers Hanafi/Shafi'i fiqh + Tennessee probate law.

## Key Files
- `claude.md` — Main system prompt / skill definition (updated Feb 2026)
- `.claude/commands/islamic-will.md` — Claude Code invocable skill (`/islamic-will`)
- `script/calculate_shares.py` — Full Fara'id Python calculator (Hanafi + Shafi'i)
- `reference/` — All knowledge base files

## Reference Structure
- `reference/Islamic_Will_Core_Metadata.md` — Core Shariah principles
- `reference/Madhhab_Comparison_Shares.md` — Hanafi vs Shafi'i differences
- `reference/Islamic_Will_Edge_Cases.md` — Edge cases (adopted, fetus, etc.)
- `reference/Glossary.md` — Arabic/English/Legal glossary (created Feb 2026)
- `reference/Modern_Assets_Guide.md` — Non-probate assets, crypto, digital (created Feb 2026)
- `reference/Tennessee/Tennessee_Will_Template.md` — Full will template (created Feb 2026)
- `reference/Tennessee/Tennessee_Execution_Checklist.md` — Signing checklist (created Feb 2026)
- `reference/Tennessee/Tennessee_waiver_of_elective_share_template.md` — Spousal waiver template
- `reference/Tennessee/Tennessee_Legal_Requirements.md` — TN statute reference

## Key Improvements Made (Feb 2026)
1. Created proper Claude skill command at `.claude/commands/islamic-will.md`
2. Enhanced `claude.md` with staged intake protocol, multiple wives handling, non-probate assets
3. Added full Will Template with Self-Proving Affidavit
4. Added Tennessee Execution Checklist (4 phases)
5. Added Modern Assets Guide (401k, IRA, crypto, digital assets)
6. Added bilingual Glossary (Arabic/English/Legal)
7. Updated README with deployment instructions

## Critical Knowledge Points
- Multiple wives: ALL wives share a single spousal fraction (1/8 or 1/4) equally
- Non-probate assets (401k, IRA, life insurance) are NOT controlled by the will
- Tennessee Elective Share: 10–40% based on marriage length; waiver required for Islamic compliance
- Six heirs never excluded: Husband, Wife, Father, Mother, Son, Daughter
- Wasiyyah max: 1/3 of net estate; cannot go to an existing heir
- Auto-revocation: TN will auto-revoked upon marriage (§ 32-1-201) or divorce (§ 32-1-202)

## Python Calculator Supported Features
- Hanafi and Shafi'i modes
- Aul, Radd, Hajb (total + partial)
- Mushtaraka (Shafi'i), Muqasama (Grandfather vs Brothers)
- Fetus reservation, missing persons, non-Muslim exclusion, killer bar
