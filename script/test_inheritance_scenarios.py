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
    }
]

def run_tests():
    print("================ ISLAMIC INHERITANCE TEST SCENARIOS ================\n")
    estate = Estate(gross_value=120000, funeral_expenses=0, debts=0, wasiyyah_amount=0)
    
    for i, s in enumerate(scenarios, 1):
        print(f"--- {s['name']} ---")
        try:
            # We use Hanafi for most, but Shafii for Scenario 12
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
