import { Request, Response, NextFunction } from 'express';
import i18n from './i18n';

// Extend Request interface to include locale
declare global {
  namespace Express {
    interface Request {
      locale?: string;
      user?: {
        preferred_language?: string;
      };
    }
  }
}

export function localeMiddleware(req: Request, res: Response, next: NextFunction) {
  let locale = 'fr'; // Default to French for Senegal

  // Priority order:
  // 1. User preference from database (if authenticated)
  // 2. x-user-lang header
  // 3. Accept-Language header
  // 4. Default fallback

  if (req.user?.preferred_language) {
    locale = req.user.preferred_language;
  } else if (req.headers['x-user-lang']) {
    locale = req.headers['x-user-lang'] as string;
  } else if (req.headers['accept-language']) {
    // Parse Accept-Language header
    const acceptLanguage = req.headers['accept-language'] as string;
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().split('-')[0])
      .filter(lang => i18n.isLocaleSupported(lang));
    
    if (languages.length > 0) {
      locale = languages[0];
    }
  }

  // Validate locale
  if (!i18n.isLocaleSupported(locale)) {
    locale = 'fr'; // Fallback to French
  }

  // Set locale for this request
  req.locale = locale;
  i18n.setLocale(locale);

  next();
}

// Helper function to get locale for a request
export function getLocaleForRequest(req: Request): string {
  return req.locale || 'fr';
}

// Helper function to translate with request context
export function translate(req: Request, key: string, options?: Record<string, any>): string {
  const locale = getLocaleForRequest(req);
  i18n.setLocale(locale);
  return i18n.t(key, options);
}

// Helper function to format numbers with request locale
export function formatNumber(req: Request, number: number): string {
  const locale = getLocaleForRequest(req);
  return i18n.formatNumber(number, locale);
}

// Helper function to format dates with request locale
export function formatDate(req: Request, date: Date): string {
  const locale = getLocaleForRequest(req);
  return i18n.formatDate(date, locale);
}
