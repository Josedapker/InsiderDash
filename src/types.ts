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
        Transaction: string;
        Wallet: string;
        Token: string;
        Birdeye?: string;
        DexScreener?: string;
        DexTools?: string;
        Photon?: string;
        Bullx?: string;
        Pump?: string;
        [key: string]: string | undefined;
    };
    contract?: string;
    original_text: string;
    poolAddress?: string; // Add this line
    // Add any other fields that are present in your parsed data
}

export interface ChartData {
    chartData: {
        series: Array<{ data: Array<{ x: number; y: number[] }> }>;
    };
    chartOptions: any; // You can define a more specific type for options if needed
}