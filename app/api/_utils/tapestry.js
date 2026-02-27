// Shared Tapestry API utilities for Vercel serverless functions

const TAPESTRY_API_KEY = process.env.TAPESTRY_API_KEY || process.env.VITE_TAPESTRY_API_KEY;
const TAPESTRY_API_URL = process.env.TAPESTRY_API_URL || 'https://api.usetapestry.dev/v1';
const NAMESPACE = 'martus';

const TAPESTRY_BASE_URLS = (() => {
  const primary = TAPESTRY_API_URL;
  const alternate = primary.includes('/api/v1')
    ? primary.replace('/api/v1', '/v1')
    : primary.replace('/v1', '/api/v1');
  return primary === alternate ? [primary] : [primary, alternate];
})();

export async function tapestryProxy(endpoint, options = {}) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const method = options.method || 'GET';

  for (let index = 0; index < TAPESTRY_BASE_URLS.length; index += 1) {
    const baseUrl = TAPESTRY_BASE_URLS[index];
    const url = `${baseUrl}${endpoint}${separator}apiKey=${TAPESTRY_API_KEY}`;
    console.log(`[Tapestry] ${method} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAPESTRY_API_KEY,
        Authorization: TAPESTRY_API_KEY ? `Bearer ${TAPESTRY_API_KEY}` : undefined,
        ...options.headers,
      },
    });

    if (response.ok) {
      return response.json();
    }

    const error = await response.text();
    console.error(`[Tapestry Error] ${response.status}: ${error}`);

    if (response.status === 404 && index < TAPESTRY_BASE_URLS.length - 1) {
      console.warn('[Tapestry] Retrying with alternate base URL...');
      continue;
    }

    throw new Error(`Tapestry API error: ${response.status}`);
  }

  throw new Error('Tapestry API error: No base URL succeeded');
}

export async function ensureContentNode(contentId, profileId) {
  if (!contentId) return null;
  try {
    const payload = { id: contentId };
    if (profileId) {
      payload.profileId = profileId;
    }
    return await tapestryProxy('/contents/findOrCreate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('[Tapestry] Failed to ensure content node:', error.message);
    return null;
  }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export { NAMESPACE, TAPESTRY_API_KEY };
