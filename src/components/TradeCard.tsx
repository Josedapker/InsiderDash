import React from 'react';

import { Trade } from '@/types';

interface TradeCardProps {
  trade: Trade;
  onCopyClick: () => void;
  copySuccess: string;
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

const renderEmoji = (action: string | null | undefined) => {
  if (!action) return ''; // Return an empty string or a default emoji if action is null or undefined
  if (action.includes('BUY')) return '🟢';
  if (action.includes('SELL')) return '🔴';
  if (action.includes('TRANSFER')) return '💸';
  if (action.includes('SWAP')) return '🔁';
  return ''; // Default case
};

const TradeCard: React.FC<TradeCardProps> = ({ trade, onCopyClick, copySuccess }) => {
  const {
    timestamp,
    action,
    token,
    platform,
    wallet,
    details,
    holdings,
    pnl,
    market_cap,
    seen_time,
    links,
    contract,
  } = trade;

  const formattedDate = formatDate(timestamp);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow relative flex">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{renderEmoji(action)}</span>
          <span className={`font-bold ${
            action?.includes('SELL') ? 'text-red-500' : 
            action?.includes('BUY') ? 'text-green-500' : 
            action?.includes('TRANSFER') ? 'text-yellow-500' : 
            'text-blue-500'
          }`}>
            {action?.replace(/🟢|🔴|💸|🔁/, '').trim() || 'Unknown Action'}
          </span>
        </div>
        <p className="font-bold text-lg">{token} {platform}</p>
        <p className="text-blue-400">{wallet}</p>
        <p className="text-gray-300">{details}</p>
        {holdings && <p className="text-yellow-500">✊Holds: {holdings}</p>}
        {pnl && <p className={pnl.includes('+') ? 'text-green-500' : 'text-red-500'}>📈PnL: {pnl}</p>}
        {(market_cap || seen_time) && (
          <p className="text-gray-400">
            {market_cap && `MC: ${market_cap}`}
            {seen_time && ` | Seen: ${seen_time}`}
          </p>
        )}
        {links && (
          <div className="mt-2">
            <p className="text-gray-300">Links:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(links).map(([key, value]) => (
                <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm">
                  {key}
                </a>
              ))}
            </div>
          </div>
        )}
        {contract && <p className="text-xs text-gray-500 mt-2">{contract}</p>}
        <span className="text-sm text-gray-400 absolute bottom-2 right-2">{formattedDate}</span>
      </div>
      <div className="w-1/3 flex items-center justify-center">
        {/* Placeholder for chart */}
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <p className="text-gray-400">No chart available</p>
        </div>
      </div>
    </div>
  );
};

export default TradeCard;