export interface Trade {
    timestamp: string;
    action: string;
    token: string;
    platform: string;
    wallet: string;
    details: string;
    holdings?: string;
    pnl?: string;
    market_cap?: string;
    seen_time?: string;
    links: {
        [key: string]: string;
    };
    contract?: string;
    original_text: string;
    // Add any other fields that are present in your parsed data
}