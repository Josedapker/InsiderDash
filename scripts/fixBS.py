import json
import re
from datetime import datetime

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
        "\\ud83d\\udd17": "🔗",
        "\\ud83d\\udd25": "🔥"
    }
    for code, emoji in emoji_map.items():
        text = text.replace(code, emoji)
    return text

def extract_links(text, entities):
    links = {}
    for entity in entities:
        if entity['type'] == 'MessageEntityTextUrl':
            link_text = text[entity['offset']:entity['offset']+entity['length']]
            links[link_text] = entity['url']
    return links

def parse_trade_message(message, entities):
    action_match = re.search(r'(🟢 BUY|🔴 SELL|💸 TRANSFER|🔁 SWAP)', message)
    action = action_match.group(1) if action_match else None

    wallet_match = re.search(r'🔹\s+(\w+)', message)
    wallet = wallet_match.group(1) if wallet_match else None

    token_platform_match = re.search(r'(?:🟢 BUY|🔴 SELL)\s+(\w+)(?:\s+on\s+(\w+\s*\w*))?', message)
    token = token_platform_match.group(1) if token_platform_match else None
    platform = token_platform_match.group(2) if token_platform_match and token_platform_match.group(2) else None

    details_match = re.search(r'🔹.+?\s+(swapped.+?|transferred.+?)(?=\n📈|\n✊|\n\n🔗|\Z)', message, re.DOTALL)
    details = details_match.group(1).strip() if details_match else None

    holdings_match = re.search(r'✊Holds:\s+(.+)', message)
    holdings = holdings_match.group(1) if holdings_match else None

    pnl_match = re.search(r'📈PnL:\s+(.+)', message)
    pnl = pnl_match.group(1) if pnl_match else None

    mc_match = re.search(r'MC:\s*\$?([\d.]+[KMB]?)(?:\s*:\s*BE)?', message)
    market_cap = mc_match.group(1) if mc_match else None

    seen_match = re.search(r'Seen:\s*([^|]+)', message)
    seen_time = seen_match.group(1).strip() if seen_match else None

    # Updated contract extraction
    contract_match = re.search(r'\n([A-Za-z0-9]{32,}(?:pump)?)\s*$', message.strip())
    contract = contract_match.group(1) if contract_match else None

    links = extract_links(message, entities)

    # Add debug print
    print(f"Parsed contract: {contract}")
    print(f"Original message: {message}")
    print("---")

    return {
        "action": action,
        "token": token,
        "platform": platform,
        "wallet": wallet,
        "details": details,
        "holdings": holdings,
        "pnl": pnl,
        "market_cap": market_cap,
        "seen_time": seen_time,
        "contract": contract,
        "links": links
    }

def fix_data(parsed_data, raw_data):
    raw_data_dict = {item['timestamp']: item for item in raw_data}
    
    for item in parsed_data:
        timestamp = item['timestamp']
        if timestamp in raw_data_dict:
            raw_item = raw_data_dict[timestamp]
            original_text = fix_emojis(raw_item['message'])
            item['original_text'] = original_text
            
            # Extract contract directly from the original text
            contract_match = re.search(r'\n([A-Za-z0-9]{32,}(?:pump)?)\s*$', original_text.strip())
            if contract_match:
                item['contract'] = contract_match.group(1)
            else:
                item['contract'] = None
            
            # Fix seen time
            seen_match = re.search(r'Seen:\s*([\w\s]+?)(?:\s*:\s*BE)?\s*\|', original_text)
            if seen_match:
                item['seen_time'] = seen_match.group(1).strip()
            
            # Debug print
            print(f"Timestamp: {timestamp}")
            print(f"Original text: {original_text}")
            print(f"Extracted contract: {item.get('contract', 'Not found')}")
            print(f"Fixed seen time: {item.get('seen_time', 'Not found')}")
            print("---")
        
        if 'action' in item and item['action']:
            item['action'] = fix_emojis(item['action'])
        
        if 'details' in item and item['details']:
            item['details'] = fix_emojis(item['details'])
        
        if 'timestamp' in item and not isinstance(item['timestamp'], str):
            item['timestamp'] = str(item['timestamp'])
    
    return parsed_data

# Input and output file paths
parsed_input_file = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDash/data/tgInsiders_parsed.json'
raw_input_file = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDash/data/tgInsiders_raw.json'
output_file = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDash/data/tgInsiders_parsed_fixed.json'

# Read the input JSON files
with open(parsed_input_file, 'r') as f:
    parsed_data = json.load(f)

with open(raw_input_file, 'r') as f:
    raw_data = json.load(f)

# Fix the data
fixed_data = fix_data(parsed_data, raw_data)

# Write the fixed data back to a JSON file
with open(output_file, 'w') as f:
    json.dump(fixed_data, f, indent=2, ensure_ascii=False)

print(f"Data has been fixed and saved to '{output_file}'")