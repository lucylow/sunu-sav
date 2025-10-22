// Lightning service layer for API calls and offline queuing
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.API_BASE_URL || 'https://api.sunusav.dev';

/* Backend endpoints:
  POST /ln/parse { lnurl: 'lnurl1...' } -> metadata (callback, minSendable, maxSendable, metadata)
  POST /lightning/pay { invoice } -> { success, preimage, fee_sats }
*/

export async function fetchLnurlMetadata(lnurl: string) {
  try {
    const response = await fetch(`${API_BASE}/ln/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lnurl }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch LNURL metadata:', error);
    throw error;
  }
}

export async function payInvoiceViaServer(invoice: string) {
  try {
    const response = await fetch(`${API_BASE}/lightning/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to pay invoice:', error);
    throw error;
  }
}

/* Offline queue helpers */
const QUEUE_KEY = '@sunu:pending_payments';

export type PendingPayment = {
  id: string; // client uuid
  type: 'bolt11' | 'lnurl';
  payload: any;
  createdAt: number;
  attempts?: number;
};

export async function enqueuePayment(item: PendingPayment) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
    return true;
  } catch (error) {
    console.error('Failed to enqueue payment:', error);
    return false;
  }
}

export async function getPendingPayments(): Promise<PendingPayment[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to get pending payments:', error);
    return [];
  }
}

export async function removePendingPayment(id: string) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const keep = arr.filter((p: any) => p.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(keep));
    return true;
  } catch (error) {
    console.error('Failed to remove pending payment:', error);
    return false;
  }
}

export async function clearPendingPayments() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
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
        if (payment.type === 'bolt11') {
          const result = await payInvoiceViaServer(payment.payload.invoice);
          if (result.success) {
            await removePendingPayment(payment.id);
            results.push({ id: payment.id, status: 'success' });
          } else {
            await updatePendingPayment(payment.id, { 
              retryCount: (payment.attempts || 0) + 1,
              lastError: result.error || 'Payment failed'
            });
            results.push({ id: payment.id, status: 'failed', error: result.error });
          }
        } else if (payment.type === 'lnurl') {
          // Handle LNURL payments
          const result = await fetchLnurlMetadata(payment.payload.lnurl);
          // Server-side should handle callback and invoice creation
          await removePendingPayment(payment.id);
          results.push({ id: payment.id, status: 'success' });
        }
      } catch (error) {
        await updatePendingPayment(payment.id, { 
          retryCount: (payment.attempts || 0) + 1,
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

async function updatePendingPayment(id: string, updates: Partial<PendingPayment>) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const updated = arr.map((p: any) => 
      p.id === id ? { ...p, ...updates } : p
    );
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to update pending payment:', error);
    return false;
  }
}