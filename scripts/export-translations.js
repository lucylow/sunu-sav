#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/i18n');
const OUTPUT_FILE = path.join(__dirname, '../translations_export.csv');

// Supported locales
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

// Generate CSV content
function generateCSV(translations) {
  const allKeys = new Set();
  
  // Collect all unique keys
  Object.values(translations).forEach(localeData => {
    Object.keys(localeData).forEach(key => allKeys.add(key));
  });
  
  const sortedKeys = Array.from(allKeys).sort();
  
  // CSV header
  const header = ['key', ...LOCALES].join(',');
  
  // CSV rows
  const rows = sortedKeys.map(key => {
    const row = [key];
    LOCALES.forEach(locale => {
      const value = translations[locale][key] || '';
      // Escape CSV values (handle quotes and commas)
      const escapedValue = value.replace(/"/g, '""');
      row.push(`"${escapedValue}"`);
    });
    return row.join(',');
  });
  
  return [header, ...rows].join('\n');
}

// Main function
function main() {
  console.log('🌍 Exporting translations to CSV...');
  
  try {
    const translations = loadTranslations();
    const csvContent = generateCSV(translations);
    
    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    
    console.log(`✅ Translations exported to: ${OUTPUT_FILE}`);
    console.log(`📊 Total keys: ${Object.keys(flattenObject(translations.fr || {})).length}`);
    console.log(`🌐 Locales: ${LOCALES.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { loadTranslations, generateCSV };
