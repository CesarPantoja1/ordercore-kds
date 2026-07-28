import { useState, useEffect } from 'react';

interface TimerBadgeProps {
  timestamp: string;
}

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

function getMinutesElapsed(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

export default function TimerBadge({ timestamp }: TimerBadgeProps) {
  const [_now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = formatElapsed(timestamp);
  const minutes = getMinutesElapsed(timestamp);

  let colorClass = 'bg-green-100 text-green-700';
  if (minutes >= 20) {
    colorClass = 'bg-red-100 text-red-700';
  } else if (minutes >= 10) {
    colorClass = 'bg-amber-100 text-amber-700';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium ${colorClass}`}>
      {elapsed}
    </span>
  );
}
