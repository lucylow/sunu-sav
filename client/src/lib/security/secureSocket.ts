// client/src/lib/security/secureSocket.ts
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getMacaroon } from './secureStore';

export async function createSecureSocket(wsUrl: string): Promise<ReconnectingWebSocket> {
  const macaroon = await getMacaroon();
  // Send macaroon in query param or Authorization header during authentication handshake.
  // Be careful: query param may be logged. Best: perform short-lived JWT handshake endpoint then connect.

  const url = `${wsUrl}?m=${encodeURIComponent(macaroon || '')}`;
  const socket = new ReconnectingWebSocket(url, [], {
    // options: customize TLS verification at native level for WSS pinning
    // in RN you may need native modules for pinning here too
  });
  return socket;
}
