import { tapestryProxy, corsHeaders, NAMESPACE } from '../../_utils/tapestry.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { profileId } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await tapestryProxy(
        `/feed/${profileId}?namespace=${NAMESPACE}`
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
