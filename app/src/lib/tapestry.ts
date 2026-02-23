// Tapestry Social Integration
// Uses REST API with local fallback for CORS issues in demo mode

const API_URL = 'https://api.usetapestry.dev/v1';
const API_KEY = import.meta.env.VITE_TAPESTRY_API_KEY || 'demo-key';
const NAMESPACE = 'collab-canvas';

// Local storage fallback for demo (when CORS blocks API)
const LOCAL_STORAGE_KEY = 'martus_social_data';
let useLocalFallback = false;

interface LocalSocialData {
  profiles: Record<string, TapestryProfile>;
  comments: Record<string, TapestryComment[]>;
  likes: Record<string, { count: number; users: string[] }>;
}

function getLocalData(): LocalSocialData {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { profiles: {}, comments: {}, likes: {} };
  } catch {
    return { profiles: {}, comments: {}, likes: {} };
  }
}

function saveLocalData(data: LocalSocialData) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

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
  // Skip API call if we know it's blocked
  if (useLocalFallback) {
    throw new Error('Using local fallback');
  }

  try {
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
  } catch (error) {
    // CORS or network error - switch to local fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Tapestry API blocked by CORS, using local storage fallback');
      useLocalFallback = true;
    }
    throw error;
  }
}

export async function getOrCreateProfile(walletAddress: string): Promise<TapestryProfile | null> {
  try {
    const result = await tapestryFetch(`/profiles/findOrCreate?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        username: `artist_${walletAddress.slice(0, 8)}`,
      }),
    });
    return result as TapestryProfile;
  } catch {
    // Fallback: create local profile
    const data = getLocalData();
    if (!data.profiles[walletAddress]) {
      data.profiles[walletAddress] = {
        id: `local_${walletAddress.slice(0, 8)}`,
        walletAddress,
        username: `player_${walletAddress.slice(0, 6)}`,
        bio: '',
        image: '',
        createdAt: new Date().toISOString(),
      };
      saveLocalData(data);
    }
    return data.profiles[walletAddress];
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
  } catch {
    // Fallback: get local comments
    const data = getLocalData();
    return data.comments[contentId] || [];
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
  } catch {
    // Fallback: save comment locally
    const data = getLocalData();
    const profile = Object.values(data.profiles).find(p => p.id === profileId);
    const newComment: TapestryComment = {
      id: `comment_${Date.now()}`,
      profileId,
      content,
      contentId,
      createdAt: new Date().toISOString(),
      profile,
    };
    if (!data.comments[contentId]) {
      data.comments[contentId] = [];
    }
    data.comments[contentId].unshift(newComment);
    saveLocalData(data);
    return newComment;
  }
}

export async function likeContent(profileId: string, contentId: string): Promise<boolean> {
  try {
    await tapestryFetch(`/likes/${contentId}?namespace=${NAMESPACE}`, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    });
    return true;
  } catch {
    // Fallback: save like locally
    const data = getLocalData();
    if (!data.likes[contentId]) {
      data.likes[contentId] = { count: 0, users: [] };
    }
    if (!data.likes[contentId].users.includes(profileId)) {
      data.likes[contentId].count++;
      data.likes[contentId].users.push(profileId);
      saveLocalData(data);
    }
    return true;
  }
}

export async function getLikes(contentId: string): Promise<number> {
  try {
    const result = await tapestryFetch(`/likes/${contentId}?namespace=${NAMESPACE}`);
    return result?.count || 0;
  } catch {
    // Fallback: get local likes
    const data = getLocalData();
    return data.likes[contentId]?.count || 0;
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
