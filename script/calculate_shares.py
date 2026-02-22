import math
from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class Heir:
    relationship: str
    count: int = 1
    is_muslim: bool = True
    is_killer: bool = False
    killer_type: str = "none" # "intentional", "accidental", "indirect"
    is_adopted: bool = False
    is_step_relation: bool = False
    is_missing: bool = False
    is_fetus: bool = False

@dataclass
class Estate:
    gross_value: float
    funeral_expenses: float = 0.0
    debts: float = 0.0 # Religious + Secular
    wasiyyah_amount: float = 0.0 # Bequest

class IslamicInheritanceCalculator:
    def __init__(self, madhhab: str = "hanafi"):
        self.madhhab = madhhab.lower()
        self.log = []

    def calculate(self, estate: Estate, heirs_input: List[Heir]) -> Dict[str, Any]:
        self.log.append(f"Starting calculation using {self.madhhab.capitalize()} fiqh.")
        
        # 1. Estate Liquidation
        net_after_funeral = estate.gross_value - estate.funeral_expenses
        if net_after_funeral < 0:
            net_after_funeral = 0
            
        net_after_debts = net_after_funeral - estate.debts
        if net_after_debts <= 0:
            return {"status": "Estate exhausted by debts.", "distribution": {}, "log": self.log}
            
        max_wasiyyah = net_after_debts / 3.0
        actual_wasiyyah = min(estate.wasiyyah_amount, max_wasiyyah)
        
        if estate.wasiyyah_amount > max_wasiyyah:
            self.log.append("Wasiyyah reduced to 1/3 limit.")
            
        net_mirath = net_after_debts - actual_wasiyyah
        self.log.append(f"Net Mirath available: {net_mirath:.2f}")

        # 2. Impediments / Invalid Heirs
        valid_heirs = []
        for heir in heirs_input:
            if not heir.is_muslim:
                self.log.append(f"Excluded {heir.relationship} (Difference of Religion).")
                continue
            if heir.is_adopted or heir.is_step_relation:
                self.log.append(f"Excluded {heir.relationship} (Adopted/Step relation - no Nasab).")
                continue
            if heir.is_killer:
                if self.madhhab == "shafii":
                    self.log.append(f"Excluded {heir.relationship} (Killer - Shafii absolute bar).")
                    continue
                elif self.madhhab == "hanafi" and heir.killer_type in ["intentional", "direct"]:
                    self.log.append(f"Excluded {heir.relationship} (Killer - Hanafi direct bar).")
                    continue
                elif self.madhhab == "hanafi" and heir.killer_type in ["accidental", "indirect"]:
                    self.log.append(f"Allowed {heir.relationship} (Killer - Hanafi accidental/indirect exception).")
            
            valid_heirs.append(heir)

        # Handle Fetus edge cases
        fetus_reserve_factor = 2 if self.madhhab == "shafii" else 1
        
        # Build heir counts
        counts = {}
        for h in valid_heirs:
            count = h.count
            if h.is_fetus:
                count = fetus_reserve_factor
                self.log.append(f"Reserved share for {count} {h.relationship}(s) due to pregnancy ({self.madhhab}).")
            
            if h.is_missing:
                self.log.append(f"Missing person ({h.relationship}) share must be reserved.")    
                
            counts[h.relationship] = counts.get(h.relationship, 0) + count

        # 3. Hajb (Exclusion Rules)
        active = counts.copy()
        
        # Son excludes grandson, siblings, distant kindred
        if active.get("son", 0) > 0:
            for ex in ["grandson", "brother", "sister", "paternal_brother", "uterine_brother", "paternal_uncle"]:
                if ex in active:
                    self.log.append(f"Son excluded {ex}.")
                    active.pop(ex, None)
                    
        # Father excludes grandfather, brothers, sisters
        if active.get("father", 0) > 0:
            for ex in ["grandfather", "brother", "sister", "paternal_brother", "uterine_brother"]:
                if ex in active:
                    self.log.append(f"Father excluded {ex}.")
                    active.pop(ex, None)
                    
        # Hanafi: Grandfather excludes brothers. Shafii: Grandfather shares.
        if active.get("grandfather", 0) > 0 and self.madhhab == "hanafi":
            for ex in ["brother", "sister", "paternal_brother"]:
                if ex in active:
                    self.log.append(f"Grandfather excluded {ex} (Hanafi rule).")
                    active.pop(ex, None)

        # 4. Zawil Furood (Fixed Shares)
        has_children = active.get("son", 0) > 0 or active.get("daughter", 0) > 0
        has_siblings = sum(active.get(k, 0) for k in ["brother", "sister", "uterine_brother", "uterine_sister", "paternal_brother", "paternal_sister"]) >= 2
        
        shares = {}
        
        # Spouses
        if "husband" in active:
            shares["husband"] = 0.25 if has_children else 0.5
        if "wife" in active:
            shares["wife"] = 0.125 if has_children else 0.25
            
        # Parents
        if "father" in active:
            shares["father"] = 1/6 if has_children else 0 # Takes residue later
        if "mother" in active:
            if not has_children and not has_siblings and "father" in active and ("husband" in active or "wife" in active):
                spouse_share = shares.get("husband", 0) + shares.get("wife", 0)
                shares["mother"] = (1.0 - spouse_share) / 3.0
                self.log.append("Umariyyataini applied: Mother gets 1/3 of remainder after spouse.")
            else:
                shares["mother"] = 1/6 if (has_children or has_siblings) else 1/3
            
        # Grandfather (if no father)
        if "grandfather" in active and "father" not in active:
            shares["grandfather"] = 1/6 if has_children else 0

        # Daughters (if no sons)
        sons = active.get("son", 0)
        daughters = active.get("daughter", 0)
        if sons == 0 and daughters > 0:
            shares["daughter"] = 0.5 if daughters == 1 else 2/3
            
        # Granddaughters (Son's Daughters)
        grandsons = active.get("grandson", 0)
        granddaughters = active.get("granddaughter", 0)
        if granddaughters > 0 and sons == 0 and grandsons == 0:
            if daughters == 0:
                shares["granddaughter"] = 0.5 if granddaughters == 1 else 2/3
            elif daughters == 1:
                shares["granddaughter"] = 1/6 # Completes the 2/3 limit with the single daughter
            
        # Uterine siblings (if no children, father, grandfather)
        uterine_sibs = active.get("uterine_brother", 0) + active.get("uterine_sister", 0)
        if uterine_sibs > 0 and not has_children and "father" not in active and "grandfather" not in active:
            shares["uterine_siblings"] = 1/6 if uterine_sibs == 1 else 1/3
            
        # Full sisters (if no full brothers, daughters, sons, father, grandfather)
        full_bros = active.get("brother", 0)
        full_sisters = active.get("sister", 0)
        if full_sisters > 0 and full_bros == 0 and not has_children and "father" not in active and "grandfather" not in active:
            shares["sister"] = 0.5 if full_sisters == 1 else 2/3
            
        # Paternal sisters (if no paternal brothers, full siblings, children, father, grandfather)
        pat_bros = active.get("paternal_brother", 0)
        pat_sisters = active.get("paternal_sister", 0)
        if pat_sisters > 0 and pat_bros == 0 and full_bros == 0 and not has_children and "father" not in active and "grandfather" not in active:
            if full_sisters == 0:
                shares["paternal_sister"] = 0.5 if pat_sisters == 1 else 2/3
            elif full_sisters == 1:
                shares["paternal_sister"] = 1/6 # Completes the 2/3 limit
            
        # Shafi'i Al-Mushtaraka scenario
        uterine_bros = active.get("uterine_brother", 0)
        if self.madhhab == "shafii" and "husband" in active and "mother" in active and uterine_bros >= 2 and full_bros > 0 and not has_children:
            self.log.append("Al-Mushtaraka applied (Shafi'i): Full brothers share with uterine brothers.")
            shares["shared_brothers"] = 1/3 

        # Al-Akdariyyah Exception (Shafi'i)
        is_akdariyyah = (
            self.madhhab == "shafii" and 
            "husband" in active and 
            "mother" in active and 
            "grandfather" in active and 
            (active.get("sister", 0) == 1 or active.get("paternal_sister", 0) == 1) and
            sum(active.values()) == 4
        )
        if is_akdariyyah:
            self.log.append("Al-Akdariyyah Exception applied (Shafi'i).")
            shares["husband"] = 3/9
            shares["mother"] = 2/9
            sister_key = "sister" if "sister" in active else "paternal_sister"
            shares["grandfather"] = (4/9) * (2/3)
            shares[sister_key] = (4/9) * (1/3)

        # 5. Al-Awl
        total_shares = sum(shares.values())
        status = "Standard Distribution"
        
        if total_shares > 1.0:
            status = f"Aul Applied (Total shares {total_shares:.2f} exceeded 1.0)"
            for k in shares:
                shares[k] = shares[k] / total_shares
                
        # 6. Asaba (Residue)
        remaining = 1.0 - sum(shares.values())
        if remaining > 0.0001:
            if remaining > 1.0: remaining = 1.0 # Float precision safety
            
            if sons > 0:
                total_parts = (sons * 2) + daughters
                part_val = remaining / total_parts
                if sons > 0: shares["son"] = part_val * 2 * sons
                if daughters > 0: shares["daughter"] = part_val * daughters
                status = "Residue distributed to children."
            elif grandsons > 0:
                total_parts = (grandsons * 2) + granddaughters
                part_val = remaining / total_parts
                shares["grandson"] = part_val * 2 * grandsons
                if granddaughters > 0: shares["granddaughter"] = part_val * granddaughters
                status = "Residue distributed to grandchildren."
            elif daughters > 0 and (full_sisters > 0 or pat_sisters > 0):
                if full_sisters > 0:
                    shares["sister"] = remaining
                    status = "Residue given to full sisters (with daughters)."
                else:
                    shares["paternal_sister"] = remaining
                    status = "Residue given to paternal sisters (with daughters)."
            elif "father" in active:
                shares["father"] = shares.get("father", 0) + remaining
                status = "Residue given to father."
            elif "grandfather" in active and "brother" in active and self.madhhab == "shafii":
                total_males = active["grandfather"] + active["brother"]
                part = remaining / total_males
                shares["grandfather"] = shares.get("grandfather", 0) + part * active["grandfather"]
                shares["brother"] = shares.get("brother", 0) + part * active["brother"]
                status = "Residue shared between Grandfather and Brothers (Shafi'i Muqasama)."
            elif "grandfather" in active:
                shares["grandfather"] = shares.get("grandfather", 0) + remaining
                status = "Residue given to grandfather."
            elif full_bros > 0:
                total_parts = (full_bros * 2) + full_sisters
                part_val = remaining / total_parts
                shares["brother"] = part_val * 2 * full_bros
                if full_sisters > 0: shares["sister"] = part_val * full_sisters
                status = "Residue given to full siblings."
            elif pat_bros > 0:
                total_parts = (pat_bros * 2) + pat_sisters
                part_val = remaining / total_parts
                shares["paternal_brother"] = part_val * 2 * pat_bros
                if pat_sisters > 0: shares["paternal_sister"] = part_val * pat_sisters
                status = "Residue given to paternal siblings."
            elif active.get("paternal_uncle", 0) > 0:
                shares["paternal_uncle"] = remaining
                status = "Residue given to paternal uncles."
            else:
                # 7. Radd
                status = "Radd (Return) applied to remaining heirs."
                radd_pool = {k:v for k,v in shares.items() if k not in ["husband", "wife"]}
                if sum(radd_pool.values()) > 0:
                    radd_sum = sum(radd_pool.values())
                    for k in radd_pool:
                        shares[k] += remaining * (radd_pool[k] / radd_sum)
                else:
                    shares["Bayt_al_Mal"] = remaining
                    
        # Distribute Net Mirath amounts
        distribution = {
            "liquidation": {
                "gross": estate.gross_value,
                "funeral": estate.funeral_expenses,
                "debts": estate.debts,
                "wasiyyah": actual_wasiyyah,
                "net_mirath": net_mirath
            },
            "shares_percent": {},
            "shares_value": {}
        }
        
        for k, v in shares.items():
            if v > 0:
                 # Adjust formatting for counts
                 label = f"{k.capitalize()} ({active[k]})" if active.get(k, 1) > 1 else k.capitalize()
                 distribution["shares_percent"][label] = v
                 distribution["shares_value"][label] = v * net_mirath

        return {
            "status": status,
            "distribution": distribution,
            "log": self.log
        }

