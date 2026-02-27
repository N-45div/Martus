import { tapestryProxy, ensureContentNode, corsHeaders } from '../../_utils/tapestry.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { contentId } = req.query;

  if (req.method === 'GET') {
    try {
      const contentNode = await ensureContentNode(contentId);
      if (contentNode) {
        res.json({
          count: contentNode?.socialCounts?.likeCount ?? contentNode?.likeCount ?? 0,
          details: contentNode,
        });
      } else {
        // Content node created but no likes yet
        res.json({ count: 0, details: null });
      }
    } catch (error) {
      // Return 0 likes instead of error for missing content
      res.json({ count: 0, details: null });
    }
  } else if (req.method === 'POST') {
    try {
      const { profileId } = req.body;
      await ensureContentNode(contentId, profileId);
      const result = await tapestryProxy(`/likes/${encodeURIComponent(contentId)}`, {
        method: 'POST',
        body: JSON.stringify({
          profileId,
          blockchain: 'SOLANA',
          execution: 'FAST_UNCONFIRMED',
        }),
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { profileId } = req.body;
      const result = await tapestryProxy(`/likes/${encodeURIComponent(contentId)}`, {
        method: 'DELETE',
        body: JSON.stringify({
          profileId,
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
