import fs from 'fs';
import {
  NextApiRequest,
  NextApiResponse,
} from 'next';
import path from 'path';

import { Trade } from '@/types'; // Make sure this path is correct

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'tgInsiders_parsed.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const trades: Trade[] = JSON.parse(fileContents);
    
    // Sort trades by timestamp in descending order (newest first)
    trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.status(200).json(trades);
  } catch (error) {
    console.error('Error reading trades file:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
}