if __name__ == "__main__":
    def print_result(title, result):
        print(f"=== {title} ===")
        print("Status:", result["status"])
        print("Logs:")
        for l in result["log"]: print(" -", l)
        print("Distribution (Percent & Value):")
        dist = result["distribution"]
        if "shares_percent" in dist:
            for k, pct in dist["shares_percent"].items():
                val = dist["shares_value"][k]
                print(f"  {k}: {pct*100:.2f}% (${val:,.2f})")
        print()

    # Test 1: Core Principles + Impediments (Hanafi)
    estate1 = Estate(100000, funeral_expenses=5000, debts=15000, wasiyyah_amount=50000)
    # Wasiyyah max is 80k / 3 = ~26.6k, so it should be capped.
    heirs1 = [
        Heir("wife"),
        Heir("son", is_adopted=True), # Adopted son excluded
        Heir("brother", is_killer=True, killer_type="accidental"), # Accidental killer allowed in Hanafi
        Heir("daughter") 
    ]
    calc = IslamicInheritanceCalculator("hanafi")
    res1 = calc.calculate(estate1, heirs1)
    print_result("Test 1: Impediments & Wasiyyah Cap (Hanafi)", res1)

    # Test 2: Shafi'i Killer + Fetus Edge Case
    estate2 = Estate(100000)
    heirs2 = [
        Heir("husband", is_killer=True, killer_type="accidental"), # Absolute bar in Shafii
        Heir("daughter"),
        Heir("son", is_fetus=True) # Shafii reserves for 2 sons
    ]
    calc2 = IslamicInheritanceCalculator("shafii")
    res2 = calc2.calculate(estate2, heirs2)
    print_result("Test 2: Fetus & Killer (Shafi'i)", res2)
    
    # Test 3: Grandfather vs Brothers (Hanafi vs Shafi'i)
    heirs3 = [Heir("grandfather"), Heir("brother", count=2)]
    res3_hanafi = IslamicInheritanceCalculator("hanafi").calculate(Estate(10000), heirs3)
    print_result("Test 3a: Grandfather vs Brothers (Hanafi)", res3_hanafi)
    res3_shafii = IslamicInheritanceCalculator("shafii").calculate(Estate(10000), heirs3)
    print_result("Test 3b: Grandfather vs Brothers (Shafi'i)", res3_shafii)
    
    # Test 4: Radd
    heirs4 = [Heir("wife"), Heir("daughter")]
    res4 = IslamicInheritanceCalculator("hanafi").calculate(Estate(100000), heirs4)
    print_result("Test 4: Radd (Hanafi)", res4)
    
    # Test 5: Aul
    heirs5 = [Heir("husband"), Heir("daughter", count=2), Heir("father"), Heir("mother")]
    res5 = IslamicInheritanceCalculator("hanafi").calculate(Estate(100000), heirs5)
    print_result("Test 5: Al-Aul", res5)
