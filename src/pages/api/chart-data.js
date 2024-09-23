const API_KEY = process.env.GECKOTERMINAL_API_KEY;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  try {
    const response = await fetch(url, options);
    if (response.status === 429 && retries > 0) {
      console.log(`Rate limited. Retrying in ${backoff}ms...`);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Error: ${error.message}. Retrying in ${backoff}ms...`);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

async function fetchTopPool(network, contractAddress) {
  console.log(`Fetching top pool for network: ${network}, contract: ${contractAddress}`);
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${contractAddress}/pools`;
    console.log(`Requesting URL: ${url}`);
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Top pool response:', JSON.stringify(data, null, 2));
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }
    console.log('No pools found for the given contract');
    return null;
  } catch (error) {
    console.error('Error fetching top pool:', error.message);
    return null;
  }
}

async function fetchOHLCVData(network, poolAddress, timeframe, aggregate) {
  console.log(`Fetching OHLCV data for network: ${network}, pool: ${poolAddress}, timeframe: ${timeframe}, aggregate: ${aggregate}`);
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=1000`;
    console.log(`Requesting URL: ${url}`);
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('OHLCV response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching OHLCV data:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  console.log('Received request:', req.query);
  
  if (!API_KEY) {
    console.error('GECKOTERMINAL_API_KEY is not set in the environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { timeframe = '1h', network = 'solana', contractAddress } = req.query;

  if (!contractAddress) {
    console.error('Contract address is missing from the request');
    return res.status(400).json({ error: 'Contract address is required' });
  }

  const poolAddress = await fetchTopPool(network, contractAddress);
  
  if (!poolAddress) {
    console.error('No pool found for the given contract');
    return res.status(404).json({ error: 'No pool found for the given contract' });
  }

  let interval, aggregate;
  switch (timeframe) {
    case '5m':
      interval = 'minute';
      aggregate = 5;
      break;
    case '15m':
      interval = 'minute';
      aggregate = 15;
      break;
    case '1h':
      interval = 'hour';
      aggregate = 1;
      break;
    case '4h':
      interval = 'hour';
      aggregate = 4;
      break;
    default:
      interval = 'hour';
      aggregate = 1;
  }

  const data = await fetchOHLCVData(network, poolAddress, interval, aggregate);

  if (!data || !data.data || !data.data.attributes || !data.data.attributes.ohlcv_list) {
    console.error('OHLCV data not available or in unexpected format');
    return res.status(404).json({ error: 'OHLCV data not available' });
  }

  const ohlcvData = data.data.attributes.ohlcv_list.map(item => ({
    x: new Date(item[0] * 1000).getTime(),
    y: item.slice(1, 5).map(Number)
  }));

  const chartData = {
    series: [{
      data: ohlcvData
    }]
  };

  const chartOptions = {
    chart: {
      type: 'candlestick',
      height: 200,
      width: 300,
      toolbar: {
        show: false
      }
    },
    title: {
      text: undefined
    },
    xaxis: {
      type: 'datetime',
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        show: false
      }
    },
    grid: {
      show: false
    }
  };

  console.log('Sending response with chart data');
  res.status(200).json({ chartData, chartOptions });
}