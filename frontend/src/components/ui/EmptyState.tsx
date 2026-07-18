import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

/** Empty state placeholder when no data is available. */
const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  message = 'Check back later for updates.',
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <div className="w-16 h-16 bg-f1-mid-gray rounded-2xl flex items-center justify-center mb-4">
      {icon || <Inbox className="w-8 h-8 text-f1-silver" />}
    </div>
    <h3 className="text-lg font-semibold text-f1-white mb-1">{title}</h3>
    <p className="text-f1-silver text-sm">{message}</p>
  </div>
);

export default EmptyState;
