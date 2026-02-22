import sys
import os

# Add current dir to path to import script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calculate_shares import IslamicInheritanceCalculator, Heir, Estate

scenarios = [
    {
        "name": "Scenario 1: Husband and Father (No children, no mother)",
        "heirs": [Heir("husband"), Heir("father")]
    },
    {
        "name": "Scenario 2: Wife, 1 Son, 1 Daughter",
        "heirs": [Heir("wife"), Heir("son"), Heir("daughter")]
    },
    {
        "name": "Scenario 3: 2 Wives, 3 Sons, 2 Daughters, Father, Mother",
        "heirs": [Heir("wife", count=2), Heir("son", count=3), Heir("daughter", count=2), Heir("father"), Heir("mother")]
    },
    {
        "name": "Scenario 4: The 'Aul' Case (Husband, 2 Daughters, Father, Mother)",
        "heirs": [Heir("husband"), Heir("daughter", count=2), Heir("father"), Heir("mother")]
    },
    {
        "name": "Scenario 5: 1 Daughter, Mother, Father (No sons)",
        "heirs": [Heir("daughter"), Heir("mother"), Heir("father")]
    },
    {
        "name": "Scenario 6: Husband, Mother, Full Brother (Kalala)",
        "heirs": [Heir("husband"), Heir("mother"), Heir("brother")]
    },
    {
        "name": "Scenario 7: 4 Wives, 4 Daughters, Father, Mother",
        "heirs": [Heir("wife", count=4), Heir("daughter", count=4), Heir("father"), Heir("mother")]
    },
    {
        "name": "Scenario 8: Only 1 Son",
        "heirs": [Heir("son")]
    },
    {
        "name": "Scenario 9: Only Father and Mother",
        "heirs": [Heir("father"), Heir("mother")]
    },
    {
        "name": "Scenario 10: Husband, 1 Daughter, Paternal Grandfather (no father)",
        "heirs": [Heir("husband"), Heir("daughter"), Heir("grandfather")]
    },
    {
        "name": "Scenario 11: 1 Wife, Mother, 2 Consanguine Brothers (Paternal Brothers)",
        "heirs": [Heir("wife"), Heir("mother"), Heir("paternal_brother", count=2)]
    },
    {
        "name": "Scenario 12: Fetus Case (Shafi'i)",
        "heirs": [Heir("wife"), Heir("son", is_fetus=True), Heir("father")]
    },
    {
        "name": "Scenario 13: 1 Wife, 1 Daughter, Paternal Uncle",
        "heirs": [Heir("wife"), Heir("daughter"), Heir("paternal_uncle")]
    },
    {
        "name": "Scenario 14: 1 Husband, 1 Son, 1 Grandson",
        "heirs": [Heir("husband"), Heir("son"), Heir("grandson")]
    },
    {
        "name": "Scenario 15: 1 Husband, 1 Grandson (No Son)",
        "heirs": [Heir("husband"), Heir("grandson")]
    },
    {
        "name": "Scenario 16: Father, Mother, 1 Brother, 1 Sister",
        "heirs": [Heir("father"), Heir("mother"), Heir("brother"), Heir("sister")]
    },
    {
        "name": "Scenario 17: Husband, Mother, Father",
        "heirs": [Heir("husband"), Heir("mother"), Heir("father")]
    },
    {
        "name": "Scenario 18: Husband, Mother, Paternal Grandfather",
        "heirs": [Heir("husband"), Heir("mother"), Heir("grandfather")]
    },
    {
        "name": "Scenario 19: Wife, 2 Daughters, Mother, Father",
        "heirs": [Heir("wife"), Heir("daughter", count=2), Heir("mother"), Heir("father")]
    },
    {
        "name": "Scenario 20: 3 Daughters, 1 Paternal Uncle",
        "heirs": [Heir("daughter", count=3), Heir("paternal_uncle")]
    },
    {
        "name": "Scenario 21: Wife, 1 Full Sister, 1 Paternal Sister",
        "heirs": [Heir("wife"), Heir("sister"), Heir("paternal_sister")]
    },
    {
        "name": "Scenario 22: Husband, 1 Full Sister, 1 Uterine Brother",
        "heirs": [Heir("husband"), Heir("sister"), Heir("uterine_brother")]
    },
    {
        "name": "Scenario 23: 1 Daughter, 1 Son's Daughter",
        "heirs": [Heir("daughter"), Heir("granddaughter")]
    },
    {
        "name": "Scenario 24: 2 Daughters, 1 Son's Daughter",
        "heirs": [Heir("daughter", count=2), Heir("granddaughter")]
    },
    {
        "name": "Scenario 25: 2 Daughters, 1 Son's Daughter, 1 Son's Son",
        "heirs": [Heir("daughter", count=2), Heir("granddaughter"), Heir("grandson")]
    },
    {
        "name": "Scenario 26: Wife, 1 Daughter, 1 Full Sister",
        "heirs": [Heir("wife"), Heir("daughter"), Heir("sister")]
    },
    {
        "name": "Scenario 27: Mother, 2 Uterine Sisters",
        "heirs": [Heir("mother"), Heir("uterine_sister", count=2)]
    },
    {
        "name": "Scenario 28: 1 Full Sister, 1 Paternal Sister, 1 Uterine Brother",
        "heirs": [Heir("sister"), Heir("paternal_sister"), Heir("uterine_brother")]
    },
    {
        "name": "Scenario 29: Wife, Mother, 1 Brother (Shafi'i)",
        "heirs": [Heir("wife"), Heir("mother"), Heir("brother")]
    },
    {
        "name": "Scenario 30: Wife, Mother, 2 Brothers",
        "heirs": [Heir("wife"), Heir("mother"), Heir("brother", count=2)]
    },
    {
        "name": "Scenario 31: 4 Wives, 1 Son",
        "heirs": [Heir("wife", count=4), Heir("son")]
    },
    {
        "name": "Scenario 32: Husband, 2 Full Sisters",
        "heirs": [Heir("husband"), Heir("sister", count=2)]
    },
    {
        "name": "Scenario 33: Wife, 2 Full Sisters, Mother",
        "heirs": [Heir("wife"), Heir("sister", count=2), Heir("mother")]
    },
    {
        "name": "Scenario 34: Husband, Mother, 2 Uterine Brothers",
        "heirs": [Heir("husband"), Heir("mother"), Heir("uterine_brother", count=2)]
    },
    {
        "name": "Scenario 35: Husband, Mother, 2 Uterine Brothers, 1 Full Brother (Shafi'i - Al-Mushtaraka)",
        "heirs": [Heir("husband"), Heir("mother"), Heir("uterine_brother", count=2), Heir("brother")]
    },
    {
        "name": "Scenario 36: Husband, Mother, 2 Uterine Brothers, 1 Full Brother (Hanafi - No Mushtaraka)",
        "heirs": [Heir("husband"), Heir("mother"), Heir("uterine_brother", count=2), Heir("brother")]
    },
    {
        "name": "Scenario 37: 1 Daughter, Mother, 1 Brother",
        "heirs": [Heir("daughter"), Heir("mother"), Heir("brother")]
    },
    {
        "name": "Scenario 38: 2 Daughters, Mother, Father",
        "heirs": [Heir("daughter", count=2), Heir("mother"), Heir("father")]
    },
    {
        "name": "Scenario 39: 1 Paternal Grandfather, 1 Full Sister (Hanafi)",
        "heirs": [Heir("grandfather"), Heir("sister")]
    },
    {
        "name": "Scenario 40: Wife, 1 Paternal Grandfather, 2 Full Brothers (Hanafi)",
        "heirs": [Heir("wife"), Heir("grandfather"), Heir("brother", count=2)]
    },
    {
        "name": "Scenario 41: Husband, 1 Daughter, 1 Son's Daughter",
        "heirs": [Heir("husband"), Heir("daughter"), Heir("granddaughter")]
    },
    {
        "name": "Scenario 42: Wife, 3 Daughters, Mother",
        "heirs": [Heir("wife"), Heir("daughter", count=3), Heir("mother")]
    },
    {
        "name": "Scenario 43: Father, 1 Full Sister, 1 Consanguine Brother",
        "heirs": [Heir("father"), Heir("sister"), Heir("paternal_brother")]
    },
    {
        "name": "Scenario 44: Mother, 1 Full Brother, 1 Uterine Brother",
        "heirs": [Heir("mother"), Heir("brother"), Heir("uterine_brother")]
    },
    {
        "name": "Scenario 45: 1 Son, 1 Adopted Son",
        "heirs": [Heir("son"), Heir("son", is_adopted=True)]
    },
    {
        "name": "Scenario 46: 1 Daughter, 1 Step-Son",
        "heirs": [Heir("daughter"), Heir("son", is_step_relation=True)]
    },
    {
        "name": "Scenario 47: Wife, 1 Son (Missing)",
        "heirs": [Heir("wife"), Heir("son", is_missing=True)]
    },
    {
        "name": "Scenario 48: Husband, 1 Son (Killer)",
        "heirs": [Heir("husband"), Heir("son", is_killer=True)]
    },
    {
        "name": "Scenario 49: Mother, 1 Daughter (Killer, Shafi'i)",
        "heirs": [Heir("mother"), Heir("daughter", is_killer=True)]
    },
    {
        "name": "Scenario 50: 1 Daughter, Paternal Uncle's Son",
        "heirs": [Heir("daughter"), Heir("paternal_uncle_son")]
    },
    {
        "name": "Scenario 51: 2 Daughters, 1 Full Sister, 1 Paternal Sister",
        "heirs": [Heir("daughter", count=2), Heir("sister"), Heir("paternal_sister")]
    },
    {
        "name": "Scenario 52: Father, 1 Uterine Brother, 1 Uterine Sister",
        "heirs": [Heir("father"), Heir("uterine_brother"), Heir("uterine_sister")]
    },
    {
        "name": "Scenario 53: Wife, Mother, 1 Uterine Brother",
        "heirs": [Heir("wife"), Heir("mother"), Heir("uterine_brother")]
    },
    {
        "name": "Scenario 54: Husband, 1 Adopted Daughter",
        "heirs": [Heir("husband"), Heir("daughter", is_adopted=True)]
    },
    {
        "name": "Scenario 55: Paternal Grandfather, 1 Daughter, 1 Paternal Uncle",
        "heirs": [Heir("grandfather"), Heir("daughter"), Heir("paternal_uncle")]
    },
    {
        "name": "Scenario 56: Wife, Mother, 1 Consanguine Sister",
        "heirs": [Heir("wife"), Heir("mother"), Heir("paternal_sister")]
    },
    {
        "name": "Scenario 57: Husband, 1 Consanguine Brother, 1 Consanguine Sister",
        "heirs": [Heir("husband"), Heir("paternal_brother"), Heir("paternal_sister")]
    },
    {
        "name": "Scenario 58: Mother, 1 Full Brother, 1 Consanguine Brother",
        "heirs": [Heir("mother"), Heir("brother"), Heir("paternal_brother")]
    },
    {
        "name": "Scenario 59: Wife, 1 Uterine Brother, 1 Uterine Sister",
        "heirs": [Heir("wife"), Heir("uterine_brother"), Heir("uterine_sister")]
    },
    {
        "name": "Scenario 60: 1 Son, 1 Non-Muslim Daughter",
        "heirs": [Heir("son"), Heir("daughter", is_muslim=False)]
    },
    {
        "name": "Scenario 61: Al-Akdariyyah (Shafi'i) - Husband, Mother, Grandfather, Full Sister",
        "heirs": [Heir("husband"), Heir("mother"), Heir("grandfather"), Heir("sister")]
    },
    {
        "name": "Scenario 62: Akdariyyah Family but Hanafi Rules - Husband, Mother, Grandfather, Full Sister",
        "heirs": [Heir("husband"), Heir("mother"), Heir("grandfather"), Heir("sister")]
    }
]

def run_tests():
    print("================ ISLAMIC INHERITANCE TEST SCENARIOS ================\n")
    estate = Estate(gross_value=120000, funeral_expenses=5000, debts=10000, wasiyyah_amount=0)
    
    for i, s in enumerate(scenarios, 1):
        print(f"--- {s['name']} ---")
        try:
            madhhab = "shafii" if "Shafi'i" in s['name'] else "hanafi"
            calc = IslamicInheritanceCalculator(madhhab)
            
            result = calc.calculate(estate, s["heirs"])
            print(f"Status: {result['status']}")
            
            dist = result["distribution"]
            if "shares_percent" in dist:
                total_percent = sum(dist["shares_percent"].values())
                for k, pct in dist["shares_percent"].items():
                    val = dist["shares_value"][k]
                    print(f"  {k}: {pct*100:.2f}% (${val:,.2f})")
                print(f"  [Total Distribution: {total_percent * 100:.2f}%]")
            
        except Exception as e:
            print(f"  ERROR calculating scenario: {e}")
        print("\n")

if __name__ == '__main__':
    run_tests()
