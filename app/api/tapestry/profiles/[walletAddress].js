import { tapestryProxy, corsHeaders, NAMESPACE } from '../../_utils/tapestry.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { walletAddress } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await tapestryProxy(
        `/profiles/${walletAddress}?namespace=${NAMESPACE}`
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const result = await tapestryProxy(`/profiles/${walletAddress}`, {
        method: 'PUT',
        body: JSON.stringify(req.body),
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
