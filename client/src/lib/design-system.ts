// Brand Colors and Design Tokens for SunuSàv
export const brandColors = {
  // Primary warm oranges and gold tones
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Secondary gold tones
  gold: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main gold
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Earth tones for backgrounds
  earth: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  
  // Dark brown/charcoal for text
  charcoal: {
    50: '#f6f6f6',
    100: '#e7e7e7',
    200: '#d1d1d1',
    300: '#b0b0b0',
    400: '#888888',
    500: '#6d6d6d',
    600: '#5d5d5d',
    700: '#4f4f4f',
    800: '#454545',
    900: '#3d3d3d',
  },
  
  // Success, warning, error colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const designTokens = {
  // Spacing scale with generous spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },
  
  // Border radius with rounded corners
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows for soft depth
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Montserrat', 'system-ui', 'sans-serif'],
      display: ['Montserrat', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
};

// African textile pattern utilities
export const textilePatterns = {
  // Subtle geometric patterns for backgrounds
  geometric: {
    background: 'linear-gradient(45deg, transparent 25%, rgba(251, 146, 60, 0.1) 25%, rgba(251, 146, 60, 0.1) 50%, transparent 50%, transparent 75%, rgba(251, 146, 60, 0.1) 75%)',
    size: '20px 20px',
  },
  
  // Diagonal stripes for accents
  diagonal: {
    background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(245, 158, 11, 0.1) 10px, rgba(245, 158, 11, 0.1) 20px)',
  },
  
  // Dot pattern for subtle texture
  dots: {
    background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 1px, transparent 1px)',
    size: '20px 20px',
  },
};

// Community-centric UI patterns
export const communityPatterns = {
  // Circular progress rings
  progressRing: {
    strokeWidth: 8,
    radius: 40,
    circumference: 2 * Math.PI * 40,
  },
  
  // Avatar sizes for different contexts
  avatar: {
    sm: '2rem',    // 32px
    md: '3rem',    // 48px
    lg: '4rem',    // 64px
    xl: '6rem',    // 96px
  },
  
  // Group member grid layouts
  memberGrid: {
    cols: {
      sm: 2,
      md: 3,
      lg: 4,
      xl: 6,
    },
  },
};

// Lightning theme elements
export const lightningTheme = {
  // Lightning bolt icon variants
  bolt: {
    primary: '#f97316',
    secondary: '#f59e0b',
    accent: '#3b82f6',
  },
  
  // Electric/energy effects
  effects: {
    glow: '0 0 20px rgba(249, 115, 22, 0.3)',
    pulse: '0 0 0 0 rgba(249, 115, 22, 0.7)',
  },
};

// Gamification elements
export const gamification = {
  // Badge colors
  badges: {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
  },
  
  // Progress levels
  levels: {
    beginner: { color: '#10b981', threshold: 0 },
    intermediate: { color: '#3b82f6', threshold: 1000 },
    advanced: { color: '#8b5cf6', threshold: 5000 },
    expert: { color: '#f59e0b', threshold: 10000 },
  },
  
  // Achievement categories
  achievements: {
    contribution: { icon: '💰', color: '#10b981' },
    consistency: { icon: '📅', color: '#3b82f6' },
    community: { icon: '👥', color: '#8b5cf6' },
    leadership: { icon: '👑', color: '#f59e0b' },
  },
};

// Localization and accessibility
export const accessibility = {
  // High contrast ratios for readability
  contrast: {
    normal: 4.5,
    large: 3.0,
    enhanced: 7.0,
  },
  
  // Touch target sizes (minimum 44px)
  touchTargets: {
    min: '2.75rem', // 44px
    comfortable: '3rem', // 48px
    large: '3.5rem', // 56px
  },
  
  // Focus indicators
  focus: {
    ring: '2px solid #f97316',
    offset: '2px',
  },
};

// Mobile-first responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export default {
  brandColors,
  designTokens,
  textilePatterns,
  communityPatterns,
  lightningTheme,
  gamification,
  accessibility,
  breakpoints,
};
