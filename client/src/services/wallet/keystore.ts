// client/src/services/wallet/keystore.ts

import * as crypto from 'crypto-js';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize the BIP32 interface for hierarchical deterministic wallets
const bip32 = BIP32Factory(ecc);

export interface WalletData {
  mnemonic: string;
  address: string;
  path: string;
  publicKey: string;
  privateKey: string;
}

export interface EncryptedWallet {
  encryptedMnemonic: string;
  address: string;
  path: string;
  publicKey: string;
  salt: string;
}

export class Keystore {
  private static readonly STORAGE_KEY = 'sunusav_wallet';
  private static readonly SALT_LENGTH = 32;

  /**
   * Encrypts a mnemonic phrase using a user-provided password
   * Uses PBKDF2 for key derivation and AES-256-CBC for encryption
   */
  static encryptMnemonic(mnemonic: string, password: string): { encrypted: string; salt: string } {
    const salt = crypto.lib.WordArray.random(this.SALT_LENGTH);
    const key = crypto.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });
    
    const encrypted = crypto.AES.encrypt(mnemonic, key, {
      iv: crypto.lib.WordArray.random(16),
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      salt: salt.toString(),
    };
  }

  /**
   * Decrypts a mnemonic phrase using the user's password
   */
  static decryptMnemonic(encryptedMnemonic: string, password: string, salt: string): string {
    const saltWordArray = crypto.enc.Hex.parse(salt);
    const key = crypto.PBKDF2(password, saltWordArray, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    const decrypted = crypto.AES.decrypt(encryptedMnemonic, key);
    return decrypted.toString(crypto.enc.Utf8);
  }

  /**
   * Generates a new HD wallet with a 12-word mnemonic phrase
   * Uses BIP84 (Native SegWit) for better efficiency and lower fees
   */
  static generateNewWallet(): WalletData {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);

    // Derive the first external receive address (m/84'/0'/0'/0/0) as per BIP84
    const path = "m/84'/0'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) throw new Error('Failed to derive private key');

    // Generate a native segwit address (starts with 'bc1q' on mainnet, 'tb1q' on testnet)
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network: bitcoin.networks.testnet // Use testnet for development
    });
    
    return {
      mnemonic,
      address: address!,
      path,
      publicKey: child.publicKey.toString('hex'),
      privateKey: child.privateKey.toString('hex'),
    };
  }

  /**
   * Derives a new address from the wallet's mnemonic
   * Uses the next available index in the derivation path
   */
  static deriveNewAddress(mnemonic: string, index: number = 0): { address: string; path: string; publicKey: string } {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);
    
    const path = `m/84'/0'/0'/0/${index}`;
    const child = root.derivePath(path);

    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network: bitcoin.networks.testnet
    });

    return {
      address: address!,
      path,
      publicKey: child.publicKey.toString('hex'),
    };
  }

  /**
   * Validates a mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * Restores a wallet from a mnemonic phrase
   */
  static restoreWallet(mnemonic: string): WalletData {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);
    const path = "m/84'/0'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) throw new Error('Failed to derive private key');

    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network: bitcoin.networks.testnet
    });

    return {
      mnemonic,
      address: address!,
      path,
      publicKey: child.publicKey.toString('hex'),
      privateKey: child.privateKey.toString('hex'),
    };
  }

  /**
   * Securely stores an encrypted wallet in AsyncStorage
   */
  static async storeWallet(encryptedWallet: EncryptedWallet): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedWallet));
    } catch (error) {
      throw new Error('Failed to store wallet');
    }
  }

  /**
   * Retrieves the encrypted wallet from AsyncStorage
   */
  static async getStoredWallet(): Promise<EncryptedWallet | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Removes the stored wallet from AsyncStorage
   */
  static async removeStoredWallet(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      throw new Error('Failed to remove wallet');
    }
  }

  /**
   * Checks if a wallet exists in storage
   */
  static async hasStoredWallet(): Promise<boolean> {
    const wallet = await this.getStoredWallet();
    return wallet !== null;
  }

  /**
   * Creates a wallet and stores it encrypted
   */
  static async createAndStoreWallet(password: string): Promise<{ address: string; mnemonic: string }> {
    const wallet = this.generateNewWallet();
    const encrypted = this.encryptMnemonic(wallet.mnemonic, password);
    
    const encryptedWallet: EncryptedWallet = {
      encryptedMnemonic: encrypted.encrypted,
      address: wallet.address,
      path: wallet.path,
      publicKey: wallet.publicKey,
      salt: encrypted.salt,
    };

    await this.storeWallet(encryptedWallet);
    
    return {
      address: wallet.address,
      mnemonic: wallet.mnemonic, // Return mnemonic only once for backup
    };
  }

  /**
   * Unlocks a stored wallet with password
   */
  static async unlockWallet(password: string): Promise<WalletData> {
    const encryptedWallet = await this.getStoredWallet();
    if (!encryptedWallet) {
      throw new Error('No wallet found');
    }

    const mnemonic = this.decryptMnemonic(
      encryptedWallet.encryptedMnemonic,
      password,
      encryptedWallet.salt
    );

    return this.restoreWallet(mnemonic);
  }

  /**
   * Changes the wallet password
   */
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const wallet = await this.unlockWallet(oldPassword);
    const encrypted = this.encryptMnemonic(wallet.mnemonic, newPassword);
    
    const encryptedWallet: EncryptedWallet = {
      encryptedMnemonic: encrypted.encrypted,
      address: wallet.address,
      path: wallet.path,
      publicKey: wallet.publicKey,
      salt: encrypted.salt,
    };

    await this.storeWallet(encryptedWallet);
  }

  /**
   * Generates a QR code data string for address sharing
   */
  static generateAddressQR(address: string): string {
    return `bitcoin:${address}`;
  }

  /**
   * Validates a Bitcoin address
   */
  static validateAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, bitcoin.networks.testnet);
      return true;
    } catch {
      return false;
    }
  }
}
