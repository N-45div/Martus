import { formatAddress } from '../lib/program';
import type { ActivityItem } from '../types';
import { Coins, Palette, Vote, MessageSquare, Send } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const iconMap = {
  fund: Coins,
  bid: Send,
  vote: Vote,
  paint: Palette,
  comment: MessageSquare,
};

const colorMap = {
  fund: 'text-emerald-400',
  bid: 'text-indigo-400',
  vote: 'text-purple-400',
  paint: 'text-amber-400',
  comment: 'text-blue-400',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'fund':
        return `funded region (${activity.regionX}, ${activity.regionY}) with ${(activity.amount || 0) / 1e9} SOL`;
      case 'bid':
        return `submitted a bid for region (${activity.regionX}, ${activity.regionY})`;
      case 'vote':
        return `voted on region (${activity.regionX}, ${activity.regionY})`;
      case 'paint':
        return `completed artwork for region (${activity.regionX}, ${activity.regionY})`;
      case 'comment':
        return activity.message || 'commented';
      default:
        return 'did something';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <MessageSquare size={18} />
        Activity Feed
      </h3>
      
      {activities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div className={`mt-1 ${colorMap[activity.type]}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p>
                    <span className="font-mono text-gray-300">
                      {formatAddress(activity.actor)}
                    </span>{' '}
                    <span className="text-gray-400">{getActivityText(activity)}</span>
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No activity yet. Be the first to contribute!</p>
      )}
    </div>
  );
}
