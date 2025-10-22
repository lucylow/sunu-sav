# backend/app/utils/lnd_client.py
import os
import requests
import binascii
import logging
import time
from typing import Optional, Dict, Any

logger = logging.getLogger("lnd_client")
# Upper bound request timeout (seconds)
LND_REQUEST_TIMEOUT = int(os.getenv("LND_REQUEST_TIMEOUT", os.getenv("LND_REQUEST_TIMEOUT", 60)))

class LndClientError(Exception):
    pass

class LndClient:
    """
    Minimal LND REST client for paying invoices via LND's Router SendPayment v2 endpoint.
    - Uses macaroon header: Grpc-Metadata-macaroon
    - Uses TLS cert verification via `verify` param in requests
    - Streams JSON chunks and returns the final result.
    """

    def __init__(self, rest_url: Optional[str] = None, macaroon_path: Optional[str] = None, tls_cert_path: Optional[str] = None):
        self.rest_url = rest_url or os.getenv("LND_REST_URL")
        if not self.rest_url:
            raise RuntimeError("LND_REST_URL not configured")
        self.macaroon_hex = None
        if macaroon_path:
            self.macaroon_hex = self._load_macaroon_hex(macaroon_path)
        else:
            macaroon_path_env = os.getenv("LND_MACAROON_PATH")
            if macaroon_path_env:
                self.macaroon_hex = self._load_macaroon_hex(macaroon_path_env)

        if not self.macaroon_hex:
            # fallback: maybe macaroon provided as hex in env var (not recommended)
            env_mac = os.getenv("LND_MACAROON_HEX")
            if env_mac:
                self.macaroon_hex = env_mac

        self.tls_cert_path = tls_cert_path or os.getenv("LND_TLS_CERT_PATH")
        if self.tls_cert_path and not os.path.exists(self.tls_cert_path):
            logger.warning("LND TLS cert path set but file does not exist: %s", self.tls_cert_path)
            # We do not raise here because sometimes TLS is handled differently.
        # default verify parameter for requests
        self.verify = self.tls_cert_path if self.tls_cert_path and os.path.exists(self.tls_cert_path) else True

    @staticmethod
    def _load_macaroon_hex(path: str) -> str:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Macaroon file not found: {path}")
        with open(path, "rb") as f:
            data = f.read()
        # Macaroon bytes -> hex string for header
        return binascii.hexlify(data).decode()

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.macaroon_hex:
            headers["Grpc-Metadata-macaroon"] = self.macaroon_hex
        return headers

    def pay_invoice(self,
                    payment_request: str,
                    timeout_seconds: int = 60,
                    fee_limit_sat: Optional[int] = None,
                    allow_self_payment: bool = False) -> Dict[str, Any]:
        """
        Pay a BOLT11 invoice through LND's router endpoint.
        Returns a dict: { success: bool, preimage: hex|None, fee_sat: int|None, error: str|None, raw: {...} }
        Note: LND streaming returns JSON objects in chunked body. We'll parse lines as JSON.
        """
        endpoint = f"{self.rest_url.rstrip('/')}/v2/router/send_payment_v2"
        payload = {
            "payment_request": payment_request,
            "timeout_seconds": int(timeout_seconds)
        }
        if fee_limit_sat is not None:
            # fee_limit can be specified as an object: {"fixed": { "msat": fee_limit_msat } }
            payload["fee_limit"] = { "fixed": { "msat": int(fee_limit_sat) * 1000 } }  # sats -> msat

        # LND supports "allow_self_payment" param in some builds; include if requested (default false)
        if allow_self_payment:
            payload["allow_self_payment"] = True

        headers = self._headers()
        try:
            with requests.post(endpoint, json=payload, headers=headers, timeout=timeout_seconds + 10, stream=True, verify=self.verify) as r:
                # 200 OK but body is chunked newline-delimited JSON objects (events)
                # If status != 200, read body and raise
                if r.status_code != 200:
                    body = r.text
                    logger.error("LND responded with non-200 status %s: %s", r.status_code, body)
                    raise LndClientError(f"LND REST returned status {r.status_code}: {body}")

                # Iterate over stream lines and parse JSON objects; capture final result
                final_event = None
                for chunk in r.iter_lines(decode_unicode=True):
                    if not chunk:
                        continue
                    # chunk could be partial; attempt JSON parse
                    try:
                        import json
                        ev = json.loads(chunk)
                    except Exception:
                        # Not valid JSON chunk; skip
                        logger.debug("Skipping non-JSON LND chunk: %s", chunk[:200])
                        continue

                    # Keep last event
                    final_event = ev
                    # LND often sends intermediate states; log debug if desired
                    logger.debug("LND event: %s", ev.get("status") if isinstance(ev, dict) else str(ev))

                    # if event indicates failure early, break and return
                    if isinstance(ev, dict) and ev.get("status") in ("FAILED", "SUCCEEDED", "IN_FLIGHT"):
                        # continue until final SUCCEEDED/FAILED, but can break on terminal states
                        if ev.get("status") == "FAILED":
                            # terminal failure
                            break
                        if ev.get("status") == "SUCCEEDED":
                            # terminal success — can break
                            break

                # interpret final_event
                if not final_event:
                    raise LndClientError("No response events from LND router")

                # Parse success
                ev = final_event
                # LND v2 format: ev contains 'status' and may contain 'preimage', 'fee_msat'
                status = ev.get("status")
                if status == "SUCCEEDED" or (ev.get("failure") is None and (ev.get("preimage") or ev.get("payment_preimage"))):
                    preimage_hex = None
                    if ev.get("preimage"):
                        # might be base64 in some versions; try handling hex or base64
                        pre = ev.get("preimage")
                        # try hex decode
                        try:
                            # if it's hex string of length 64
                            if isinstance(pre, str) and all(c in "0123456789abcdefABCDEF" for c in pre):
                                preimage_hex = pre
                            else:
                                # try base64 -> hex
                                import base64
                                preimage_hex = base64.b16encode(base64.b64decode(pre)).decode().lower()
                        except Exception:
                            preimage_hex = str(pre)
                    elif ev.get("payment_preimage"):
                        preimage_hex = ev.get("payment_preimage")

                    fee_msat = None
                    if ev.get("fee_msat") is not None:
                        fee_msat = int(ev.get("fee_msat"))
                    elif ev.get("fee_msat_paid") is not None:
                        fee_msat = int(ev.get("fee_msat_paid"))
                    fee_sat = int(fee_msat / 1000) if fee_msat is not None else None

                    return {
                        "success": True,
                        "preimage": preimage_hex,
                        "fee_sat": fee_sat,
                        "raw_event": ev
                    }
                else:
                    # failure details in ev['failure'] or ev['error']
                    err = ev.get("failure", ev.get("error", ev))
                    # try to extract failure reason
                    reason = None
                    if isinstance(err, dict):
                        reason = err.get("reason") or err.get("message") or str(err)
                    else:
                        reason = str(err)
                    logger.warning("LND payment failure: %s", reason)
                    return {"success": False, "error": reason, "raw_event": ev}
        except requests.RequestException as e:
            logger.exception("HTTP error calling LND REST")
            raise LndClientError(f"HTTP error to LND REST: {str(e)}") from e
        except Exception as e:
            logger.exception("Unexpected LND client error")
            raise LndClientError(str(e)) from e

    def get_info(self) -> Dict[str, Any]:
        """
        Get LND node info for health checks.
        """
        endpoint = f"{self.rest_url.rstrip('/')}/v1/getinfo"
        headers = self._headers()
        
        try:
            response = requests.get(endpoint, headers=headers, timeout=10, verify=self.verify)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error("Failed to get LND info: %s", str(e))
            raise LndClientError(f"Failed to get LND info: {str(e)}") from e

    def create_invoice(self, 
                      amount_sats: int, 
                      memo: str = "", 
                      expiry_seconds: int = 3600) -> Dict[str, Any]:
        """
        Create a BOLT11 invoice via LND.
        """
        endpoint = f"{self.rest_url.rstrip('/')}/v1/invoices"
        payload = {
            "value": amount_sats,
            "memo": memo,
            "expiry": expiry_seconds
        }
        headers = self._headers()
        
        try:
            response = requests.post(endpoint, json=payload, headers=headers, timeout=30, verify=self.verify)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error("Failed to create invoice: %s", str(e))
            raise LndClientError(f"Failed to create invoice: {str(e)}") from e
