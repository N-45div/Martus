import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

const TAPESTRY_API_URL = 'https://api.usetapestry.dev/v1';
const TAPESTRY_API_KEY = process.env.VITE_TAPESTRY_API_KEY;
const NAMESPACE = 'martus';

app.use(cors());
app.use(express.json());

// Proxy all Tapestry API requests - Tapestry uses apiKey as query param
async function tapestryProxy(endpoint, options = {}) {
  // Add apiKey to endpoint
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TAPESTRY_API_URL}${endpoint}${separator}apiKey=${TAPESTRY_API_KEY}`;
  console.log(`[Tapestry] ${options.method || 'GET'} ${endpoint}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Tapestry Error] ${response.status}: ${error}`);
    throw new Error(`Tapestry API error: ${response.status}`);
  }

  return response.json();
}

// ==================== PROFILES ====================

// Get or create profile
app.post('/api/tapestry/profiles/findOrCreate', async (req, res) => {
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
});

// Get profile by wallet
app.get('/api/tapestry/profiles/:walletAddress', async (req, res) => {
  try {
    const result = await tapestryProxy(
      `/profiles/${req.params.walletAddress}?namespace=${NAMESPACE}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
app.put('/api/tapestry/profiles/:profileId', async (req, res) => {
  try {
    const result = await tapestryProxy(`/profiles/${req.params.profileId}`, {
      method: 'PUT',
      body: JSON.stringify(req.body),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search profiles
app.get('/api/tapestry/profiles/search', async (req, res) => {
  try {
    const { query } = req.query;
    const result = await tapestryProxy(
      `/profiles/search?namespace=${NAMESPACE}&query=${encodeURIComponent(query)}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMENTS ====================

// Get comments for content
app.get('/api/tapestry/comments', async (req, res) => {
  try {
    const { contentId } = req.query;
    const result = await tapestryProxy(
      `/comments?contentId=${encodeURIComponent(contentId)}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message, comments: [] });
  }
});

// Post comment
app.post('/api/tapestry/comments', async (req, res) => {
  try {
    const { profileId, contentId, text } = req.body;
    const result = await tapestryProxy(`/comments`, {
      method: 'POST',
      body: JSON.stringify({ 
        profileId, 
        contentId, 
        text,
        blockchain: 'SOLANA',
        execution: 'FAST_UNCONFIRMED'
      }),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
app.delete('/api/tapestry/comments/:commentId', async (req, res) => {
  try {
    const result = await tapestryProxy(`/comments/${req.params.commentId}`, {
      method: 'DELETE',
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LIKES ====================

// Get likes for content
app.get('/api/tapestry/likes/:contentId', async (req, res) => {
  try {
    const result = await tapestryProxy(
      `/likes?contentId=${encodeURIComponent(req.params.contentId)}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message, count: 0 });
  }
});

// Like content
app.post('/api/tapestry/likes/:contentId', async (req, res) => {
  try {
    const { profileId } = req.body;
    const result = await tapestryProxy(`/likes`, {
      method: 'POST',
      body: JSON.stringify({ 
        profileId, 
        contentId: req.params.contentId,
        blockchain: 'SOLANA',
        execution: 'FAST_UNCONFIRMED'
      }),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlike content
app.delete('/api/tapestry/likes/:contentId', async (req, res) => {
  try {
    const { profileId } = req.body;
    const result = await tapestryProxy(`/likes`, {
      method: 'DELETE',
      body: JSON.stringify({ 
        profileId, 
        contentId: req.params.contentId 
      }),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FOLLOWERS ====================

// Get followers
app.get('/api/tapestry/followers/:profileId', async (req, res) => {
  try {
    const result = await tapestryProxy(
      `/followers/${req.params.profileId}?namespace=${NAMESPACE}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get following
app.get('/api/tapestry/following/:profileId', async (req, res) => {
  try {
    const result = await tapestryProxy(
      `/following/${req.params.profileId}?namespace=${NAMESPACE}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow profile
app.post('/api/tapestry/followers', async (req, res) => {
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
});

// Unfollow profile
app.delete('/api/tapestry/followers', async (req, res) => {
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
});

// ==================== CONTENT/POSTS ====================

// Get content/posts
app.get('/api/tapestry/content', async (req, res) => {
  try {
    const { profileId, type } = req.query;
    let endpoint = `/content?namespace=${NAMESPACE}`;
    if (profileId) endpoint += `&profileId=${profileId}`;
    if (type) endpoint += `&type=${type}`;
    const result = await tapestryProxy(endpoint);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create content/post
app.post('/api/tapestry/content', async (req, res) => {
  try {
    const { profileId, type, data, contentId } = req.body;
    const result = await tapestryProxy(`/content?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({ profileId, type, data, contentId }),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FEED ====================

// Get social feed
app.get('/api/tapestry/feed/:profileId', async (req, res) => {
  try {
    const result = await tapestryProxy(
      `/feed/${req.params.profileId}?namespace=${NAMESPACE}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== IDENTITIES ====================

// Resolve identity
app.get('/api/tapestry/identities/:identifier', async (req, res) => {
  try {
    const result = await tapestryProxy(`/identities/${req.params.identifier}`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    tapestryConfigured: !!TAPESTRY_API_KEY,
    namespace: NAMESPACE 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Tapestry API server running on http://localhost:${PORT}`);
  console.log(`   Namespace: ${NAMESPACE}`);
  console.log(`   API Key configured: ${TAPESTRY_API_KEY ? 'Yes' : 'No'}`);
});
