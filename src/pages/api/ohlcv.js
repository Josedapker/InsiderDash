import axios from 'axios';

const API_KEY = process.env.GECKOTERMINAL_API_KEY;

export async function fetchOHLCVData(network, poolAddress, timeframe, aggregate, limit = 1000) {
  const cleanPoolAddress = poolAddress.replace(`${network}_`, '');
  const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${cleanPoolAddress}/ohlcv/${timeframe}`;
  
  try {
    const response = await axios.get(url, {
      params: { aggregate, limit },
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (response.data && response.data.data && response.data.data.attributes && response.data.data.attributes.ohlcv_list) {
      return response.data.data.attributes.ohlcv_list;
    } else {
      console.error('Unexpected API response structure:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching OHLCV data:', error.response?.data || error.message);
    return null;
  }
}

export default async function handler(req, res) {
  const { network, poolAddress, timeframe, aggregate } = req.query;
  
  if (!network || !poolAddress || !timeframe || !aggregate) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const ohlcvData = await fetchOHLCVData(network, poolAddress, timeframe, parseInt(aggregate, 10));
    
    if (ohlcvData) {
      res.status(200).json(ohlcvData);
    } else {
      res.status(404).json({ error: 'No OHLCV data available for the specified parameters' });
    }
  } catch (error) {
    console.error('Error in OHLCV handler:', error);
    res.status(500).json({ error: 'Error fetching OHLCV data' });
  }
}