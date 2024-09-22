import json
import re

def fix_emojis(text):
    emoji_map = {
        "\\ud83d\\udfe2": "🟢",
        "\\ud83d\\udd34": "🔴",
        "\\ud83d\\udcb8": "💸",
        "\\ud83c\\udd95": "🆕",
        "\\ud83d\\udd39": "🔹",
        "\\u270a": "✊",
        "\\ud83d\\udcc8": "📈",
        "\\ud83d\\udcc9": "📉",
        "\\ud83d\\udd17": "🔗"
    }
    for code, emoji in emoji_map.items():
        text = text.replace(code, emoji)
    return text

def fix_data(data):
    for item in data:
        # Fix emojis in all string fields
        for key, value in item.items():
            if isinstance(value, str):
                item[key] = fix_emojis(value)
        
        # Fix links dictionary
        if 'links' in item:
            fixed_links = {}
            for k, v in item['links'].items():
                if 'solscan.io/tx/' in v:
                    fixed_links['Transaction'] = v
                elif 'solscan.io/account/' in v:
                    fixed_links['Wallet'] = v
                elif k in ['BE', 'DS', 'DT', 'PF', 'Bullx', 'PH']:
                    fixed_links[k] = v
                elif 'solscan.io/token/' in v:
                    fixed_links['Token'] = v
            
            # If Token is not found, use the contract address from other links
            if 'Token' not in fixed_links and 'contract' in item:
                for link_type in ['DS', 'DT', 'PH']:
                    if link_type in fixed_links:
                        contract = item['contract']
                        fixed_links['Token'] = f"https://solscan.io/token/{contract}"
                        break
            
            item['links'] = fixed_links
        
        # Extract contract from links if not present
        if not item.get('contract') and item.get('links'):
            for link_type in ['DS', 'DT', 'PH']:
                if link_type in item['links']:
                    contract = item['links'][link_type].split('/')[-1]
                    item['contract'] = contract
                    break
        
        # Fix other fields
        for field in ['details', 'holdings', 'market_cap', 'seen_time']:
            if field in item:
                item[field] = item[field].strip() if item[field] else None

    return data

# Read the JSON data
input_file = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDashboard/data/tgInsiders_parsed.json'
output_file = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDashboard/data/tgInsiders_parsed_fixed.json'

with open(input_file, 'r') as f:
    data = json.load(f)

# Fix the data
fixed_data = fix_data(data)

# Write the fixed data back to a JSON file
with open(output_file, 'w') as f:
    json.dump(fixed_data, f, indent=2)

print(f"Data has been fixed and saved to '{output_file}'")