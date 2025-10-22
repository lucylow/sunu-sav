import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SkeletonLoader } from './skeleton-loader';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  fallbackIcon?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  placeholderColor = '#F0F0F0',
  fallbackIcon,
  onLoad,
  onError,
  lazy = true,
  priority = false,
  sizes,
  quality = 75
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Generate optimized image URL with quality and size parameters
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return originalSrc;
    
    // If it's a data URL or already optimized, return as is
    if (originalSrc.startsWith('data:') || originalSrc.includes('?')) {
      return originalSrc;
    }

    // Add quality parameter for better compression
    const separator = originalSrc.includes('?') ? '&' : '?';
    return `${originalSrc}${separator}q=${quality}&auto=format`;
  };

  const optimizedSrc = getOptimizedSrc(src);

  if (imageError) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          'flex items-center justify-center bg-gray-100',
          className
        )}
        style={{ backgroundColor: placeholderColor }}
      >
        {fallbackIcon || (
          <div className="flex flex-col items-center text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs">Image non disponible</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Placeholder/Skeleton */}
      {!imageLoaded && isInView && (
        <div className="absolute inset-0">
          <SkeletonLoader 
            width="100%" 
            height="100%" 
            className="rounded-none"
          />
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes}
          decoding="async"
        />
      )}
    </div>
  );
};

// Avatar component with progressive loading
export const ProgressiveAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}> = ({ src, alt, size = 'md', className, fallbackText }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-200 text-gray-600 font-medium rounded-full',
        sizeClasses[size],
        className
      )}>
        {fallbackText ? getInitials(fallbackText) : '?'}
      </div>
    );
  }

  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      className={cn(
        'rounded-full object-cover',
        sizeClasses[size],
        className
      )}
      fallbackIcon={
        <div className={cn(
          'flex items-center justify-center bg-gray-200 text-gray-600 font-medium rounded-full',
          sizeClasses[size]
        )}>
          {fallbackText ? getInitials(fallbackText) : '?'}
        </div>
      }
    />
  );
};

// Image gallery component with progressive loading
export const ProgressiveImageGallery: React.FC<{
  images: Array<{ src: string; alt: string; caption?: string }>;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}> = ({ images, className, columns = 2 }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {images.map((image, index) => (
        <div key={index} className="space-y-2">
          <ProgressiveImage
            src={image.src}
            alt={image.alt}
            className="w-full h-48 object-cover rounded-lg"
            quality={80}
          />
          {image.caption && (
            <p className="text-sm text-gray-600 text-center">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// Responsive image component
export const ResponsiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait';
}> = ({ src, alt, className, aspectRatio = 'video' }) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[16/9]',
    portrait: 'aspect-[3/4]'
  };

  return (
    <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}>
      <ProgressiveImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        quality={85}
      />
    </div>
  );
};
