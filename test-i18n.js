import i18n from '../server/_core/i18n';

// Test the i18n service
console.log('🧪 Testing i18n service...');

// Test basic translation
i18n.setLocale('fr');
console.log('French:', i18n.t('app.welcome', { name: 'Aissatou' }));

i18n.setLocale('wo');
console.log('Wolof:', i18n.t('app.welcome', { name: 'Aissatou' }));

i18n.setLocale('en');
console.log('English:', i18n.t('app.welcome', { name: 'Aissatou' }));

// Test number formatting
i18n.setLocale('fr');
console.log('French number:', i18n.formatNumber(50000));

i18n.setLocale('wo');
console.log('Wolof number:', i18n.formatNumber(50000));

// Test date formatting
const now = new Date();
i18n.setLocale('fr');
console.log('French date:', i18n.formatDate(now));

i18n.setLocale('wo');
console.log('Wolof date:', i18n.formatDate(now));

// Test fallback
i18n.setLocale('fr');
console.log('Fallback test:', i18n.t('nonexistent.key'));

// Test available locales
console.log('Available locales:', i18n.getAvailableLocales());

console.log('✅ i18n service tests completed!');
