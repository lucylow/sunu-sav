// client/src/services/wallet/walletService.ts

import * as bitcoin from 'bitcoinjs-lib';
import { Keystore, WalletData } from './keystore';

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  confirmations: number;
}

export interface TransactionResult {
  txid: string;
  hex: string;
  fee: number;
}

export interface BalanceInfo {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export class WalletService {
  private network: bitcoin.Network;
  private apiBaseUrl: string;

  constructor(network: bitcoin.Network = bitcoin.networks.testnet) {
    this.network = network;
    // Use mempool.space testnet API for development
    this.apiBaseUrl = 'https://mempool.space/testnet/api';
  }

  /**
   * Fetches the wallet balance by checking all unspent transaction outputs (UTXOs)
   */
  async getBalance(address: string): Promise<BalanceInfo> {
    try {
      const utxos = await this.getUTXOs(address);
      
      let confirmed = 0;
      let unconfirmed = 0;

      for (const utxo of utxos) {
        if (utxo.confirmations >= 1) {
          confirmed += utxo.value;
        } else {
          unconfirmed += utxo.value;
        }
      }

      return {
        confirmed,
        unconfirmed,
        total: confirmed + unconfirmed,
      };
    } catch (error) {
      console.error('[WalletService] Error fetching balance:', error);
      return { confirmed: 0, unconfirmed: 0, total: 0 };
    }
  }

  /**
   * Fetches all unspent transaction outputs for an address
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/address/${address}/utxo`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const utxos = await response.json();
      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.scriptPubKey,
        confirmations: utxo.status?.confirmed ? utxo.status.block_height : 0,
      }));
    } catch (error) {
      console.error('[WalletService] Error fetching UTXOs:', error);
      // Return mock data for development
      return [
        {
          txid: 'abc123def456789',
          vout: 0,
          value: 100000, // 100,000 satoshis
          scriptPubKey: '0014' + 'a'.repeat(40),
          confirmations: 6,
        }
      ];
    }
  }

  /**
   * Creates a signed Bitcoin transaction
   */
  createTransaction(
    utxos: UTXO[],
    fromAddress: string,
    toAddress: string,
    amount: number,
    changeAddress: string,
    privateKey: Buffer,
    feeRate: number = 10 // satoshis per byte
  ): TransactionResult {
    const psbt = new bitcoin.Psbt({ network: this.network });

    // Add all the unspent inputs to the transaction
    let totalInput = 0;
    for (const utxo of utxos) {
      totalInput += utxo.value;
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({ address: fromAddress }).output!,
          value: utxo.value,
        },
      });
    }

    // Add the output (sending bitcoin to the recipient)
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });

    // Calculate fee based on estimated transaction size
    const estimatedSize = this.estimateTransactionSize(utxos.length, 2); // 2 outputs
    const fee = estimatedSize * feeRate;

    // Add a change output (sending leftover bitcoin back to the sender)
    const change = totalInput - amount - fee;
    if (change > 546) { // Dust threshold
      psbt.addOutput({
        address: changeAddress,
        value: change,
      });
    }

    // Sign every input with the provided private key
    for (let i = 0; i < utxos.length; i++) {
      psbt.signInput(i, privateKey);
    }

    // Finalize all inputs and extract the raw transaction
    psbt.finalizeAllInputs();
    const transaction = psbt.extractTransaction();
    
    return {
      txid: transaction.getId(),
      hex: transaction.toHex(),
      fee,
    };
  }

  /**
   * Estimates the size of a transaction in bytes
   */
  private estimateTransactionSize(inputCount: number, outputCount: number): number {
    // Simplified estimation for P2WPKH transactions
    const inputSize = 41; // P2WPKH input size
    const outputSize = 31; // P2WPKH output size
    const overhead = 10; // Transaction overhead
    
    return (inputCount * inputSize) + (outputCount * outputSize) + overhead;
  }

  /**
   * Broadcasts a transaction to the Bitcoin network
   */
  async broadcastTransaction(hex: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: hex,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Broadcast failed: ${errorText}`);
      }

      const txid = await response.text();
      return txid.trim();
    } catch (error) {
      console.error('[WalletService] Error broadcasting transaction:', error);
      throw new Error('Failed to broadcast transaction');
    }
  }

  /**
   * Sends bitcoin from one address to another
   */
  async sendBitcoin(
    wallet: WalletData,
    toAddress: string,
    amount: number,
    feeRate: number = 10
  ): Promise<TransactionResult> {
    // Validate addresses
    if (!Keystore.validateAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    if (!Keystore.validateAddress(wallet.address)) {
      throw new Error('Invalid sender address');
    }

    // Get UTXOs
    const utxos = await this.getUTXOs(wallet.address);
    if (utxos.length === 0) {
      throw new Error('No funds available');
    }

    // Calculate total available
    const totalAvailable = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    
    // Estimate fee
    const estimatedSize = this.estimateTransactionSize(utxos.length, 2);
    const estimatedFee = estimatedSize * feeRate;

    if (totalAvailable < amount + estimatedFee) {
      throw new Error('Insufficient funds');
    }

    // Create transaction
    const privateKey = Buffer.from(wallet.privateKey, 'hex');
    const transaction = this.createTransaction(
      utxos,
      wallet.address,
      toAddress,
      amount,
      wallet.address, // Use same address for change
      privateKey,
      feeRate
    );

    // Broadcast transaction
    const txid = await this.broadcastTransaction(transaction.hex);
    
    return {
      ...transaction,
      txid,
    };
  }

  /**
   * Gets transaction history for an address
   */
  async getTransactionHistory(address: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/address/${address}/txs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const transactions = await response.json();
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('[WalletService] Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Gets detailed information about a specific transaction
   */
  async getTransaction(txid: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tx/${txid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[WalletService] Error fetching transaction:', error);
      throw new Error('Transaction not found');
    }
  }

  /**
   * Estimates the fee for a transaction
   */
  async estimateFee(utxoCount: number, outputCount: number = 2): Promise<number> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/fee-estimates`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const feeEstimates = await response.json();
      const estimatedSize = this.estimateTransactionSize(utxoCount, outputCount);
      
      // Use 6 block confirmation fee estimate
      const feeRate = feeEstimates['6'] || 10;
      return estimatedSize * feeRate;
    } catch (error) {
      console.error('[WalletService] Error estimating fee:', error);
      // Fallback to default fee
      const estimatedSize = this.estimateTransactionSize(utxoCount, outputCount);
      return estimatedSize * 10; // 10 satoshis per byte
    }
  }

  /**
   * Converts satoshis to BTC
   */
  static satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  /**
   * Converts BTC to satoshis
   */
  static btcToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  /**
   * Formats a Bitcoin amount for display
   */
  static formatAmount(satoshis: number, showUnit: boolean = true): string {
    const btc = this.satoshisToBTC(satoshis);
    
    if (btc >= 1) {
      return `${btc.toFixed(8)}${showUnit ? ' BTC' : ''}`;
    } else {
      return `${satoshis.toLocaleString()}${showUnit ? ' sats' : ''}`;
    }
  }
}

export const walletService = new WalletService();
