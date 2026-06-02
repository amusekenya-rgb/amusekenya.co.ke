import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (qrCodeData: string) => void;
}

type ScanMode = 'camera' | 'upload';
const LS_MODE = 'qrScan.mode';
const LS_CAMERA = 'qrScan.cameraId';
const READER_ID = 'qr-reader-live';

export const QRScannerDialog = ({ open, onClose, onScanSuccess }: QRScannerDialogProps) => {
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<ScanMode>(
    () => (typeof window !== 'undefined' && (localStorage.getItem(LS_MODE) as ScanMode)) || 'camera',
  );
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(
    () => (typeof window !== 'undefined' && localStorage.getItem(LS_CAMERA)) || null,
  );
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const stopScanner = useCallback(async () => {
    const instance = html5QrRef.current;
    if (!instance) return;
    try {
      if (startedRef.current) {
        await instance.stop();
      }
      await instance.clear();
    } catch (e) {
      // ignore - already stopped
    } finally {
      startedRef.current = false;
      html5QrRef.current = null;
    }
  }, []);

  const handleDecoded = useCallback(
    async (text: string) => {
      await stopScanner();
      onScanSuccess(text);
    },
    [onScanSuccess, stopScanner],
  );

  const startCamera = useCallback(
    async (cameraId?: string | null) => {
      setStatus('starting');
      setErrorMsg('');

      // Ensure DOM target exists
      let tries = 0;
      while (!document.getElementById(READER_ID) && tries < 20) {
        await new Promise((r) => setTimeout(r, 50));
        tries++;
      }
      const el = document.getElementById(READER_ID);
      if (!el) {
        setStatus('error');
        setErrorMsg('Scanner container not ready. Please try again.');
        return;
      }

      // Tear down any previous instance
      await stopScanner();

      const instance = new Html5Qrcode(READER_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrRef.current = instance;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const source: MediaTrackConstraints | string =
        cameraId || { facingMode: { ideal: 'environment' } } as MediaTrackConstraints;

      try {
        await instance.start(
          source as any,
          config,
          (decodedText) => {
            void handleDecoded(decodedText);
          },
          () => {
            // per-frame errors ignored
          },
        );
        startedRef.current = true;
        setStatus('running');

        // Populate camera list (after permission is granted device labels become available)
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            setCameras(devices.map((d) => ({ id: d.id, label: d.label || 'Camera' })));
            // Track the camera actually in use when we used facingMode
            if (!cameraId) {
              const rear =
                devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
              if (rear) {
                setActiveCameraId(rear.id);
                try { localStorage.setItem(LS_CAMERA, rear.id); } catch {}
              }
            } else {
              setActiveCameraId(cameraId);
            }
          }
        } catch {
          // ignore - enumeration is best-effort
        }
      } catch (err: any) {
        startedRef.current = false;
        html5QrRef.current = null;
        setStatus('error');
        const name = err?.name || '';
        if (name === 'NotAllowedError' || /permission/i.test(String(err))) {
          setErrorMsg('Camera blocked. Enable camera access in your browser settings, then try again.');
        } else if (name === 'NotFoundError' || /no camera|requested device not found/i.test(String(err))) {
          // Clear saved camera id and fall back to upload
          try { localStorage.removeItem(LS_CAMERA); } catch {}
          setErrorMsg('No camera found. Upload an image of the QR code instead.');
          setMode('upload');
          try { localStorage.setItem(LS_MODE, 'upload'); } catch {}
        } else if (name === 'NotReadableError') {
          setErrorMsg('Camera is in use by another app. Close it and try again.');
        } else {
          setErrorMsg(err?.message || 'Could not start the camera.');
        }
      }
    },
    [handleDecoded, stopScanner],
  );

  // Open / close lifecycle
  useEffect(() => {
    if (!open) {
      void stopScanner();
      setStatus('idle');
      setErrorMsg('');
      return;
    }
    if (mode === 'camera') {
      void startCamera(activeCameraId);
    }
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const switchToUpload = async () => {
    await stopScanner();
    setMode('upload');
    setErrorMsg('');
    setStatus('idle');
    try { localStorage.setItem(LS_MODE, 'upload'); } catch {}
  };

  const switchToCamera = async () => {
    setMode('camera');
    try { localStorage.setItem(LS_MODE, 'camera'); } catch {}
    await startCamera(activeCameraId);
  };

  const changeCamera = async (id: string) => {
    setActiveCameraId(id);
    try { localStorage.setItem(LS_CAMERA, id); } catch {}
    await startCamera(id);
  };

  const handleFile = async (file: File) => {
    setErrorMsg('');
    setStatus('starting');
    await stopScanner();
    const instance = new Html5Qrcode(READER_ID, { verbose: false });
    html5QrRef.current = instance;
    try {
      const result = await instance.scanFile(file, false);
      void handleDecoded(result);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Could not read a QR code from that image. Try another photo.');
    } finally {
      try { await instance.clear(); } catch {}
      html5QrRef.current = null;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) void handleClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <DialogTitle>Scan QR Code</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-6 w-6 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {mode === 'camera'
              ? 'Point your camera at the registration QR code.'
              : 'Upload a photo or screenshot of the QR code.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live scanner container — kept mounted so html5-qrcode always has its target */}
          <div className="relative">
            <div
              id={READER_ID}
              className={
                mode === 'camera'
                  ? 'rounded-lg overflow-hidden border border-border min-h-[260px] bg-muted'
                  : 'hidden'
              }
            />
            {mode === 'camera' && status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm">Starting camera…</span>
              </div>
            )}
          </div>

          {/* Upload mode */}
          {mode === 'upload' && (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select an image containing the QR code</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = '';
                }}
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                Choose image
              </Button>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
            {mode === 'camera' ? (
              <>
                {cameras.length > 1 ? (
                  <Select value={activeCameraId ?? undefined} onValueChange={changeCamera}>
                    <SelectTrigger className="h-8 w-[200px] text-xs">
                      <SelectValue placeholder="Camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {status === 'running' ? 'Camera ready' : ''}
                  </span>
                )}
                <Button variant="link" size="sm" className="text-xs" onClick={switchToUpload}>
                  <Upload className="h-3 w-3 mr-1" /> Upload image instead
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Upload mode</span>
                <Button variant="link" size="sm" className="text-xs" onClick={switchToCamera}>
                  <Camera className="h-3 w-3 mr-1" /> Use camera instead
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
