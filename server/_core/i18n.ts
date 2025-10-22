import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Translation interface
interface Translations {
  [key: string]: string | Translations;
}

interface LocaleData {
  [locale: string]: Translations;
}

class I18nService {
  private translations: LocaleData = {};
  private fallbackLocale: string = 'fr';
  private currentLocale: string = 'fr';

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations() {
    const localesDir = path.join(__dirname, 'i18n');
    
    try {
      // Load French translations
      const frPath = path.join(localesDir, 'fr.yml');
      if (fs.existsSync(frPath)) {
        const frContent = fs.readFileSync(frPath, 'utf8');
        this.translations.fr = yaml.load(frContent) as Translations;
      }

      // Load Wolof translations
      const woPath = path.join(localesDir, 'wo.yml');
      if (fs.existsSync(woPath)) {
        const woContent = fs.readFileSync(woPath, 'utf8');
        this.translations.wo = yaml.load(woContent) as Translations;
      }

      // Load English translations
      const enPath = path.join(localesDir, 'en.yml');
      if (fs.existsSync(enPath)) {
        const enContent = fs.readFileSync(enPath, 'utf8');
        this.translations.en = yaml.load(enContent) as Translations;
      }
    } catch (error) {
      console.warn('Failed to load translations:', error);
    }
  }

  setLocale(locale: string) {
    this.currentLocale = locale;
  }

  getLocale(): string {
    return this.currentLocale;
  }

  // Get translation with fallback
  t(key: string, options?: Record<string, any>): string {
    const keys = key.split('.');
    let translation: any = this.translations[this.currentLocale];

    // Try to get translation from current locale
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        translation = null;
        break;
      }
    }

    // If not found, try fallback locale
    if (!translation || typeof translation !== 'string') {
      translation = this.translations[this.fallbackLocale];
      for (const k of keys) {
        if (translation && typeof translation === 'object' && k in translation) {
          translation = translation[k];
        } else {
          translation = null;
          break;
        }
      }
    }

    // If still not found, return the key
    if (!translation || typeof translation !== 'string') {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Replace placeholders
    if (options) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
        return options[placeholder] || match;
      });
    }

    return translation;
  }

  // Format numbers with locale
  formatNumber(number: number, locale?: string): string {
    const currentLocale = locale || this.currentLocale;
    try {
      return new Intl.NumberFormat(currentLocale).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // Format dates with locale
  formatDate(date: Date, locale?: string): string {
    const currentLocale = locale || this.currentLocale;
    try {
      return new Intl.DateTimeFormat(currentLocale, {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  // Get available locales
  getAvailableLocales(): string[] {
    return Object.keys(this.translations);
  }

  // Check if locale is supported
  isLocaleSupported(locale: string): boolean {
    return locale in this.translations;
  }
}

// Create singleton instance
const i18n = new I18nService();

export default i18n;
export { I18nService };
