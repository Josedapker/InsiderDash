import React from 'react';

import dynamic from 'next/dynamic';

import {
  ChartData,
  Trade,
} from '@/types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TradeCardProps {
  trade: Trade;
  chartData?: ChartData;
  showChart: boolean;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade, chartData, showChart }) => {
  console.log('Trade object:', JSON.stringify(trade, null, 2));
  console.log('Chart data:', JSON.stringify(chartData, null, 2));

  const formattedDate = new Date(trade.timestamp).toLocaleString();

  const linkAbbreviations = {
    BE: 'Birdeye',
    DS: 'DexScreener',
    DT: 'DexTools',
    PH: 'Photon',
    Bullx: 'Bullx',
    Pump: 'Pump'
  };

  // Function to safely clean up the details
  const cleanDetails = (details: string | undefined | null): string => {
    if (!details) return '';
    
    // Remove link abbreviations and "|"
    const abbreviations = Object.keys(linkAbbreviations).join('|');
    const regex = new RegExp(`\\s*(${abbreviations}|\\|)\\s*`, 'g');
    let cleaned = details.replace(regex, '').trim();
    
    // Remove "🔗 tokenName" pattern before "MC:"
    cleaned = cleaned.replace(/🔗\s*[^:]+(?=\s*MC:)/g, '');
    // Add spaces around contract address (assuming it's a 32-44 character alphanumeric string ending with 'pump')
    cleaned = cleaned.replace(/([a-zA-Z0-9]{31,43}pump)\b/, ' $1 ');
    // Add a space after the "K" in the MC value and remove the colon before the contract address
    cleaned = cleaned.replace(/K:/, 'K ').replace(/: ([a-zA-Z0-9]{31,43}pump)\b/, ' $1');
    
    
    return cleaned;
  };

  const getActionColor = (action: string | null | undefined) => {
    if (!action) return 'text-gray-500'; // Default color if action is null or undefined
    if (action.includes('SELL')) return 'text-red-500';
    if (action.includes('BUY')) return 'text-green-500';
    if (action.includes('TRANSFER') || action.includes('SWAP')) return 'text-blue-500';
    return 'text-gray-500'; // Default color for any other action
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className={`text-2xl mr-2 ${getActionColor(trade.action)}`}>
              {trade.action || 'Unknown Action'}
            </span>
            <a href={trade.links?.Token} target="_blank" rel="noopener noreferrer" className="font-bold text-xl hover:underline">
              {trade.token || 'Unknown Token'}
            </a>
            <span className="text-sm ml-2 text-gray-400">{trade.platform}</span>
          </div>
          <a href={trade.links?.Wallet} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-lg mb-2 hover:underline">
            {trade.wallet || 'Unknown Wallet'}
          </a>
          <p className="text-gray-300 mb-2">{trade.details}</p>
          {trade.holdings && <p className="text-yellow-500 mb-2">{trade.holdings}</p>}
          {trade.pnl && <p className={`mb-2 ${trade.pnl.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{trade.pnl}</p>}
          <p className="text-gray-400 mb-2">
            {trade.market_cap && `MC: $${trade.market_cap}`}
            {trade.seen_time && ` | Seen: ${trade.seen_time}`}
          </p>
          {trade.contract && <p className="text-xs text-gray-500 mb-2">{trade.contract}</p>}
          {trade.links && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(trade.links).map(([key, value]) => (
                key !== 'Transaction' && key !== 'Wallet' && key !== 'Token' && (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm"
                  >
                    {key}
                  </a>
                )
              ))}
            </div>
          )}
        </div>
        {showChart && (
          <div className="w-1/3">
            {chartData ? (
              <Chart
                options={chartData.chartOptions}
                series={chartData.chartData.series}
                type="candlestick"
                height={200}
              />
            ) : (
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-gray-400">Loading chart...</p>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">{formattedDate}</p>
    </div>
  );
};

export default TradeCard;
