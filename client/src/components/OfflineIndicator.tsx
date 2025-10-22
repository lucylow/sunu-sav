// client/src/components/OfflineIndicator.tsx
// NOTE: This component contains React Native imports and needs to be converted to web components
// For now, providing a placeholder to fix TypeScript errors

import React from 'react';

interface OfflineIndicatorProps {
  // Add props as needed
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = () => {
  return (
    <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
      <span className="text-yellow-800 text-sm">Offline Mode</span>
    </div>
  );
};

export default OfflineIndicator;