import { tapestryProxy, corsHeaders, NAMESPACE } from '../../_utils/tapestry.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'POST') {
    try {
      const { startId, endId } = req.body;
      const result = await tapestryProxy(`/followers?namespace=${NAMESPACE}`, {
        method: 'POST',
        body: JSON.stringify({ startId, endId }),
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { startId, endId } = req.body;
      const result = await tapestryProxy(`/followers?namespace=${NAMESPACE}`, {
        method: 'DELETE',
        body: JSON.stringify({ startId, endId }),
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
