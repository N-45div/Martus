import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatAddress } from '../lib/program';
import { 
  getOrCreateProfile, 
  getComments, 
  postComment, 
  likeContent, 
  getLikes,
  type TapestryProfile,
  type TapestryComment 
} from '../lib/tapestry';
import { MessageSquare, Heart, User, Send } from 'lucide-react';

interface SocialPanelProps {
  contentId: string; // e.g., "season_xyz" or "region_0_0"
  title: string;
}

export function SocialPanel({ contentId, title }: SocialPanelProps) {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<TapestryProfile | null>(null);
  const [comments, setComments] = useState<TapestryComment[]>([]);
  const [likes, setLikes] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (publicKey) {
      loadProfile();
    }
    loadSocialData();
  }, [publicKey, contentId]);

  const loadProfile = async () => {
    if (!publicKey) return;
    const p = await getOrCreateProfile(publicKey.toBase58());
    setProfile(p);
  };

  const loadSocialData = async () => {
    const [fetchedComments, fetchedLikes] = await Promise.all([
      getComments(contentId),
      getLikes(contentId),
    ]);
    setComments(fetchedComments);
    setLikes(fetchedLikes);
  };

  const handlePostComment = async () => {
    if (!profile || !newComment.trim()) return;
    
    setLoading(true);
    const comment = await postComment(profile.id, contentId, newComment);
    if (comment) {
      setComments([comment, ...comments]);
      setNewComment('');
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!profile || hasLiked) return;
    
    const success = await likeContent(profile.id, contentId);
    if (success) {
      setLikes(likes + 1);
      setHasLiked(true);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare size={18} />
          {title}
        </h3>
        <button
          onClick={handleLike}
          disabled={hasLiked || !profile}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
            hasLiked 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          <Heart size={14} className={hasLiked ? 'fill-current' : ''} />
          {likes}
        </button>
      </div>

      {profile && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-800/50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center">
            <User size={14} />
          </div>
          <div className="text-sm">
            <p className="font-semibold">{profile.username}</p>
            <p className="text-gray-400 text-xs">{formatAddress(profile.walletAddress)}</p>
          </div>
        </div>
      )}

      {/* Comment Input */}
      {profile && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
          />
          <button
            onClick={handlePostComment}
            disabled={loading || !newComment.trim()}
            className="btn-primary p-2"
          >
            <Send size={16} />
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                  <User size={12} />
                </div>
                <span className="text-sm font-medium">
                  {comment.profile?.username || formatAddress(comment.profileId)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 ml-8">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            No comments yet. Be the first to share!
          </p>
        )}
      </div>

      {!publicKey && (
        <p className="text-gray-400 text-sm text-center py-4">
          Connect wallet to join the conversation
        </p>
      )}
    </div>
  );
}
