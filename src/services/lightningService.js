/**
 * Lightning Network service for handling payments and offline queueing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock API base URL - replace with your actual backend
const API_BASE = process.env.API_BASE_URL || 'https://api.sunusav.org';

/**
 * Pay a BOLT11 Lightning invoice
 */
export async function payBolt11(invoice) {
  try {
    // In a real implementation, this would call your backend API
    // which would then call LND/BTCPay/LNURL endpoints
    
    const response = await fetch(`${API_BASE}/lightning/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice }),
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`Payment failed: ${response.status}`);
    }

    const data = await response.json();
    return data; // { success: bool, preimage: string, fee_sats: number, txid?: string }
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
}

/**
 * Fetch LNURL metadata
 */
export async function fetchLnurlMetadata(lnurl) {
  try {
    const response = await fetch(`${API_BASE}/lnurl/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lnurl }),
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`LNURL parsing failed: ${response.status}`);
    }

    const data = await response.json();
    return data; // structured lnurl pay metadata
  } catch (error) {
    console.error('LNURL error:', error);
    throw error;
  }
}

/**
 * Offline queue persistence for pending payments
 */
const PENDING_KEY = '@sunusav:pendingPayments';

export async function queuePendingPayment(payload) {
  try {
    const existingRaw = await AsyncStorage.getItem(PENDING_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    
    const newPayment = {
      id: `pending_${Date.now()}`,
      createdAt: Date.now(),
      payload,
      retryCount: 0,
      status: 'queued'
    };
    
    existing.push(newPayment);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(existing));
    
    return newPayment.id;
  } catch (error) {
    console.error('Failed to queue payment:', error);
    throw error;
  }
}

export async function getPendingPayments() {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to get pending payments:', error);
    return [];
  }
}

export async function removePendingPayment(paymentId) {
  try {
    const existingRaw = await AsyncStorage.getItem(PENDING_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    
    const filtered = existing.filter(p => p.id !== paymentId);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
    
    return true;
  } catch (error) {
    console.error('Failed to remove pending payment:', error);
    return false;
  }
}

export async function updatePendingPayment(paymentId, updates) {
  try {
    const existingRaw = await AsyncStorage.getItem(PENDING_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    
    const updated = existing.map(p => 
      p.id === paymentId ? { ...p, ...updates } : p
    );
    
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to update pending payment:', error);
    return false;
  }
}

export async function clearPendingPayments() {
  try {
    await AsyncStorage.removeItem(PENDING_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear pending payments:', error);
    return false;
  }
}

/**
 * Process queued payments when back online
 * Note: In a real implementation, this would be called when network connectivity is restored
 */
export async function processQueuedPayments() {
  try {
    const pending = await getPendingPayments();
    const results = [];

    for (const payment of pending) {
      try {
        if (payment.payload.type === 'bolt11') {
          const result = await payBolt11(payment.payload.invoice);
          if (result.success) {
            await removePendingPayment(payment.id);
            results.push({ id: payment.id, status: 'success' });
          } else {
            await updatePendingPayment(payment.id, { 
              retryCount: payment.retryCount + 1,
              lastError: result.error || 'Payment failed'
            });
            results.push({ id: payment.id, status: 'failed', error: result.error });
          }
        }
      } catch (error) {
        await updatePendingPayment(payment.id, { 
          retryCount: payment.retryCount + 1,
          lastError: error.message
        });
        results.push({ id: payment.id, status: 'error', error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to process queued payments:', error);
    return [];
  }
}
