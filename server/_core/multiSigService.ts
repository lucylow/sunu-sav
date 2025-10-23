import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import { ECPairFactory } from 'ecpair';
import crypto from 'crypto';

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

// Use testnet for demo
const network = bitcoin.networks.testnet;

export interface MultiSigWallet {
  address: string;
  redeemScript: string;
  publicKeys: string[];
  requiredSignatures: number;
}

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * Generate 2-of-3 multisig address for tontine group
 * Keys: group creator, random member, server backup
 */
export function generateMultiSigWallet(
  creatorPubKey: string,
  memberPubKey: string,
  serverPubKey: string
): MultiSigWallet {
  const pubkeys = [
    Buffer.from(creatorPubKey, 'hex'),
    Buffer.from(memberPubKey, 'hex'),
    Buffer.from(serverPubKey, 'hex'),
  ].map(pubkey => ECPair.fromPublicKey(pubkey).publicKey);
  
  const { address, redeemScript } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2ms({
      m: 2, // 2-of-3 signatures required
      pubkeys,
      network
    }),
    network
  });
  
  if (!address || !redeemScript) {
    throw new Error('Failed to generate multisig address');
  }
  
  return {
    address,
    redeemScript: redeemScript.toString('hex'),
    publicKeys: pubkeys.map(pk => pk.toString('hex')),
    requiredSignatures: 2
  };
}

/**
 * Generate a new key pair for server backup key
 */
export function generateServerKey(): KeyPair {
  const keyPair = ECPair.makeRandom({ network });
  return {
    privateKey: keyPair.privateKey!.toString('hex'),
    publicKey: keyPair.publicKey.toString('hex')
  };
}

/**
 * Generate a new key pair for user
 */
export function generateUserKey(): KeyPair {
  const keyPair = ECPair.makeRandom({ network });
  return {
    privateKey: keyPair.privateKey!.toString('hex'),
    publicKey: keyPair.publicKey.toString('hex')
  };
}

/**
 * Sign a transaction with a private key
 */
export function signTransaction(
  transaction: bitcoin.Transaction,
  privateKey: string,
  redeemScript: string,
  inputIndex: number,
  amount: number
): bitcoin.Transaction {
  const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  const redeemScriptBuffer = Buffer.from(redeemScript, 'hex');
  
  // Create signature hash
  const signatureHash = transaction.hashForSignature(
    inputIndex,
    redeemScriptBuffer,
    bitcoin.Transaction.SIGHASH_ALL
  );
  
  // Sign the hash
  const signature = keyPair.sign(signatureHash);
  const signatureWithHashType = Buffer.concat([
    signature,
    Buffer.from([bitcoin.Transaction.SIGHASH_ALL])
  ]);
  
  // Add signature to transaction
  transaction.setInputScript(inputIndex, bitcoin.script.compile([
    bitcoin.script.number.encode(0), // OP_0
    signatureWithHashType,
    keyPair.publicKey
  ]));
  
  return transaction;
}

/**
 * Verify a multisig transaction
 */
export function verifyMultisigTransaction(
  transaction: bitcoin.Transaction,
  redeemScript: string,
  publicKeys: string[],
  requiredSignatures: number
): boolean {
  try {
    const redeemScriptBuffer = Buffer.from(redeemScript, 'hex');
    
    // Verify the redeem script matches expected format
    const expectedScript = bitcoin.script.compile([
      bitcoin.script.number.encode(requiredSignatures),
      ...publicKeys.map(pk => Buffer.from(pk, 'hex')),
      bitcoin.script.number.encode(publicKeys.length),
      bitcoin.opcodes.OP_CHECKMULTISIG
    ]);
    
    if (!redeemScriptBuffer.equals(expectedScript)) {
      return false;
    }
    
    // Additional verification logic would go here
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * MultiSigManager class for managing multisig operations
 */
export class MultiSigManager {
  private static serverKeys: Map<string, KeyPair> = new Map();
  
  /**
   * Generate multisig address for a tontine group
   */
  static async generateAddress(): Promise<string> {
    // For demo purposes, generate random keys
    // In production, users would provide their own public keys
    const creatorKey = generateUserKey();
    const memberKey = generateUserKey();
    const serverKey = generateServerKey();
    
    // Store server key for later use
    const groupId = `group_${Date.now()}`;
    this.serverKeys.set(groupId, serverKey);
    
    const multiSig = generateMultiSigWallet(
      creatorKey.publicKey,
      memberKey.publicKey,
      serverKey.publicKey
    );
    
    return multiSig.address;
  }
  
  /**
   * Get server key for a group
   */
  static getServerKey(groupId: string): KeyPair | undefined {
    return this.serverKeys.get(groupId);
  }
  
  /**
   * Create a multisig transaction
   */
  static createMultisigTransaction(
    inputs: Array<{ txId: string; vout: number; amount: number }>,
    outputs: Array<{ address: string; amount: number }>,
    redeemScript: string
  ): bitcoin.Transaction {
    const tx = new bitcoin.Transaction();
    
    // Add inputs
    inputs.forEach(input => {
      tx.addInput(
        Buffer.from(input.txId, 'hex'),
        input.vout
      );
    });
    
    // Add outputs
    outputs.forEach(output => {
      tx.addOutput(
        bitcoin.address.toOutputScript(output.address, network),
        output.amount
      );
    });
    
    return tx;
  }
}

export default MultiSigManager;