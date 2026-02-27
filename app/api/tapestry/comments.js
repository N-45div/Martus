import { tapestryProxy, ensureContentNode, corsHeaders } from '../_utils/tapestry.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'GET') {
    try {
      const { contentId } = req.query;
      await ensureContentNode(contentId);
      const result = await tapestryProxy(
        `/comments?contentId=${encodeURIComponent(contentId)}`
      );
      res.json(result);
    } catch (error) {
      // Return empty comments instead of error
      res.json({ comments: [], page: 1, pageSize: 10 });
    }
  } else if (req.method === 'POST') {
    try {
      const { profileId, contentId, text } = req.body;
      await ensureContentNode(contentId, profileId);
      const result = await tapestryProxy(`/comments`, {
        method: 'POST',
        body: JSON.stringify({
          profileId,
          contentId,
          text,
          blockchain: 'SOLANA',
          execution: 'FAST_UNCONFIRMED',
        }),
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
