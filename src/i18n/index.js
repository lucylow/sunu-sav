import I18n from 'i18n-js';
import * as Localize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import fr from './fr.json';
import wo from './wo.json'; // Wolof

I18n.translations = { en, fr, wo };
I18n.fallbacks = true;

const LANGUAGE_STORAGE_KEY = 'sunu_lang';

// Initialize with device locale or saved preference
export async function initI18n() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const deviceLocale = Localize.getLocales()[0]?.languageCode;
    
    // Default to French for Senegal, fallback to device locale
    const fallback = saved || deviceLocale || 'fr';
    
    I18n.locale = fallback;
    return I18n;
  } catch (error) {
    console.warn('Failed to initialize i18n:', error);
    I18n.locale = 'fr'; // Fallback to French
    return I18n;
  }
}

// Set app language and persist
export async function setAppLanguage(lang: string) {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    I18n.locale = lang;
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
}

// Get current app language
export function getAppLanguage() {
  return I18n.locale;
}

// Translation helper with interpolation
export function t(key: string, options?: any) {
  return I18n.t(key, options);
}

// Format numbers with locale
export function formatNumber(number: number, locale?: string) {
  const currentLocale = locale || I18n.locale;
  try {
    return new Intl.NumberFormat(currentLocale).format(number);
  } catch (error) {
    return number.toString();
  }
}

// Format dates with locale
export function formatDate(date: Date, locale?: string) {
  const currentLocale = locale || I18n.locale;
  try {
    return new Intl.DateTimeFormat(currentLocale, { 
      dateStyle: 'short',
      timeStyle: 'short' 
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
}

export default I18n;