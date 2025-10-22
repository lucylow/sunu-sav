import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  width, 
  height, 
  className,
  rounded = true 
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create shimmer animation
    const shimmer = document.createElement('div');
    shimmer.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent';
    shimmer.style.animation = 'shimmer 1.5s infinite';
    
    element.appendChild(shimmer);

    return () => {
      if (shimmer.parentNode) {
        shimmer.parentNode.removeChild(shimmer);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div
        ref={elementRef}
        className={cn(
          'relative overflow-hidden bg-gray-200 animate-pulse',
          rounded && 'rounded-md',
          className
        )}
        style={{
          width: width || '100%',
          height: height || '1rem',
        }}
      />
    </>
  );
};

export const TontineCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <SkeletonLoader width="120px" height="20px" />
      <SkeletonLoader width="60px" height="20px" />
    </div>
    
    <div className="flex justify-between mb-3">
      <SkeletonLoader width="80px" height="16px" />
      <SkeletonLoader width="80px" height="16px" />
      <SkeletonLoader width="80px" height="16px" />
    </div>
    
    <SkeletonLoader width="100%" height="6px" className="mb-2" />
    <SkeletonLoader width="100%" height="40px" className="rounded-lg" />
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <TontineCardSkeleton key={index} />
    ))}
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 p-4">
    <SkeletonLoader width="60px" height="60px" className="rounded-full" />
    <div className="space-y-2 flex-1">
      <SkeletonLoader width="150px" height="20px" />
      <SkeletonLoader width="100px" height="16px" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: cols }).map((_, index) => (
        <SkeletonLoader key={index} width="120px" height="20px" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <SkeletonLoader key={colIndex} width="100px" height="16px" />
        ))}
      </div>
    ))}
  </div>
);
