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

interface SocialPanelProps {
  contentId: string;
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
        <h3 className="font-pixel text-xs text-pixel-pink">
          💬 {title}
        </h3>
        <button
          onClick={handleLike}
          disabled={hasLiked || !profile}
          className={`flex items-center gap-2 px-3 py-1 border-2 text-sm ${
            hasLiked 
              ? 'border-[--pixel-red] text-pixel-red bg-[--pixel-red]/20' 
              : 'border-[--pixel-mid] text-[--pixel-light] hover:border-[--pixel-red] hover:text-pixel-red'
          }`}
        >
          <span>{hasLiked ? '♥' : '♡'}</span>
          <span className="font-pixel text-[8px]">{likes}</span>
        </button>
      </div>

      {/* Profile Badge */}
      {profile && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-[--pixel-black] border-2 border-[--pixel-cyan]">
          <div className="w-8 h-8 bg-[--pixel-cyan] flex items-center justify-center text-[--pixel-black] font-pixel text-xs">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-pixel text-[8px] text-pixel-cyan">{profile.username}</p>
            <p className="text-xs text-[--pixel-light]">{formatAddress(profile.walletAddress)}</p>
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
            placeholder="Say something..."
            className="input-pixel flex-1 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
          />
          <button
            onClick={handlePostComment}
            disabled={loading || !newComment.trim()}
            className="btn-primary px-3"
          >
            ➤
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-[--pixel-black] p-3 border-l-4 border-[--pixel-pink]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-pixel text-[8px] text-pixel-cyan">
                  {comment.profile?.username || formatAddress(comment.profileId)}
                </span>
                <span className="text-[10px] text-[--pixel-mid]">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-[--pixel-white]">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">💭</div>
            <p className="text-[--pixel-light] text-sm">No comments yet...</p>
          </div>
        )}
      </div>

      {!publicKey && (
        <div className="text-center py-4 border-2 border-dashed border-[--pixel-mid]">
          <div className="text-2xl mb-2">🔌</div>
          <p className="text-[--pixel-light] text-sm">Connect wallet to chat</p>
        </div>
      )}
    </div>
  );
}
