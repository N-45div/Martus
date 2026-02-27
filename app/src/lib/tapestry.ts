// Tapestry Social Integration
// Uses local API proxy server to avoid CORS issues
// Full end-to-end integration with Tapestry Protocol

const API_BASE = '/api/tapestry';

const fallbackDate = () => new Date().toISOString();

const normalizeDate = (value?: string | number | null): string => {
  if (!value) return fallbackDate();
  if (typeof value === 'number') {
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  return value;
};

const normalizeProfile = (input: any, walletFallback = ''): TapestryProfile | null => {
  if (!input) return null;
  const profile = input.profile ?? input;
  const walletAddress = input.walletAddress || input.wallet?.address || walletFallback || '';
  const username = profile.username || input.username || walletAddress.slice(0, 8) || 'anon';
  return {
    id: profile.id || input.id || walletAddress,
    walletAddress,
    username,
    bio: profile.bio || input.bio || '',
    image: profile.image || input.image || profile.profileImage || input.profileImage || '',
    createdAt: normalizeDate(profile.created_at || profile.createdAt || input.createdAt),
    followerCount: input.followerCount,
    followingCount: input.followingCount,
  };
};

// ==================== TYPES ====================

export interface TapestryProfile {
  id: string;
  walletAddress: string;
  username: string;
  bio: string;
  image: string;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
}

export interface TapestryComment {
  id: string;
  profileId: string;
  content: string;
  contentId: string;
  createdAt: string;
  profile?: TapestryProfile;
}

export interface TapestryContent {
  id: string;
  profileId: string;
  type: string;
  data: Record<string, unknown>;
  contentId: string;
  createdAt: string;
  profile?: TapestryProfile;
  likeCount?: number;
  commentCount?: number;
}

export interface TapestryFollower {
  id: string;
  profile: TapestryProfile;
  createdAt: string;
}

// ==================== API FETCH ====================

async function tapestryFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tapestry API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// ==================== PROFILES ====================

export async function getOrCreateProfile(walletAddress: string, username?: string): Promise<TapestryProfile | null> {
  try {
    const result = await tapestryFetch<any>('/profiles/findOrCreate', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        username: username || `artist_${walletAddress.slice(0, 8)}`,
      }),
    });
    return normalizeProfile(result, walletAddress);
  } catch (error) {
    console.error('Get/create profile error:', error);
    return null;
  }
}

