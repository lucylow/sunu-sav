import 'react-native-gesture-handler';
import { jest } from '@jest/globals';

// Mock react-native modules
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('react-native-flash-message', () => 'FlashMessage');
jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageCode: 'fr' }],
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock i18n
jest.mock('./src/i18n', () => ({
  t: (key) => key,
  locale: 'fr',
}));
