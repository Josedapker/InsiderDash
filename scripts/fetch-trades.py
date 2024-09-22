import sys
print("Python path:")
for path in sys.path:
    print(path)

from telethon import TelegramClient, events
import asyncio
import os
import json
from datetime import datetime
from dotenv import load_dotenv
import re
from telethon.tl.types import MessageEntityTextUrl

# Load environment variables from .env.local
load_dotenv('/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDashboard/.env.local')

# Telegram API credentials
API_ID = os.getenv('API_ID')
API_HASH = os.getenv('API_HASH')
PHONE_NUMBER = os.getenv('PHONE_NUMBER')
BOT_USERNAME = '@ray_black_bot'

# Create the client
client = TelegramClient('user_session', API_ID, API_HASH)

# File to store the messages
JSON_FILE = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDashboard/data/tgInsiders.json'

# Update the file paths
RAW_DATA_FILE = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDashboard/data/tgInsiders_raw.json'
PARSED_DATA_FILE = '/Users/jose/Desktop/ExperimentalScripts/NEW/InsidersDashboard/data/tgInsiders_parsed.json'

def append_to_json(data, file_path):
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # If the file doesn't exist or is empty, create it with an empty list
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump([], file, ensure_ascii=False)

        # Read existing data
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                file_data = json.load(file)
            except json.JSONDecodeError:
                file_data = []

        # Append new data
        file_data.append(data)

        # Write updated data back to file
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(file_data, file, ensure_ascii=False, indent=2)

        print(f"Data appended to {file_path}")
    except Exception as e:
        print(f"Error appending to JSON: {e}")

def parse_trade_message(message, entities):
    action_match = re.search(r'(🟢 BUY|🔴 SELL|💸 TRANSFER|🔁 SWAP)', message)
    action = action_match.group(1) if action_match else None
    token_platform_match = re.search(r'(🟢 BUY|🔴 SELL|💸 TRANSFER|🔁 SWAP)\s+(\w+)(?:\s+on\s+(\w+\s*\w*))?', message)
    token = token_platform_match.group(2) if token_platform_match else None
    platform = token_platform_match.group(3) if token_platform_match and token_platform_match.group(3) else None

    wallet_match = re.search(r'🔹\s+(.+)', message)
    wallet = wallet_match.group(1) if wallet_match else None

    details_match = re.search(r'🔹.+\n\n🔹.+\s+(swapped.+|transferred.+)', message)
    details = details_match.group(1) if details_match else None

    holdings_match = re.search(r'✊Holds:\s+(.+)', message)
    holdings = holdings_match.group(1) if holdings_match else None

    pnl_match = re.search(r'📈PnL:\s+(.+)', message)
    pnl = pnl_match.group(1) if pnl_match else None

    mc_seen_match = re.search(r'🔗.+\|\s*MC:\s*([^|]+)\s*\|\s*Seen:\s*([^:]+)', message)
    market_cap = mc_seen_match.group(1).strip() if mc_seen_match else None
    seen_time = mc_seen_match.group(2).strip() if mc_seen_match else None

    links = {}
    link_section = re.search(r'🔗(.+?)(?:\n|$)', message)
    if link_section:
        link_text = link_section.group(1).strip()
        link_parts = link_text.split('|')
        if len(link_parts) > 1:
            links_string = link_parts[1].strip()
            link_names = [name.strip() for name in links_string.split(':')]
            for entity in entities:
                if isinstance(entity, MessageEntityTextUrl):
                    entity_text = message[entity.offset:entity.offset + entity.length].strip()
                    if entity_text in link_names:
                        links[entity_text] = entity.url

    contract_match = re.search(r'\n([a-zA-Z0-9]{32,})\s*$', message)
    contract = contract_match.group(1) if contract_match else None

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
        "links": links,
        "contract": contract,
        "original_text": message
    }

@client.on(events.NewMessage(chats=BOT_USERNAME))
async def handle_new_message(event):
    message = event.message.message
    entities = event.message.entities
    print(f"Received new message: {message}")
    
    # Save raw data
    raw_data = {
        "message": message,
        "entities": [{"offset": e.offset, "length": e.length, "type": type(e).__name__} for e in (entities or [])],
        "timestamp": datetime.now().isoformat()
    }
    append_to_json(raw_data, RAW_DATA_FILE)
    print("Raw data saved")
    
    try:
        # Parse the message to extract detailed information
        trade_info = parse_trade_message(message, entities)
        
        # Add timestamp
        trade_info["timestamp"] = datetime.now().isoformat()
        
        # Append the parsed trade info to the JSON file
        append_to_json(trade_info, PARSED_DATA_FILE)
        
        print("Parsed trade info:")
        print(json.dumps(trade_info, indent=2, ensure_ascii=False))
        print("Parsed trade info recorded")
        print("---")
    except Exception as e:
        print(f"Error processing message: {e}")
        print("Original message:", message)
        import traceback
        print("Traceback:", traceback.format_exc())
        print("---")

async def main():
    await client.start(phone=PHONE_NUMBER)
    print(f"Client started. Listening for messages from {BOT_USERNAME}...")
    print(f"Raw data will be saved to {RAW_DATA_FILE}")
    print(f"Parsed data will be saved to {PARSED_DATA_FILE}")
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())