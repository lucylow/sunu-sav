// client/src/lib/ux-enhancements.ts
/**
 * UX Enhancement Service
 * Provides advanced user experience features for SunuSàv
 */

import { demoService } from './demo-service';
import { toast } from 'sonner';

export interface UXPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'wo' | 'en';
  currency: 'XOF' | 'BTC' | 'USD';
  notifications: {
    payments: boolean;
    payouts: boolean;
    groupUpdates: boolean;
    security: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
  privacy: {
    showBalances: boolean;
    shareAnalytics: boolean;
    biometricAuth: boolean;
  };
}

export interface UXAnalytics {
  sessionDuration: number;
  pagesVisited: string[];
  actionsPerformed: string[];
  errorsEncountered: string[];
  performanceMetrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    renderTime: number;
  };
}

export interface SmartSuggestion {
  type: 'payment' | 'join' | 'create' | 'security' | 'optimization';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

export class UXEnhancementService {
  private static instance: UXEnhancementService;
  private preferences: UXPreferences;
  private analytics: UXAnalytics;
  private sessionStart: Date;
  private currentPage: string = '';

  private constructor() {
    this.sessionStart = new Date();
    this.preferences = this.loadPreferences();
    this.analytics = this.initializeAnalytics();
    this.setupAccessibility();
  }

  static getInstance(): UXEnhancementService {
    if (!UXEnhancementService.instance) {
      UXEnhancementService.instance = new UXEnhancementService();
    }
    return UXEnhancementService.instance;
  }

  /**
   * Initialize UX enhancements
   */
  async initialize(): Promise<void> {
    try {
      // Apply theme
      this.applyTheme();
      
      // Setup accessibility features
      this.setupAccessibility();
      
      // Initialize analytics
      this.startAnalytics();
      
      // Setup smart suggestions
      this.setupSmartSuggestions();
      
      console.log('🎨 UX Enhancement Service initialized');
    } catch (error) {
      console.error('Failed to initialize UX enhancements:', error);
    }
  }

  /**
   * Load user preferences from localStorage
   */
  private loadPreferences(): UXPreferences {
    const defaultPreferences: UXPreferences = {
      theme: 'light',
      language: 'fr',
      currency: 'XOF',
      notifications: {
        payments: true,
        payouts: true,
        groupUpdates: true,
        security: true
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReader: false
      },
      privacy: {
        showBalances: true,
        shareAnalytics: true,
        biometricAuth: false
      }
    };

    try {
      const stored = localStorage.getItem('sunusav-ux-preferences');
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load UX preferences:', error);
    }

    return defaultPreferences;
  }

  /**
   * Save user preferences to localStorage
   */
  savePreferences(preferences: Partial<UXPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    localStorage.setItem('sunusav-ux-preferences', JSON.stringify(this.preferences));
    this.applyTheme();
    this.setupAccessibility();
  }

