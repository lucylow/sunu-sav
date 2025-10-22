import React from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

// Simplified button variants without class-variance-authority
const getButtonClasses = (variant?: string, size?: string, className?: string) => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    default: 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:shadow-lg active:bg-orange-700',
    secondary: 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200 hover:border-yellow-300',
    destructive: 'bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg',
    outline: 'border border-orange-300 bg-transparent text-orange-700 hover:bg-orange-50 hover:border-orange-400',
    ghost: 'text-orange-700 hover:bg-orange-50',
    link: 'text-orange-600 underline-offset-4 hover:underline',
    lightning: 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-yellow-600',
    community: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md hover:shadow-lg hover:from-orange-500 hover:to-orange-700',
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-xs',
    default: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
    xl: 'h-14 px-10 text-lg',
    icon: 'h-11 w-11',
  };
  
  return cn(
    baseClasses,
    variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
    sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default,
    className
  );
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "lightning" | "community";
  size?: "sm" | "default" | "lg" | "xl" | "icon";
  asChild?: boolean;
  loading?: boolean;
  showLightning?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, loading = false, showLightning = false, children, ...props }, ref) => {
    return (
      <button
        className={getButtonClasses(variant, size, className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {showLightning && !loading && (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Specialized button components for different contexts
export const LightningButton: React.FC<Omit<ButtonProps, 'variant' | 'showLightning'>> = (props) => (
  <Button variant="lightning" showLightning {...props} />
);

export const CommunityButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="community" {...props} />
);

export const ContributionButton: React.FC<ButtonProps> = ({ children, ...props }) => (
  <Button variant="lightning" size="lg" className="w-full" {...props}>
    <Zap className="mr-2 h-5 w-5" />
    {children || 'Contribuer'}
  </Button>
);

export const JoinGroupButton: React.FC<ButtonProps> = ({ children, ...props }) => (
  <Button variant="community" size="lg" className="w-full" {...props}>
    {children || 'Rejoindre le groupe'}
  </Button>
);

export { Button };
