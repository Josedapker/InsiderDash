import React from 'react';

import { Trade } from '@/types';

interface TradeDashboardProps {
  trades: Trade[];
}

const TradeDashboard: React.FC<TradeDashboardProps> = ({ trades }) => {
  return (
    <div className="space-y-2">
      {trades.map((trade, index) => (
        <div key={index} className="bg-gray-800 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white font-bold">
              {trade.action} {trade.token} on {trade.platform}
            </span>
            <span className="text-gray-400 text-xs">No chart available x</span>
          </div>
          <p className="text-blue-400 text-sm">{trade.wallet}</p>
          {trade.holdings && (
            <p className="text-yellow-400 text-sm">
              Holds: {trade.holdings}
            </p>
          )}
          {trade.pnl && (
            <p className="text-green-400 text-sm">
              PnL: {trade.pnl}
            </p>
          )}
          {trade.market_cap && trade.seen_time && (
            <p className="text-gray-400 text-xs">
              {trade.token} | MC: {trade.market_cap} | Seen: {trade.seen_time}
            </p>
          )}
          <div className="mt-1 flex space-x-2">
            {Object.keys(trade.links).map((key) => (
              <span key={key} className="text-blue-400 text-xs">
                {key}
              </span>
            ))}
          </div>
          {trade.contract && (
            <p className="text-gray-500 text-xs mt-1">{trade.contract}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default TradeDashboard;