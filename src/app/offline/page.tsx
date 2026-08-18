import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-card-light border border-card-border flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-text-tertiary" />
      </div>
      <h1 className="font-display font-bold text-2xl text-text-primary mb-2">You're offline</h1>
      <p className="text-sm text-text-secondary max-w-xs">
        No connection right now. Pages and quizzes you've already opened still work —
        reconnect to sync your progress and reach new content.
      </p>
    </div>
  );
}
