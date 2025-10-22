# Multi-Language Support (i18n) for SunuSàv

This document describes the complete multi-language implementation for SunuSàv, supporting French, Wolof, and English.

## 🌍 Overview

SunuSàv supports three languages:
- **French (fr)** - Primary language for Senegal
- **Wolof (wo)** - Local language for Senegal
- **English (en)** - International support

## 📁 File Structure

```
src/i18n/
├── index.js          # Main i18n configuration
├── fr.json           # French translations
├── wo.json           # Wolof translations
└── en.json           # English translations

server/_core/
├── i18n.ts           # Backend i18n service
├── localeMiddleware.ts # Locale detection middleware
└── i18n/
    ├── fr.yml        # Backend French translations
    └── wo.yml        # Backend Wolof translations

scripts/
├── i18next-scanner.config.js # Translation key extraction
├── export-translations.js     # CSV export for translators
└── check-translations.js      # Translation validation
```

## 🚀 Quick Start

### Frontend Usage

```tsx
import { useTranslation } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.welcome', { name: 'Aissatou' })}</h1>
      <LanguageSelector />
    </div>
  );
}
```

### Backend Usage

```typescript
import { translate, localeMiddleware } from './localeMiddleware';

// In your route handler
app.use(localeMiddleware);

app.get('/api/hello', (req, res) => {
  const message = translate(req, 'app.welcome', { name: 'Aissatou' });
  res.json({ message });
});
```

## 🔧 Configuration

### Frontend Setup

1. **Initialize i18n** in your app root:
```tsx
import { LanguageProvider } from '@/hooks/useLanguage';

function App() {
  return (
    <LanguageProvider>
      {/* Your app components */}
    </LanguageProvider>
  );
}
```

2. **Language persistence** is handled automatically via AsyncStorage

### Backend Setup

1. **Add middleware** to your Express app:
```typescript
import { localeMiddleware } from './localeMiddleware';

app.use(localeMiddleware);
```

2. **Use translations** in your routes:
```typescript
import { translate } from './localeMiddleware';

app.get('/api/message', (req, res) => {
  const message = translate(req, 'app.welcome', { name: req.user?.name });
  res.json({ message });
});
```

## 📝 Translation Keys

### Key Structure

Translations are organized hierarchically:

```json
{
  "app": {
    "welcome": "Bienvenue, {{name}}",
    "loading": "Chargement..."
  },
  "tontine": {
    "create": "Créer une tontine",
    "join": "Rejoindre une tontine"
  }
}
```

### Interpolation

Use `{{variable}}` for dynamic content:

```tsx
t('app.welcome', { name: 'Aissatou' })
// French: "Bienvenue, Aissatou"
// Wolof: "Bëgg nga ci, Aissatou"
```

### Pluralization

i18next handles pluralization automatically:

```json
{
  "notifications": {
    "contributions": "{{count}} contribution",
    "contributions_plural": "{{count}} contributions"
  }
}
```

## 🛠️ Development Tools

### Extract Translation Keys

Scan your codebase for translation keys:

```bash
npm run i18n:extract
```

This will:
- Find all `t('key')` calls in your code
- Add missing keys to translation files
- Preserve existing translations

### Export for Translators

Generate CSV file for translators:

```bash
npm run i18n:export
```

Creates `translations_export.csv` with all keys and translations.

### Check Translations

Validate translation completeness:

```bash
npm run i18n:check
```

Reports:
- Missing translations
- Placeholder values
- Potential unused keys

## 🌐 Locale Detection

### Frontend Priority

1. User's saved preference (AsyncStorage)
2. Device locale
3. Default fallback (French)

### Backend Priority

1. User's `preferred_language` from database
2. `x-user-lang` header
3. `Accept-Language` header
4. Default fallback (French)

## 📱 USSD & SMS Integration

### USSD Templates

```yaml
ussd:
  main_menu: "1. Rejoindre\n2. Contribuer\n3. Solde\nEntrez le numéro:"
  confirm_contrib: "Confirmer contribution de {{amount}} sats? (1=Oui, 2=Non)"
```

### SMS Templates

```yaml
sms:
  contribution: "Votre contribution de {{amount}} sats a été reçue."
  payout: "Vous avez reçu votre paiement de {{amount}} sats."
```

## 🗄️ Database Schema

### Users Table

```sql
ALTER TABLE users ADD COLUMN preferredLanguage VARCHAR(5) DEFAULT 'fr';
```

### API Endpoints

```typescript
// Update user language preference
PATCH /api/user/preferences
{
  "preferredLanguage": "wo"
}

// Get localized content
GET /api/content?locale=wo
```

## 🧪 Testing

### Frontend Testing

```tsx
import { render } from '@testing-library/react';
import { LanguageProvider } from '@/hooks/useLanguage';

test('displays French text', () => {
  const { getByText } = render(
    <LanguageProvider>
      <MyComponent />
    </LanguageProvider>
  );
  
  expect(getByText('Bienvenue')).toBeInTheDocument();
});
```

### Backend Testing

```typescript
import request from 'supertest';
import { app } from './app';

test('returns localized message', async () => {
  const response = await request(app)
    .get('/api/hello')
    .set('Accept-Language', 'wo');
    
  expect(response.body.message).toContain('Bëgg nga ci');
});
```

## 🚀 Deployment

### Environment Variables

```bash
# Default locale
DEFAULT_LOCALE=fr

# Supported locales
SUPPORTED_LOCALES=fr,wo,en

# Translation file paths
I18N_LOCALES_DIR=./src/i18n
```

### Build Process

1. **Frontend**: Translations are bundled with the app
2. **Backend**: Translations are loaded at startup
3. **Database**: Run migration to add `preferredLanguage` field

## 📋 Best Practices

### Translation Keys

- Use descriptive, hierarchical keys: `tontine.create_group`
- Keep keys consistent across frontend and backend
- Use interpolation for dynamic content: `{{name}}`, `{{amount}}`

### Content Guidelines

- **French**: Formal, clear business language
- **Wolof**: Conversational, culturally appropriate
- **English**: International, accessible

### USSD Constraints

- Keep messages under 160 characters
- Use simple language
- Avoid special characters
- Test on actual USSD gateways

### SMS Constraints

- Keep messages concise
- Include essential information
- Use clear formatting
- Test delivery across carriers

## 🔍 Troubleshooting

### Common Issues

1. **Missing translations**: Run `npm run i18n:extract`
2. **Wrong locale**: Check middleware configuration
3. **Interpolation not working**: Verify `{{}}` syntax
4. **USSD formatting**: Check character limits

### Debug Mode

Enable debug logging:

```typescript
// Frontend
i18n.debug = true;

// Backend
process.env.I18N_DEBUG = 'true';
```

## 📚 Resources

- [i18next Documentation](https://www.i18next.com/)
- [React Native Localization](https://github.com/react-native-localize/react-native-localize)
- [Wolof Language Resources](https://en.wikipedia.org/wiki/Wolof_language)
- [Senegal Localization Guide](https://www.localeplanet.com/sn/)

## 🤝 Contributing

### Adding New Translations

1. Add keys to `fr.json` (reference)
2. Run `npm run i18n:extract`
3. Translate new keys in `wo.json` and `en.json`
4. Test with `npm run i18n:check`

### Translation Guidelines

- **Accuracy**: Use native speakers for Wolof
- **Consistency**: Maintain terminology across all channels
- **Cultural Sensitivity**: Adapt content for local context
- **Testing**: Verify on actual devices and networks

---

**Note**: This implementation prioritizes offline functionality and cultural appropriateness for Senegalese users while maintaining international accessibility.
