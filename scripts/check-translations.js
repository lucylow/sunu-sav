#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/i18n');
const LOCALES = ['fr', 'wo', 'en'];

// Flatten nested object to dot notation
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
}

// Load translations from JSON files
function loadTranslations() {
  const translations = {};
  
  LOCALES.forEach(locale => {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        translations[locale] = flattenObject(data);
      } catch (error) {
        console.warn(`Failed to load ${locale}.json:`, error.message);
        translations[locale] = {};
      }
    } else {
      console.warn(`Translation file not found: ${filePath}`);
      translations[locale] = {};
    }
  });
  
  return translations;
}

// Check for missing translations
function checkTranslations(translations) {
  const allKeys = new Set();
  
  // Collect all unique keys
  Object.values(translations).forEach(localeData => {
    Object.keys(localeData).forEach(key => allKeys.add(key));
  });
  
  const issues = [];
  
  // Check each locale
  LOCALES.forEach(locale => {
    const localeData = translations[locale] || {};
    
    allKeys.forEach(key => {
      if (!localeData[key]) {
        issues.push({
          type: 'missing',
          locale,
          key,
          message: `Missing translation for key: ${key}`
        });
      } else if (localeData[key] === key) {
        issues.push({
          type: 'placeholder',
          locale,
          key,
          message: `Translation appears to be placeholder: ${key}`
        });
      }
    });
  });
  
  return issues;
}

// Check for unused translations
function checkUnusedTranslations(translations) {
  const unused = [];
  
  // This would require scanning the codebase for actual usage
  // For now, just report potential issues
  LOCALES.forEach(locale => {
    const localeData = translations[locale] || {};
    const keys = Object.keys(localeData);
    
    // Simple heuristic: keys that are very similar to their values might be unused
    keys.forEach(key => {
      if (key === localeData[key]) {
        unused.push({
          locale,
          key,
          message: `Key matches value, might be unused: ${key}`
        });
      }
    });
  });
  
  return unused;
}

// Main function
function main() {
  console.log('🔍 Checking translations...');
  
  try {
    const translations = loadTranslations();
    const missingIssues = checkTranslations(translations);
    const unusedIssues = checkUnusedTranslations(translations);
    
    console.log(`📊 Translation Statistics:`);
    LOCALES.forEach(locale => {
      const count = Object.keys(translations[locale] || {}).length;
      console.log(`  ${locale}: ${count} keys`);
    });
    
    if (missingIssues.length > 0) {
      console.log(`\n❌ Missing Translations (${missingIssues.length}):`);
      missingIssues.forEach(issue => {
        console.log(`  ${issue.locale}: ${issue.message}`);
      });
    }
    
    if (unusedIssues.length > 0) {
      console.log(`\n⚠️  Potential Unused Translations (${unusedIssues.length}):`);
      unusedIssues.forEach(issue => {
        console.log(`  ${issue.locale}: ${issue.message}`);
      });
    }
    
    if (missingIssues.length === 0 && unusedIssues.length === 0) {
      console.log('\n✅ All translations look good!');
    } else {
      console.log(`\n📝 Total issues found: ${missingIssues.length + unusedIssues.length}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { loadTranslations, checkTranslations, checkUnusedTranslations };
