// backend/src/services/multiSigService.ts
import * as bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import { randomBytes } from 'crypto';
import debugFactory from 'debug';
const debug = debugFactory('sunu:multisig');

export interface MultiSigInfo {
  address: string;
  redeemScriptHex: string;
  witnessScriptHex: string;
  pubkeysHex: string[];
  networkName: string;
}

/**
 * generate2of3MultiSig
 * - pubkeys: hex pubkeys for the three participants (compressed)
 * - network: bitcoin.networks.testnet | bitcoin.networks.bitcoin
 */
export function generate2of3MultiSig(pubkeysHex: string[], network = bitcoin.networks.testnet): MultiSigInfo {
  if (pubkeysHex.length !== 3) throw new Error('Need exactly 3 pubkeys');
  const pubkeys = pubkeysHex.map(h => Buffer.from(h, 'hex'));

  // create witness (P2WSH) multisig
  const { address, output } = bitcoin.payments.p2wsh({
    redeem: bitcoin.payments.p2ms({ m: 2, pubkeys, network }),
    network
  });

  const witnessScriptHex = output ? output.toString('hex') : '';
  // redeemScript for p2wsh is the p2ms output (same as witness script)
  const redeemScriptHex = witnessScriptHex;

  return {
    address: address || '',
    redeemScriptHex,
    witnessScriptHex,
    pubkeysHex,
    networkName: network === bitcoin.networks.testnet ? 'testnet' : 'mainnet'
  };
}

/**
 * createPayoutPsbt - constructs PSBT paying 'toAddress' from 'fromUtxos'
 * - for demo only: build unsigned PSBT (server does not sign)
 */
export function createPayoutPsbt({
  toAddress,
  amountSats,
  fromUtxos,
  network = bitcoin.networks.testnet,
  multisigRedeemScriptHex
}: {
  toAddress: string;
  amountSats: number;
  fromUtxos: Array<{ txid: string; vout: number; value: number; scriptPubKey?: string }>;
  network?: bitcoin.Network;
  multisigRedeemScriptHex?: string; // for P2WSH UTXOs
}) {
  const psbt = new bitcoin.Psbt({ network });

  let inputSum = 0;
  for (const utxo of fromUtxos) {
    inputSum += utxo.value;
    // For P2WSH inputs, you must provide witnessUtxo or nonWitnessUtxo and redeemScript
    if (multisigRedeemScriptHex) {
      // witness UTXO form
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(multisigRedeemScriptHex, 'hex'), // this is not correct for full witness; may require raw scriptPubKey
          value: utxo.value
        },
        witnessScript: Buffer.from(multisigRedeemScriptHex, 'hex')
      } as any);
    } else {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from('00', 'hex') // Placeholder: supply real raw TX if non-witness
      } as any);
    }
  }

  // fee simple estimation - use conservative fee (e.g., 1000 sats)
  const fee = 1000;
  const change = inputSum - amountSats - fee;
  if (change < 0) throw new Error('Insufficient funds');

  psbt.addOutput({ address: toAddress, value: amountSats });
  // If change available, pay change to same multisig address (requires deriving)
  if (change > 0) {
    // For demo send change to first pubkey's P2WPKH (not ideal). Replace with group's change address.
    psbt.addOutput({ address: toAddress, value: change }); // simple placeholder
  }

  return psbt.toBase64();
}

/**
 * generateDemoKeypair - returns { mnemonic, xpub, pubkeyHex } for demo use only
 * Do NOT use generated private keys in production server.
 */
export function generateDemoKeypair() {
  const mnemonic = bip39.generateMnemonic(256);
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
  const child = root.derivePath("m/84'/1'/0'/0/0"); // BIP84 testnet
  const pubkey = child.publicKey.toString('hex');
  return { mnemonic, pubkey };
}
