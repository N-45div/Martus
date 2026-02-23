// Tapestry Social Integration
// Uses REST API directly for more control

const API_URL = 'https://api.usetapestry.dev/v1';
const API_KEY = import.meta.env.VITE_TAPESTRY_API_KEY || 'demo-key';
const NAMESPACE = 'collab-canvas';

export interface TapestryProfile {
  id: string;
  walletAddress: string;
  username: string;
  bio: string;
  image: string;
  createdAt: string;
}

export interface TapestryComment {
  id: string;
  profileId: string;
  content: string;
  contentId: string;
  createdAt: string;
  profile?: TapestryProfile;
}

async function tapestryFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Tapestry API error: ${response.status}`);
  }
  
  return response.json();
}

export async function getOrCreateProfile(walletAddress: string): Promise<TapestryProfile | null> {
  try {
    // Try to find or create profile using findOrCreate endpoint
    const result = await tapestryFetch(`/profiles/findOrCreate?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        username: `artist_${walletAddress.slice(0, 8)}`,
      }),
    });
    return result as TapestryProfile;
  } catch (error) {
    console.error('Tapestry profile error:', error);
    return null;
  }
}

export async function updateProfile(
  profileId: string,
  updates: { username?: string; bio?: string; image?: string }
): Promise<TapestryProfile | null> {
  try {
    const result = await tapestryFetch(`/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return result as TapestryProfile;
  } catch (error) {
    console.error('Update profile error:', error);
    return null;
  }
}

export async function getComments(contentId: string): Promise<TapestryComment[]> {
  try {
    const result = await tapestryFetch(`/comments?contentId=${contentId}&namespace=${NAMESPACE}`);
    return (result?.comments || []) as TapestryComment[];
  } catch (error) {
    console.error('Get comments error:', error);
    return [];
  }
}

export async function postComment(
  profileId: string,
  contentId: string,
  content: string
): Promise<TapestryComment | null> {
  try {
    const result = await tapestryFetch(`/comments?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        contentId,
        text: content,
      }),
    });
    return result as TapestryComment;
  } catch (error) {
    console.error('Post comment error:', error);
    return null;
  }
}

export async function likeContent(profileId: string, contentId: string): Promise<boolean> {
  try {
    await tapestryFetch(`/likes/${contentId}?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    });
    return true;
  } catch (error) {
    console.error('Like error:', error);
    return false;
  }
}

export async function getLikes(contentId: string): Promise<number> {
  try {
    const result = await tapestryFetch(`/likes/${contentId}?namespace=${NAMESPACE}`);
    return result?.count || 0;
  } catch (error) {
    console.error('Get likes error:', error);
    return 0;
  }
}

export async function followProfile(followerProfileId: string, followingProfileId: string): Promise<boolean> {
  try {
    await tapestryFetch(`/followers?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({
        startId: followerProfileId,
        endId: followingProfileId,
      }),
    });
    return true;
  } catch (error) {
    console.error('Follow error:', error);
    return false;
  }
}