export async function getProfile(walletAddress: string): Promise<TapestryProfile | null> {
  try {
    const result = await tapestryFetch<any>(`/profiles/${walletAddress}`);
    return normalizeProfile(result, walletAddress);
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

export async function updateProfile(
  profileId: string,
  updates: { username?: string; bio?: string; image?: string }
): Promise<TapestryProfile | null> {
  try {
    const result = await tapestryFetch<any>(`/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return normalizeProfile(result, profileId);
  } catch (error) {
    console.error('Update profile error:', error);
    return null;
  }
}

export async function searchProfiles(query: string): Promise<TapestryProfile[]> {
  try {
    const result = await tapestryFetch<{ profiles?: any[] }>(`/profiles/search?query=${encodeURIComponent(query)}`);
    return (result.profiles || []).map(profile => normalizeProfile(profile)).filter(Boolean) as TapestryProfile[];
  } catch (error) {
    console.error('Search profiles error:', error);
    return [];
  }
}

// ==================== COMMENTS ====================

export async function getComments(contentId: string): Promise<TapestryComment[]> {
  try {
    const result = await tapestryFetch<{ comments?: any[] }>(`/comments?contentId=${encodeURIComponent(contentId)}`);
    return (result.comments || []).map((item) => {
      const comment = item.comment || item;
      const author = item.author || item.profile || {};
      return {
        id: comment.id || item.id,
        profileId: comment.profileId || author.id || item.profileId || '',
        content: comment.text || comment.content || item.content || '',
        contentId,
        createdAt: normalizeDate(comment.createdAt || comment.created_at || item.createdAt),
        profile: normalizeProfile(author) || undefined,
      };
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return [];
  }
}

export async function postComment(
  profileId: string,
  contentId: string,
  text: string
): Promise<TapestryComment | null> {
  try {
    const result = await tapestryFetch<any>('/comments', {
      method: 'POST',
      body: JSON.stringify({ profileId, contentId, text }),
    });
    const comment = result.comment || result;
    return {
      id: comment.id || result.id,
      profileId: comment.profileId || profileId,
      content: comment.text || comment.content || text,
      contentId,
      createdAt: normalizeDate(comment.createdAt || comment.created_at || result.createdAt),
      profile: normalizeProfile(result.author) || undefined,
    };
  } catch (error) {
    console.error('Post comment error:', error);
    return null;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    await tapestryFetch(`/comments/${commentId}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Delete comment error:', error);
    return false;
  }
}

// ==================== LIKES ====================

export async function getLikes(contentId: string): Promise<number> {
  try {
    const result = await tapestryFetch<any>(`/likes/${encodeURIComponent(contentId)}`);
    return result.likeCount || result.count || (result.likes ? result.likes.length : 0);
  } catch (error) {
    console.error('Get likes error:', error);
    return 0;
  }
}

export async function likeContent(profileId: string, contentId: string): Promise<boolean> {
  try {
    await tapestryFetch(`/likes/${encodeURIComponent(contentId)}`, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    });
    return true;
  } catch (error) {
    console.error('Like error:', error);
    return false;
  }
}

export async function unlikeContent(profileId: string, contentId: string): Promise<boolean> {
  try {
    await tapestryFetch(`/likes/${encodeURIComponent(contentId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ profileId }),
    });
    return true;
  } catch (error) {
    console.error('Unlike error:', error);
    return false;
  }
}

// ==================== FOLLOWERS ====================

export async function getFollowers(profileId: string): Promise<TapestryFollower[]> {
  try {
    const result = await tapestryFetch<{ followers: TapestryFollower[] }>(`/followers/${profileId}`);
    return result.followers || [];
  } catch (error) {
    console.error('Get followers error:', error);
    return [];
  }
}

export async function getFollowing(profileId: string): Promise<TapestryFollower[]> {
  try {
    const result = await tapestryFetch<{ following: TapestryFollower[] }>(`/following/${profileId}`);
    return result.following || [];
  } catch (error) {
    console.error('Get following error:', error);
    return [];
  }
}

export async function followProfile(followerProfileId: string, followingProfileId: string): Promise<boolean> {
  try {
    await tapestryFetch('/followers', {
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

export async function unfollowProfile(followerProfileId: string, followingProfileId: string): Promise<boolean> {
  try {
    await tapestryFetch('/followers', {
      method: 'DELETE',
      body: JSON.stringify({
        startId: followerProfileId,
        endId: followingProfileId,
      }),
    });
    return true;
  } catch (error) {
    console.error('Unfollow error:', error);
    return false;
  }
}

// ==================== CONTENT/POSTS ====================

export async function getContent(profileId?: string, type?: string): Promise<TapestryContent[]> {
  try {
    let endpoint = '/content';
    const params = new URLSearchParams();
    if (profileId) params.append('profileId', profileId);
    if (type) params.append('type', type);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    const result = await tapestryFetch<{ content: TapestryContent[] }>(endpoint);
    return result.content || [];
  } catch (error) {
    console.error('Get content error:', error);
    return [];
  }
}

export async function createContent(
  profileId: string,
  type: string,
  data: Record<string, unknown>,
  contentId?: string
): Promise<TapestryContent | null> {
  try {
    return await tapestryFetch<TapestryContent>('/content', {
      method: 'POST',
      body: JSON.stringify({ profileId, type, data, contentId }),
    });
  } catch (error) {
    console.error('Create content error:', error);
    return null;
  }
}

// ==================== FEED ====================

export async function getFeed(profileId: string): Promise<TapestryContent[]> {
  try {
    const result = await tapestryFetch<{ feed: TapestryContent[] }>(`/feed/${profileId}`);
    return result.feed || [];
  } catch (error) {
    console.error('Get feed error:', error);
    return [];
  }
}

// ==================== IDENTITIES ====================

export async function resolveIdentity(identifier: string): Promise<TapestryProfile | null> {
  try {
    return await tapestryFetch<TapestryProfile>(`/identities/${encodeURIComponent(identifier)}`);
  } catch (error) {
    console.error('Resolve identity error:', error);
    return null;
  }
}

// ==================== HEALTH CHECK ====================

export async function checkApiHealth(): Promise<{ status: string; tapestryConfigured: boolean }> {
  try {
    const response = await fetch('/api/health');
    return await response.json();
  } catch {
    return { status: 'error', tapestryConfigured: false };
  }
}
