import { formatAddress } from '../lib/program';
import type { ActivityItem } from '../types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const emojiMap = {
  fund: '💰',
  bid: '🎨',
  vote: '🗳️',
  paint: '✨',
  comment: '💬',
};

const colorMap = {
  fund: 'text-pixel-green',
  bid: 'text-pixel-cyan',
  vote: 'text-pixel-orange',
  paint: 'text-pixel-purple',
  comment: 'text-pixel-pink',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'fund':
        return `funded [${activity.regionX},${activity.regionY}]`;
      case 'bid':
        return `bid on [${activity.regionX},${activity.regionY}]`;
      case 'vote':
        return `voted [${activity.regionX},${activity.regionY}]`;
      case 'paint':
        return `painted [${activity.regionX},${activity.regionY}]`;
      case 'comment':
        return activity.message || 'commented';
      default:
        return 'action';
    }
  };

  return (
    <div className="card">
      <h3 className="font-pixel text-xs text-pixel-yellow mb-4">
        📜 ACTIVITY LOG
      </h3>
      
      {activities.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-2 text-sm bg-[--pixel-black] p-2 border-l-4 border-[--pixel-mid]">
              <span>{emojiMap[activity.type]}</span>
              <div className="flex-1 min-w-0">
                <span className={`${colorMap[activity.type]} font-pixel text-[8px]`}>
                  {formatAddress(activity.actor)}
                </span>
                <span className="text-[--pixel-light] ml-2 text-xs">
                  {getActivityText(activity)}
                </span>
              </div>
              <span className="text-[--pixel-light] text-xs shrink-0">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-[--pixel-light] text-sm">No activity yet...</p>
          <p className="text-xs text-[--pixel-mid] mt-1">Be the first player!</p>
        </div>
      )}
    </div>
  );
}