  /**
   * Get current preferences
   */
  getPreferences(): UXPreferences {
    return { ...this.preferences };
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    const root = document.documentElement;
    
    if (this.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (this.preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  /**
   * Setup accessibility features
   */
  private setupAccessibility(): void {
    const root = document.documentElement;
    
    if (this.preferences.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (this.preferences.accessibility.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (this.preferences.accessibility.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): UXAnalytics {
    return {
      sessionDuration: 0,
      pagesVisited: [],
      actionsPerformed: [],
      errorsEncountered: [],
      performanceMetrics: {
        pageLoadTime: 0,
        apiResponseTime: 0,
        renderTime: 0
      }
    };
  }

  /**
   * Start analytics tracking
   */
  private startAnalytics(): void {
    // Track page visits
    this.trackPageVisit(window.location.pathname);
    
    // Track performance
    this.trackPerformance();
    
    // Track user interactions
    this.trackInteractions();
  }

  /**
   * Track page visit
   */
  trackPageVisit(page: string): void {
    this.currentPage = page;
    if (!this.analytics.pagesVisited.includes(page)) {
      this.analytics.pagesVisited.push(page);
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, data?: any): void {
    this.analytics.actionsPerformed.push(action);
    
    // Log important actions
    if (['payment', 'payout', 'join_group', 'create_group'].includes(action)) {
      console.log(`🎯 User action: ${action}`, data);
    }
  }

  /**
   * Track error
   */
  trackError(error: string, context?: any): void {
    this.analytics.errorsEncountered.push(error);
    console.error(`❌ UX Error: ${error}`, context);
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(): void {
    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.analytics.performanceMetrics.pageLoadTime = loadTime;
    });

    // Track API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const end = performance.now();
        this.analytics.performanceMetrics.apiResponseTime = end - start;
        return response;
      } catch (error) {
        this.trackError('API Error', { url: args[0], error });
        throw error;
      }
    };
  }

  /**
   * Track user interactions
   */
  private trackInteractions(): void {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.getAttribute('data-action') || target.textContent;
      
      if (action && ['Pay', 'Join', 'Create', 'Leave'].includes(action)) {
        this.trackAction(`click_${action.toLowerCase()}`, {
          element: target.tagName,
          page: this.currentPage
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackAction('form_submit', {
        formId: form.id,
        page: this.currentPage
      });
    });
  }

  /**
   * Setup smart suggestions
   */
  private setupSmartSuggestions(): void {
    // This would integrate with AI/ML to provide smart suggestions
    // For now, we'll provide basic rule-based suggestions
  }

  /**
   * Get smart suggestions based on user behavior
   */
  getSmartSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const currentUser = demoService.getCurrentUser();
    
    if (!currentUser) return suggestions;

    // Payment suggestions
    const userGroups = demoService.getUserGroups(currentUser.id);
    const overdueGroups = userGroups.filter(group => {
      const now = new Date();
      const nextDue = group.nextPayoutDate ? new Date(group.nextPayoutDate) : null;
      return nextDue && nextDue.getTime() < now.getTime();
    });

    if (overdueGroups.length > 0) {
      suggestions.push({
        type: 'payment',
        title: 'Overdue Payments',
        description: `You have ${overdueGroups.length} overdue payment${overdueGroups.length > 1 ? 's' : ''}`,
        action: 'Pay Now',
        priority: 'high',
        data: { groups: overdueGroups }
      });
    }

    // Join suggestions
    const allGroups = demoService.getGroups();
    const availableGroups = allGroups.filter(group => 
      group.currentMembers < group.maxMembers && 
      !userGroups.some(ug => ug.id === group.id)
    );

    if (availableGroups.length > 0) {
      suggestions.push({
        type: 'join',
        title: 'Available Groups',
        description: `${availableGroups.length} groups are accepting new members`,
        action: 'Browse Groups',
        priority: 'medium',
        data: { groups: availableGroups }
      });
    }

    // Security suggestions
    if (this.preferences.privacy.biometricAuth === false) {
      suggestions.push({
        type: 'security',
        title: 'Enable Biometric Auth',
        description: 'Add an extra layer of security to your account',
        action: 'Enable',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Show contextual help
   */
  showContextualHelp(context: string): void {
    const helpMessages: Record<string, string> = {
      'payment': 'Tap "Pay Now" to make your contribution using Wave or Orange Money',
      'join': 'Review the group rules and tap "Join Group" to become a member',
      'create': 'Fill out the form to create a new tontine group for your community',
      'payout': 'The winner is selected randomly when all members have paid',
      'security': 'All transactions are secured with Bitcoin Lightning Network'
    };

    const message = helpMessages[context];
    if (message) {
      toast.info(message, {
        duration: 5000,
        description: 'Need more help? Tap the help icon for detailed information.'
      });
    }
  }

  /**
   * Format currency based on user preference
   */
  formatCurrency(amount: number, currency?: string): string {
    const targetCurrency = currency || this.preferences.currency;
    
    switch (targetCurrency) {
      case 'XOF':
        return `${amount.toLocaleString()} XOF`;
      case 'BTC':
        const btcAmount = amount / 100000000; // Convert sats to BTC
        return `${btcAmount.toFixed(8)} BTC`;
      case 'USD':
        const usdAmount = amount * 0.00002; // Approximate conversion
        return `$${usdAmount.toFixed(2)} USD`;
      default:
        return `${amount.toLocaleString()} sats`;
    }
  }

  /**
   * Get accessibility-friendly color contrast
   */
  getAccessibleColor(baseColor: string, isHighContrast: boolean = this.preferences.accessibility.highContrast): string {
    if (isHighContrast) {
      // Return high contrast colors
      const highContrastColors: Record<string, string> = {
        'orange': '#FF6B00',
        'green': '#00AA00',
        'red': '#CC0000',
        'blue': '#0066CC',
        'gray': '#333333'
      };
      return highContrastColors[baseColor] || baseColor;
    }
    return baseColor;
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): UXAnalytics {
    this.analytics.sessionDuration = Date.now() - this.sessionStart.getTime();
    return { ...this.analytics };
  }

  /**
   * Export user data for portability
   */
  exportUserData(): string {
    const userData = {
      preferences: this.preferences,
      analytics: this.getAnalyticsSummary(),
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(userData, null, 2);
  }

  /**
   * Import user data
   */
  importUserData(data: string): boolean {
    try {
      const userData = JSON.parse(data);
      
      if (userData.preferences) {
        this.savePreferences(userData.preferences);
      }
      
      toast.success('User data imported successfully');
      return true;
    } catch (error) {
      toast.error('Failed to import user data');
      return false;
    }
  }

  /**
   * Reset to default preferences
   */
  resetPreferences(): void {
    localStorage.removeItem('sunusav-ux-preferences');
    this.preferences = this.loadPreferences();
    this.applyTheme();
    this.setupAccessibility();
    toast.success('Preferences reset to defaults');
  }

  /**
   * Get user onboarding status
   */
  getOnboardingStatus(): { completed: boolean; steps: string[] } {
    const completedSteps = localStorage.getItem('sunusav-onboarding-steps') || '[]';
    const steps = JSON.parse(completedSteps);
    
    const allSteps = [
      'welcome',
      'create_profile',
      'join_first_group',
      'make_first_payment',
      'understand_security',
      'setup_notifications'
    ];
    
    return {
      completed: steps.length === allSteps.length,
      steps: allSteps.filter(step => !steps.includes(step))
    };
  }

  /**
   * Mark onboarding step as completed
   */
  completeOnboardingStep(step: string): void {
    const completedSteps = localStorage.getItem('sunusav-onboarding-steps') || '[]';
    const steps = JSON.parse(completedSteps);
    
    if (!steps.includes(step)) {
      steps.push(step);
      localStorage.setItem('sunusav-onboarding-steps', JSON.stringify(steps));
    }
  }
}

// Export singleton instance
export const uxEnhancementService = UXEnhancementService.getInstance();

// Export types
export type { UXPreferences, UXAnalytics, SmartSuggestion };
