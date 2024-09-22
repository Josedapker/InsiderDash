const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GECKOTERMINAL_API_KEY;

async function fetchPoolsForToken(network, tokenAddress) {
  try {
    console.log(`Fetching pools for token_address: ${tokenAddress} on network: ${network}`);
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${tokenAddress}/pools`;
    console.log(`GeckoTerminal API URL: ${url}`);
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    console.log('GeckoTerminal Response status:', response.status);
    console.log(`Number of pools fetched: ${response.data.data.length}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pools from GeckoTerminal:', error.response?.data || error.message);
    return null;
  }
}

async function fetchOHLCVData(network, poolAddress, timeframe = 'minute', limit = 1000) {
  try {
    // Remove the 'solana_' prefix from the poolAddress
    const cleanPoolAddress = poolAddress.replace(/^solana_/, '');
    
    console.log(`Fetching OHLCV data for network: ${network}, pool_address: ${cleanPoolAddress}, timeframe: ${timeframe}, limit=${limit}`);
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${cleanPoolAddress}/ohlcv/${timeframe}`;
    console.log(`GeckoTerminal OHLCV API URL: ${url}`);
    const response = await axios.get(url, {
      params: { limit },
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('Error fetching OHLCV data:', error.message);
    console.error('Error response:', error.response?.data);
    return null;
  }
}

async function fetchJupiterPrice(tokenId, vsToken = null) {
  try {
    let url = `https://price.jup.ag/v6/price?ids=${tokenId}`;
    if (vsToken) {
      url += `&vsToken=${vsToken}`;
    }
    console.log(`Jupiter Price API URL: ${url}`);
    const response = await axios.get(url);
    console.log('Jupiter Price API Response status:', response.status);
    console.log('Jupiter Price API Response data:', JSON.stringify(response.data, null, 2));
    
    if (Object.keys(response.data.data).length === 0) {
      console.log(`No price data available for token: ${tokenId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching price from Jupiter:', error.response?.data || error.message);
    return null;
  }
}

async function fetchOHLCVDataWithRetry(network, poolAddress, timeframe = 'minute', limit = 1000, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const data = await fetchOHLCVData(network, poolAddress, timeframe, limit);
    if (data) {
      return data;
    }
    console.log(`Retry ${i + 1} for OHLCV data...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
  }
  console.log('Failed to fetch OHLCV data after multiple attempts');
  return null;
}

async function fetchOHLCVData(network, poolAddress, timeframe, aggregate) {
  try {
    // Remove the 'solana_' prefix from the pool address
    const cleanPoolAddress = poolAddress.replace('solana_', '');
    console.log(`Fetching OHLCV data for network: ${network}, pool_address: ${cleanPoolAddress}, timeframe: ${timeframe}, aggregate: ${aggregate}`);
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${cleanPoolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=1000`;
    console.log(`GeckoTerminal OHLCV API URL: ${url}`);
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    console.log('Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error fetching OHLCV data:', error.response?.data || error.message);
    return null;
  }
}

async function fetchAllOHLCVData(network, poolAddress) {
  const timeframes = [
    { timeframe: 'minute', aggregates: [1, 5, 15] },
    { timeframe: 'hour', aggregates: [1, 4, 12] },
    { timeframe: 'day', aggregates: [1] }
  ];

  const allData = {};

  for (const tf of timeframes) {
    allData[tf.timeframe] = {};
    for (const agg of tf.aggregates) {
      const data = await fetchOHLCVData(network, poolAddress, tf.timeframe, agg);
      if (data && data.data && data.data.attributes && data.data.attributes.ohlcv_list) {
        allData[tf.timeframe][agg] = data.data.attributes.ohlcv_list.map(item => ({
          timestamp: new Date(item[0] * 1000),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
      } else {
        console.log(`No data available for ${tf.timeframe} timeframe with ${agg} aggregate.`);
      }
    }
  }

  return allData;
}

async function main() {
  const network = 'solana';
  const tokenAddress = '3WKzqdh3ZW3tP2PhAtAuDu4e1XsEzFhk7qnN8mApm3S2'; // IWNKM token address
  const timeframe = '15m';

  console.log('Testing GeckoTerminal API...');
  const pools = await fetchPoolsForToken(network, tokenAddress);
  
  if (!pools || pools.length === 0) {
    console.log('No pools found');
    return;
  }

  console.log(`Total number of pools: ${pools.length}`);

  // Function to find the pool with the highest reserve in USD
  function findBestPool(pools) {
    return pools.reduce((best, current) => {
      const currentReserve = parseFloat(current.attributes.reserve_in_usd);
      const bestReserve = parseFloat(best.attributes.reserve_in_usd);
      return currentReserve > bestReserve ? current : best;
    });
  }

  // Assuming 'data' is your response data containing all pools
  const bestPool = findBestPool(pools);

  console.log(`Best pool found: ${bestPool.id}`);
  console.log(`Pool name: ${bestPool.attributes.name}`);
  console.log(`Base token price (USD): ${parseFloat(bestPool.attributes.base_token_price_usd).toFixed(8)}`);
  console.log(`Quote token price (USD): ${bestPool.attributes.quote_token_price_usd}`);
  console.log(`Pool created at: ${bestPool.attributes.pool_created_at}`);
  console.log(`Reserve in USD: ${bestPool.attributes.reserve_in_usd}`);
  console.log(`24h price change: ${bestPool.attributes.price_change_percentage.h24}%`);
  console.log(`24h volume: ${bestPool.attributes.volume_usd.h24}`);

  const allOHLCVData = await fetchAllOHLCVData(network, bestPool.id);

  if (Object.keys(allOHLCVData).length === 0) {
    console.log('Unable to fetch any OHLCV data. This could be due to:');
    console.log('1. The pool is too new and doesn\'t have historical data yet.');
    console.log('2. There might be an issue with the API or our access to it.');
    console.log('3. The pool ID might not be in the correct format for OHLCV queries.');
    console.log('\nPlease check the pool creation date and try again later if the pool is very new.');
  } else {
    console.log('\nOHLCV data summary:');
    for (const [timeframe, aggregates] of Object.entries(allOHLCVData)) {
      for (const [aggregate, data] of Object.entries(aggregates)) {
        console.log(`${timeframe} (aggregate ${aggregate}): ${data.length} entries`);
        if (data.length > 0) {
          console.log('First entry:', data[0]);
          console.log('Last entry:', data[data.length - 1]);
        }
        console.log('---');
      }
    }
  }

  // Here you would typically pass allOHLCVData to your charting library or further processing
  // For example: createCharts(allOHLCVData);
}

function processOHLCVData(ohlcvList) {
  return ohlcvList.map(item => ({
    timestamp: new Date(item[0] * 1000),
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5])
  }));
}

main().catch(console.error);