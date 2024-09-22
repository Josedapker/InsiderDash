import axios from 'axios';

const API_KEY = process.env.GECKOTERMINAL_API_KEY;

async function fetchOHLCVData(network, poolAddress, timeframe, aggregate) {
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=1000`;
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching OHLCV data:', error.response?.data || error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (!API_KEY) {
    console.error('GECKOTERMINAL_API_KEY is not set in the environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { timeframe, network = 'solana', poolAddress } = req.query;

  if (!poolAddress) {
    return res.status(400).json({ error: 'Pool address is required' });
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
      return res.status(400).json({ error: 'Invalid timeframe' });
  }

  const data = await fetchOHLCVData(network, poolAddress, interval, aggregate);

  if (!data || !data.data || !data.data.attributes || !data.data.attributes.ohlcv_list) {
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
      height: 350
    },
    title: {
      text: `OHLCV Data (${timeframe})`,
      align: 'left'
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    }
  };

  res.status(200).json({ chartData, chartOptions });
}