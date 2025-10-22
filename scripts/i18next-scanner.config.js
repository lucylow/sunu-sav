module.exports = {
  input: [
    'client/src/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  output: './src/i18n/locales',
  options: {
    debug: false,
    removeUnusedKeys: false,
    func: {
      list: ['t', 'i18n.t', 'translate'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    lngs: ['fr', 'wo', 'en'],
    ns: ['translation'],
    defaultLng: 'fr',
    defaultNs: 'translation',
    defaultValue: (lng, ns, key) => {
      // For new keys, provide English placeholder
      if (lng === 'en') return key;
      // For French and Wolof, return the key as placeholder
      return key;
    },
    resource: {
      loadPath: 'src/i18n/locales/{{lng}}.json',
      savePath: 'src/i18n/locales/{{lng}}.json'
    },
    keySeparator: '.',
    nsSeparator: ':',
    interpolation: {
      prefix: '{{',
      suffix: '}}'
    }
  }
};
