// client/src/components/SyncButton.tsx
// NOTE: This component contains React Native imports and needs to be converted to web components
// For now, providing a placeholder to fix TypeScript errors

import React from 'react';

interface SyncButtonProps {
  onPress?: () => void;
  // Add other props as needed
}

const SyncButton: React.FC<SyncButtonProps> = ({ onPress }) => {
  return (
    <button 
      onClick={onPress}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Sync
    </button>
  );
};

export default SyncButton;