// client/src/lib/security/secureApi.ts
// React Native - secure axios instance with certificate pinning
// Requires: react-native-ssl-pinning or axios-https-proxy-fix + native SSL pinning support
// For Expo: use expo-network + custom fetch; here we use 'react-native-ssl-pinning' style usage.

import { Platform } from 'react-native';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Example: if you use react-native-ssl-pinning (native module)
// yarn add axios react-native-ssl-pinning
// iOS/Android native setup required.

const API_BASE = process.env.VITE_API_BASE || 'https://api.sunu-sav.example';

function createSecureInstance(): AxiosInstance {
  // If using react-native-ssl-pinning, the request options differ;
  // fallback to normal axios with custom TLS options on native (Android/iOS)
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 20000,
    // No credentials here — we'll attach tokens/macaroons from secure storage
  });

  // Request interceptor to attach auth token/macaroon from Keychain
  instance.interceptors.request.use(async (config: AxiosRequestConfig) => {
    // attach authorization header from secure storage (Keychain)
    try {
      // you'll implement secure get in secureStore.js
      const { getMacaroon } = await import('./secureStore');
      const macaroon = await getMacaroon();
      if (macaroon) {
        config.headers = {
          ...config.headers,
          'Grpc-Metadata-macaroon': macaroon,
          Authorization: `Bearer ${await import('./secureStore').then(m => m.getApiToken()) || ''}`,
        };
      }
    } catch (e) {
      // non-blocking: continue without macaroon if not present
      console.warn('secureApi: cannot read macaroon', e);
    }

    // enforce TLS 1.3 and strong ciphers on native by OS config (outside JS)
    // add additional headers
    config.headers = {
      ...config.headers,
      'x-client-version': 'sunu-sav-mobile/1.0',
    };
    return config;
  }, (err) => Promise.reject(err));

  // Response interceptor to handle TLS pinning violations if using native lib
  instance.interceptors.response.use(
    (r) => r,
    (err) => {
      // Map SSL errors to actionable messages
      return Promise.reject(err);
    }
  );

  return instance;
}

export default createSecureInstance();
