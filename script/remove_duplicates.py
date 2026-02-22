import sys
import os

filepath = '/Users/zaid/claude/islamic_will_agent/script/test_inheritance_scenarios.py'
sys.path.append('/Users/zaid/claude/islamic_will_agent/script')

from test_inheritance_scenarios import scenarios

unique_scenarios = []
seen_heirs = set()

def heir_to_tuple(heir):
    return (
        heir.relationship, 
        heir.count, 
        getattr(heir, 'is_muslim', True), 
        getattr(heir, 'is_killer', False), 
        getattr(heir, 'killer_type', "none"), 
        getattr(heir, 'is_adopted', False), 
        getattr(heir, 'is_step_relation', False), 
        getattr(heir, 'is_missing', False), 
        getattr(heir, 'is_fetus', False)
    )

for s in scenarios:
    heirs_tuple = tuple(sorted([heir_to_tuple(h) for h in s["heirs"]]))
    
    if "Shafi'i - Al-Mushtaraka" in s["name"]:
        heirs_tuple = (*heirs_tuple, "shafii_mushtaraka")
    if "Hanafi - No Mushtaraka" in s["name"]:
        heirs_tuple = (*heirs_tuple, "hanafi_no_mushtaraka")
        
    if heirs_tuple not in seen_heirs:
        seen_heirs.add(heirs_tuple)
        unique_scenarios.append(s)

print(f"Original count: {len(scenarios)}")
print(f"Unique count: {len(unique_scenarios)}")

def heir_to_str(heir):
    args = [f'"{heir.relationship}"']
    if heir.count != 1:
        args.append(f'count={heir.count}')
    if not getattr(heir, 'is_muslim', True):
        args.append('is_muslim=False')
    if getattr(heir, 'is_killer', False):
        args.append('is_killer=True')
    if getattr(heir, 'killer_type', "none") != "none":
        args.append(f'killer_type="{heir.killer_type}"')
    if getattr(heir, 'is_adopted', False):
        args.append('is_adopted=True')
    if getattr(heir, 'is_step_relation', False):
        args.append('is_step_relation=True')
    if getattr(heir, 'is_missing', False):
        args.append('is_missing=True')
    if getattr(heir, 'is_fetus', False):
        args.append('is_fetus=True')
    return f"Heir({', '.join(args)})"

new_file_content = """import sys
import os

# Add current dir to path to import script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calculate_shares import IslamicInheritanceCalculator, Heir, Estate

scenarios = [
"""

for i, s in enumerate(unique_scenarios, 1):
    heirs_str = ", ".join([heir_to_str(h) for h in s['heirs']])
    original_name = s['name'].split(': ', 1)[1] if ': ' in s['name'] else s['name']
    
    new_file_content += "    {\n"
    new_file_content += f'        "name": "Scenario {i}: {original_name}",\n'
    new_file_content += f'        "heirs": [{heirs_str}]\n'
    new_file_content += "    }"
    if i < len(unique_scenarios):
        new_file_content += ",\n"
    else:
        new_file_content += "\n]\n\n"

new_file_content += """def run_tests():
    print("================ ISLAMIC INHERITANCE TEST SCENARIOS ================\\n")
    estate = Estate(gross_value=120000, funeral_expenses=0, debts=0, wasiyyah_amount=0)
    
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
        print("\\n")

if __name__ == '__main__':
    run_tests()
"""

# Re-checkout file to clear the broken syntax first
os.system(f"git checkout -- {filepath}")

# Write fixed content
with open(filepath, 'w') as f:
    f.write(new_file_content)

print("Duplicates removed and file fully rewritten.")
