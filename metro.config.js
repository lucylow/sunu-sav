module.exports = {
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'svg'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
