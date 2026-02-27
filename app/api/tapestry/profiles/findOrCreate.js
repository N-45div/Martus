import { tapestryProxy, corsHeaders } from '../../_utils/tapestry.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, username, bio } = req.body;
    const result = await tapestryProxy(`/profiles/findOrCreate`, {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        username: username || `artist_${walletAddress.slice(0, 8)}`,
        bio: bio || '',
        blockchain: 'SOLANA',
        execution: 'FAST_UNCONFIRMED',
      }),
    });
    res.json(result);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
}
