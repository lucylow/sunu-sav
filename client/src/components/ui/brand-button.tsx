import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { brandColors, designTokens } from '@/lib/design-system';
import { Zap } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary brand button with warm orange
        default: 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:shadow-lg active:bg-orange-700',
        
        // Secondary with gold accent
        secondary: 'bg-gold-100 text-gold-800 border border-gold-200 hover:bg-gold-200 hover:border-gold-300',
        
        // Destructive with warm red
        destructive: 'bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg',
        
        // Outline with brand colors
        outline: 'border border-orange-300 bg-transparent text-orange-700 hover:bg-orange-50 hover:border-orange-400',
        
        // Ghost variant
        ghost: 'text-orange-700 hover:bg-orange-50',
        
        // Link variant
        link: 'text-orange-600 underline-offset-4 hover:underline',
        
        // Lightning theme variant
        lightning: 'bg-gradient-to-r from-orange-500 to-gold-500 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-gold-600',
        
        // Community variant for group actions
        community: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md hover:shadow-lg hover:from-orange-500 hover:to-orange-700',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        default: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  showLightning?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, showLightning = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
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

export { Button, buttonVariants };
