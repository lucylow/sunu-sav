// client/src/lib/security/integration.ts
// Integration example showing how to use the security framework in SunuSàv

import secureApi from './secureApi';
import { saveMacaroon, getMacaroon, saveApiToken } from './secureStore';
import { createSecureSocket } from './secureSocket';

export class SecurityIntegration {
  private static instance: SecurityIntegration;
  private socket: WebSocket | null = null;

  static getInstance(): SecurityIntegration {
    if (!SecurityIntegration.instance) {
      SecurityIntegration.instance = new SecurityIntegration();
    }
    return SecurityIntegration.instance;
  }

  /**
   * Initialize security for the application
   */
  async initialize(): Promise<void> {
    try {
      // Check if we have stored credentials
      const macaroon = await getMacaroon();
      const token = await saveApiToken('');

      if (!macaroon || !token) {
        console.log('No stored credentials found, user needs to authenticate');
        return;
      }

      console.log('Security initialized successfully');
    } catch (error) {
      console.error('Failed to initialize security:', error);
      throw error;
    }
  }

  /**
   * Store Lightning Network credentials securely
   */
  async storeLightningCredentials(macaroonHex: string, apiToken: string): Promise<void> {
    try {
      await saveMacaroon(macaroonHex);
      await saveApiToken(apiToken);
      console.log('Lightning credentials stored securely');
    } catch (error) {
      console.error('Failed to store Lightning credentials:', error);
      throw error;
    }
  }

  /**
   * Make a secure payment request
   */
  async makePayment(invoice: string, metadata?: any): Promise<any> {
    try {
      const response = await secureApi.post('/api/payments/pay', {
        invoice,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          clientVersion: 'sunu-sav-mobile/1.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  }

  /**
   * Create secure WebSocket connection
   */
  async connectWebSocket(wsUrl: string): Promise<void> {
    try {
      this.socket = await createSecureSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('Secure WebSocket connected');
      };

      this.socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        // Handle incoming messages
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.socket = null;
      };
    } catch (error) {
      console.error('Failed to create secure WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Clear all stored credentials
   */
  async clearCredentials(): Promise<void> {
    try {
      await saveMacaroon('');
      await saveApiToken('');
      console.log('Credentials cleared');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const securityIntegration = SecurityIntegration.getInstance();
