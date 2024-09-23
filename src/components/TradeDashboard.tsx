"use client"

import React, {
  useEffect,
  useState,
} from 'react';

import {
  ChartData,
  Trade as ImportedTrade,
} from '@/types';

import TradeCard from './TradeCard';

interface Trade {
  poolAddress?: string;
  // ... other properties
}

interface TradeCardProps {
  trade: Trade;
  chartData?: ChartData;
  onCopyClick: () => void;
  copySuccess: string;
}

export default function TradeDashboard() {
  const [trades, setTrades] = useState<ImportedTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<ImportedTrade[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [chartData, setChartData] = useState<{ [key: string]: ChartData }>({});

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        console.log('Fetched trades:', data);
        setTrades(data);
        setFilteredTrades(data);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };

    fetchTrades();
  }, []);

  useEffect(() => {
    const fetchChartData = async (contractAddress: string) => {
      console.log(`Fetching chart data for contract: ${contractAddress}`);
      try {
        const response = await fetch(`/api/chart-data?contractAddress=${contractAddress}&timeframe=1h`);
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Received chart data for contract ${contractAddress}:`, data);
        setChartData(prevData => {
          const newData = { ...prevData, [contractAddress]: data };
          console.log('Updated chartData state:', newData);
          return newData;
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    filteredTrades.forEach(trade => {
      if (trade.contract && !chartData[trade.contract] && shouldShowChart(trade)) {
        console.log(`Initiating chart data fetch for trade:`, trade);
        fetchChartData(trade.contract);
      }
    });
  }, [filteredTrades, chartData]);

  useEffect(() => {
    if (filter === 'All') {
      setFilteredTrades(trades);
    } else {
      const filtered = trades.filter((trade) => {
        if (!trade.action) return false;
        switch (filter) {
          case 'Buys':
            return trade.action.includes('BUY');
          case 'Sells':
            return trade.action.includes('SELL');
          case 'Transfers':
            return trade.action.includes('TRANSFER');
          case 'Swaps':
            return trade.action.includes('SWAP');
          default:
            return true;
        }
      });
      setFilteredTrades(filtered);
    }
  }, [filter, trades]);

  const shouldShowChart = (trade: ImportedTrade) => {
    return trade.action && !['SWAP', 'TRANSFER'].includes(trade.action);
  };

  return (
    <div className="bg-gray-900 text-white p-4 space-y-4">
      <h1 className="text-3xl font-bold mb-4">Trade Feed</h1>
      <div className="flex space-x-4 mb-4">
        {['All', 'Buys', 'Sells', 'Transfers', 'Swaps'].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded ${
              filter === type ? 'bg-purple-600' : 'bg-gray-700'
            }`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>
      {filteredTrades.map((trade, index) => {
        console.log(`Rendering TradeCard for trade ${index}:`, trade);
        const showChart = shouldShowChart(trade);
        console.log(`Chart data for trade ${index}:`, showChart ? (trade.contract ? chartData[trade.contract] : 'No contract') : 'Chart hidden');
        return (
          <TradeCard
            key={index}
            trade={trade}
            chartData={showChart && trade.contract ? chartData[trade.contract] : undefined}
            showChart={!!showChart}
          />
        );
      })}
    </div>
  );
}