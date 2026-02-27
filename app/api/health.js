import { TAPESTRY_API_KEY, NAMESPACE, corsHeaders } from './_utils/tapestry.js';

export default function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.json({
    status: 'ok',
    tapestryConfigured: !!TAPESTRY_API_KEY,
    namespace: NAMESPACE,
  });
}
