// Thin wrapper around the Web NFC API (NDEFReader). Supported on Android Chrome
// over HTTPS; unavailable on iOS and desktop browsers, where callers fall back
// to manual entry / geolocation.

interface NdefReadingEvent {
  serialNumber?: string;
}

interface NdefReaderLike {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (type: string, listener: (event: NdefReadingEvent) => void) => void;
}

type NdefReaderCtor = new () => NdefReaderLike;

function getNdefReaderCtor(): NdefReaderCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { NDEFReader?: NdefReaderCtor }).NDEFReader;
  return ctor ?? null;
}

export function isNfcSupported(): boolean {
  return getNdefReaderCtor() !== null;
}

export class NfcError extends Error {}

/**
 * Scans for a single NFC tag and resolves with its serial number (UID).
 * Rejects with an {@link NfcError} on unsupported browsers, denied permission,
 * timeout, or if a tag without a readable serial is presented.
 */
export async function readNfcTag(timeoutMs = 20000): Promise<string> {
  const Ctor = getNdefReaderCtor();
  if (!Ctor) {
    throw new NfcError("NFC is not supported on this device or browser.");
  }

  const reader = new Ctor();
  const controller = new AbortController();

  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new NfcError("Timed out waiting for an NFC tag. Please try again."));
    }, timeoutMs);

    const settleReject = (message: string) => {
      clearTimeout(timer);
      controller.abort();
      reject(new NfcError(message));
    };

    reader.addEventListener("reading", (event: NdefReadingEvent) => {
      clearTimeout(timer);
      controller.abort();
      if (event.serialNumber) {
        resolve(event.serialNumber.toUpperCase());
      } else {
        reject(new NfcError("The scanned tag does not expose a readable serial number."));
      }
    });

    reader.scan({ signal: controller.signal }).catch((err: unknown) => {
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError") {
        settleReject("NFC permission was denied. Please allow NFC access and try again.");
      } else if (name === "NotSupportedError") {
        settleReject("NFC is not supported on this device or browser.");
      } else {
        settleReject("Unable to start NFC scanning. Ensure NFC is enabled on your device.");
      }
    });
  });
}
