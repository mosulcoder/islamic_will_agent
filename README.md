# Islamic Will Agent — Sunni · Tennessee

A Claude AI skill and reference toolkit that guides Muslims through creating a **Shariah-compliant, Tennessee-legally-enforceable Last Will & Testament**.

Covers Hanafi and Shafi'i fiqh, inheritance calculation (Fara'id), Tennessee probate law, spousal elective share waiver, document drafting, and execution.

---

## How to Use This Skill

### Option 1 — Claude.ai Project (Recommended)
1. Open [Claude.ai](https://claude.ai) and create a new **Project**
2. In Project Settings → Instructions, paste the contents of `claude.md`
3. Upload all files in the `reference/` directory as Project Knowledge
4. Start a conversation — the agent will greet you and begin the intake process

### Option 2 — Claude Code Skill (Developer)
1. Ensure `.claude/commands/islamic-will.md` is in your project
2. In Claude Code, type `/islamic-will` to invoke the skill
3. The agent will guide you through the full will creation process

### Option 3 — API / Custom Deployment
Use the contents of `claude.md` as the system prompt in any Claude API call.

---

## What This Skill Produces

At the end of each session, the agent generates:

1. **Last Will and Testament** — Tennessee-compliant, Shariah-structured document with all required clauses
2. **Waiver of Elective Share** — Prevents Tennessee's 10–40% spousal override (T.C.A. § 31-4-102)
3. **Inheritance Calculation Table** — Fraction, decimal, percentage, and dollar amount for each heir
4. **Tennessee Execution Checklist** — Step-by-step guide for signing, witnessing, and notarizing
5. **Beneficiary Designation Action List** — Instructions for non-probate assets (401k, IRA, life insurance)

---

## Knowledge Base (Reference Files)

| File | Contents |
|------|----------|
| `reference/Islamic_Will_Core_Metadata.md` | Core Shariah principles: prerequisites, causes, impediments, heir categories |
| `reference/Madhhab_Comparison_Shares.md` | Hanafi vs. Shafi'i differences on Radd, Grandfather, Mushtaraka, Aul |
| `reference/Islamic_Will_Edge_Cases.md` | Adopted children, fetus, simultaneous death, missing persons, non-Muslim relatives |
| `reference/Glossary.md` | Arabic/English/Legal glossary of all terms used |
| `reference/Modern_Assets_Guide.md` | Non-probate assets, retirement accounts, digital assets, crypto, life insurance |
| `reference/Tennessee/Tennessee_Legal_Requirements.md` | TN statutes: execution, elective share, guardianship |
| `reference/Tennessee/Tennessee_Will_Template.md` | Full fillable Last Will & Testament template |
| `reference/Tennessee/Tennessee_waiver_of_elective_share_template.md` | Full Waiver of Elective Share template (T.C.A. § 31-4-102) |
| `reference/Tennessee/Tennessee_waier_of_elective_share.md` | Explanation of why the spousal waiver is essential |
| `reference/Tennessee/Tennessee_Execution_Checklist.md` | Phase-by-phase execution checklist |

---

## Python Calculator

`script/calculate_shares.py` implements the full Fara'id engine:

- Supports Hanafi and Shafi'i schools
- Handles: Al-Aul, Ar-Radd, Al-Hajb (total and partial exclusion)
- Edge cases: adopted heirs, step-relations, non-Muslims, killers (Madhhab-specific), missing persons, unborn fetus
- Al-Mushtaraka (Shafi'i) and Muqasama (Grandfather vs. Brothers)
- Multiple wives (shared spousal fraction)

```bash
python script/calculate_shares.py
```

---

## Key Tennessee Legal Points

| Issue | Rule | Statute |
|-------|------|---------|
| Will execution | 2 disinterested witnesses + Notary (self-proving affidavit) | T.C.A. § 32-1-104 |
| Spousal elective share | Spouse can claim 10–40% of estate without a waiver | T.C.A. § 31-4-101 |
| Elective share waiver | Must be signed voluntarily with fair financial disclosure | T.C.A. § 31-4-102 |
| Will revocation | Auto-revoked upon marriage or divorce | T.C.A. §§ 32-1-201, 32-1-202 |
| No-contest clause | Enforceable | T.C.A. § 32-3-119 |
| Guardianship | Will nomination honored under "best interest" standard | T.C.A. § 36-6-106 |

---

## Disclaimer

This toolkit was created with AI assistance and is intended for educational and document-drafting purposes only. It does not constitute legal advice. All documents generated must be reviewed by a **Tennessee-licensed estate planning attorney** before execution.
