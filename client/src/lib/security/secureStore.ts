// client/src/lib/security/secureStore.ts
// Use react-native-keychain for secure storage
// yarn add react-native-keychain @react-native-async-storage/async-storage

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MACAROON_KEY = 'sunu:macaroon';
const API_TOKEN_KEY = 'sunu:apitoken';
const MNEMONIC_KEY = 'sunu:mnemonic'; // avoid storing mnemonic unless encrypted

export async function saveMacaroon(macaroonHex: string): Promise<boolean> {
  // store macaroon in keychain securely
  // Use "service" to namespace
  await Keychain.setGenericPassword('macaroon', macaroonHex, { service: MACAROON_KEY });
  return true;
}

export async function getMacaroon(): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({ service: MACAROON_KEY });
  return creds ? creds.password : null;
}

export async function deleteMacaroon(): Promise<boolean> {
  await Keychain.resetGenericPassword({ service: MACAROON_KEY });
  return true;
}

export async function saveApiToken(token: string): Promise<boolean> {
  // token storage - Keychain preferred, but AsyncStorage used here as fallback
  try {
    await Keychain.setGenericPassword('api', token, { service: API_TOKEN_KEY });
    return true;
  } catch (e) {
    await AsyncStorage.setItem(API_TOKEN_KEY, token);
    return true;
  }
}

export async function getApiToken(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: API_TOKEN_KEY });
    if (creds) return creds.password;
    const fallback = await AsyncStorage.getItem(API_TOKEN_KEY);
    return fallback;
  } catch (e) {
    return null;
  }
}

export async function saveMnemonic(mnemonic: string): Promise<boolean> {
  // Only store mnemonic if absolutely necessary and encrypted
  try {
    await Keychain.setGenericPassword('mnemonic', mnemonic, { service: MNEMONIC_KEY });
    return true;
  } catch (e) {
    console.error('Failed to save mnemonic securely:', e);
    return false;
  }
}

export async function getMnemonic(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: MNEMONIC_KEY });
    return creds ? creds.password : null;
  } catch (e) {
    return null;
  }
}

export async function deleteMnemonic(): Promise<boolean> {
  await Keychain.resetGenericPassword({ service: MNEMONIC_KEY });
  return true;
}
