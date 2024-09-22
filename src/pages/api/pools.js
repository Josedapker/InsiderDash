// pages/api/pools.js
import axios from 'axios';

export default async function handler(req, res) {
  const { network_id, token_address } = req.query;
  const API_KEY = process.env.GECKOTERMINAL_API_KEY;

  if (!network_id || !token_address) {
    return res.status(400).json({ error: 'Missing network_id or token_address' });
  }

  try {
    const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${network_id}/tokens/${token_address}/pools`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    const pools = response.data.data;
    if (pools.length === 0) {
      return res.status(404).json({ error: 'No pools found for the token' });
    }

    // Sort pools by reserve_in_usd and get the top one
    const bestPool = pools.sort((a, b) => b.attributes.reserve_in_usd - a.attributes.reserve_in_usd)[0];

    res.status(200).json({ bestPool });
  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
}