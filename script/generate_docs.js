/**
 * generate_docs.js — Islamic Will Word Document Generator
 * 
 * Generates formatted .docx documents from a JSON data file
 * produced by the Islamic Will skill (/islamic-will).
 * 
 * Usage:
 *     node script/generate_docs.js will_data.json
 *     node script/generate_docs.js will_data.json --output-dir ./output
 * 
 * Install dependency:
 *     npm install docx
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } = require('docx');

// Constants
const FONT = "Times New Roman";
const BODY_PT = 24;  // docx uses half-points (24 = 12pt)
const TITLE_PT = 32; // 16pt
const HEAD_PT = 26;  // 13pt
const SMALL_PT = 20; // 10pt

class IslamicWillGenerator {
    constructor(data, outputDir) {
        this.data = data;
        this.out = outputDir;
        if (!fs.existsSync(this.out)) {
            fs.mkdirSync(this.out, { recursive: true });
        }

        this.t = data.testator || {};
        this.sp = data.spouse || {};
        this.h = data.heirs || {};
        this.est = data.estate || {};
        this.was = data.wasiyyah || [];
        this.exe = data.executor || {};
        this.grd = data.guardian || {};
        this.dist = data.distribution || {};
    }

    _name() { return this.t.full_name || "[TESTATOR NAME]"; }
    _county() { return this.t.county || "[COUNTY]"; }
    _madhhab() { return this.t.madhhab || "Hanafi"; }
    _dob() { return this.t.dob || "[DOB]"; }

    _elective_pct() {
        const y = this.sp.years_married || 0;
        if (y < 3) return "10%";
        if (y < 6) return "20%";
        if (y < 9) return "30%";
        return "40%";
    }

    _spouse_share() {
        const shares = this.dist.shares || [];
        return shares.find(s => s.relationship === "Wife") || null;
    }

    _wasiyyah_total() {
        return this.was.reduce((sum, w) => sum + (w.amount || 0), 0);
    }

    _safe(name) {
        return name.replace(/ /g, "_").replace(/\//g, "_");
    }

    _formatCurrency(val) {
        return "$" + Math.round(val).toLocaleString();
    }

    // -- formatting helpers --

    _para(text, options = {}) {
        const { size = BODY_PT, bold = false, italic = false, align = AlignmentType.LEFT, spaceBefore = 0, spaceAfter = 120, indent = 0 } = options;

        return new Paragraph({
            alignment: align,
            spacing: { before: spaceBefore, after: spaceAfter },
            indent: indent ? { left: indent * 1440 } : undefined,
            children: text ? [new TextRun({ text, font: FONT, size, bold, italics: italic })] : []
        });
    }

    _titlePara(text) {
        return this._para(text, { size: TITLE_PT, bold: true, align: AlignmentType.CENTER, spaceAfter: 80 });
    }

    _subTitlePara(text) {
        return this._para(text, { size: BODY_PT, align: AlignmentType.CENTER, spaceAfter: 80 });
    }

    _article(text) {
        return this._para(text, { size: HEAD_PT, bold: true, align: AlignmentType.CENTER, spaceBefore: 240, spaceAfter: 120 });
    }

    _rule() {
        return new Paragraph({
            spacing: { before: 120, after: 120 },
            border: {
                bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 }
            }
        });
    }

    _sigBlock(label, dateLine = true, indent = 0) {
        const paras = [];
        paras.push(this._para("________________________________________________", { spaceBefore: 480, spaceAfter: 40, indent }));
        paras.push(this._para(label, { spaceBefore: 40, spaceAfter: 40, indent }));
        if (dateLine) {
            paras.push(this._para("Date: ____________________", { spaceBefore: 80, spaceAfter: 160, indent }));
        }
        return paras;
    }

    _detailLine(label, indent = 0) {
        return this._para(`${label}: ______________________________________`, { spaceBefore: 40, spaceAfter: 40, indent });
    }

    _tableHeader(headers, size = BODY_PT) {
        return new TableRow({
            children: headers.map(h => new TableCell({
                children: [this._para(h, { size, bold: true })],
                verticalAlign: "center",
            }))
        });
    }

    _tableRow(values, bold = false, size = BODY_PT) {
        return new TableRow({
            children: values.map(v => new TableCell({
                children: [this._para(String(v), { size, bold })],
                verticalAlign: "center",
            }))
        });
    }

    _disclaimer() {
        return [
            this._rule(),
            this._para("This document was prepared with AI assistance and must be reviewed by a Tennessee-licensed estate planning attorney before execution.", { size: SMALL_PT, italic: true, align: AlignmentType.CENTER })
        ];
    }

    async _saveDoc(children, filename) {
        const doc = new Document({
            sections: [{
                properties: {
                    page: { margin: { top: 1440, right: 1800, bottom: 1440, left: 1800 } }
                },
                children
            }]
        });

        const buf = await Packer.toBuffer(doc);
        const p = path.join(this.out, filename);
        fs.writeFileSync(p, buf);
        return p;
    }

    async generateAll() {
        const paths = [];
        console.log("  [1/4] Last Will and Testament...");
        paths.push(await this.genWill());

        console.log("  [2/4] Waiver of Elective Share...");
        paths.push(await this.genWaiver());

        console.log("  [3/4] Execution Checklist...");
        paths.push(await this.genChecklist());

        console.log("  [4/4] Beneficiary Designation Reminder...");
        paths.push(await this.genBeneficiary());

        return paths;
    }

    async genWill() {
        const name = this._name();
        const county = this._county();
        const madhhab = this._madhhab();
        const dob = this._dob();
        const dist = this.dist;
        const shares = dist.shares || [];
        const net = dist.net_mirath || 0;

        const children = [];

        // Title
        children.push(this._titlePara("LAST WILL AND TESTAMENT"));
        children.push(this._titlePara("OF"));
        children.push(this._titlePara(name.toUpperCase()));
        children.push(this._subTitlePara("STATE OF TENNESSEE"));
        children.push(this._subTitlePara(`COUNTY OF ${county.toUpperCase().replace(' COUNTY', '')}`));
        children.push(this._rule());

        children.push(this._para(`I, ${name.toUpperCase()}, a resident of ${county}, Tennessee, born on ${dob}, being of sound mind and disposing memory, and not acting under duress, menace, fraud, or undue influence of any person whomsoever, do hereby make, publish, and declare this instrument to be my Last Will and Testament, hereby revoking all former wills and codicils previously made by me.`, { spaceAfter: 240 }));

        // Article I
        children.push(this._rule(), this._article("ARTICLE I — RELIGIOUS DECLARATION"));
        children.push(this._para(`I am a Muslim of the Sunni faith, following the ${madhhab} school of jurisprudence (Madhhab). It is my sincere intention and express direction that my estate be distributed in accordance with the Islamic Law of Inheritance (Ilm al-Fara'id) as interpreted by the ${madhhab} school. This will has been drafted to honor that intent while complying with the laws of the State of Tennessee.`));

        // Article II
        children.push(this._rule(), this._article("ARTICLE II — PERSONAL INFORMATION"));
        children.push(this._para(`I was born on ${dob} and reside in ${county}, Tennessee.`));

        // Article III
        children.push(this._rule(), this._article("ARTICLE III — APPOINTMENT OF EXECUTOR (WASI)"));
        const ep = this.exe.primary || "[PRIMARY EXECUTOR]";
        const ea = this.exe.alternate || "[ALTERNATE EXECUTOR]";

        const clauses3 = [
            ["3.1  Primary Executor", `I hereby appoint ${ep.toUpperCase()} as the Executor (Wasi) of this Will. It is my preference that my Executor be a Muslim of good character who understands and respects my religious obligations.`],
            ["3.2  Alternate Executor", `If ${ep} is unable or unwilling to serve, I appoint ${ea.toUpperCase()} as alternate Executor.`],
            ["3.3  Powers of Executor", "My Executor shall have full power to: collect and manage all estate assets; pay all funeral expenses, religious obligations, debts, taxes, and administrative expenses; sell, mortgage, or lease real or personal property as necessary; and distribute the estate as directed herein, without being required to obtain court approval for individual acts, to the extent permitted by Tennessee law."],
            ["3.4  Bond", "I waive the requirement that my Executor post a bond."]
        ];

        for (const [title, body] of clauses3) {
            children.push(this._para(title, { bold: true, spaceBefore: 120, spaceAfter: 40 }));
            children.push(this._para(body, { indent: 0.3 }));
        }

        // Article IV
        children.push(this._rule(), this._article("ARTICLE IV — FUNERAL AND BURIAL INSTRUCTIONS (TAJHEEZ WA TAKFEEN)"));
        children.push(this._para("I direct that my funeral and burial be conducted in strict accordance with Sunni Islamic tradition:"));
        const funeralItems = [
            "(a)  Ghusl: My body shall be washed by a qualified Muslim of the same gender, per the Sunnah;",
            "(b)  Kafan: My body shall be wrapped in white unsewn linen cloth (Kafan);",
            "(c)  Janazah Prayer: An Islamic funeral prayer (Salat al-Janazah) shall be performed;",
            `(d)  Burial: I shall be buried in a Muslim cemetery in or near ${county}, Tennessee, facing the Qiblah if possible;`,
            "(e)  No Embalming: My body shall NOT be embalmed unless required by law;",
            "(f)  No Open Casket: There shall be no open casket viewing;",
            "(g)  No Cremation: I expressly prohibit cremation of my body."
        ];
        for (const item of funeralItems) {
            children.push(this._para(item, { indent: 0.3, spaceAfter: 60 }));
        }
        const funeral = this.est.funeral_expenses || 5000;
        children.push(this._para(`Reasonable funeral and burial expenses, not to exceed ${this._formatCurrency(funeral)}, shall be paid from my estate as the first priority before any distribution.`));

        // Article V
        children.push(this._rule(), this._article("ARTICLE V — PAYMENT OF DEBTS (DUYUN)"));
        children.push(this._para("I direct my Executor to pay all of my lawful debts from my estate before any inheritance distribution:"));
        children.push(this._para("5.1  Religious Obligations:", { bold: true, spaceAfter: 40 }));
        const relDebts = [
            "(a)  Any unpaid Mahr (dowry) owed to my wife;",
            "(b)  Any unpaid Zakat (obligatory charity) from prior years;",
            "(c)  Any Kaffarah (religious expiation) owed;",
            "(d)  Any cost of Hajj by proxy (Hajj al-Badal) if applicable."
        ];
        for (const item of relDebts) {
            children.push(this._para(item, { indent: 0.6, spaceAfter: 60 }));
        }
        children.push(this._para("5.2  Secular Debts:", { bold: true, spaceAfter: 40 }));
        children.push(this._para("All outstanding mortgages, loans, credit cards, medical bills, and other lawful debts proven by creditors within the time permitted by Tennessee law.", { indent: 0.3 }));

        // Article VI (Wasiyyah)
        let art_mirath = "VI";
        let art_guard = "VII";
        if (this.was.length > 0) {
            children.push(this._rule(), this._article("ARTICLE VI — BEQUEST (WASIYYAH)"));
            const probate = this.est.probate || 0;
            const netDebts = probate - (this.est.funeral_expenses || 0);
            children.push(this._para(`6.1  Limitation: These bequests shall not exceed one-third (1/3) of the net estate (maximum ${this._formatCurrency(netDebts / 3)}) after payment of funeral expenses and debts, per Islamic Law.`));
            children.push(this._para("6.2  Specific Bequests:", { bold: true, spaceAfter: 40 }));

            const letters = "abcdefg";
            this.was.forEach((w, i) => {
                const rec = w.recipient || "[RECIPIENT]";
                const amt = w.amount || 0;
                const purp = w.purpose || "[PURPOSE]";
                children.push(this._para(`(${letters[i]})  To ${rec}: ${this._formatCurrency(amt)} for the purpose of ${purp}.`, { indent: 0.3, spaceAfter: 80 }));
            });
            children.push(this._para("6.3  Failure of Bequest: If a designated recipient ceases to exist, the Executor shall transfer the amount to the nearest equivalent Islamic charitable organization.", { indent: 0.3 }));
            art_mirath = "VII";
            art_guard = "VIII";
        }

        // Article VII - Mirath
        children.push(this._rule(), this._article(`ARTICLE ${art_mirath} — DISTRIBUTION OF ESTATE (MIRATH)`));
        const aul = dist.aul_applied || false;
        const denom = dist.aul_denominator || dist.original_denominator || 1;

        children.push(this._para(`7.1  Declaration of Intent\nThe remainder of my estate shall be distributed per the Islamic Law of Inheritance (Fara'id), ${madhhab} school.`));
        if (aul) {
            children.push(this._para(`7.2  Al-Aul Applied: Fixed shares exceeded 100%. Per ${madhhab} jurisprudence, all shares are reduced proportionally (denominator adjusted to ${denom}).`, { spaceBefore: 80 }));
        }

        children.push(this._para("7.3  Distribution:", { bold: true, spaceBefore: 160, spaceAfter: 120 }));
        if (shares.length > 0) {
            const tableRows = [
                this._tableHeader(["Heir", "Relationship", "Fraction", "Percentage", "Est. Amount"])
            ];
            shares.forEach(s => {
                tableRows.push(this._tableRow([
                    s.heir || "",
                    s.relationship || "",
                    `${s.fraction_num}/${s.fraction_den}`,
                    `${parseFloat(s.percentage || 0).toFixed(2)}%`,
                    this._formatCurrency(s.amount || 0)
                ]));
            });
            tableRows.push(this._tableRow(["TOTAL", "", `${denom}/${denom}`, "100.00%", this._formatCurrency(net)], true));
            children.push(new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
            }));
            children.push(this._para("", { spaceAfter: 120 }));
        }

        const excl = dist.exclusion_note || "";
        if (excl) {
            children.push(this._para(`7.4  Excluded Heirs: ${excl}`));
        }
        children.push(this._para("7.5  Predeceased Heir: If any named heir predeceases the Testator, their share is redistributed per Hanafi Fara'id rules."));
        children.push(this._para("7.6  Non-Muslim Heirs: Any heir who is not Muslim at death shall not receive a Mirath share."));

        // Guardian
        const daughters = this.h.daughters || [];
        const sons = this.h.sons || [];
        const gp = this.grd.primary || "[PRIMARY GUARDIAN]";
        const ga = this.grd.alternate || "[ALTERNATE GUARDIAN]";
        const spouseName = this.sp.full_name || "my spouse";

        if (gp || daughters.length || sons.length) {
            children.push(this._rule(), this._article(`ARTICLE ${art_guard} — GUARDIAN OF MINOR CHILDREN (WALI)`));
            const childrenStr = (daughters.length || sons.length) ? [...daughters, ...sons].join(", ") : "my minor children";
            children.push(this._para(`8.1  Appointment\nIf any of my children are minors at the time of my death, and if ${spouseName} is also deceased or unable to serve, I nominate ${gp.toUpperCase()} as Guardian.`));
            children.push(this._para(`8.2  Alternate Guardian\nIf ${gp} is unable or unwilling to serve, I nominate ${ga.toUpperCase()} as alternate Guardian.`));
            children.push(this._para(`8.3  Islamic Upbringing\nIt is my express wish that ${childrenStr} be raised in the Islamic faith (Sunni, ${madhhab} tradition), receive regular Islamic education, maintain their daily prayers, and be raised in a Muslim household. I request that ${county} courts give full weight to this instruction consistent with T.C.A. § 36-6-106.`));
            children.push(this._para("8.4  Bond: I waive the requirement that the Guardian post a bond."));
        }

        // No Contest
        children.push(this._rule(), this._article("ARTICLE IX — NO-CONTEST CLAUSE (IN TERROREM)"));
        children.push(this._para("If any person contests or challenges the validity of this Will through any legal proceeding, such person shall forfeit any and all rights under this Will, and their share shall pass as if they predeceased the Testator, per Hanafi Fara'id. Enforceable per T.C.A. § 32-3-119."));

        // Governing Law
        children.push(this._rule(), this._article("ARTICLE X — GOVERNING LAW"));
        children.push(this._para(`This Will shall be governed by the laws of the State of Tennessee. Probate shall occur in ${county} Probate Court.`));

        // Severability
        children.push(this._rule(), this._article("ARTICLE XI — SEVERABILITY"));
        children.push(this._para("If any provision of this Will is found invalid or unenforceable, the remaining provisions shall remain in full force and effect."));

        // Sig Testator
        children.push(this._rule(), this._article("SIGNATURE OF TESTATOR"));
        children.push(this._para(`IN WITNESS WHEREOF, I, ${name.toUpperCase()}, declare this to be my Last Will and Testament and have signed it on the date indicated below.`, { spaceAfter: 360 }));
        children.push(...this._sigBlock(`${name.toUpperCase()}, Testator`));
        children.push(this._para(`${county}, Tennessee`, { spaceAfter: 360 }));

        // Witnesses
        children.push(this._rule(), this._article("ATTESTATION OF WITNESSES"));
        children.push(this._para(`We, the undersigned, certify that ${name.toUpperCase()} signed this instrument in our presence; appeared to be of sound mind and not under duress; and that we signed as witnesses in the Testator's presence and in each other's presence. Neither of us is a beneficiary under this Will.`, { spaceAfter: 240 }));

        for (let i = 1; i <= 2; i++) {
            children.push(this._para(`Witness ${i}:`, { bold: true, spaceAfter: 40 }));
            children.push(...this._sigBlock(`Witness ${i} Signature`));
            children.push(this._detailLine("Printed Name"));
            children.push(this._detailLine("Address"));
            children.push(this._detailLine("City, State, Zip"));
            children.push(this._para(""));
        }

        // Self-Proving
        children.push(this._rule(), this._article("SELF-PROVING AFFIDAVIT  (T.C.A. § 32-1-104)"));
        children.push(this._subTitlePara("STATE OF TENNESSEE"));
        children.push(this._subTitlePara(`COUNTY OF ${county.toUpperCase().replace(' COUNTY', '')}`));
        children.push(this._para(`Before me, the undersigned Notary Public, personally appeared ${name.toUpperCase()}, [WITNESS 1 NAME], and [WITNESS 2 NAME]. The Testator declared that the foregoing instrument is their Last Will and Testament, willingly signed as their free and voluntary act. Each witness stated they signed in the presence of the Testator and each other.`, { spaceAfter: 360 }));

        children.push(...this._sigBlock(`${name.toUpperCase()}, Testator`, false));
        children.push(this._para("", { spaceAfter: 240 }));
        children.push(...this._sigBlock("Witness 1", false));
        children.push(this._para("", { spaceAfter: 240 }));
        children.push(...this._sigBlock("Witness 2", false));

        children.push(this._para("Subscribed and sworn before me this ____ day of ____________, 20____.", { spaceBefore: 240, spaceAfter: 360 }));
        children.push(...this._sigBlock("Notary Public, State of Tennessee", false));
        children.push(this._para(`County of ${county.replace(' County', '')}`, { spaceBefore: 40, spaceAfter: 40 }));
        children.push(this._detailLine("My Commission Expires"));
        children.push(this._para("[NOTARY SEAL]", { spaceBefore: 160 }));

        children.push(...this._disclaimer());

        return await this._saveDoc(children, `01_Last_Will_${this._safe(name)}.docx`);
    }

    async genWaiver() {
        const name = this._name();
        const county = this._county();
        const spouse = this.sp.full_name || "[SPOUSE NAME]";
        const madhhab = this._madhhab();
        const ss = this._spouse_share();

        const children = [];

        children.push(this._titlePara("WAIVER OF ELECTIVE SHARE AND BENEFITS"));
        children.push(this._subTitlePara("(Pursuant to T.C.A. § 31-4-102)"));
        children.push(this._subTitlePara("STATE OF TENNESSEE"));
        children.push(this._subTitlePara(`COUNTY OF ${county.toUpperCase().replace(' COUNTY', '')}`));
        children.push(this._rule());

        children.push(this._article("1. PARTIES"));
        children.push(this._para(`This Waiver is made this ____ day of ____________, 20____, by ${spouse.toUpperCase()} (hereinafter "Undersigned"), spouse of ${name.toUpperCase()} (hereinafter "Testator").`));

        children.push(this._rule(), this._article("2. PURPOSE AND INTENT"));
        children.push(this._para(`The Undersigned acknowledges that the Testator has executed a Last Will and Testament intended to comply with Sunni Islamic Law (Shariah), ${madhhab} school.`));
        children.push(this._para(`The Undersigned understands that under T.C.A. § 31-4-101, as a surviving spouse married ${this.sp.years_married || 0} years, she is entitled to an Elective Share of ${this._elective_pct()} of the Testator's estate.`));

        let islamicStr = "[Islamic share per Fara'id]";
        let islAmt = "[amount]";
        if (ss) {
            islamicStr = `${ss.fraction_num}/${ss.fraction_den} (${parseFloat(ss.percentage || 0).toFixed(2)}%)`;
            islAmt = this._formatCurrency(ss.amount || 0);
        }
        children.push(this._para(`The Undersigned further understands that her Islamic share under ${madhhab} Fara'id is ${islamicStr} of the Net Mirath, estimated at ${islAmt}. It is her free and voluntary intent to waive her statutory rights to facilitate distribution per Islamic Law.`));

        children.push(this._rule(), this._article("3. WAIVER OF RIGHTS"));
        children.push(this._para("The Undersigned hereby voluntarily and irrevocably waives, releases, and relinquishes any and all rights as surviving spouse, including:"));
        const waiveItems = [
            "(a)  The Right of Election against the Will (T.C.A. § 31-4-101);",
            "(b)  The Right to Year's Support (T.C.A. § 30-2-102);",
            "(c)  The Right to Exempt Property (T.C.A. § 30-2-101);",
            "(d)  The Right to Homestead (T.C.A. § 30-2-201)."
        ];
        waiveItems.forEach(i => children.push(this._para(i, { indent: 0.3, spaceAfter: 60 })));
        children.push(this._para(`The Undersigned agrees to accept only her Islamic inheritance share (${islamicStr}) as stated in the Will.`));

        children.push(this._rule(), this._article("4. FINANCIAL DISCLOSURE"));
        children.push(this._para("The Undersigned acknowledges that she has been provided with, or has voluntarily waived the right to, a fair and reasonable disclosure of the Testator's property and financial obligations:"));

        const gross = this.est.gross_total || 0;
        const probate = this.est.probate || 0;
        const home_v = (this.est.home && this.est.home.value) ? this.est.home.value : 0;
        const ret = this.est.retirement_401k || 0;
        const funeral = this.est.funeral_expenses || 0;
        const wasTot = this._wasiyyah_total();

        const finItems = [
            `Gross estate approximately ${this._formatCurrency(gross)}`,
            `Probate estate approximately ${this._formatCurrency(probate)}`,
            `Non-probate: Home ${this._formatCurrency(home_v)} (joint) · Retirement ${this._formatCurrency(ret)}`,
            `Funeral expenses ${this._formatCurrency(funeral)}`,
            `Wasiyyah bequest ${this._formatCurrency(wasTot)}`
        ];
        finItems.forEach(i => children.push(this._para("•  " + i, { indent: 0.3, spaceAfter: 60 })));

        children.push(this._rule(), this._article("5. INDEPENDENT COUNSEL"));
        children.push(this._para("The Undersigned acknowledges that she has had the opportunity to consult with independent legal counsel regarding the legal consequences of this waiver and has either done so or knowingly and voluntarily declined."));

        children.push(this._rule(), this._article("6. BINDING EFFECT"));
        children.push(this._para("This waiver shall be binding upon the Undersigned, her heirs, executors, administrators, and assigns."));

        children.push(this._rule(), this._article("SIGNATURE"));
        children.push(this._para("I, the Undersigned, have read and understand this Waiver and sign it freely and voluntarily.", { spaceAfter: 400 }));
        children.push(...this._sigBlock(spouse.toUpperCase()));

        children.push(this._rule(), this._article("NOTARY ACKNOWLEDGMENT"));
        children.push(this._subTitlePara("STATE OF TENNESSEE"));
        children.push(this._subTitlePara(`COUNTY OF ${county.toUpperCase().replace(' COUNTY', '')}`));
        children.push(this._para(`Before me, the undersigned Notary Public, personally appeared ${spouse.toUpperCase()}, who acknowledged she executed this waiver freely and voluntarily.`, { spaceAfter: 400 }));
        children.push(...this._sigBlock("Notary Public, State of Tennessee", false));
        children.push(this._detailLine("My Commission Expires"));
        children.push(this._para("[NOTARY SEAL]", { spaceBefore: 160 }));

        children.push(...this._disclaimer());

        return await this._saveDoc(children, `02_Waiver_Elective_Share_${this._safe(spouse)}.docx`);
    }

    async genChecklist() {
        const name = this._name();
        const county = this._county();
        const spouse = this.sp.full_name || "[SPOUSE]";
        const ep = this.exe.primary || "[EXECUTOR]";
        const ea = this.exe.alternate || "[ALT EXECUTOR]";
        const gp = this.grd.primary || "[GUARDIAN]";
        const ga = this.grd.alternate || "[ALT GUARDIAN]";

        const children = [];
        children.push(this._titlePara("TENNESSEE ISLAMIC WILL"));
        children.push(this._titlePara("EXECUTION CHECKLIST"));
        children.push(this._subTitlePara(`${name}  ·  ${county}`));
        children.push(this._rule());

        const phases = [
            ["PHASE 1 — BEFORE THE SIGNING APPOINTMENT", [
                ["Legal Review", [
                    "Have the Will and Waiver reviewed by a Tennessee-licensed estate planning attorney",
                    "Fill in parents' full legal names in the distribution article of the Will",
                    "Name a specific Waqf organization for the Mosul bequest (Article VI)",
                    "Confirm daughters are minors if the guardian clause is to be active",
                ]],
                ["Deed Review  (CRITICAL — $750,000 at stake)", [
                    `Pull the home deed from ${county} Register of Deeds`,
                    "Identify deed type: JTWROS (auto to spouse) vs. Tenants in Common (passes through Will)",
                    "If JTWROS: consult attorney about re-titling as Tenants in Common for Fara'id compliance",
                ]],
                ["Two Disinterested Witnesses", [
                    "Both must be adults (18+) and NOT named as beneficiaries in this Will",
                    `Cannot be: ${spouse}, Ayah Altalib, Leena Altalib, parents, ${gp}, or ${ga}`,
                    "Both must attend the signing simultaneously",
                ]],
                ["Notary Public", [
                    `Locate a Notary in ${county} (banks, UPS Store, County Clerk's office)`,
                    "Schedule signing appointment with both witnesses and Notary present",
                ]],
            ]],
            ["PHASE 2 — SIGNING DAY", [
                [`${name} (Testator)`, [
                    "Bring government-issued photo ID",
                    "Sign the Will in the presence of both witnesses and the Notary",
                    "Initial every page (recommended best practice)",
                    "Sign the Self-Proving Affidavit before the Notary",
                ]],
                ["Both Witnesses", [
                    "Watch the Testator sign",
                    "Sign in the Testator's presence and in each other's presence",
                    "Print full legal name and current address",
                ]],
                ["Notary", [
                    "Administer oath for the Self-Proving Affidavit",
                    "All three (Testator + 2 witnesses) sign affidavit before Notary",
                    "Notary affixes official seal and signs with commission expiration date",
                ]],
                [`${spouse} — Elective Share Waiver (same appointment)`, [
                    `${spouse} signs the Waiver of Elective Share before the Notary`,
                    `${spouse} had opportunity to review with independent legal counsel`,
                    "Notary notarizes signature on the Waiver as a separate document",
                    "Store Waiver separately from the Will (but keep them together)",
                ]],
            ]],
            ["PHASE 3 — AFTER SIGNING", [
                ["Document Storage", [
                    "Store original Will + Waiver in a fireproof home safe",
                    "DO NOT store the original Will in a safe deposit box (may require probate to access)",
                    `Give ${spouse} a copy; tell her where the original is stored`,
                    "Give a copy to your estate planning attorney for their file",
                ]],
                ["Non-Probate Asset Updates  (complete within 30 days)", [
                    "Update 401k beneficiary designations per Fara'id percentages (see Document 4)",
                    "Update life insurance beneficiary designations",
                    "Update any POD/TOD bank or investment account designations",
                    "Re-title home deed from JTWROS to Tenants in Common if applicable",
                ]],
            ]],
            ["PHASE 4 — ONGOING MAINTENANCE", [
                ["Re-execute the Will after any of these events", [
                    "Death of a named heir (father, mother, or either daughter)",
                    `Death or incapacity of ${ep}, ${ea}, ${gp}, or ${ga}`,
                    "Birth of a new child",
                    "Marriage or divorce (Tennessee auto-revokes wills upon both)",
                    "Significant change in estate value (>25%)",
                    "Completion of the Mosul Waqf transfer — update or remove Article VI",
                ]],
                ["Routine", [
                    "Review the Will and all beneficiary designations every 3–5 years regardless of life events",
                ]],
            ]],
        ];

        for (const [phaseTitle, sections] of phases) {
            children.push(this._article(phaseTitle));
            for (const [sectionTitle, items] of sections) {
                children.push(this._para(sectionTitle, { bold: true, spaceBefore: 160, spaceAfter: 40 }));
                for (const item of items) {
                    children.push(new Paragraph({
                        text: item,
                        font: FONT,
                        bullet: { level: 0 }
                    }));
                }
            }
            children.push(this._rule());
        }

        children.push(this._article("TENNESSEE REQUIREMENTS — QUICK REFERENCE"));
        const rows = [
            this._tableHeader(["Requirement", "Detail", "Statute"], SMALL_PT)
        ];
        [
            ["Writing", "Must be a written document", "T.C.A. § 32-1-104"],
            ["Testator Signature", "Must sign in presence of both witnesses", "T.C.A. § 32-1-104"],
            ["Two Witnesses", "Disinterested adults; sign in each other's presence", "T.C.A. § 32-1-104"],
            ["Self-Proving Affidavit", "Notarized at signing; eliminates witness testimony at probate", "T.C.A. § 32-1-104"],
            ["Spousal Elective Share", "Surviving spouse may claim 10–40% without waiver", "T.C.A. § 31-4-101"],
            ["Elective Share Waiver", "Spouse signs voluntarily with fair financial disclosure", "T.C.A. § 31-4-102"],
            ["Year's Support Waiver", "Included in Waiver document", "T.C.A. § 30-2-102"],
            ["Revocation — Marriage", "Prior will auto-revoked upon remarriage", "T.C.A. § 32-1-201"],
            ["Revocation — Divorce", "Ex-spouse provisions auto-revoked upon divorce", "T.C.A. § 32-1-202"],
            ["Guardianship", "Will nomination honored under 'best interest' standard", "T.C.A. § 36-6-106"],
            ["No-Contest Clause", "In terrorem clauses are enforceable", "T.C.A. § 32-3-119"]
        ].forEach(r => rows.push(this._tableRow(r, false, SMALL_PT)));

        children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));

        children.push(...this._disclaimer());
        return await this._saveDoc(children, `03_Execution_Checklist_${this._safe(name)}.docx`);
    }

    async genBeneficiary() {
        const name = this._name();
        const county = this._county();
        const shares = this.dist.shares || [];
        const ret = this.est.retirement_401k || 0;
        const home_v = (this.est.home && this.est.home.value) || 0;
        const home_h = home_v / 2;
        const wasTot = this._wasiyyah_total();

        const children = [];
        children.push(this._titlePara("BENEFICIARY DESIGNATION ACTION PLAN"));
        children.push(this._subTitlePara(`${name}  ·  ${county}`));
        children.push(this._para("These assets pass OUTSIDE the Will via beneficiary designation. Update each account separately to enforce Fara'id distribution.", { italic: true, spaceAfter: 240 }));
        children.push(this._rule());

        if (ret) {
            children.push(this._article(`401(k) / RETIREMENT ACCOUNTS — Estimated Value: ${this._formatCurrency(ret)}`));
            children.push(this._para("Action: Contact your plan administrator or HR department and submit a new Beneficiary Designation form with the following allocations:"));
            if (shares.length > 0) {
                const rows = [this._tableHeader(["Beneficiary", "Relationship", "Percentage", `Est. Amount (${this._formatCurrency(ret)})`])];
                shares.forEach(s => {
                    const pct = s.percentage || 0;
                    rows.push(this._tableRow([
                        s.heir || "",
                        s.relationship || "",
                        `${parseFloat(pct).toFixed(2)}%`,
                        this._formatCurrency(ret * pct / 100)
                    ]));
                });
                children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
                children.push(this._para("", { spaceAfter: 200 }));
            }
            children.push(this._para("Plan Administrator: _______________________    Account #: _______________"));
            children.push(this._rule());
        }

        if (home_v) {
            children.push(this._article(`HOME — Estimated Value: ${this._formatCurrency(home_v)} (Joint with Spouse)`));
            children.push(this._para("Pull your deed from the County Register of Deeds and confirm titling:"));
            children.push(this._para(`☐  Joint Tenants with Right of Survivorship (JTWROS): Full ${this._formatCurrency(home_v)} passes to spouse automatically — bypasses all other heirs. Consult attorney about re-titling as Tenants in Common.`, { indent: 0.3 }));
            children.push(this._para(`☐  Tenants in Common: Your 50% share (${this._formatCurrency(home_h)}) passes through this Will per Fara'id. No deed change needed.`, { indent: 0.3 }));
            children.push(this._rule());
        }

        if (shares.length > 0) {
            children.push(this._article("FULL ESTATE — COMPLETE ISLAMIC PICTURE"));
            children.push(this._para("If all assets are updated to follow Fara'id:", { italic: true }));

            const rows = [this._tableHeader(["Heir", "Probate Will", "401k (update)", "Home 50% (re-title)", "TOTAL"], SMALL_PT)];
            let colProb = 0, colRet = 0, colHome = 0, colAll = 0;

            shares.forEach(s => {
                const pct = s.percentage || 0;
                const prob = s.amount || 0;
                const rVal = ret * pct / 100;
                const hVal = (s.relationship === "Wife") ? home_h : 0;
                const total = prob + rVal + hVal;

                colProb += prob; colRet += rVal; colHome += hVal; colAll += total;

                rows.push(this._tableRow([
                    s.heir || "",
                    this._formatCurrency(prob),
                    this._formatCurrency(rVal),
                    hVal ? this._formatCurrency(hVal) : "—",
                    this._formatCurrency(total)
                ], false, SMALL_PT));
            });

            if (wasTot) {
                rows.push(this._tableRow(["Wasiyyah (Waqf)", this._formatCurrency(wasTot), "—", "—", this._formatCurrency(wasTot)], false, SMALL_PT));
                colProb += wasTot; colAll += wasTot;
            }

            rows.push(this._tableRow(["TOTAL", this._formatCurrency(colProb), this._formatCurrency(colRet), this._formatCurrency(colHome), this._formatCurrency(colAll)], true, SMALL_PT));
            children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));

            children.push(this._para("", { spaceAfter: 120 }));
            children.push(this._para("* Spouse retains her own 50% of home as co-owner regardless of deed type.", { size: SMALL_PT, italic: true }));
            children.push(this._rule());
        }

        children.push(...this._disclaimer());

        return await this._saveDoc(children, `04_Beneficiary_Designations_${this._safe(name)}.docx`);
    }
}

async function main() {
    const args = process.argv.slice(2);
    let dataFile = args[0];
    let outDir = "./output";

    if (!dataFile || ['--help', '-h'].includes(dataFile)) {
        console.log("Generate Islamic Will Word (.docx) documents from a JSON data file.");
        console.log("Usage:\n  node script/generate_docs.js will_data.json\n  node script/generate_docs.js will_data.json --output-dir ./output/zaid\n");
        return;
    }

    if (args[1] === '--output-dir' && args[2]) {
        outDir = args[2];
    } else if (args[0] === '--output-dir' && args[1]) {
        outDir = args[1];
        dataFile = args[2];
    }

    if (!fs.existsSync(dataFile)) {
        console.error(`Error: file not found — ${dataFile}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`\nIslamic Will Document Generator (Node.js/docx)`);
    console.log(`${'─'.repeat(40)}`);

    const gen = new IslamicWillGenerator(data, outDir);
    const paths = await gen.generateAll();

    console.log(`\nSaved to: ${path.resolve(outDir)}`);
    for (const p of paths) {
        console.log(`  ✓ ${path.basename(p)}`);
    }
    console.log("\nNext: open each document, complete [BRACKETED FIELDS], then proceed to signing.");
}

main().catch(err => {
    console.error("Error generating documents:", err);
    process.exit(1);
});
